const browserify = require('browserify');
const buffer = require('vinyl-buffer');
const gulp = require('gulp');
const imagemin = require('gulp-imagemin');
const pngquant = require('imagemin-pngquant');
const sass = require('gulp-sass');
const source = require('vinyl-source-stream');
const spawn = require('child_process').spawn;
const swPrecache = require('sw-precache');

gulp.task('jekyll', callback => {
  spawn('jekyll', ['serve', '--watch'], {stdio: 'inherit'})
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
  return gulp.src('css/main.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('css'));
});

gulp.task('imagemin', () => {
  return gulp.src('assets/images/*')
    .pipe(imagemin({
      progressive: true,
      svgoPlugins: [{removeViewBox: false}],
      use: [pngquant()]
    }))
    .pipe(gulp.dest('assets/images-min'));
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
    dontCacheBustUrlsMatching: /./,
    replacePrefix: 'http://localhost:8000/',//'https://raw.githubusercontent.com/jeffposnick/jeffposnick.github.io/sw-jekyll/',
    staticFileGlobs: [
      '_config.yml',
      'manifest.json',
      '_layouts/**/*.html',
      '_includes/**/*.html',
      '_posts/**/*.markdown'
    ],
    importScripts: ['jekyll-behavior-import.js'],
    runtimeCaching: [{
      urlPattern: /\/assets\/images-min\//,
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
