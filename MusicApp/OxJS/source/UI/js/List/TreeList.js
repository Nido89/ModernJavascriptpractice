'use strict';

/*@
Ox.TreeList <f> Tree List
    options <o> Options object
        data <f|null> Data to be parsed as items (needs documentation)
        expanded <b|false> If true, and data is not null, all items are expanded
        icon <o|f|null> Image URL, or function that returns an image object
        items <a|[]> Array of items
        max <n|-1> Maximum number of items that can be selected, -1 unlimited
        min <n|0> Minimum number of items that have to be selected
        selected <a|[]> Selected ids
        width <n|256> List width
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.List> Tree List Object
@*/

Ox.TreeList = function(options, self) {

    // fixme: expanding the last item should cause some scroll

    self = self || {};
    var that = Ox.Element({}, self)
            .defaults({
                data: null,
                expanded: false,
                icon: null,
                items: [],
                max: 1,
                min: 0,
                selected: [],
                width: 'auto'
            })
            .options(options || {})
            .update({
                data: function() {
                    self.options.items = getItems();
                    self.$list.options({items: parseItems()});
                },
                selected: function() {
                    //self.$list.options({selected: self.options.selected});
                    selectItem({ids: self.options.selected});
                    self.$list.scrollToSelection();
                },
                width: function() {
                    // ...
                }
            });

    if (self.options.data) {
        self.options.items = getItems();
    }

    that.setElement(
        self.$list = Ox.List({
                _tree: true,
                construct: constructItem,
                itemHeight: 16,
                items: parseItems(),
                itemWidth: self.options.width,
                keys: ['expanded', 'id', 'items', 'level', 'title'],
                max: self.options.max,
                min: self.options.min,
                unique: 'id'
            })
            .addClass('OxTableList OxTreeList')
            .css({
                width: self.options.width + 'px',
                overflowY: 'scroll'
            })
            .bindEvent(function(data, event) {
                if (event == 'anyclick') {
                    clickItem(data);
                } else if (event == 'toggle') {
                    toggleItems(data);
                }
                that.triggerEvent(event, data);
            })
    );

    self.options.selected.length && selectItem({ids: self.options.selected});

    function clickItem(e) {
        var $target = $(e.target),
            $item, id, item;
        if ($target.is('.OxToggle')) {
            $item = $target.parent().parent();
            id = $item.data('id');
            item = getItemById(id);
            toggleItem(item, !item.expanded);
        }
    }

    function constructItem(data) {
        var $item = $('<div>').css({
                width: self.options.width == 'auto' ? '100%'
                    : self.options.width - Ox.UI.SCROLLBAR_SIZE + 'px'
            }),
            $cell = $('<div>').addClass('OxCell').css({width: '8px'}),
            $icon = data.id ? getIcon(data.id, data.expanded || (
                data.items ? false : null
            )) : null,
            padding = data.level * 16 - 8;
        if (data.level) {
            $('<div>')
                .addClass('OxCell OxTarget')
                .css({width: padding + 'px'})
                .appendTo($item);
        }
        $cell.appendTo($item);
        $icon && $icon.addClass(data.items ? 'OxToggle' : 'OxTarget').appendTo($cell);
        $('<div>')
            .addClass('OxCell OxTarget')
            .css({
                width: self.options.width - padding - 32 - Ox.UI.SCROLLBAR_SIZE + 'px'
            })
            .html(data.title || '')
            .appendTo($item);
        return $item;
    }

    function getIcon(id, expanded) {
        var isFunction = Ox.isFunction(self.options.icon),
            $icon = isFunction ? self.options.icon(id, expanded) : null;
        if (!$icon) {
            if (expanded === null) {
                if (!$icon && self.options.icon && !isFunction) {
                    $icon = $('<img>').attr({src: self.options.icon});
                }
            } else {
                $icon = $('<img>').attr({src: Ox.UI.getImageURL(
                    'symbol' + (expanded ? 'Down' : 'Right')
                )});
            }
        }
        return $icon;
    }

    function getItemById(id, items, level) {
        var ret = null;
        items = items || self.options.items;
        level = level || 0;
        Ox.forEach(items, function(item) {
            if (item.id == id) {
                ret = Ox.extend(item, {
                    level: level
                });
                return false; // break
            }
            if (item.items) {
                ret = getItemById(id, item.items, level + 1);
                if (ret) {
                    return false; // break
                }
            }
        });
        return ret;
    }

    function getItems() {
        var items = [];
        Ox.sort(Object.keys(self.options.data)).forEach(function(key) {
            items.push(parseData(key, self.options.data[key]));
        });
        return items;
    }

    function getParent(id, items) {
        var ret;
        Ox.forEach(items, function(item) {
            if (item.items) {
                if (Ox.getObjectById(item.items, id)) {
                    ret = item.id;
                } else {
                    ret = getParent(id, item.items);
                }
                if (ret) {
                    return false; // break
                }
            }
        });
        return ret;
    }

    function parseData(key, value) {
        var ret = {
                id: Ox.uid().toString(),
                title: Ox.encodeHTMLEntities(key.toString()) + ': '
            },
            type = Ox.typeOf(value);
        if (type == 'array' || type == 'object') {
            ret.expanded = self.options.expanded;
            ret.title += Ox.toTitleCase(type)
                + ' <span class="OxLight">[' + Ox.len(value) + ']</span>';
            ret.items = type == 'array' ? value.map(function(v, i) {
                return parseData(i, v);
            }) : Ox.sort(Object.keys(value)).map(function(k) {
                return parseData(k, value[k]);
            });
        } else {
            ret.title += (
                type == 'function'
                ? value.toString().split('{')[0]
                : Ox.encodeHTMLEntities(JSON.stringify(value))
                    .replace(/(^&quot;|&quot;$)/g, '<span class="OxLight">"</span>')
            );
        }
        return ret;
    }

    function parseItems(items, level) {
        var ret = [];
        items = items || self.options.items;
        level = level || 0;
        items.forEach(function(item, i) {
            if (item.items && self.options.expanded) {
                item.expanded = true;
            }
            var item_ = Ox.extend({level: level}, item, item.items ? {
                items: item.expanded
                    ? parseItems(item.items, level + 1)
                    : []
            } : {});
            ret.push(item_);
            if (item.items) {
                ret = ret.concat(item_.items);
            }
        });
        return ret;
    }

    function selectItem(data) {
        var id = data.ids[0], parent = id, parents = [];
        while (parent = getParent(parent, self.options.items)) {
            parents.push(parent);
        }
        parents = parents.reverse();
        toggleItems({
            expanded: true,
            ids: parents
        });
        self.$list.options({selected: data.ids})
    }

    function toggleItem(item, expanded) {
        var $img, pos;
        item.expanded = expanded;
        that.find('.OxItem').each(function() {
            var $item = $(this);
            if ($item.data('id') == item.id) {
                $img = $item.find('.OxToggle');
                pos = $item.data('position');
                return false;
            }
        });
        //self.$list.value(item.id, 'expanded', expanded);
        $img.attr({
            src: getIcon(item.id, expanded).attr('src')
        });
        if (expanded) {
            self.$list.addItems(
                pos + 1, parseItems(item.items, item.level + 1)
            );
        } else {
            self.$list.removeItems(
                pos + 1, parseItems(item.items, item.level + 1).length
            );
        }
    }

    function toggleItems(data) {
        data.ids.forEach(function(id, i) {
            var item = getItemById(id);
            if (item.items && data.expanded != !!item.expanded) {
                toggleItem(item, data.expanded);
            }
        });
    }

    /*@
    gainFocus <f> gainFocus
    @*/
    that.gainFocus = function() {
        self.$list.gainFocus();
        return that;
    };

    /*@
    hasFocus <f> hasFocus
    @*/
    that.hasFocus = function() {
        return self.$list.hasFocus();
    };

    /*@
    loseFocus <f> loseFocus
    @*/
    that.loseFocus = function() {
        self.$list.loseFocus();
        return that;
    };

    return that;

};
