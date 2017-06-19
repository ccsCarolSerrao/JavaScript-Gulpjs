var gulp = require('gulp');
var args = require('yargs').argv;
var browserSync = require('browser-sync');
var config = require('./gulp.config')();
var del = require('del');
var port = process.env.PORT || config.defaultPort;
var $ = require('gulp-load-plugins')({lazy: true});
//var jshint = require('gulp-jshint');
//var jscs = require('gulp-jscs');
//var util = require('gulp-util');
//var gulpprint = require('gulp-print');
//var gulpif = require('gulp-if');


gulp.task('help', $.taskListing);
gulp.task('default', ['help']);

//Examining code
gulp.task('vet', function() {
    log('Analysing source with JSHint and JSCS');
    return gulp
        .src(config.alljs)
        .pipe($.if(args.verbose, $.print()))
             /*gulp vet --verbose*/
        .pipe($.jscs())
        .pipe($.jshint())
        .pipe($.jshint.reporter('jshint-stylish', {verbose: true}))
        .pipe($.jshint.reporter('fail'));
            /*
            Report an error
                jshint.reporter()
            Better presentations (npm install)
                'jshint-stylish', {verbose: true}
            */
});

gulp.task('styles', ['clean-styles'], function(done){
    log('Compiling Less --> CSS');
    return gulp
        .src(config.less)
        .pipe($.plumber())
        .pipe($.less())
        //.on('error', errorLogger)
        .pipe($.autoprefixer({browsers: ['last 2 version', '> 5%']}))
        .pipe(gulp.dest(config.temp));
});

gulp.task('fonts', ['clean-fonts'],function(){
    log('Copying fonts');
    return gulp
        .src(config.fonts)
        .pipe(gulp.dest(config.distAssets + 'fonts'));
});

gulp.task('images', ['clean-images'],function(){
    log('Copying and compressing images');
    return gulp
        .src(config.images)
        .pipe($.imagemin({optimizationLevel: 4}))
        .pipe(gulp.dest(config.distAssets + 'images'));
});

gulp.task('clean', function() {
    var delconfig = [].concat(config.dist, config.temp);
    clean(delconfig);
});

gulp.task('clean-fonts', function() {
    clean(config.distAssets + 'fonts/**/*.*');
});

gulp.task('clean-images', function() {
    clean(config.distAssets + 'images/**/*.*');
});

gulp.task('clean-styles', function() {
    clean(config.temp + '**/*.css');
});

gulp.task('clean-code', function() {
    var files = [].concat(
        config.temp + '**/*.js',
        config.dist + '**/*.html',
        config.dist + '**/*.js'
    );
    clean(files);
});

gulp.task('templatecache', ['clean-code'], function(){
    log('Creating AngularJS $templateCache');

    return gulp
        .src(config.htmlTemplates)
        .pipe($.minifyHtml({empty: true}))
        .pipe($.angularTemplatecache(
            config.templateCache.file,
            config.templateCache.options
        ))
        .pipe(gulp.dest(config.temp))
});

gulp.task('less-watcher', function(){
    gulp.watch([config.less], ['styles']);
});

gulp.task('wiredep', function(){
    log('Wire up the bower css js anda our app js into the html');
    var options = config.getWiredepDefaultOptions();
    var wiredep = require('wiredep').stream;
    return gulp
        .src(config.index)
        .pipe(wiredep(options))
        .pipe($.inject(gulp.src(config.js)))
        .pipe(gulp.dest(config.client)); 
});

gulp.task('inject', ['wiredep', 'styles', 'templatecache'], function(){
    return gulp
        .src(config.index)
        .pipe($.inject(gulp.src(config.css)))
        .pipe(gulp.dest(config.client)); 
});

gulp.task('optimize',['inject', 'fonts', 'images'], function(){
    log('Optimizing the js, css, html');
    
    var templateCache = config.temp + config.templateCache.file;
    return gulp
        .src(config.index)
        .pipe($.plumber())
        .pipe($.inject(gulp.src(templateCache, {read: false}), {
            starttag: '<!-- inject:templates:js -->'
        }))
        .pipe($.useref({
            transformPath: function(filePath) {
                return filePath.replace('../../','')
            },
            searchPath: './'
        }))
        .pipe($.if('*.js', $.uglify()))
        .pipe($.if('*.css', $.csso()))
        .pipe(gulp.dest(config.dist));
});

gulp.task('server-dist',['optimize'], function(){
    server(false);
});

gulp.task('server-dev',['inject'], function(){
    server(true);
});


///////////////////////////////////////

function server(isDev){
    var nodeOptions ={
        script: config.nodeServer,
        delayTime: 1,
        env: {
            'PORT': port,
            'NODE_ENV': isDev ? 'dev' : 'dist'
        },
        watch:[config.server]
    };

    return $.nodemon(nodeOptions)
        .on('restart', function(ev){
            log('*** nodemon restarted!');
            log('files changed on restart>\n' + ev);
            setTimeout(function() {
                browserSync.notify('reloading now...');
                browserSync.reload({stream: false});
            }, config.browserReloadDelay);
        })
        .on('start', function(){
            log('*** nodemon started!');
            startBrowserScript(isDev);
        })
        .on('crash', function(){
            log('*** nodemon crashed: script crashed for some reason!');
        })
        .on('exit', function(){
            log('*** nodemon exited cleanly!');
        });
}

function log(msg){
    if(typeof(msg) === 'object') {
        for (var item in msg) {
            if (msg.hasOwnProperty(item)) {
                $.util.log($.util.colors.blue(msg[item]));
            }
        }
    } else {
        $.util.log($.util.colors.blue(msg));
    }    
}

function clean(path) {
    log('Cleaning: ' + $.util.colors.blue(path));
    del(path);
}

function errorLogger(error){
    log('*** Start of Error ***');
    log(error);
    log('*** End of Error ***');
    this.emit('end');
}

function startBrowserScript(isDev){
    if(args.nosync || browserSync.active){
        return;
    }

    log('Starting browser-sync on port ' + port);
    
    if(isDev){
        gulp.watch([config.less], ['styles'])
            .on('change', function(event){changeEvent(event)});
    } else {
        
        gulp.watch([config.less, config.js, config.html], ['optimize', browserSync.reload])
            .on('change', function(event){changeEvent(event)});
    }

    var options={
        proxy: 'localhost:' + port,
        port: 3000,
        files: isDev ? 
        [
            config.client + '**/*.*',
            '!' + config.less,
            config.temp + '**/*.css'
        ] : [],
        ghostMode: {
            clicks: true,
            location: false,
            forms: true,
            scroll: true
        },
        injectChanges: true,
        logFilesChanges: true,
        logLevel: 'debug',
        logPrefix: 'gulp-patterns',
        notify: true,
        reloadDelay: 1000
    };

    browserSync(options);
}

function changeEvent(event){
    var srcPattern = new RegExp('/.*(?=/' + config.source + ')/');
    log('File ' + event.path.replace(srcPattern, '') + ' ' + event.type);
}