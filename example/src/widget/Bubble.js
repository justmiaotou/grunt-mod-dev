define('bubble', function(require, exports, module) {
    function Bubble(opt) {
        var winHeight = $(window).height(),
            winWidth = $(window).width(),
            width = opt.length,
            height = opt.length,
            top = winHeight * Math.random(),
            left = winWidth * Math.random();

        if (top + height > winHeight) top = winHeight - height;
        if (left + width > winWidth) left = winWidth - width;

        this.node = $('<div></div>');
        this.node.css({
            position: 'absolute',
            top: top,
            left: left,
            background: 'rgba(' + (255 * Math.random()).toFixed(0) + ', ' + (255 * Math.random()).toFixed(0) + ', ' + (255 * Math.random()).toFixed(0) + ', '  + Math.random() + ')',
            opacity: 0,
            width: 0,
            height: 0
        });

        this.pop = function() {
            $(document.body).prepend(this.node);
            this.node
                .animate({
                    opacity: 1,
                    width: width,
                    height: width,
                    borderRadius: opt.length
                }, 600)
                .fadeOut();
        };
    }

    module.exports = Bubble;
});
