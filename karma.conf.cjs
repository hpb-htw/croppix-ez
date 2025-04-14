// Karma configuration
// Generated on Mon Apr 14 2025 10:26:24 GMT+0200 (Central European Summer Time)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: './',


    // frameworks to use
    // available frameworks: https://www.npmjs.com/search?q=keywords:karma-adapter
    frameworks: ['qunit'],




    // list of files / patterns to load in the browser
    files: [
      {pattern: 'lib/**/*.js', type: 'module'},
      {pattern: 'test/**/*.js', type: 'module'},
      {pattern: 'test/**/*.dom.html', type: 'dom'},
      {pattern: 'test/img/*', watched: false, included: false, served: true, nocache: false}
    ],


    // list of files / patterns to exclude
    exclude: [
        'lib/main.js'
    ],

    proxies: {
      '/img': '/base/test/img'
    },

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://www.npmjs.com/search?q=keywords:karma-preprocessor
    preprocessors: {
      'lib/**/*.js': ['coverage']
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://www.npmjs.com/search?q=keywords:karma-reporter
    reporters: ['progress', 'coverage'],

    coverageReporter: {
      dir: "coverage",
      subdir: function (browser) {
        // normalization process to keep a consistent browser name across different
        // OS
        return browser.toLowerCase().split(/[ /-]/)[0];
      },
    },
    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_DEBUG,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,


    // start these browsers
    // available browser launchers: https://www.npmjs.com/search?q=keywords:karma-launcher
    browsers: ['Chrome'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level
    // how many browser instances should be started simultaneously
    concurrency: Infinity
  })
}
