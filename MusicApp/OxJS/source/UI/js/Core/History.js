'use strict';

Ox.History = function(options) {

    options = Ox.extend({
        text: function(item) {
            return item.text;
        }
    }, options || {});

    var history = [],
        position = 0,
        $element;

    return {
        _print: function() {
            Ox.print(JSON.stringify({history: history, position: position}));
        },
        add: function(items) {
            items = Ox.makeArray(items);
            history = history.slice(0, position).concat(items);
            position += items.length;
            $element && $element.triggerEvent('add');
            return history.length;
        },
        bindEvent: function() {
            if (!$element) {
                $element = Ox.Element();
            }
            $element.bindEvent.apply($element, arguments);
        },
        clear: function() {
            history = [];
            position = 0;
            $element && $element.triggerEvent('clear');
            return history.length;
        },
        items: function() {
            return history.length;
        },
        redo: function() {
            if (position < history.length) {
                position++;
                $element && $element.triggerEvent('redo');
                return history[position - 1];
            }
        },
        redoText: function() {
            if (position < history.length) {
                return options.text(history[position]);
            }
        },
        remove: function(test) {
            
        },
        unbindEvent: function() {
            $element && $element.unbindEvent.apply($element, arguments);
        },
        undo: function() {
            if (position > 0) {
                position--;
                $element && $element.triggerEvent('undo');
                return history[position];
            }
        },
        undoText: function() {
            if (position > 0) {
                return options.text(history[position - 1]);
            }
        }
    };

};
