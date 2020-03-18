'use strict';

/*@
Ox.Clipboard <o> Basic clipboard handler
    add <f> Add items to clipboard
        (items[, type]) -> <n> Number of items
    clear <f> Clear clipboard
        () -> <n> Number of items
    copy <f> Copy items to clipboard
        (items[, type]) -> <n> Number of items
    paste <f> Paste items from clipboard
        () -> <a> Items
    type <f> Get item type
        () -> <s|undefined> Item type
@*/
Ox.Clipboard = function() {
    var clipboard = {items: [], type: void 0},
        $element;
    return {
        _print: function() {
            Ox.print(JSON.stringify(clipboard));
        },
        add: function(items, type) {
            items = Ox.makeArray(items);
            if (items.length) {
                if (type != clipboard.type) {
                    Ox.Clipboard.clear();
                }
                clipboard = {
                    items: Ox.unique(clipboard.items.concat(items)),
                    type: type
                };
                $element && $element.triggerEvent('add');
            }
            return clipboard.items.length;
        },
        bindEvent: function() {
            if (!$element) {
                $element = Ox.Element();
            }
            $element.bindEvent.apply($element, arguments);
        },
        clear: function() {
            clipboard = {items: [], type: void 0};
            $element && $element.triggerEvent('clear');
            return clipboard.items.length;
        },
        copy: function(items, type) {
            items = Ox.makeArray(items);
            if (items.length) {
                clipboard = {items: items, type: type};
                $element && $element.triggerEvent('copy');
            }
            return clipboard.items.length;
        },
        items: function(type) {
            return !type || type == clipboard.type ? clipboard.items.length : 0;
        },
        paste: function(type) {
            $element && $element.triggerEvent('paste');
            return !type || type == clipboard.type ? clipboard.items : [];
        },
        type: function() {
            return clipboard.type;
        },
        unbindEvent: function() {
            $element && $element.unbindEvent.apply($element, arguments);
        }
    };
};
