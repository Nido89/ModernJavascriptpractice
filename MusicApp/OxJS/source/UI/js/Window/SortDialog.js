'use strict';

/*@
Ox.SortDialog <f> Dialog with Sortable List
    options <o> Options object
        defaults <[o]|[]> Items ({id: ..., title: ...}) in default order
        height <n|0> Dialog height in px, or 0 for fit-all
        items <[o]|[]> Items ({id: ..., title: ...})
        title <s|''> Dialog title
        width <n|256> Dialog width in px
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.Element> SortDialog Object
@*/

Ox.SortDialog = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({
            defaults: [],
            height: 0,
            items: [],
            title: '',
            width: 256
        })
        .options(options || {});

    self.fitAll = !self.options.height;
    self.hasDefaults = !!self.options.defaults.length;
    self.height = self.fitAll
        ? self.options.items.length * 16
        : self.options.height

    self.$list = Ox.SortList({
            items: self.options.items,
            scrollbarVisible: !self.fitAll
        })
        .bindEvent({
            sort: function(data) {
                self.hasDefaults && updateDefaultsButton();
                that.triggerEvent('sort', data);
            }
        });

    if (self.hasDefaults) {
        self.$defaultsButton = Ox.Button({
                title: Ox._('Restore Defaults')
            })
            .bindEvent({
                click: function() {
                    self.options.items = Ox.clone(self.options.defaults);
                    self.$list.options({items: self.options.items});
                }
            });
    }

    self.$doneButton = Ox.Button({
            title: Ox._('Done')
        })
        .bindEvent({
            click: function() {
                self.$dialog.close();
            }
        });

    self.$dialog = Ox.Dialog({
        buttons: self.hasDefaults
            ? [self.$defaultsButton, {}, self.$doneButton]
            : [self.$doneButton],
        content: self.$list,
        fixedSize: true,
        height: self.height,
        removeOnClose: true,
        title: self.options.title,
        width: self.options.width
    });

    self.hasDefaults && updateDefaultsButton();

    that.setElement(self.$dialog);

    function updateDefaultsButton() {
        self.$defaultsButton.options({
            disabled: Ox.isEqual(self.options.items, self.options.defaults)
        });
    }

    that.close = function() {
        self.$dialog.close();
    };

    that.open = function() {
        self.$dialog.open();
    };

    return that;

};
