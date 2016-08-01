import browserify from 'gulp-browserify';
import gulp from 'gulp';
import imagemin from 'gulp-imagemin';
import pngquant from 'imagemin-pngquant';
import sass from 'gulp-sass';
import {spawn} from 'child_process';

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
  return gulp.src('assets/images/*').pipe(imagemin({
    progressive: true,
    svgoPlugins: [{removeViewBox: false}],
    use: [pngquant()]
  })).pipe(gulp.dest('assets/images-min'));
});

gulp.task('browserify', () => {
  return gulp.src('src/service-worker.js')
    .pipe(browserify({
      transform: ['babelify']
    }))
    .on('error', error => console.error(error))
    .pipe(gulp.dest('.'));
});

gulp.task('watch', ['browserify'], () => {
  return gulp.watch('src/**/*.js', ['browserify']);
});
