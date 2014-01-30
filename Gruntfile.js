(function() { "use strict";
 
    // NPM dependencies
    var request = require('request');
    var _ = require('lodash');
    var YAML = require('yamljs');
    var cheerio = require('cheerio');

    module.exports = function(grunt) {

        // Load dependencies
        grunt.loadNpmTasks('grunt-contrib-watch');
        grunt.loadNpmTasks('grunt-contrib-compass');
        grunt.loadNpmTasks('grunt-jekyll');
        grunt.loadNpmTasks('grunt-contrib-connect');

        // Project configuration
        grunt.initConfig({
            pkg: grunt.file.readJSON('package.json'),

            compass: {
                dist: {
                    options: {
                        config: 'config.rb'
                    }
                }
            },

            jekyll: {
                build: {
                    dest: '_site'
                },
            },

            watch: {
                sass: {
                    files: ['_sass/**/*.sass'],
                    tasks: ['compass'],
                },
                jekyll: {
                    files: ['**/*.{html, md, yaml, yml}'],
                    tasks: ['jekyll']
                }
            },

            connect: {
                server: {
                    options: {
                       port: 4000,
                        base: '_site'
                    }
                }
            }

        });

        grunt.registerTask(
            'scrape',
            'Scrape the Guardian style guide for data',
            function() {

                var letters = ['a', 'b'];
                var uri = 'http://www.theguardian.com/styleguide/';
                var callback = function (error, response, html) {
                    if (error || response.statusCode == 200) {
                        grunt.fail.warn(error);
                        done(false);
                    }
                    done(true);
                    return html;
                };

                for (var i = 0; i < letters.length; i++) {
                    var letterURI = uri + letters[i];
                    var done = this.async();
                    var html = request(letterURI, callback);
                    var $ = cheerio.load(html);

                }


            }
        );


        grunt.registerTask(
            'default',
            'Default task: serve',
            ['serve']
        );

        grunt.registerTask(
            'build',
            'Recompiles the sass and rebuilds Jekyll',
            ['compass', 'jekyll']
        );


        grunt.registerTask(
            'serve',
            'Start a web server on port 4000, and rebuild after changes',
            ['build', 'connect', 'watch']
        );

    };

})();
