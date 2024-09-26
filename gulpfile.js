const gulp = require('gulp');
const sass = require('gulp-sass')(require('sass')); // Use the correct import for gulp-sass
const prefix = require('gulp-autoprefixer');
const imagemin = require('gulp-imagemin');
const pngquant = require('imagemin-pngquant');
const cache = require('gulp-cache');
const cp = require('child_process');
const browserSync = require('browser-sync').create(); // Properly initialize browserSync

const jekyll = process.platform === 'win32' ? 'jekyll.bat' : 'jekyll';

// Compile SASS files
gulp.task('sass', function () {
    return gulp.src('assets/css/scss/main.scss') // Ensure this path is correct
        .pipe(sass({
            outputStyle: 'expanded',
            onError: browserSync.notify // Ensure to notify on error
        }).on('error', sass.logError)) // Handle SASS errors properly
        .pipe(prefix(['last 15 versions', '> 1%', 'ie 8', 'ie 7'], { cascade: true }))
        .pipe(gulp.dest('_site/assets/css')) // Output to the _site directory
        .pipe(browserSync.stream()); // Stream changes to browserSync
});

// Compression images
gulp.task('img', function () {
    return gulp.src('assets/img/**/*') // Ensure this path is correct
        .pipe(cache(imagemin({
            interlaced: true,
            progressive: true,
            svgoPlugins: [{ removeViewBox: false }],
            use: [pngquant()]
        })))
        .pipe(gulp.dest('_site/assets/img')) // Output to the _site directory
        .pipe(browserSync.stream()); // Stream changes to browserSync
});

// Build the Jekyll Site
gulp.task('jekyll-build', function (done) {
    return cp.spawn(jekyll, ['build'], { stdio: 'inherit' })
        .on('close', done); // Ensure to call done() on completion
});

// Rebuild Jekyll and page reload
gulp.task('jekyll-rebuild', gulp.series('jekyll-build', function (done) {
    browserSync.reload(); // Reload the browser
    done(); // Call done() to signal task completion
}));

// Wait for jekyll-build, then launch the Server
gulp.task('browser-sync', gulp.series('sass', 'img', 'jekyll-build', function () {
    browserSync.init({
        server: {
            baseDir: '_site' // Ensure base directory is set correctly
        },
        notify: false
    });
}));

// Watch scss, html, img files
gulp.task('watch', function () {
    gulp.watch('assets/css/scss/**/*.scss', gulp.series('sass')); // Watch for SASS changes
    gulp.watch('assets/js/**/*.js', gulp.series('jekyll-rebuild')); // Watch for JS changes
    gulp.watch('assets/img/**/*', gulp.series('img')); // Watch for image changes
    gulp.watch(['*.html', '_layouts/*.html', '_includes/*.html', '_pages/*.html', '_posts/*'], gulp.series('jekyll-rebuild')); // Watch for HTML changes
});

// Default task
gulp.task('default', gulp.series('browser-sync', 'watch')); // Set default task to start browser-sync and watch
