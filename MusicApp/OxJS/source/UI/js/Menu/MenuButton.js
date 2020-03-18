'use strict';

/*@
Ox.MenuButton <f> Menu Button
    options <o> Options object
        disabled <b|false> If true, button is disabled
        id <s|''> Element id
        items <a|[]> Menu items
        maxWidth <n|0> Maximum menu width
        style <s|'rounded'> Style ('rounded' or 'square')
        title <s|''> Menu title
        tooltip <s|f|''> Tooltip title, or function that returns one
            (e) -> <string> Tooltip title
            e <object> Mouse event
        type <s|'text'> Type ('text' or 'image')
        width <s|n|'auto'> Width in px, or 'auto'
        click <!> click
        change <!> change
        hide <!> hide
        show <!> show
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.Element> Menu Button    
@*/

Ox.MenuButton = function(options, self) {

    self = self || {};
    var that = Ox.Element({
            tooltip: options.tooltip || ''
        }, self)
        .defaults({
            disabled: false,
            id: '',
            items: [],
            maxWidth: 0,
            overlap: 'none',
            style: 'rounded',
            title: '',
            type: 'text',
            width: 'auto'
        })
        .options(options || {})
        .update({
            items: function() {
                self.$menu.options({items: self.options.items});
            },
            title: function() {
                if (self.options.type == 'text') {
                    self.$title.html(self.options.title);
                } else {
                    self.$button.options({title: self.options.title});
                }
            },
            width: function() { 
                that.css({width: self.options.width - 2 + 'px'});
                self.$title.css({width: self.options.width - 24 + 'px'});
            }
        })
        .addClass(
            'OxSelect Ox' + Ox.toTitleCase(self.options.style) + (
                self.options.overlap != 'none'
                ? ' OxOverlap' + Ox.toTitleCase(self.options.overlap)
                : ''
            )
        )
        .css(self.options.width == 'auto' ? {} : {
            width: self.options.width - 2 + 'px'
        })
        .bindEvent({
            anyclick: function(e) {
                showMenu($(e.target).is('.OxButton') ? 'button' : null);
            },
        });

    if (self.options.type == 'text') {
        self.$title = Ox.$('<div>')
            .addClass('OxTitle')
            .css({width: self.options.width - 24 + 'px'})
            .html(self.options.title)
            .appendTo(that);
    }

    self.$button = Ox.Button({
            id: self.options.id + 'Button',
            selectable: true,
            overlap: self.options.overlap,
            style: 'symbol',
            title: self.options.type == 'text' || !self.options.title
                ? 'select' : self.options.title,
            type: 'image'
        })
        .appendTo(that);

    self.$menu = Ox.Menu({
            edge: 'bottom',
            element: self.$title || self.$button,
            id: self.options.id + 'Menu',
            items: self.options.items,
            maxWidth: self.options.maxWidth
        })
        .bindEvent({
            change: changeMenu,
            click: clickMenu,
            hide: hideMenu
        });

    self.options.type == 'image' && self.$menu.addClass('OxRight');

    function clickMenu(data) {
        that.triggerEvent('click', data);
    }

    function changeMenu(data) {
        that.triggerEvent('change', data);
    }

    function hideMenu(data) {
        that.loseFocus();
        that.removeClass('OxSelected');
        self.$button.options({value: false});
        that.triggerEvent('hide');
    }

    function showMenu(from) {
        that.gainFocus();
        that.addClass('OxSelected');
        from != 'button' && self.$button.options({value: true});
        that.$tooltip && that.$tooltip.hide();
        self.$menu.showMenu();
        that.triggerEvent('show');
    }

    /*@
    checkItem <f> checkItem
        (id) -> <o> check item with id
    @*/
    that.checkItem = function(id) {
        self.$menu.checkItem(id);
        return that;
    };

    /*@
    disableItem <f> disableItem
        (id) -> <o> disable item with id
    @*/
    that.disableItem = function(id) {
        self.$menu.getItem(id).options({disabled: true});
        return that;
    };

    /*@
    enableItem <f> enableItem
        (id) -> <o> enable item
    @*/
    that.enableItem = function(id) {
        self.$menu.getItem(id).options({disabled: false});
        return that;
    };

    /*@
    removeElement <f> removeElement
    @*/
    that.removeElement = function() {
        self.$menu.remove();
        return Ox.Element.prototype.removeElement.apply(that, arguments);
    };

    /*@
    setItemTitle <f> setItemTitle
        (id, title) -> <o>  set item title
    @*/
    that.setItemTitle = function(id, title) {
        self.$menu.setItemTitle(id, title);
        return that;
    };

    /*@
    uncheckItem <f> uncheck item
        (id) -> <o>  uncheck item with id
    @*/
    that.uncheckItem = function(id) {
        self.$menu.uncheckItem(id);
        return that;
    };

    return that;

};
