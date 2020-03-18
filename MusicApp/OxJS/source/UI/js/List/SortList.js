'use strict';

/*@
Ox.SortList <f> Sortable List
    options <o> Options object
        items <[o]|[]> Items ({id: ..., title: ...})
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.Element> SortList Object
@*/

Ox.SortList = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({
            items: [],
            scrollbarVisible: false
        })
        .options(options || {})
        .update({
            items: function() {
                self.items = getItems();
                self.$list.reloadList();
                that.triggerEvent('sort', {
                    ids: self.items.map(function(item) {
                        return item.id;
                    })
                });
            }
        });

    self.items = getItems();

    self.$list = Ox.TableList({
            columns: [
                {id: 'title', visible: true}
            ],
            items: self.items,
            max: 1,
            scrollbarVisible: self.options.scrollbarVisible,
            sort: [{key: 'position', operator: '+'}],
            sortable: true,
            unique: 'id'
        })
        .bindEvent({
            move: function(data) {
                self.options.items.sort(function(a, b) {
                    return data.ids.indexOf(a.id) - data.ids.indexOf(b.id);
                });
                that.triggerEvent('sort', data);
            }
        });

    function getItems() {
        return self.options.items.map(function(item, position) {
            return {id: item.id, title: item.title, position: position};
        });
    }

    that.setElement(self.$list);

    return that;

};