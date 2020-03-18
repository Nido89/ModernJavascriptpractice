'use strict';

/*@
Ox.LoadingIcon <f> Loading Icon Element
    options <o> Options object
        size     <n|s|16> size of icon
    self <o>    Shared private variable
    ([options[, self]]) -> <o:Ox.Element> Loading Icon Element
@*/

Ox.LoadingIcon = function(options, self) {

    self = self || {};
    var that = Ox.Element('<img>', self)
        .defaults({
            size: 16,
            video: false
        })
        .options(options || {})
        .addClass('OxLoadingIcon')
        .attr({
            src: Ox.UI.getImageURL(
                'symbolLoading',
                self.options.video ? 'videoIcon' : null
            )
        });

    Ox.isNumber(self.options.size)
        ? that.css({width: self.options.size, height: self.options.size})
        : that.addClass('Ox' + Ox.toTitleCase(self.options.size));

    /*@
    start <f> Start loading animation
        ()  -> <f> Loading Icon Element
    @*/
    that.start = function(callback) {
        var css, deg = 0, previousTime = +new Date();
        function step() {
            var currentTime = +new Date(),
                delta = (currentTime - previousTime) / 1000,
                next = Math.round((deg + delta * 360) % 360 / 30) * 30;
            if (deg != next) {
                previousTime = currentTime;
                deg = next;
                css = 'rotate(' + deg + 'deg)';
                that.css({
                    MozTransform: css,
                    MsTransform: css,
                    OTransform: css,
                    WebkitTransform: css,
                    transform: css
                });
            }
            if (!self.stopping && !Ox.isUndefined(window.requestAnimationFrame)) {
                self.loadingInterval = window.requestAnimationFrame(step);
            }
        }
        if (!self.loadingInterval) {
            if (Ox.isUndefined(window.requestAnimationFrame)) {
                self.loadingInterval = setInterval(step, 83);
            } else {
                self.loadingInterval = window.requestAnimationFrame(step);
            }
            that.animate({opacity: 1}, 250, function() {
                callback && callback();
            });
        }
        return that;
    };

    /*@
    stop <f> Stop loading animation
        ()  -> <f> Loading Icon Element
    @*/
    that.stop = function(callback) {
        if (self.loadingInterval && !self.stopping) {
            self.stopping = true;
            that.animate({opacity: 0}, 250, function() {
                var css = 'rotate(0deg)';
                if (Ox.isUndefined(window.cancelAnimationFrame)) {
                    clearInterval(self.loadingInterval);
                } else {
                    window.cancelAnimationFrame(self.loadingInterval);
                }
                self.loadingInterval = null;
                self.stopping = false;
                that.css({
                    MozTransform: css,
                    MsTransform: css,
                    OTransform: css,
                    WebkitTransform: css,
                    transform: css
                });
                callback && callback();
            });
        }
        return that;
    };

    return that;

};
