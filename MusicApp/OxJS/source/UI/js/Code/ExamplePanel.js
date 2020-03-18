'use strict';

/*@
Ox.ExamplePanel <f> Example Panel
    options <o> Options
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.SplitPanel> Example Panel
        change <!> Change event
            value <s> 'source' or 'live'
        load <!> Load event
        select <!> Select event
            id <s> selected example
@*/

Ox.ExamplePanel = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({
            element: '',
            examples: [],
            mode: 'source',
            path: '',
            references: null,
            replaceCode: [],
            replaceComment: [],
            selected: '',
            size: 256
        })
        .options(options || {})
        .update({
            mode: function() {
                if (self.options.selected) {
                    self.$page.options({selected: self.options.mode});
                }
            },
            selected: function() {
                self.options.mode = 'source';
                selectItem(self.options.selected);
            }
        });

    self.$list = Ox.Element();
    self.$page = Ox.Element();

    that.setElement(
        self.$panel = Ox.SplitPanel({
            elements: [
                {
                    element: self.$list,
                    size: self.options.size
                },
                {
                    element: self.$page
                }
            ],
            orientation: 'horizontal'
        })
    );

    loadItems(function(items) {
        var treeItems = [];
        self.items = items;
        items.forEach(function(item) {
            var sectionIndex = Ox.getIndexById(treeItems, item.section + '/');
            if (sectionIndex == -1) {
                treeItems.push({
                    id: item.section + '/',
                    items: [],
                    title: item.sectionTitle
                });
                sectionIndex = treeItems.length - 1;
            }
            treeItems[sectionIndex].items.push(item);
        });
        self.$list = Ox.TreeList({
                expanded: true,
                icon: Ox.UI.getImageURL('symbolCenter'),
                items: treeItems,
                selected: self.options.selected ? [self.options.selected] : [],
                width: self.options.size
            })
            .bindEvent({
                select: function(data) {
                    if (!data.ids[0] || !Ox.endsWith(data.ids[0], '/')) {
                        self.options.mode = 'source';
                        selectItem(
                            data.ids[0] ? data.ids[0].split('/').pop() : ''
                        );
                    }
                }
            });
        self.$panel.replaceElement(0, self.$list);
        selectItem(self.options.selected);
        that.triggerEvent('load', {items: self.items});
    });

    function getItemByName(name) {
        var item = null;
        Ox.forEach(self.items, function(v) {
            if (v.id.split('/').pop() == name) {
                item = v;
                return false; // break
            }
        });
        return item;
    }

    function loadItems(callback) {
        var items = [];
        self.options.examples.forEach(function(example) {
            var item = {
                html: self.options.path + example + '/index.html',
                id: example,
                js: self.options.path + example + '/js/example.js',
                section: example.split('/').shift()
            };
            Ox.get(item.html, function(html) {
                var match = html.match(/<title>(.+)<\/title>/);
                item.title = match ? match[1] : 'Untitled';
                match = html.match(/<meta http-equiv="Keywords" content="(.+)"\/>/);
                item.sectionTitle = match ? match[1] : Ox._('Untitled');
                Ox.get(item.js, function(js) {
                    var references = js.match(self.options.references);
                    item.references = references ? Ox.unique(references).sort(function(a, b) {
                        a = a.toLowerCase();
                        b = b.toLowerCase();
                        return a < b ? -1 : a > b ? 1 : 0;
                    }) : [];
                    items.push(item);
                    if (items.length == self.options.examples.length) {
                        callback(items.sort(sortById));
                    }
                });
            });
        });
    }

    function selectItem(id) {
        var item = id ? getItemByName(id) : null,
            selected = self.options.selected;
        if (item) {
            self.options.selected = id;
            self.$list.options({selected: [item.section + '/' + id]});
            self.$page = Ox.ExamplePage({
                    height: window.innerHeight,
                    html: item.html,
                    js: item.js,
                    references: item.references,
                    replaceCode: self.options.replaceCode,
                    replaceComment: self.options.replaceComment,
                    selected: self.options.mode,
                    title: item.title,
                    width: window.innerWidth - self.options.size
                })
                .bindEvent({
                    change: function(data) {
                        that.triggerEvent('change', data);
                    },
                    close: function() {
                        selectItem();
                    }
                });
            self.$panel.replaceElement(1, self.$page);
        } else {
            self.options.selected = '';
            self.$list.options({selected: []});
            self.$page.empty().append(self.options.element);
        }
        if (self.options.selected != selected) {
            that.triggerEvent('select', {id: self.options.selected});
        }
    }

    function sortById(a, b) {
        return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    }

    return that;

};
