const browserify = require('browserify');
const buffer = require('vinyl-buffer');
const del = require('del');
const frontmatter = require('frontmatter');
const fs = require('fs');
const glob = require('glob');
const gulp = require('gulp');
const htmlMinifier = require('html-minifier').minify;
const runSequence = require('run-sequence');
const source = require('vinyl-source-stream');
const spawn = require('child_process').spawn;
const swPrecache = require('sw-precache');

const BUILD_DIR = 'build';

gulp.task('clean', () => {
  return del(BUILD_DIR);
});

gulp.task('jekyll:build', callback => {
  spawn('bundle', ['exec', 'jekyll', 'build', '--destination', BUILD_DIR], {stdio: 'inherit'})
    .on('exit', callback);
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

gulp.task('copy-raw-files', () => {
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

const bundler = browserify({
  entries: 'src/jekyll-behavior-import.js',
}).transform('babelify', {
  plugins: ['transform-async-to-generator', 'transform-es2015-modules-commonjs']
});

gulp.task('bundle', () => {
  return bundler.bundle()
    .on('error', console.error)
    .pipe(source('jekyll-behavior-import.js'))
    .pipe(buffer())
    .pipe(gulp.dest(BUILD_DIR));
});

gulp.task('bundle:watch', ['bundle'], () => {
  return gulp.watch('src/**/*.js', ['bundle']);
});

gulp.task('minify:js', callback => {
  spawn('node_modules/.bin/babili', [
    `${BUILD_DIR}/jekyll-behavior-import.js`,
    '-d', '.',
    '--no-comments'
  ]).on('exit', callback);
});

gulp.task('service-worker', () => {
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
    }]
  });
});

gulp.task('build', callback => {
  runSequence(
    'clean',
    'jekyll:build',
    ['site-metadata', 'copy-raw-files', 'bundle'],
    ['minify:html', 'minify:js'],
    'service-worker',
    callback
  );
});

gulp.task('deploy', ['build'], callback => {
  spawn('node_modules/.bin/firebase', ['deploy'])
    .on('exit', callback);
});

gulp.task('localhost', callback => {
  // The server is on http://localhost:5000
  spawn('node_modules/.bin/firebase', ['serve'])
    .on('exit', callback);
});
