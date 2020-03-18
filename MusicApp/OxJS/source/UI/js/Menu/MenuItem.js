'use strict';

/*@
Ox.MenuItem <f> MenuItem Object
    options <o> Options object
        bind <a|[]> fixme: what's this?
        checked <f|null> If true, the item is checked
        disabled <b|false> If true, the item is disabled
        file <o|null> File selection options
        group <s|''>
        icon <s|''> icon
        id <s|''> id
        items <a|[]> items
        keyboard <s|''> keyboard
        menu <o|null> menu
        position <n|0> position
        title <a|[]> title
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.Element> MenuItem Object
@*/

Ox.MenuItem = function(options, self) {

    self = self || {};
    var that = Ox.Element('<tr>', self)
            .defaults({
                bind: [], // fixme: what's this?
                checked: null,
                disabled: false,
                file: null,
                group: '',
                icon: '',
                id: '',
                items: [],
                keyboard: '',
                maxWidth: 0,
                menu: null, // fixme: is passing the menu to 100s of menu items really memory-neutral?
                position: 0,
                title: [],
                type: ''
            })
            .options(Ox.extend(Ox.clone(options), {
                keyboard: parseKeyboard(options.keyboard || self.defaults.keyboard),
                title: Ox.makeArray(options.title || self.defaults.title)
            }))
            .update({
                checked: function() {
                    that.$status.html(self.options.checked ? Ox.SYMBOLS.check : '')
                },
                disabled: function() {
                    that[
                        self.options.disabled ? 'addClass' : 'removeClass'
                    ]('OxDisabled');
                    self.options.file && that.$button.options({
                        disabled: self.options.disabled
                    });
                },
                keyboard: function() {
                    self.options.keyboard = parseKeyboard(self.options.keyboard);
                    that.$modifiers.html(formatModifiers());
                    that.$key.html(formatKey());
                },
                title: function() {
                    self.options.title = Ox.makeArray(self.options.title);
                    that.$title.html(self.options.title[0]);
                }
            })
            .addClass('OxItem' + (self.options.disabled ? ' OxDisabled' : ''))
            /*
            .attr({
                id: Ox.toCamelCase(self.options.menu.options('id') + '/' + self.options.id)
            })
            */
            .data('group', self.options.group); // fixme: why?

    if (self.options.group && self.options.checked === null) {
        self.options.checked = false;
    }

    that.append(
            that.$status = Ox.$('<td>')
                .addClass('OxCell OxStatus')
                .html(self.options.checked ? Ox.SYMBOLS.check : '')
        )
        .append(
            that.$icon = $('<td>')
                .addClass('OxCell OxIcon')
                .append(
                    self.options.icon
                    ? Ox.$('<img>').attr({src: self.options.icon})
                    : null
                )
        )
        .append(
            that.$title = $('<td>')
                .addClass('OxCell OxTitle')
                .css(
                    self.options.maxWidth
                    ? {
                        maxWidth: self.options.maxWidth - 46,
                        textOverflow: 'ellipsis',
                        overflow: 'hidden'
                    }
                    : {}
                )
                .html(
                    self.options.file
                        ? that.$button = Ox.FileButton(Ox.extend({
                                disabled: self.options.disabled,
                                title: self.options.title[0]
                            }, self.options.file)).bindEvent({
                                click: function(data) {
                                    self.options.menu.clickItem(self.options.position, data.files);
                                }
                            })
                        : (
                            Ox.isString(self.options.title[0])
                                ? self.options.title[0]
                                : Ox.$('<div>').html(self.options.title[0]).html()
                        )
                )
        )
        .append(
            that.$modifiers = Ox.$('<td>')
                .addClass('OxCell OxModifiers')
                .html(formatModifiers())
        )
        .append(
            that.$key = Ox.$('<td>')
                .addClass(
                    'OxCell Ox' + (self.options.items.length ? 'Submenu' : 'Key')
                )
                .html(
                    self.options.items.length
                    ? Ox.SYMBOLS.triangle_right
                    : formatKey()
                )
        );

    function formatKey() {
        return Ox.SYMBOLS[self.options.keyboard.key]
            || self.options.keyboard.key.toUpperCase();
    }

    function formatModifiers() {
        return self.options.keyboard.modifiers.map(function(modifier) {
            return Ox.SYMBOLS[modifier];
        }).join('');
    }

    function parseKeyboard(str) {
        var modifiers = str.split(' '),
            key = modifiers.pop();
        return {
            modifiers: modifiers,
            key: key
        };
    }

    that.toggle = function() {
        // toggle id and title
    };

    /*@
    toggleChecked <f> toggleChecked
    @*/
    that.toggleChecked = function() {
        that.options({checked: !self.options.checked});
        return that;
    };

    that.toggleDisabled = function() {

    };
    
    /*@
    toggleTitle <f> toggleTitle
    @*/
    that.toggleTitle = function() {
        that.options({title: Ox.clone(self.options.title).reverse()});
        return that;
    };

    return that;

};
