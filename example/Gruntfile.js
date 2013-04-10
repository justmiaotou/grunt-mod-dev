module.exports = function(grunt) {
    'use strict';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %>*/'
            },
            core: {
                files: {
                    'dist/main.js': 'dist/main.min.js',
                }
            },
        },
        watch: {
            core: {
                files: ['./src/**/*.js'],
                tasks: ['mod_dev']
            }
        },
        mod_dev: {
            // core task生成的文件将会与module.js合并
            core: {
                //charset: 'utf-8', // default
                //sourceMapDest: false, // 若不输出sourcemap则值为false，否则指定目录。若不设定此值，默认设定路径与dest路径相同
                src: 'src/',
                dest: 'dist/',
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
