const browserify = require('browserify');
const buffer = require('vinyl-buffer');
const gulp = require('gulp');
const imagemin = require('gulp-imagemin');
const pngquant = require('imagemin-pngquant');
const sass = require('gulp-sass');
const source = require('vinyl-source-stream');
const spawn = require('child_process').spawn;

gulp.task('jekyll', callback => {
  spawn('jekyll', ['serve', '--watch'], {stdio: 'inherit'})
    .on('exit', callback);
});

gulp.task('localhost', callback => {
  spawn('python', ['-m', 'SimpleHTTPServer'], {stdio: 'inherit'})
    .on('exit', callback);
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
  entries: 'src/service-worker.js',
  transform: ['babelify']
});

gulp.task('browserify', () => {
  return bundler.bundle()
    .on('error', console.error)
    .pipe(source('service-worker.js'))
    .pipe(buffer())
    .pipe(gulp.dest('./'));
});

gulp.task('watch', ['browserify'], () => {
  return gulp.watch('src/**/*.js', ['browserify']);
});
