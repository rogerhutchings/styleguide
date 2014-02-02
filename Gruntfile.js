(function() { 'use strict';

    // NPM dependencies
    var request = require('request');
    var _ = require('lodash');
    var YAML = require('yamljs');
    var cheerio = require('cheerio');
    var slug = require('slug');

    module.exports = function(grunt) {

        // Load dependencies
        grunt.loadNpmTasks('grunt-contrib-watch');
        grunt.loadNpmTasks('grunt-contrib-compass');
        grunt.loadNpmTasks('grunt-jekyll');
        grunt.loadNpmTasks('grunt-contrib-connect');
        grunt.loadNpmTasks('grunt-contrib-concat');
        grunt.loadNpmTasks('grunt-contrib-copy');

        // Project configuration
        grunt.initConfig({
            pkg: grunt.file.readJSON('package.json'),

            tempYAMLDir: '_tempYAML',

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
                    tasks: ['compass', 'copy:css'],
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
            },

            concat: {
                dist: {
                    src: ['<%= tempYAMLDir %>/*.yaml'],
                    dest: '_data/definitions.yaml',
                }
            },

            copy: {
                css: {
                    src: ['public/css/*'],
                    dest: '_site/'
                }
            }

        });


        grunt.registerTask(
            'scrapePages',
            'Runs the scrapePage task on every page of the Guardian style guide',
            function () {

                // Generate the alphabet
                var letters = [];
                for (var i = 97; i <= 122; i++) {
                    letters[letters.length] = String.fromCharCode(i);
                }

                letters.forEach(function (letter) {
                    grunt.task.run('scrapePage:' + letter);
                });
            }
        );

        grunt.registerTask(
            'scrapePage',
            'Scrape an individual page of the Guardian style guide for data and save as a YAML file',
            function(letter) {
                var filename = grunt.config.get('tempYAMLDir') + '/' + letter + '.yaml';
                var url = 'http://www.theguardian.com/styleguide/' + letter;

                grunt.log.write('Retrieving ' + url + '... ');

                var done = this.async();
                request(url, function (error, response, body) {
                    if (error || response.statusCode !== 200) {
                        grunt.log.error(error);
                        done(false);
                    } else {

                        grunt.log.ok();

                        // Parse it
                        grunt.log.write('Parsing to YAML... ');
                        var $ = cheerio.load(body);
                        var definitions = [];
                        $('#content').find('li.normal').each(function() {
                            var title = _.escape($(this).find('h3').text().trim());
                            var obj = {
                                title: title,
                                slug: slug(title).toLowerCase(),
                                text: _.escape($(this).find('.trailtext').text().trim())
                            };
                            definitions.push(obj);
                        });
                        grunt.log.ok();

                        // Write the file
                        var output = [{
                            letter: letter,
                            definitions: definitions
                        }];
                        grunt.log.write('Writing to ' + filename + '... ');
                        grunt.file.write(filename, YAML.stringify(output, 4, 4));
                        grunt.log.ok();

                        // Finish
                        grunt.log.ok('Scrape complete!');
                        done();

                    }

                });

            }

        );

        grunt.registerTask(
            'cleanup',
            function () {
                grunt.log.write('Deleting temporary directory... ');
                var path = grunt.config.get('tempYAMLDir');
                if (grunt.file.exists(path)) {
                    grunt.file.delete(path);
                    grunt.log.ok();
                } else {
                    grunt.log.ok('Directory doesn\'t exist!');
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

        grunt.registerTask(
            'scrape',
            'Scrape the Guardian style guide',
            [
                'scrapePages',
                'concat',
                'cleanup',
                'jekyll'
            ]
        );

    };

})();
