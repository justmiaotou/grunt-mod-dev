# grunt-mod-dev

> 像开发nodejs模块一样进行前端开发

----


example文件夹中的例子可以打开example.html直接在浏览器中查看。

若修改了src中的源文件，要生成dist中的目标文件，您只需要在命令行中`grunt`一下。

若没有安装grunt，请参考[官方文档Getting Started](http://gruntjs.com/getting-started)。

可配置参数有：

- `charset` 文件编码，默认为'utf-8'
- `snapshotPath` 文件状态快照文件的路径，默认为Gruntfile所在目录
- `src` 源文件路径，默认为'./lib/'
- `dest` 目标文件路径，默认为'./build/'
- `exclude` 不包含某几个模块。例如，假设有如下配置：
    {
        exclude: ['a', 'b'],
        files: {
            'all-in-one.js': ['main1.js', 'main2.js']
        }
    }
    main1.js与main2.js分别依赖模块a和b，但是由于设置了exclude参数，最后生成的all-in-one.js里不包含a与b模块。
- `wrapCoreTarget` 默认为true。当为true时，如果task名为core，则会将模块化支持的相关js合并到目标文件的头部。
- `wrapAll` 默认为false。当为true时，所有目标文件都会在头部插入模块化支持的相关js。

log:

- 2013.4.27 修改了files对象的配置，由原来的'main-module: target'改为了'target: main-module'，且main-module支持数组，包含多个模块，最后会按顺序合并
