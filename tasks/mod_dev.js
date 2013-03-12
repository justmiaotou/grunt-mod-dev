/*
 * grunt-mod-dev
 * 
 *
 * Copyright (c) 2013 Memo Zhou
 * Licensed under the MIT license.
 */

'use strict';

var fs = require('fs'),
    UglifyJs = require('uglify-js'),
    path = require('path');

module.exports = function(grunt) {
    var _ = grunt.util._; // Lo-Dash

    grunt.registerMultiTask('mod_dev', 'Modular Development Support', function() {

        // charset, snapshotPath, src, dest作为公共参数，不作为task，因此这里直接返回不执行
        // TODO 命令行中还是会打印出这些target的运行信息，想办法去掉？
        if (this.target == 'charset' ||
            this.target == 'snapshotPath' ||
            this.target == 'src' ||
            this.target == 'dest') {
            return;
        }

            /**
             * 若设置了公共参数，则将公共参数覆盖默认参数
             * 即，若有如下配置：
             * ```
             * mod_dev: {
             *      dest: './build/',
             *      core: {
             *          dest: './common/',
             *          files: {
             *              ...
             *          }
             *      },
             *      project1: {
             *          files: {
             *              ...
             *          }
             *      },
             *      project2: {
             *          files: {
             *              ...
             *          }
             *      }
             * }
             * ```
             * 与core等task同级的dest属性不作为task而是公共参数，project1和project2将使用该参数
             * 而core这个task由于自定义了dest属性，所以它用的是自己的这个属性
             */
        var defaultOptions = {
                charset: grunt.config('mod_dev.charset') || 'utf-8',
                snapshotPath: grunt.config('mod_dev.snapshotPath') || './',
                src: grunt.config('mod_dev.src') || './lib/',
                dest: grunt.config('mod_dev.dest') || './build/'
            },
            options = this.data,
            _this = this;

        // 扩展默认选项至用户自定义选项中
        for (var opt in defaultOptions) {
            if (!(opt in options)) {
                options[opt] = defaultOptions[opt];
            }
        }

        //options.src = addSlash(options.src);
        options.dest = addSlash(options.dest);

            // specify the snapshot file path
        var snapshotPath = addSlash(options.snapshotPath) + '.snapshot',
            /**
             * 各个文件的时间戳信息
             * 格式如下：
                 {
                     'path/to/file1': {
                         modName: 'modName',
                         mtime: 1360218909838,
                         require: ['pop']
                     },
                     'path/to/file2': {
                         modName: 'modName2',
                         mtime: 1370000000000,
                         require: ['pop', 'ivr']
                     }
                 }
             */
            snapshot = {},
            /**
             * 各个模块的相关信息。并非每个模块对应一个文件（文件内容可能不是模块）
             * 该对象与snapshot对象结合，可以实现文件与模块之间互相快速查询
             * 格式如下：
                 {
                     'mod1': {
                         path: 'path/to/file1',
                         mtime: 1360218909838,
                         require: ['pop']
                     },
                     'mod2': {
                         path: 'path/to/file2',
                         mtime: 1360218909838,
                         require: ['pop']
                     }
                 }
             */
            modules = {},
            // 保存修改过的文件的路径：{'path1': 1, 'path2': 1}
            // 用这种格式是为了方便索引，使用`path in modFiles`就可以判断
            modFiles = {};

        // 根据时间戳文件判断文件是否是新建的或是否修改过，并更新时间戳文件
        (function() {
            // flag to indicate whether to update the snapshot file
            // 用来判断是否需要更新时间戳文件的标志位
            var hasMod = false;
            // 如果存在时间戳文件，则加载该文件并比对文件信息判断是否被修改
            if (grunt.file.exists(snapshotPath)) {
                snapshot = grunt.file.readJSON(snapshotPath);

                fileRecurse(options.src, function(abspath, rootdir, subdir, filename) {
                    if (!isJS(abspath)) return;

                    var stat = fs.statSync(abspath);
                    // if the file is new or has been modified, update the info
                    if (!snapshot[abspath] || snapshot[abspath].mtime < stat.mtime) {
                        if (!snapshot[abspath]) {
                            grunt.log.write('[New]\t');
                        } else {
                            grunt.log.write('[Modify]\t');
                        }

                        // 记录哪些文件经过了修改
                        modFiles[abspath] = 1;

                        hasMod = true;
                        // 修改过的文件需要更新时间戳信息
                        snapshot[abspath] = parseFileInfo(abspath);

                        grunt.log.writeln(abspath);
                        grunt.log.writeln('\tmodule:\t' + snapshot[abspath].modName);
                        grunt.log.writeln('\trequire:\t[' + snapshot[abspath].require + ']');
                    }
                });
            } else {
                fileRecurse(options.src, function(abspath, rootdir, subdir, filename) {
                    // 非JS文件不处理
                    if (!isJS(abspath)) return;

                    hasMod = true;
                    snapshot[abspath] = parseFileInfo(abspath);

                    grunt.log.writeln(abspath);
                    grunt.log.writeln('\tmodule:\t' + snapshot[abspath].modName);
                    grunt.log.writeln('\trequire:\t[' + snapshot[abspath].require + ']');
                });
            }

            if (hasMod) {
                // 将更新过的时间戳文件覆盖原文件
                grunt.file.write(snapshotPath, JSON.stringify(snapshot));
            }

            function fileRecurse(src, callback) {
                if (_.isArray(src)) {
                    _.each(src, function(p) {
                        srcHandler(p, callback);
                    });
                } else if (_.isString(src)) {
                    srcHandler(src, callback);
                }

                function srcHandler(src, callback) {
                    grunt.file.recurse(src, function(abspath, rootdir, subdir, filename) {
                        var oriPath = unixifyPath(path.join(subdir, filename));

                        if (options.files[oriPath]) {
                            /**
                             * 将files的文件路径替换为abspath使之与snapshot对象的路径一致
                             */
                            options.files[abspath] = options.files[oriPath];
                            delete options.files[oriPath];
                        }

                        callback(abspath, rootdir, subdir, filename);
                    });
                }
            }
        })();

        modules = getModules();

        build();

        function build() {
            grunt.log.writeln('Start building...');
            var require,
                source = '',
                wrapperStart = grunt.file.read(path.resolve(__dirname, '../lib/wrapper-start.js'), 'utf-8'),
                wrapperEnd = grunt.file.read(path.resolve(__dirname, '../lib/wrapper-end.js'), 'utf-8'),
                filePath;
            for (var module in options.files) {
                if (module in modules) {
                    require = getDepInSeq(module);
                } else {
                    // 兼容非模块名而是路径的情况
                    //filePath = unixifyPath(path.join(options.src, module));
                    if (module in snapshot) {
                        require = getDepInSeq(module);
                    } else {
                        grunt.log.error('[' + module + '] is not found!');
                        return;
                    }
                }
                for (var i = 0, l = require.length; i < l; ++i) {
                    if (modules[require[i]]) {
                        filePath = modules[require[i]].path;
                    } else if (snapshot[require[i]]) {
                        filePath = require[i];
                    } else {
                        grunt.log.error('[' + require[i] + '] is not found!');
                        return;
                    }
                    source += wrapperStart + grunt.file.read(filePath, { encoding: options.charset}) + wrapperEnd;
                }

                // 如果是core task，则与module.js合并使支持模块化
                if (_this.target == 'core') {
                    source = prependModuleSupportFile(source);
                }

                grunt.file.write(path.resolve(options.dest, options.files[module]), source, { encoding: options.charset });
                source = '';
            }
            grunt.log.writeln('Build Completing!');
        }

        function prependModuleSupportFile(source) {
            return grunt.file.read(path.resolve(__dirname, '../lib/module.js'), 'utf-8') + source;
        }

        function getModules() {
            var file,
            modules = {};
            for (var path in snapshot) {
                file = snapshot[path];
                if (file.modName) {
                    modules[file.modName] = {
                        path: path,
                        require: file.require,
                        mtime: file.mtime
                    };
                }
            }

            return modules;
        }

        /**
         * 获得模块依赖数组
         * 优先级越高序号越小
         */
        function getDepInSeq(mod) {
            var depTree = getDepTree(mod),
            arrSort = [],
            level,
            result = [];
            for (var i in depTree) {
                level = depTree[i].level - 1;
                arrSort[level] || (arrSort[level] = []);
                arrSort[level].push(i);
            }
            for (var l = arrSort.length - 1; l >= 0; l--) {
                result = result.concat(arrSort[l]);
            }
            return result;
        }

        /**
         * 1、根节点，设置level为1
         * 2、进入下个节点，如果之前已经访问过该节点且节点level比过来的节点level小，
         * 则重设level为过来节点level加1；没访问过，则直接过来节点level加1
         *  root = {
         *      mod1Name: {
         *          level: 1,
         *          require: ['mod2Name', 'mod3Name']
         *      },
         *      mod2Name: {
         *          level: 2,
         *          require: ['mod3Name', 'mod4Name']
         *      },
         *      mod3Name: {
         *          level: 3
         *      },
         *      mod4Name: {
         *          level: 3
         *      }
         *  }
         */
        function getDepTree(mod, root, level) {
            // mod也可能是文件路径，即获得该文件的依赖
            var module = modules[mod] || snapshot[mod];
            if (!module) {
                grunt.log.error('ERROR: module "' + mod + '" not found');
                return;
            }
            root = root || {};
            level = level || 1;
            // 如果该模块之前已访问过，则视情况调整其level，并递归调整其之后的节点
            // TODO 有循环引用引起死循环的bug
            if (root[mod] && root[mod].level < level) {
                root[mod].level = level;
                for (var i = 0, l = root[mod].require.length; i < l; ++i) {
                    getDepTree(root[mod].require[i], root, level + 1);
                }
            } else {
                root[mod] = {
                    level: level
                };
                root[mod].require = module.require;
                for (var i = 0, l = root[mod].require.length; i < l; ++i) {
                    getDepTree(root[mod].require[i], root, level + 1);
                }
            }
            return root;
        }

        function isJS(fileName) {
            return /\.js$/.test(fileName);
        }

        function addSlash(str) {
            if (str[str.length - 1] != '/') {
                str += '/';
            }
            return str;
        }

        // Normalize \\ paths to / paths.
        function unixifyPath(filepath) {
            // Windows?
            var win32 = process.platform === 'win32';

            if (win32) {
                return filepath.replace(/\\/g, '/');
            } else {
                return filepath;
            }
        };

        function parseFileInfo(uri) {
            var content = grunt.file.read(uri, 'utf-8'),
            modName = '',
            require = [],
            stat = fs.statSync(uri),
            ast, walker;

            // get the Abstract Syntax Tree
            ast = UglifyJs.parse(content),

            walker = new UglifyJs.TreeWalker(function(node) {
                // get the file's module name
                if (node instanceof UglifyJs.AST_Call && node.expression.name == 'define') {
                    modName = node.args[0].value;
                }
                // get the module's depandencies
                if (node instanceof UglifyJs.AST_Call && node.expression.name == 'require') {
                    require.push(node.args[0].value);
                }
            });

            ast.walk(walker);

            return {
                modName: modName,
                mtime: new Date(stat.mtime).getTime(),
                require: require
            };
        }

    });

};

/**
 * Iterate all the files under the directory
 */
function fileIterate(uri, cb) {
    var stat = fs.statSync(uri),
    files;

    if (stat.isDirectory()) {
        files = fs.readdirSync(uri);
        files.forEach(function(item) {
            var subUri = path.resolve(uri, item),
            stat = fs.statSync(subUri);
            if (stat.isFile()) {
                cb && cb(stat, subUri);
            } else if (stat.isDirectory()) {
                // recurve the sub directory
                fileIterate(subUri, cb);
            }
        });
        fs.rmdirSync(uri);
    } else if (stat.isFile()) {
        cb && cb(stat, path.resolve(uri));
    }
}
