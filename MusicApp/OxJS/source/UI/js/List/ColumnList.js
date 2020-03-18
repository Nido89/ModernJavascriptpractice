'use strict';

/*@
Ox.ColumnList <f> Column List Widget
    experimental
@*/

Ox.ColumnList = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({
            columns: [],
            custom: {},
            items: [],
            list: 'table',
            query: {conditions: [], operator: '&'},
            resize: null,
            width: 768
        })
        .options(options || {})
        .update({
            query: updateQuery,
            width: function() {
                self.columnWidths = getColumnWidths();
                self.$panel.size(0, self.columnWidths[0]);
                self.$panel.size(2, self.columnWidths[2]);
                self.$lists.forEach(function($list, i) {
                    $list.options({itemWidth: self.columnWidths[i]});
                });
            }
        })
        .addClass('OxColumnList');

    self.numberOfColumns = self.options.columns.length;
    self.columnWidths = getColumnWidths();

    self.flatItems = [];
    self.ids = [{}, {}, {}];
    self.options.items.forEach(function(item0) {
        item0.items.forEach(function(item1) {
            self.ids[1][item1.id] = [item0.id];
            item1.items.forEach(function(item2) {
                self.ids[2][item2.id] = [item0.id, item1.id];
                self.flatItems.push(item2);
            });
        });
    });
    self.api = Ox.api(self.flatItems);

    self.$lists = self.options.columns.map(function(column, i) {
        return Ox.CustomList({
                item: self.options.columns[i].item,
                itemHeight: self.options.columns[i].itemHeight,
                items: getItems(i),
                itemWidth: self.columnWidths[i],
                keys: self.options.columns[i].keys,
                // FIXME: undefined max will overwrite CustomList default
                max: self.options.columns[i].max,
                resize: self.options.resize,
                scrollbarVisible: true,
                selected: self.options.columns[i].selected,
                sort: self.options.columns[i].sort,
                unique: 'id'
            })
            .bindEvent({
                key_left: function() {
                    if (i > 0) {
                        self.$lists[i - 1].gainFocus();
                        that.triggerEvent('select', {
                            id: self.options.columns[i - 1].id,
                            ids: self.$lists[i - 1].options('selected')
                        });
                    }
                },
                key_right: function() {
                    var index, object, selected = self.$lists[i].options('selected');
                    if (selected.length) {
                        if (i < self.numberOfColumns - 1) {
                            if (self.$lists[i + 1].options('selected').length == 0) {
                                self.$lists[i + 1].selectPosition(0);
                            }
                            self.$lists[i + 1].gainFocus();
                            that.triggerEvent('select', {
                                id: self.options.columns[i + 1].id,
                                ids: self.$lists[i + 1].options('selected')
                            });
                        }
                    }
                },
                open: function(data) {
                    that.triggerEvent('open', {
                        id: column.id,
                        ids: data.ids
                    });
                },
                select: function(data) {
                    self.options.columns[i].selected = data.ids;
                    if (i < self.numberOfColumns - 1) {
                        self.$lists[i + 1].options({items: getItems(i + 1)});
                    }
                    if (i == 0 || data.ids.length) {
                        that.triggerEvent('select', {
                            id: column.id,
                            ids: data.ids
                        });
                    } else {
                        self.$lists[i - 1].gainFocus();
                        that.triggerEvent('select', {
                            id: self.options.columns[i - 1].id,
                            ids: self.$lists[i - 1].options('selected')
                        });
                    }
                }
            });
    });

    self.$panel = Ox.SplitPanel({
        elements: self.$lists.map(function($list, index) {
            return Ox.extend(
                {element: $list},
                index == 1 ? {} : {size: self.columnWidths[index]}
            );
        }),
        orientation: 'horizontal'
    });

    that.setElement(self.$panel);

    function getColumnWidths() {
        return Ox.splitInt(self.options.width, self.numberOfColumns);
    }

    function getItems(i) {
        var items;
        if (i == 0) {
            items = self.options.items;
        } else {
            items = [];
            self.options.columns[i - 1].selected.forEach(function(id) {
                var index;
                if (i == 1) {
                    index = Ox.getIndexById(self.options.items, id);
                    items = items.concat(
                        self.options.items[index].items
                    );
                } else if (i == 2) {
                    index = [];
                    Ox.forEach(self.options.columns[0].selected, function(id_) {
                        index[0] = Ox.getIndexById(
                            self.options.items, id_
                        );
                        index[1] = Ox.getIndexById(
                            self.options.items[index[0]].items, id
                        );
                        if (index[1] > -1) {
                            return false;
                        }
                    });
                    items = items.concat(
                        self.options.items[index[0]].items[index[1]].items
                    );
                }
            });
        }
        return items;
    }

    function updateQuery() {
        if (self.options.query.conditions.length == 0) {
            self.items = self.options.items;
        } else {
            self.api({
                keys: ['id', '_ids'],
                query: self.options.query
            }, function(result) {
                var ids = [[], [], []];
                result.data.items.forEach(function(item) {
                    ids[0].push(self.ids[2][item.id][0]);
                    ids[1].push(self.ids[2][item.id][1]);
                    ids[2].push(item.id);
                });
                self.items = self.options.items.filter(function(item0) {
                    return Ox.contains(ids[0], item0.id);
                });
                self.items.forEach(function(item0) {
                    item0.items = item0.items.filter(function(item1) {
                        return Ox.contains(ids[1], item1.id);
                    });
                    item0.items.forEach(function(item1) {
                        item1.items = item1.items.filter(function(item2) {
                            return Ox.contains(ids[2], item2.id);
                        });
                    });
                });
            });
        }
        self.$lists.forEach(function($list, i) {
            $list.options({items: i == 0 ? self.items : []});
        });
    }

    that.sort = function(id, sort) {
        var index = Ox.isNumber(id) ? id
            : Ox.getIndexById(self.options.columns, id);
        self.$lists[index].options({sort: sort});
        self.options.columns[index].sort = sort;
    };

    return that;

};