(function() { 'use strict';

    // NPM dependencies
    var _ = require('lodash');
    var request = require('request');
    var YAML = require('yamljs');
    var cheerio = require('cheerio');
    var slug = require('slug');
    var S = require('string');
    var fs = require('fs');

    // Functions
    function getFilesizeInBytes(filename) {
        var stats = fs.statSync(filename);
        var fileSizeInBytes = stats["size"];
        return fileSizeInBytes;
    }

    // Main Grunt section
    module.exports = function(grunt) {

        // Load dependencies
        require('time-grunt')(grunt);
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
            rawdataDir: '_rawData',
            dataDir: '_data',
            siteDir: '_site',

            compass: {
                dist: {
                    options: {
                        config: 'config.rb'
                    }
                }
            },

            jekyll: {
                build: {
                    dest: '<%= siteDir %>'
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
                    tasks: ['concat:js', 'copy:assets']
                }
            },

            connect: {
                server: {
                    options: {
                       port: 4000,
                        base: '<%= siteDir %>'
                    }
                }
            },

            concat: {
                tempRawData: {
                    src: ['<%= tempYAMLDir %>/*.yaml'],
                    dest: '<%= rawdataDir %>/temprawdata.yaml',
                },
                js: {
                    src: ['_js/jquery-1.11.0.min.js', '_js/**/*.js'],
                    dest: 'assets/app.js'
                }
            },

            copy: {
                assets: {
                    src: ['assets/*'],
                    dest: '<%= siteDir %>'
                }
            }

        });



        grunt.registerTask(
            'scrapePages',
            'Runs the scrapePage task on every page of the Guardian style guide',
            function () {
                // Generate the alphabet
                var letters = [];
                // for (var i = 97; i <= 122; i++) {
                for (var i = 97; i <= 98; i++) {
                    letters[letters.length] = String.fromCharCode(i);
                }

                letters.forEach(function (letter) {
                    grunt.task.run('scrapePage:' + letter);
                });
            }
        );

        grunt.registerTask(
            'scrapePage',
            'Scrape an individual page of the Guardian style guide',
            function (letter) {
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

                        var $ = cheerio.load(body);
                        var definitions = [];
                        $('#content').find('li.normal').each(function() {
                            definitions.push({
                                title: $(this).find('h3').text().trim(),
                                gid: $(this).attr('id'),
                                text: $(this).find('.trailtext').html().trim()
                            });
                        });

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
            'compareRawData',
            'Compare recently scraped data with current data',
            function() {

                var temp = grunt.config.get('rawdataDir') + '/temprawdata.yaml';
                var current = grunt.config.get('rawdataDir') + '/rawdata.yaml';

                grunt.log.write('Comparing raw definition data... ');

                if (getFilesizeInBytes(temp) === getFilesizeInBytes(current)) {
                    grunt.file.delete(temp);
                    grunt.log.ok('No change!');
                } else {
                    // TODO: commit and push changes
                    grunt.file.delete(current);
                    grunt.file.copy(temp, current);
                    grunt.file.delete(temp);
                    grunt.log.ok('Updated!');
                }

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
            'Recompiles the sass, js, and rebuilds Jekyll',
            function() {
                grunt.task.run(['compass', 'concat:js', 'jekyll']);
            }
        );



        grunt.registerTask(
            'serve',
            'Start a web server on port 4000, and rebuild after changes',
            function() {
                grunt.task.run(['build', 'connect', 'watch']);
            }
        );



        grunt.registerTask(
            'scrape',
            'Scrape the Guardian style guide',
            function() {
                grunt.task.run([
                    'scrapePages',
                    'concat:tempRawData',
                    'compareRawData',
                    'cleanup',
                    'jekyll'
                ]);
            }
        );

    };

})();
