'use strict';

/*@
Ox.Select <f> Select Object
    options <o> Options object
        disabled <b|false> If true, select is disabled
        id <s> Element id
        items <a|[]> Items (array of {id, title} or strings)
        label <s|''> Label
        labelWidth <n|64> Label width
        max <n|1> Maximum number of selected items
        maxWidth <n|0> Maximum menu width
        min <n|1> Minimum number of selected items
        overlap <s|'none'> Can be 'none', 'left' or 'right'
        selectable <b|true> is selectable
        size <s|'medium'> Size, can be small, medium, large
        style <s|'rounded'> Style ('rounded' or 'square')
        title <s|''> Select title
        tooltip <s|f|''> Tooltip title, or function that returns one
            (e) -> <string> Tooltip title
            e <object> Mouse event
        type <s|'text'> Type ('text' or 'image')
        value <a|s> Selected id, or array of selected ids
        width <s|n|'auto'> Width in px, or 'auto'
    self <o> Shared private variable
    ([options[, self]) -> <o:Ox.Element> Select Object
        click <!> Click event
        change <!> Change event
@*/

Ox.Select = function(options, self) {

    self = self || {};
    var that = Ox.Element({
                tooltip: options.tooltip || ''
            }, self)
            .defaults({
                id: '',
                items: [],
                label: '',
                labelWidth: 64,
                max: 1,
                maxWidth: 0,
                min: 1,
                overlap: 'none',
                size: 'medium',
                style: 'rounded',
                title: '',
                type: 'text',
                value: options.max != 1 ? [] : '',
                width: 'auto'
            })
            // fixme: make default selection restorable
            .options(options)
            .update({
                label: function() {
                    self.$label.options({title: self.options.label});
                },
                labelWidth: function() {
                    self.$label.options({width: self.options.labelWidth});
                    self.$title.css({width: getTitleWidth() + 'px'});
                },
                title: function() {
                    var title = self.options.title
                        ? self.options.title
                        : getItem(self.options.value).title;
                    if (self.options.type == 'text') {
                        self.$title.html(title);
                    } else {
                        self.$button.options({title: title});
                    }
                },
                width: function() {
                    that.css({width: self.options.width- 2 + 'px'});
                    self.$title.css({width: getTitleWidth() + 'px'});
                },
                value: function() {
                    var value = self.options.value;
                    if (self.options.type == 'text' && !self.options.title) {
                        self.$title.html(getItem(value).title);
                    }
                    value !== '' && Ox.makeArray(value).forEach(function(value) {
                        self.$menu.checkItem(value);
                    });
                    self.options.value = self.optionGroup.value();
                }
            })
            .addClass(
                'OxSelect Ox' + Ox.toTitleCase(self.options.size)
                + ' Ox' + Ox.toTitleCase(self.options.style) + (
                    self.options.overlap == 'none'
                    ? '' : ' OxOverlap' + Ox.toTitleCase(self.options.overlap)
                ) + (self.options.label ? ' OxLabelSelect' : '')
            )
            .css(self.options.width == 'auto' ? {} : {
                width: self.options.width - 2 + 'px'
            })
            .bindEvent({
                anyclick: function(e) {
                    showMenu($(e.target).is('.OxButton') ? 'button' : null);
                },
                key_escape: loseFocus,
                key_down: showMenu
            });

    self.options.items = self.options.items.map(function(item) {
        var isObject = Ox.isObject(item);
        return Ox.isEmpty(item) ? item : {
            id: isObject ? item.id : item,
            title: isObject ? item.title : item,
            checked: Ox.makeArray(self.options.value).indexOf(
                isObject ? item.id : item
            ) > -1,
            disabled: isObject ? item.disabled : false
        };
    });

    self.optionGroup = new Ox.OptionGroup(
        self.options.items,
        self.options.min,
        self.options.max,
        'checked'
    );
    self.options.items = self.optionGroup.init();
    self.options.value = self.optionGroup.value();

    if (self.options.label) {
        self.$label = Ox.Label({
            overlap: 'right',
            style: self.options.style,
            textAlign: 'right',
            title: self.options.label,
            width: self.options.labelWidth
        })
        .appendTo(that);
    }

    if (self.options.type == 'text') {
        self.$title = $('<div>')
            .addClass('OxTitle')
            .css({
                width: getTitleWidth() + 'px'
            })
            .html(
                self.options.title || getItem(self.options.value).title
            )
            .appendTo(that);
    }

    self.$button = Ox.Button({
            id: self.options.id + 'Button',
            selectable: true,
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
            items: [{
                group: self.options.id + 'Group',
                items: self.options.items,
                max: self.options.max,
                min: self.options.min
            }],
            maxWidth: self.options.maxWidth,
            size: self.options.size
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
        self.options.value = self.optionGroup.value();
        self.$title && self.$title.html(
            self.options.title || getItem(self.options.value).title
        );
        that.triggerEvent('change', {
            title: Ox.isEmpty(self.options.value) ? ''
                : Ox.isArray(self.options.value)
                    ? self.options.value.map(function(value) {
                        return getItem(value).title;
                    })
                    : getItem(self.options.value).title,
            value: self.options.value
        });
    }

    function getItem(id) {
        return Ox.getObjectById(self.options.items, id);
    }

    function getTitleWidth() {
        // fixme: used to be 22. obscure
        return self.options.width - 24 - (
            self.options.label ? self.options.labelWidth : 0
        );
    }

    function hideMenu() {
        that.loseFocus();
        that.removeClass('OxSelected');
        self.$button.options({value: false});
    }

    function loseFocus() {
        that.loseFocus();
    }

    function selectItem() {
        
    }

    function showMenu(from) {
        that.gainFocus();
        that.addClass('OxSelected');
        from != 'button' && self.$button.options({value: true});
        self.options.tooltip && that.$tooltip.hide();
        self.$menu.showMenu();
    }

    /*@
    disableItem <f> disableItem
    @*/
    that.disableItem = function(id) {
        self.$menu.getItem(id).options({disabled: true});
        return that;
    };

    /*@
    enableItem <f> enableItem
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
    selected <f> gets selected item
        () -> <o> returns array of selected items with id and title
    @*/
    that.selected = function() {
        return Ox.makeArray(self.optionGroup.value()).map(function(id) {
            return {
                id: id,
                title: getItem(id).title
            };
        });
    };

    return that;

};
