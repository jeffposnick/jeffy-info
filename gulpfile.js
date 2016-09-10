const browserify = require('browserify');
const buffer = require('vinyl-buffer');
const del = require('del');
const frontmatter = require('frontmatter');
const fs = require('fs');
const ghPages = require('gh-pages');
const glob = require('glob');
const gulp = require('gulp');
const htmlMinifier = require('html-minifier').minify;
const runSequence = require('run-sequence');
const sass = require('gulp-sass');
const source = require('vinyl-source-stream');
const spawn = require('child_process').spawn;
const swPrecache = require('sw-precache');

const BUILD_DIR = 'build';

gulp.task('jekyll:serve', callback => {
  spawn('jekyll', ['serve', '--watch'], {stdio: 'inherit'})
    .on('exit', callback);
});

gulp.task('jekyll:build', callback => {
  spawn('jekyll', ['build', '--destination', BUILD_DIR], {stdio: 'inherit'})
    .on('exit', callback);
});


gulp.task('localhost', callback => {
  spawn('node_modules/.bin/http-server', [
    '-p', '8000',
    '-a', '127.0.0.1',
    '-c', '-1',
    '--cors'
  ]).on('exit', callback);
});

gulp.task('sass', () => {
  return gulp.src('_sass/main.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest(`${BUILD_DIR}/css`));
});

gulp.task('site-metadata', callback => {
  const posts = glob.sync('_posts/**/*.markdown').map(post => {
    const markdown = fs.readFileSync(post, 'utf-8');
    const parsedFrontmatter = frontmatter(markdown);
    return {
      url: post.replace(/^_posts\//, '').replace(/-/g, '/').replace('markdown', 'html'),
      title: parsedFrontmatter.data.title,
      date: parsedFrontmatter.data.date,
      excerpt: parsedFrontmatter.data.excerpt
    };
  }).sort((a, b) => a.date < b.date);

  fs.writeFile(`${BUILD_DIR}/posts.json`, JSON.stringify(posts), callback);
});

const bundler = browserify({
  entries: 'src/jekyll-behavior-import.js',
  transform: ['babelify']
});

gulp.task('browserify', () => {
  return bundler.bundle()
    .on('error', console.error)
    .pipe(source('jekyll-behavior-import.js'))
    .pipe(buffer())
    .pipe(gulp.dest(BUILD_DIR));
});

gulp.task('service-worker', ['browserify'], () => {
  return swPrecache.write(`${BUILD_DIR}/service-worker.js`, {
    stripPrefix: `${BUILD_DIR}/`,
    staticFileGlobs: [
      '_config.yml',
      'posts.json',
      'manifest.json',
      '_layouts/**/*.html',
      '_includes/**/*.html',
      '_posts/**/*.markdown'
    ].map(glob => `${BUILD_DIR}/${glob}`),
    importScripts: ['jekyll-behavior-import.js'],
    runtimeCaching: [{
      urlPattern: /\/assets\/images\//,
      handler: 'cacheFirst',
      options: {
        cache: {
          maxEntries: 20,
          name: 'images'
        }
      }
    }, {
      urlPattern: /\/css\/.*\.css$/,
      handler: 'fastest'
    }, {
      urlPattern: /\/\/fonts\./,
      handler: 'fastest'
    }]
  });
});

gulp.task('watch', ['browserify'], () => {
  return gulp.watch('src/**/*.js', ['browserify']);
});

gulp.task('clean', () => {
  return del(BUILD_DIR);
});

gulp.task('copy-raw-files', () => {
  // See https://github.com/blog/572-bypassing-jekyll-on-github-pages
  fs.closeSync(fs.openSync(`${BUILD_DIR}/.nojekyll`, 'w'));

  return gulp.src([
    '{_includes,_layouts,_posts}/**/*.{html,markdown}',
    '_config.yml'
  ]).pipe(gulp.dest(BUILD_DIR));
});

gulp.task('minify:html', () => {
  glob.sync(`${BUILD_DIR}/**/*.html`)
    .filter(file => !file.startsWith(`${BUILD_DIR}/_`))
    .forEach(file => {
      const originalHtml = fs.readFileSync(file, 'utf-8');
      const minifiedHtml = htmlMinifier(originalHtml, {
        collapseWhitespace: true,
        decodeEntities: true,
      });
      fs.writeFileSync(file, minifiedHtml);
    });
});

gulp.task('build', callback => {
  runSequence(
    'clean',
    'jekyll:build',
    ['sass', 'site-metadata', 'copy-raw-files', 'minify:html'],
    'service-worker',
    callback
  );
});

gulp.task('deploy', ['build'], callback => {
  ghPages.publish(BUILD_DIR, {
    branch: 'master',
    message: 'Automated build.',
    dotfiles: true
  }, callback);
});