'use strict';

/*@
Ox.Picker <f> Picker Object
    options <o> Options object
        element <o|null> picker element
        elementHeight <n|128> height
        elemementWidth <n|256> width
        id <s> picker id
        overlap <s|none> select button overlap value
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.Element> Picker Object
        show <!> picker is shown
        hide <!> picker is hidden
@*/

Ox.Picker = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
            .defaults({
                element: null,
                elementHeight: 128,
                elementWidth: 256,
                overlap: 'right', // 'none'
            })
            .options(options || {});

    self.$selectButton = Ox.Button({
            overlap: self.options.overlap,
            title: 'select',
            type: 'image'
        })
        .bindEvent({
            click: showMenu
        })
        .appendTo(that);

    self.$menu = Ox.Element()
        .addClass('OxPicker')
        .css({
            width: self.options.elementWidth + 'px',
            height: (self.options.elementHeight + 24) + 'px'
        });

    self.options.element.css({
            width: self.options.elementWidth + 'px',
            height: self.options.elementHeight + 'px'
        })
        .appendTo(self.$menu);

    self.$bar = Ox.Bar({
            orientation: 'horizontal',
            size: 24
        })
        .appendTo(self.$menu);

    that.$label = Ox.Label({
            width: self.options.elementWidth - 60
        })
        .appendTo(self.$bar);

    self.$doneButton = Ox.Button({
            title: Ox._('Done'),
            width: 48
        })
        .bindEvent({
            click: hideMenu
        })
        .appendTo(self.$bar);

    self.$layer = Ox.$('<div>')
        .addClass('OxLayer')
        .on({
            click: hideMenu
        });

    function hideMenu() {
        self.$menu.detach();
        self.$layer.detach();
        self.$selectButton
            .removeClass('OxSelected')
            .css({
                borderRadius: '8px'
            });
        that.triggerEvent('hide');
    }

    function showMenu() {
        var offset = that.offset(),
            left = offset.left,
            top = offset.top + 15;
        self.$selectButton
            .addClass('OxSelected')
            .css({
                borderRadius: '8px 8px 0 0'
            });
        self.$layer.appendTo(Ox.Fullscreen.element ? Ox.Fullscreen.element : Ox.$body);
        self.$menu
            .css({
                left: left + 'px',
                top: top + 'px'
            })
            .appendTo(Ox.$body);
        that.triggerEvent('show');
    }

    return that;

};
