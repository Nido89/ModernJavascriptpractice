'use strict';

/*@
Ox.CustomList <f> Custom List Widget
    experimental
@*/

Ox.CustomList = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({
            draggable: false,
            item: null,
            itemHeight: 32,
            items: null,
            itemWidth: 256,
            keys: [],
            max: -1,
            min: 0,
            pageLength: 100,
            query: {conditions: [], operator: '&'},
            resize: null,
            scrollbarVisible: false,
            selected: [],
            sort: [],
            sortable: false,
            sums: [],
            unique: ''
        })
        .options(options || {})
        .update({
            items: function() {
                self.$list.options({items: self.options.items});
            },
            itemWidth: function() {
                var width = self.options.itemWidth - Ox.UI.SCROLLBAR_SIZE;
                if (self.options.resize) {
                    that.find('.OxItem').each(function(element) {
                        self.options.resize($(this), width);
                    });
                }
            },
            query: function() {
                self.$list.options({query: self.options.query});
            },
            selected: function() {
                self.$list.options({selected: self.options.selected});
                // FIXME: TableList doesn't trigger event here
                that.triggerEvent('select', {ids: self.options.selected});
            },
            sort: function() {
                self.$list.options({sort: self.options.sort});
            }
        })
        .addClass('OxCustomList');

    self.$list = Ox.List({
            construct: function(data) {
                return self.options.item(
                    data, self.options.itemWidth - Ox.UI.SCROLLBAR_SIZE
                ).addClass('OxTarget');
            },
            draggable: self.options.draggable,
            itemHeight: self.options.itemHeight,
            itemWidth: self.options.itemWidth
                - self.options.scrollbarVisible * Ox.UI.SCROLLBAR_SIZE,
            items: self.options.items,
            keys: self.options.keys.concat(self.options.unique),
            max: self.options.max,
            min: self.options.min,
            orientation: 'vertical',
            pageLength: self.options.pageLength,
            query: Ox.clone(self.options.query, true),
            selected: self.options.selected,
            sort: Ox.clone(self.options.sort, true),
            sortable: self.options.sortable,
            sums: self.options.sums,
            type: 'text',
            unique: self.options.unique
        })
        .css({
            top: 0,
            overflowY: (self.options.scrollbarVisible ? 'scroll' : 'hidden')
        })
        .bindEvent(function(data, event) {
            if (event == 'select') {
                self.options.selected = data.ids;
            }
            that.triggerEvent(event, data);
        })
        .appendTo(that);

    that.api = self.$list.options('items');

    /*@
    gainFocus <f> gain Focus
    @*/
    that.gainFocus = function() {
        self.$list.gainFocus();
        return that;
    };

    that.getPasteIndex = function() {
        return self.$list.getPasteIndex();
    };

    /*@
    hasFocus <f> has Focus
    @*/
    that.hasFocus = function() {
        return self.$list.hasFocus();
    };

    that.invertSelection = function() {
        self.$list.invertSelection();
        return that;
    };

    /*@
    loseFocus <f> lose Focus
    @*/
    that.loseFocus = function() {
        self.$list.loseFocus();
        return that;
    };

    that.selectAll = function() {
        self.$list.selectAll();
        return that;
    };

    /*@
    selectPosition <f> select position
    @*/
    that.selectPosition = function(pos) {
        self.$list.selectPosition(pos);
        return that;
    };

    that.selectSelected = function(offset) {
        that.$list.selectSelected(offset);
        return that;
    };

    /*@
    size <f> size
    @*/
    that.size = function() {
        self.$list.size();
        return that;
    };

    return that;

};
