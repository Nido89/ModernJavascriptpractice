'use strict';

/*@
Ox.Tooltip <f> Tooltip Object
    options <o> Options object
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.Element> Tooltip Object
s@*/

Ox.Tooltip = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
            .defaults({
                animate: true, // fixme: shouldn't booleans be false by default?
                title: ''
            })
            .options(options || {})
            .update({
                title: function() {
                    setTitle();
                    self.options.title === '' && that.detach();
                }
            })
            .addClass('OxTooltip')
            [Ox.isString(self.options.title) ? 'html' : 'append'](
                self.options.title
            );

    self.options.animate && that.css({opacity: 0});

    setTitle();

    function setTitle() {
        if (Ox.isString(self.options.title)) {
            that.html(self.options.title);
        } else {
            that.empty().append(self.options.title);
        }
    }

    /*@
    hide <f> hide tooltip
        () -> <o>  hide tooltip
    @*/
    that.hide = function() {
        var last = Ox.last(arguments);
        if (self.options.title) {
            if (self.options.animate) {
                that.animate({
                    opacity: 0
                }, 250, function() {
                    that.detach();
                    Ox.isFunction(last) && last();
                });
            } else {
                that.detach();
            }
        }
        return that;
    };

    // can pass event instead of x/y
    // fixme: use this in widgets
    /*@
    show <f> show tooltip
        (x, y) -> <o>  show tooltip at x,y
        (event) -> <o>  show tooltip at event.clientX/clientY
    @*/
    that.show = function(x, y) {
        var last = Ox.last(arguments),
            left, top, width, height;
        if (self.options.title) {
            if (arguments.length == 1) {
                self.x = arguments[0].clientX;
                self.y = arguments[0].clientY;
            } else {
                self.x = x;
                self.y = y;
            }
            $('.OxTooltip').detach(); // fixme: don't use DOM
            that.appendTo(Ox.Fullscreen.element ? Ox.Fullscreen.element : Ox.$body);
            width = that.width();
            height = that.height();
            left = Ox.limit(
                self.x - Math.round(width / 2), 0, window.innerWidth - width - 8
            );
            top = self.y > window.innerHeight - height - 16
                ? self.y - 16 - height
                : self.y + 16;
            that.css({
                left: left + 'px',
                top: top + 'px'
            });
            self.options.animate && that.animate({
                opacity: 1
            }, 250, function() {
                Ox.isFunction(last) && last();
            });
        }
        return that;
    };

    return that;

};
