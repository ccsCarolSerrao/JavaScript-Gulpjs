module.exports = function() {
    var client = './src/client/';
    var clientApp = client + 'app/';
    var clientAssets = client + 'assets/';
    var server ='./src/server/';
    var temp = './.tmp/';
    var dist =  './dist/';
    distAssets = dist + 'assets/';

    var config={

        /**
         * File paths
         */
        alljs:[
            './src/**/*.js',
            './*.js'
        ],
        client: client,
        index: client + 'index.html',
        css: temp + 'styles.css',
        js:[
            clientApp + '**/*.module.js',
            clientApp + '**/*.js',
            '!' + clientApp + '**/*.spec.js'
        ],
        images: clientAssets + 'images/**/*.*',
        fonts: './bower_components/font-awesome/fonts/**/*.*',
        less: [
            clientAssets + 'styles/styles.less'
        ],
        html: clientApp + '**/*.html',
        htmlTemplates: clientApp + '**/*.html',
        server: server,        
        temp: temp,
        dist: dist,
        distAssets: distAssets,

        /**
         * template cache
         */
         templateCache: {
             file: 'templates.js',
             options:{
                 module: 'app.core',
                 standAlone: false,
                 root:  'app/'
             }
         },

        /**
         * brwoser sync
         */
        browserReloadDelay: 1000,

        /**
         * Bower and NPM locations
         */
        bower:{
            json: require('./bower.json'),
            directory: './bower_components/',
            ignorePath: '../../'
        },

        /**
         * Node settings
         */
        defaultPort: 7203,
        nodeServer: server + 'app.js'
    };

    config.getWiredepDefaultOptions = function (){
        var options={
            bowerJson: config.bower.json,
            directory: config.bower.directory,
            ignorePath: config.bower.ignorePath
        };
    };
    return config;
};