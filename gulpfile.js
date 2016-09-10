const browserify = require('browserify');
const buffer = require('vinyl-buffer');
const frontmatter = require('frontmatter');
const fs = require('fs');
const glob = require('glob');
const gulp = require('gulp');
const htmlmin = require('gulp-htmlmin');
const runSequence = require('run-sequence');
const sass = require('gulp-sass');
const source = require('vinyl-source-stream');
const spawn = require('child_process').spawn;
const swPrecache = require('sw-precache');
const tmp = require('tmp');

let tmpDirs;
const getTempDir = () => {
  if (!tmpDir) {
    const result = tmp.dirSync({keep: true, unsafeCleanup: false});
    tmpDir = result.name;
    console.log(result.name);
  }
  return tmpDir;
};

gulp.task('jekyll:serve', callback => {
  spawn('jekyll', ['serve', '--watch'], {stdio: 'inherit'})
    .on('exit', callback);
});

gulp.task('jekyll:build', callback => {
  spawn('jekyll', ['build', '--destination', getTempDir()], {stdio: 'inherit'})
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
    .pipe(gulp.dest('css'));
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

  fs.writeFile('posts.json', JSON.stringify(posts), callback);
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
    .pipe(gulp.dest('./'));
});

gulp.task('service-worker', ['browserify'], () => {
  return swPrecache.write('service-worker.js', {
    replacePrefix: 'https://raw.githubusercontent.com/jeffposnick/jeffposnick.github.io/master/',//'http://localhost:8000/',
    staticFileGlobs: [
      '_config.yml',
      'posts.json',
      'manifest.json',
      '_layouts/**/*.html',
      '_includes/**/*.html',
      '_posts/**/*.markdown'
    ],
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

gulp.task('html-min', () => {
  return gulp.src(`${getTempDir()}/**/*.html`)
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest('/tmp/b'));
});

gulp.task('build', callback => {
  runSequence('sass', 'jekyll:build', 'html-min', callback);
});