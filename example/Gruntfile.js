module.exports = function(grunt) {
    'use strict';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            example: {
                files: {
                    'dist/main.min.js': 'dist/main.js'
                }
            }
        },
        watch: {
            example: {
                files: ['./src/**/*.js'],
                tasks: ['mod_dev']
            }
        },
        mod_dev: {
            options: {
                //charset: 'utf-8', // default
                src: 'src/',
                dest: 'dist/',
                wrapAll: true
            },
            example: {
                files: {
                    // main-module : module-path
                    'main.js': 'main.js'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-mod-dev');

    grunt.registerTask('default', ['mod_dev']);
    grunt.registerTask('build', ['mod_dev', 'uglify']);
};
