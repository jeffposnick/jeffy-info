import browserify from 'gulp-browserify';
import gulp from 'gulp';
import {spawn} from 'child_process';
import imagemin from 'gulp-imagemin';
import pngquant from 'imagemin-pngquant';

gulp.task('jekyll', callback => {
  spawn('jekyll', ['serve', '--watch'], {stdio: 'inherit'})
    .on('exit', callback);
});

gulp.task('localhost', callback => {
  spawn('python', ['-m', 'SimpleHTTPServer'], {stdio: 'inherit'})
    .on('exit', callback);
});

gulp.task('imagemin', () => {
  return gulp.src('assets/images/*').pipe(imagemin({
    progressive: true,
    svgoPlugins: [{removeViewBox: false}],
    use: [pngquant()]
  })).pipe(gulp.dest('assets/images-min'));
});

gulp.task('browserify', () => {
  return gulp.src('src/test.js')
    .pipe(browserify({
      transform: ['babelify']
    }))
    .on('error', error => console.error(error))
    .pipe(gulp.dest('bundled'));
});

gulp.task('watch', ['browserify'], () => {
  return gulp.watch('src/test.js', ['browserify']);
});
