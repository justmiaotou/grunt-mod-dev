/**
 * 模仿nodejs的CMD模块规范来实现模块化开发基础
 */
(function() {
    // 唯一全局对象
    var M = window.M = {
        // 缓存用户定义的模块
        cache: {}
        // TODO 调用require函数的时候，根据require的层级构建树
        // 例如：require('a')运行的时候，模块a再require('b')，require('c')，模块b再require('d')，则可得这样的树：
        // a
        // -> b
        //    -> d
        // -> c
        //, requireStack: null
    }, 
    modules = M.cache;

    // Modular Development Service
    // module factory可以是任意类型
    // 只有该module为函数时才会在第一次require的时候调用，其它类型均是直接返回
    M.define = function(modName, module) {
         if (modName in modules) {
            // TODO
         }

         modules[modName] = {
             module: module,
             hasExec: false
         };
    };
    M.define.cmd = true;

    var require = M.require = function(modName) {
        var modSpec = modules[modName];

        if (!modSpec) {
            throw Error('Module \'' + modName + '\' not found.');
        }

        if (!modSpec.hasExec) {
            // factory为函数时运行一次
            if (typeof modSpec.module == 'function') {
                modSpec.module = (function() {
                    var module = {
                            exports: {}
                            // TODO 有没有办法通过构造requireStack告知被require的模块的父模块子模块信息？
                            // , parent: parent
                            // , children: children
                        },
                        result;

                    result = modSpec.module(require, module.exports, module);

                    // 如果有返回值，则将返回值作为模块结果
                    // 否则将exports.module作为模块结果。
                    if (typeof result == 'undefined') {
                        result = module.exports;
                    }

                    return result;
                })();
            }

            // 重置标志位，下次请求该模块将直接返回结果
            modSpec.hasExec = true;
        }

        return modSpec.module;
    };
})();
