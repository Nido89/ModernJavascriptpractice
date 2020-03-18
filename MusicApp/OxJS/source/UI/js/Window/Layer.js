'use strict';

/*@
Ox.Layer <f> Background layer for dialogs and menus
    options <o> Options
        type <s|'dialog'> Layer type ('dialog' or 'menu')
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.Element> Layer
        click <!> click
@*/

Ox.Layer = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({
            type: 'dialog'
        })
        .options(options || {})
        .addClass('OxLayer Ox' + Ox.toTitleCase(self.options.type) + 'Layer')
        .on(self.options.type == 'dialog' ? {
            mousedown: mousedown
        } : {
            click: click
        });

    function click() {
        that.triggerEvent('click').remove();
    }

    function mousedown() {
        that.stop().css({opacity: 0.5});
    }

    function mouseup() {
        that.stop().animate({opacity: 0}, 250);
    }

    /*@
    hide <f> hide
        () -> <u>  hide layer
    @*/
    that.hide = function() {
        if (self.options.type == 'dialog') {
            Ox.$window.off({mouseup: mouseup});
        }
        that.remove();
    };

    /*@
    show <f> show
        () -> <o>  show layer
    @*/
    that.show = function() {
        if (self.options.type == 'dialog') {
            Ox.$window.on({mouseup: mouseup});
        }
        that.appendTo(Ox.Fullscreen.element ? Ox.Fullscreen.element : Ox.$body);
        return that;
    }

    return that;

}
