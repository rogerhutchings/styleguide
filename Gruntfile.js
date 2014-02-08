(function() { 'use strict';

    // NPM dependencies
    var _ = require('lodash');
    var request = require('request');
    var YAML = require('yamljs');
    var cheerio = require('cheerio');
    var slug = require('slug');
    var S = require('string');

    module.exports = function(grunt) {

        // Load dependencies
        require('time-grunt')(grunt);

        // grunt.loadnpmtasks shorthand
        var lnpm = function (inputTasks) {
            if (_.isString(inputTasks)) {
                inputTasks = [inputTasks];
            }
            inputTasks.forEach(function(task) {
                grunt.loadNpmTasks(task);
            });
        };


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
                    tasks: ['compass', 'copy:assets'],
                },
                jekyll: {
                    files: ['_config.yml', '**/*.{html, md, yaml, yml}'],
                    tasks: ['jekyll']
                },
                js: {
                    files: ['_js/**/*.js'],
                    tasks: ['concat:js', 'uglify', 'copy:assets']
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
                definitions: {
                    src: ['<%= tempYAMLDir %>/*.yaml'],
                    dest: '_data/definitions.yaml',
                },
                js: {
                    src: ['_js/jquery-1.11.0.min.js', '_js/**/*.js'],
                    dest: 'assets/_app.js'
                }
            },

            copy: {
                assets: {
                    src: ['assets/*'],
                    dest: '_site/'
                }
            },

            uglify: {
                dist: {
                    files: {
                        'assets/app.min.js': ['assets/_app.js']
                    }
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

                var slugOptions = {
                    charmap: _.extend(slug.charmap, {
                        "'": null,
                        '*': 'star'
                    })
                };

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
                            var title = $(this).find('h3').text().trim();

                            // Have to use string because slug doesn't correctly
                            // strip punctuation :/
                            definitions.push({
                                title: _.escape(title),
                                slug: slug(S(title).stripPunctuation().s).toLowerCase(),
                                text: _.escape($(this).find('.trailtext').text().trim())
                            });
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
            'Compile the sass, js, and rebuilds Jekyll',
            function() {
                lnpm(['grunt-contrib-concat', 'grunt-contrib-compass', 'grunt-jekyll', 'grunt-contrib-uglify']);
                grunt.task.run(['compass', 'concat:js', 'uglify', 'jekyll']);
            }
        );


        grunt.registerTask(
            'serve',
            'Build the site, start a server on port 4000, and watch for changes',
            function() {
                lnpm(['grunt-contrib-connect', 'grunt-contrib-watch', 'grunt-contrib-copy']);
                grunt.task.run(['build', 'connect', 'watch']);
            }
        );

        grunt.registerTask(
            'scrape',
            'Scrape the Guardian style guide',
            function() {
                lnpm(['grunt-contrib-concat', 'grunt-jekyll']);
                grunt.task.run([
                    'scrapePages',
                    'concat:definitions',
                    'cleanup',
                    'jekyll'
                ]);
            }
        );

    };

})();
