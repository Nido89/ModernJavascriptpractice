'use strict';
/*@
Ox.IconList <f> IconList Object
    options <o> Options object
        borderRadius <n|0> border radius for icon images
        centered <b|false> scroll list so selection is always centered
        defaultRatio <n|1> aspect ratio of icon placeholders
        draggable <b|false> If true, items can be dragged
        fixedRatio <b|n|false> if set to a number, icons have a fixed ratio
        id <s|''> element id
        item <f|null> called with data, sort, size,
                      extends data with information needed for constructor
        itemConstructor <f|Ox.IconItem> contructor used to create item
        items <f|null> items array or callback function
        keys <a|[]> available item keys
        max <n|-1> maximum selected selected items
        min <n|0> minimum of selcted items
        orientation <s|both> orientation ("horizontal", "vertical" or "both")
        pageLength <n|100> Number of items per page (if orientation != "both")
        query <o> Query
        selectAsYouType <s|''> If set to a key, enables select-as-you-type
        selected <a|[]> array of selected items
        size <n|128> list size
        sort <a|[]> sort keys
        sums <[s]|[]> Sums to be included in totals
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.List> IconList Object
@*/

Ox.IconList = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
            .defaults({
                borderRadius: 0,
                centered: false,
                defaultRatio: 1,
                draggable: false,
                find: '',
                fixedRatio: false,
                id: '',
                item: null,
                itemConstructor: Ox.IconItem,
                items: null,
                keys: [],
                max: -1,
                min: 0,
                orientation: 'both',
                pageLength: 100,
                query: {conditions: [], operator: '&'},
                selectAsYouType: '',
                selected: [],
                size: 128,
                sort: [],
                sums: [],
                unique: ''
            })
            .options(options || {})
            .update({
                items: function() {
                    self.$list.options({items: self.options.items});
                },
                query: function() {
                    self.$list.options({query: self.options.query});
                },
                selected: function() {
                    self.$list.options({selected: self.options.selected});
                },
                sort: function() {
                    updateKeys();
                    self.$list.options({sort: self.options.sort});
                }
            });

    if (self.options.fixedRatio) {
        self.options.defaultRatio = self.options.fixedRatio;
    }

    if (Ox.isArray(self.options.items)) {
        self.options.keys = Ox.unique(Ox.flatten(
            self.options.items.map(function(item) {
                return Object.keys(item);
            })
        ));
    }

    self.iconWidth = self.options.size;
    self.iconHeight = self.options.fixedRatio > 1
        ? Math.round(self.options.size / self.options.fixedRatio)
        : self.options.size;
    self.itemWidth = self.options.size;
    self.itemHeight = self.iconHeight + self.options.size * 0.5;

    self.$list = Ox.List({
            centered: self.options.centered,
            // fixme: change all occurences of construct to render
            construct: constructItem,
            draggable: self.options.draggable,
            id: self.options.id,
            itemHeight: self.itemHeight,
            items: self.options.items,
            itemWidth: self.itemWidth,
            keys: self.options.keys,
            max: self.options.max,
            min: self.options.min,
            orientation: self.options.orientation,
            pageLength: self.options.pageLength,
            query: self.options.query,
            selectAsYouType: self.options.selectAsYouType,
            selected: self.options.selected,
            sort: self.options.sort,
            sums: self.options.sums,
            type: 'icon',
            unique: self.options.unique
        })
        .addClass('OxIconList Ox' + Ox.toTitleCase(self.options.orientation))
        .bindEvent(function(data, event) {
            if (event == 'select') {
                self.options.selected = data.ids;
            }
            that.triggerEvent(event, data);
        });

    that.setElement(self.$list);

    updateKeys();

    function constructItem(data) {
        var isEmpty = Ox.isEmpty(data);
        data = !isEmpty
            ? self.options.item(data, self.options.sort, self.options.size)
            : {
                width: Math.round(self.options.size * (
                    self.options.defaultRatio >= 1 ? 1 : self.options.defaultRatio
                )),
                height: Math.round(self.options.size / (
                    self.options.defaultRatio <= 1 ? 1 : self.options.defaultRatio
                ))
            };
        return self.options.itemConstructor(Ox.extend(data, {
            borderRadius: self.options.borderRadius,
            find: self.options.find,
            iconHeight: self.iconHeight,
            iconWidth: self.iconWidth,
            imageHeight: data.height,
            imageWidth: data.width,
            itemHeight: self.itemHeight,
            itemWidth: self.itemWidth
            //height: Math.round(self.options.size / (ratio <= 1 ? 1 : ratio)),
            //size: self.options.size,
            //width: Math.round(self.options.size * (ratio >= 1 ? 1 : ratio))
        }));
    }

    function updateKeys() {
        self.$list.options({
            keys: Ox.unique(
                [self.options.sort[0].key].concat(self.options.keys)
            )
        });
    }

    /*@
    closePreview <f> close preview
        () -> <o> the list
    @*/
    that.closePreview = function() {
        self.$list.closePreview();
        return that;
    };

    /*@
    gainFocus <f> gainFocus
    @*/
    that.gainFocus = function() {
        self.$list.gainFocus();
        return that;
    };

    that.getPasteIndex = function() {
        return self.$list.getPasteIndex();
    };

    /*@
    hasFocus <f> hasFocus
    @*/
    that.hasFocus = function() {
        return self.$list.hasFocus();
    };

    that.invertSelection = function() {
        self.$list.invertSelection();
        return that;
    };

    /*@
    loseFocus <f> loseFocus
    @*/
    that.loseFocus = function() {
        self.$list.loseFocus();
        return that;
    };

    /*@
    openPreview <f> openPreview
    @*/
    that.openPreview = function() {
        self.$list.openPreview();
        return that;
    };

    /*@
    reloadList <f> reload list
        () -> <o> the list
    @*/
    that.reloadList = function() {
        self.$list.reloadList();
        return that;
    };

    /*@
    scrollToSelection <f> scroll list to selection
        () -> <o> the list
    @*/
    that.scrollToSelection = function() {
        self.$list.scrollToSelection();
        return that;
    };

    that.selectAll = function() {
        self.$list.selectAll();
        return that;
    };

    that.selectPosition = function(pos) {
        self.$list.selectPosition(pos);
        return that;
    };

    that.selectSelected = function(offset) {
        self.$list.selectSelected(offset);
        return that;
    };

    /*@
    size <f> get size of list
        () -> <n> size
    @*/
    that.size = function() {
        self.$list.size();
        return that;
    };

    // fixme: deprecate, use options()
    /*@
    sortList <f> sort list
        (key, operator) -> <o> the list
        key <s> sort key
        operator <s> sort operator ("+" or "-")
    @*/
    that.sortList = function(key, operator) {
        self.options.sort = [{
            key: key,
            operator: operator
        }];
        updateKeys();
        self.$list.sortList(key, operator);
        return that;
    };

    /*@
    value <f> get/set value of item in list
        (id) -> <o> get all data for item
        (id, key) -> <s> get value of key of item with id
        (id, key, value) -> <f> set value, returns IconList
        (id, {key: value, ...}) -> <f> set values, returns IconList
    @*/
    that.value = function() {
        var args = Ox.slice(arguments),
            id = args.shift(),
            sort = false;
        if (arguments.length == 1) {
            return self.$list.value(id);
        } else if (arguments.length == 2 && Ox.isString(arguments[1])) {
            return self.$list.value(id, arguments[1]);
        } else {
            Ox.forEach(Ox.makeObject(args), function(value, key) {
                self.$list.value(id, key, value);
                if (key == self.unique) {
                    // unique id has changed
                    self.options.selected = self.options.selected.map(function(id_) {
                        return id_ == id ? value : id_
                    });
                    id = value;
                }
                if (key == self.options.sort[0].key) {
                    // sort key has changed
                    sort = true;
                }
            });
            sort && self.$list.sort();
            return that;
        }
    };

    return that;

};
