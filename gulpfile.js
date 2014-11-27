var gulp = require('gulp');
var child_process = require('child_process');
var imagemin = require('gulp-imagemin');
var pngquant = require('imagemin-pngquant');

gulp.task('serve', function() {
  child_process.spawn('jekyll', ['serve'], {stdio: 'inherit'});
});

gulp.task('imagemin', function() {
  return gulp.src('assets/images/*').pipe(imagemin({
    progressive: true,
    svgoPlugins: [{removeViewBox: false}],
    use: [pngquant()]
  })).pipe(gulp.dest('assets/images-min'));
});
