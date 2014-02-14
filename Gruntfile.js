(function() { 'use strict';

    // NPM dependencies --------------------------------------------------------
    var _ = require('lodash');
    var request = require('request');
    var YAML = require('yamljs');
    var cheerio = require('cheerio');
    var slugify = require('slug');
    var S = require('string');
    var fs = require('fs');
    var moment = require('moment');

    // Options -----------------------------------------------------------------
    var slugOptions = {
        charmap: {
            '&': ' and ',
            '*': ' star',
            '\'': false,
            "ä": "a", "ö": "o", "ü": "u",
            "Ä": "A", "Ö": "O", "Ü": "U",
            "á": "a", "à": "a", "â": "a",
            "é": "e", "è": "e", "ê": "e",
            "ú": "u", "ù": "u", "û": "u",
            "ó": "o", "ò": "o", "ô": "o",
            "Á": "A", "À": "A", "Â": "A",
            "É": "E", "È": "E", "Ê": "E",
            "Ú": "U", "Ù": "U", "Û": "U",
            "Ó": "O", "Ò": "O", "Ô": "O",
            "ß": "s"

        }
    };



    // Main Grunt section ------------------------------------------------------
    module.exports = function(grunt) {

        // Load dependencies ---------------------------------------------------
        require('time-grunt')(grunt);
        require('jit-grunt')(grunt);

        // Helper functions ----------------------------------------------------
        var getFilesizeInBytes = function (filename) {
            var stats = fs.statSync(filename);
            var fileSizeInBytes = stats.size;
            return fileSizeInBytes;
        };

        var writeLastModified = function () {
            grunt.log.write('Writing last modified file... ');
            grunt.file.write(grunt.config.get('lastModifiedFile'), YAML.stringify({
                date: moment().format('MMMM Do, YYYY')
            }, 4, 4));
            grunt.log.ok();
        };

        // Project configuration -----------------------------------------------
        grunt.initConfig({
            pkg: grunt.file.readJSON('package.json'),

            tempYAMLDir: '_tempYAML',
            rawdataDir: '_rawData',
            dataDir: '_data',
            siteDir: '_site',

            tempRawDataFile: '<%= rawdataDir %>/tempRawData.yaml',
            rawDataFile: '<%= rawdataDir %>/rawData.yaml',
            lastModifiedFile: '<%= dataDir %>/lastModified.yaml',
            definitionsFile: '<%= dataDir %>/definitions.yaml',

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
                }
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
                    dest: '<%= tempRawDataFile %>',
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
            },

            gitcommit: {
                rawData: {
                    options: {
                        message: 'Raw definition data updated'
                    },
                    files: {
                        src: ['<%= rawDataFile %>', '<%= lastModifiedFile %>']
                    }
                }
            }

        });


        // Tasks ---------------------------------------------------------------
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
                            grunt.log.writeln( 'title: ' + $(this).find('h3').text().trim() );
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
            function () {

                var temp = grunt.config.get('tempRawDataFile');
                var current = grunt.config.get('rawDataFile');

                grunt.log.write('Comparing raw definition data... ');

                // Compare the files
                if (!grunt.file.exists(current)) {
                    grunt.file.copy(temp, current);
                    grunt.file.delete(temp);
                    grunt.log.ok('No data found.');
                    grunt.config.set('definitionsChanged', true);
                } else {
                    if (getFilesizeInBytes(temp) === getFilesizeInBytes(current)) {
                        grunt.file.delete(temp);
                        grunt.log.ok('No change.');
                    } else {
                        grunt.file.delete(current);
                        grunt.file.copy(temp, current);
                        grunt.file.delete(temp);
                        grunt.log.ok('Updated.');
                        grunt.config.set('definitionsChanged', true);
                    }
                }

                // Commit and update time if they've changed
                if (grunt.config('definitionsChanged')) {
                    writeLastModified();
                    grunt.task.run('gitcommit:rawData');
                }

            }
        );



        grunt.registerTask(
            'process',
            'Process scraped data into something suitable for the site',
            function () {
                var data = grunt.file.readYAML(grunt.config.get('rawDataFile'));

                function iterate(obj) {
                    for (var property in obj) {
                        if (obj.hasOwnProperty(property)) {
                            if (typeof obj[property] == "object") {
                                iterate(obj[property]);
                            } else {
                                switch (property) {
                                    case 'title':
                                        // Create slug from title
                                        var slug = obj[property];
                                        slug = S(slug).stripPunctuation().s.toLowerCase();
                                        slug = slugify(slug, slugOptions);
                                        obj['slug'] = slug;
                                        break;

                                    case 'text':
                                        var text = obj['text'];

                                        // Remove \n
                                        text = text.replace(/(\r\n|\n|\r)/gm, "");

                                        // Add in paragraph tags
                                        text = '<p>' + text.replace(/(<br>)+/g, '</p><p>') + '</p>';

                                        obj['text'] = text;
                                        break;
                                }
                            }
                        }
                    }
                }
                iterate(data);

                // Add nice slugs
                //     - '
                // Update links
                grunt.file.write(grunt.config.get('definitionsFile'), YAML.stringify(data, 4, 4));
                grunt.task.run('jekyll');

            }
        );


        grunt.registerTask(
            'cleanup',
            'Delete any temporary YAML files created while scraping',
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



        // Batch tasks ---------------------------------------------------------
        grunt.registerTask(
            'default',
            'Default task: serve',
            ['serve']
        );



        grunt.registerTask(
            'build',
            'Recompiles the sass, js, and rebuilds Jekyll',
            function () {
                grunt.task.run([
                    'compass',
                    'concat:js',
                    'jekyll'
                ]);
            }
        );



        grunt.registerTask(
            'serve',
            'Start a web server on port 4000, and rebuild after changes',
            function () {
                grunt.task.run([
                    'build',
                    'connect',
                    'watch'
                ]);
            }
        );



        grunt.registerTask(
            'scrape',
            'Scrape the Guardian style guide',
            function () {
                grunt.task.run([
                    'scrapePages',
                    'concat:tempRawData',
                    'compareRawData',
                    'process',
                    'cleanup',
                    'jekyll'
                ]);
            }
        );

    };

})();
