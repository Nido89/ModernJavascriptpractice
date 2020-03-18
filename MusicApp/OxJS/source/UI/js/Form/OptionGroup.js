'use strict';

/*@
Ox.OptionGroup <f> OptionGroup
    Helper object, used by ButtonGroup, CheckboxGroup, Select and Menu
    (items, min, max, property) -> <f> OptionGroup
    items <a> array of items
    min <n> minimum number of selected items
    max <n> maximum number of selected items
    property <s|'checked'> property to check
@*/

// FIXME: Should be moved to Ox.js

Ox.OptionGroup = function(items, min, max, property) {

    var length = items.length;
    property = property || 'checked';
    max = max == -1 ? length : max;

    function getLastBefore(pos) {
        // returns the position of the last checked item before position pos
        var last = -1;
        // fixme: why is length not == items.length here?
        Ox.forEach([].concat(
            pos > 0 ? Ox.range(pos - 1, -1, -1) : [],
            pos < items.length - 1 ? Ox.range(items.length - 1, pos, -1) : []
        ), function(v) {
            if (items[v][property]) {
                last = v;
                return false; // break
            }
        });
        return last;
    }

    function getNumber() {
        // returns the number of checked items
        return items.reduce(function(prev, curr) {
            return prev + !!curr[property];
        }, 0);
    }

    /*@
    [property] <f> returns an array with the positions of all checked items
        () -> <a> positions of checked items
    @*/
    // FIXME: isn't value more useful in all cases?
    this[property] = function() {
        return Ox.indicesOf(items, function(item) {
            return item[property];
        });
    };

    /*@
    init <f> init group
        () -> <a> returns items
    @*/
    this.init = function() {
        var num = getNumber(),
            count = 0;
        //if (num < min || num > max) {
            items.forEach(function(item) {
                if (Ox.isUndefined(item[property])) {
                    item[property] = false;
                }
                if (item[property]) {
                    count++;
                    if (count > max) {
                        item[property] = false;
                    }
                } else {
                    if (num < min) {
                        item[property] = true;
                        num++;
                    }
                }
            });
        //}
        return items;
    };

    /*@
    toggle <f> toggle options
        (pos) -> <a> returns toggled state
    @*/
    this.toggle = function(pos) {
        var last,
            num = getNumber(),
            toggled = [];
        if (!items[pos][property]) { // check
            if (num >= max) {
                last = getLastBefore(pos);
                items[last][property] = false;
                toggled.push(last);
            }
            if (!items[pos][property]) {
                items[pos][property] = true;
                toggled.push(pos);
            }
        } else { // uncheck
            if (num > min) {
                items[pos][property] = false;
                toggled.push(pos);
            }
        }
        return toggled;
    };

    /*@
    value <f> get value
    @*/
    this.value = function() {
        var value = items.filter(function(item) {
            return item[property];
        }).map(function(item) {
            return item.id;
        });
        return max == 1 ? (value.length ? value[0] : '') : value;
    };

    return this;

}
