'use strict';

/*@
Ox.ImageElement <f> Simple image element with loading indication
@*/

Ox.ImageElement = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({
            height: 0,
            src: '',
            width: 0
        })
        .options(options || {})
        .update({
            height: function() {
                !self.isAuto && setSizes();
            },
            src: loadImage,
            width: function() {
                !self.isAuto && setSizes();
            }
        })
        .addClass('OxImageElement');

    self.isAuto = !self.options.width && !self.options.height;

    self.$screen = Ox.LoadingScreen({
            height: self.options.height,
            size: 16,
            width: self.options.width
        })
        .start()
        .appendTo(that);

    loadImage();
    !self.isAuto && setSizes();

    function loadImage() {
        if (self.$image) {
            self.$image.off({load: showImage}).remove();
        }
        self.$image = $('<img>')
            .one({
                error: stopLoading,
                load: showImage
            })
            .attr({src: self.options.src});
    }

    function setSizes() {
        var css = {
            width: self.options.width,
            height: self.options.height
        };
        self.$screen && self.$screen.options(css);
        css = Ox.map(css, function(value) {
            return value + 'px';
        });
        that.css(css);
        self.$image.css(css);
    }

    function showImage() {
        self.$screen.stop().remove();
        self.$image.appendTo(that);
        that.triggerEvent('load');
    }

    function stopLoading() {
        self.$screen.stop();
    }

    that.css = function(css) {
        that.$element.css(css);
        self.$screen && self.$screen.css(css);
        self.$image.css(css);
        return that;
    };

    return that;

};