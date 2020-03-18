'use strict';

/*@
Ox.DocPanel <f> Documentation Panel
    options <o> Options object
        collapsible <b|false> If true, the list can be collabsed
        element <e> Default content
        expanded <b> If true, modules and sections are expanded in the list
        files <a|[]> Files to parse for docs (alternative to items option)
        getModule <f> Returns module for given item
        getSection <f> Returns section for given item
        items <a|[]> Array of doc items (alternative to files option)
        path <s|''> Path prefix
        references <r|null> RegExp to find references
        replace <[[]]|[]> See Ox.SyntaxHighlighter
        resizable <b|true> If true, list is resizable
        resize <a|[128, 256, 384]> List resize positions
        runTests <b|false> If true, run tests
        selected <s|''> Id of the selected item
        showLoading <b|false> If true, show loading icon when parsing files
        showTests <b|false> If true, show test results in list
        showTooltips <b|false> If true, show test result tooltips in list
        size <s|256> Default list size
        stripComments <b|false> If true, strip comments in source code
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.SplitPanel> Documentation Panel
        load <!> Fires once all docs are loaded
            items [o] Array of doc items
        tests <!> Fires once all tests finished
            results [o] Array of results
        select <!> select
@*/

Ox.DocPanel = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({
            collapsible: false,
            element: null,
            examples: [],
            examplesPath: '',
            expanded: false,
            files: [],
            getModule: function(item) {
                return item.file.replace(self.options.path, '');
            },
            getSection: function(item) {
                return item.section;
            },
            items: [],
            path: '',
            references: null,
            replace: [],
            resizable: false,
            resize: [128, 256, 384],
            results: null,
            runTests: false,
            selected: '',
            showLoading: false,
            showTests: false,
            showTooltips: false,
            size: 256,
            stripComments: false
        })
        .options(options || {})
        .update({
            selected: function() {
                selectItem(self.options.selected);
            }
        });

    self.$list = Ox.Element();
    self.$toolbar = Ox.Bar({size: 24}).css({textAlign: 'center'});
    self.$sidebar = Ox.SplitPanel({
        elements: [
            {element: Ox.Element()},
            {element: Ox.Element(), size: 24}
        ],
        orientation: 'vertical'
    });
    self.$page = Ox.Element();

    self.$testsStatus = $('<div>')
        .css({marginTop: '5px', textAlign: 'center'})
        .appendTo(self.$toolbar);
    if (!self.options.results) {
        self.options.results = {};
        self.$testsButton = Ox.Button({title: Ox._('Run Tests')})
            .css({margin: '4px auto'})
            .bindEvent({click: runTests})
            .appendTo(self.$toolbar);
        self.$testsStatus.hide();
    } else {
        self.$testsStatus.html(formatResults());
    }

    that.setElement(
        self.$panel = Ox.SplitPanel({
            elements: [
                {
                    collapsible: self.options.collapsible,
                    element: self.$sidebar,
                    resizable: self.options.resizable,
                    resize: self.options.resize,
                    size: self.options.size
                },
                {
                    element: self.$page
                }
            ],
            orientation: 'horizontal'
        })
    );

    if (self.options.files && self.options.files.length) {
        setTimeout(function() {
            self.options.showLoading && showLoadingScreen();
            self.options.files = Ox.makeArray(self.options.files);
            self.options.items = Ox.doc(self.options.files.map(function(file) {
                return self.options.path + file;
            }), function(docItems) {
                self.options.items = docItems;
                getExamples(function() {
                    self.options.showLoading && hideLoadingScreen();
                    self.$sidebar.replaceElement(1, self.$toolbar);
                    renderList();
                    self.options.runTests && runTests();
                    that.triggerEvent('load', {items: self.options.items});
                });
            });
        }, 250); // 0 timeout may fail in Firefox
    } else {
        getExamples(function() {
            self.$sidebar.replaceElement(1, self.$toolbar);
            renderList();
            self.options.runTests && runTests();
        });
    }

    function formatResults() {
        var results = self.options.results[''],
            tests = results.passed + results.failed;
        return tests + ' test' + (tests == 1 ? '' : 's') + ', '
            + results.passed + ' passed, ' + results.failed + ' failed';
    }

    function getExamples(callback) {
        var i = 0;
        if (self.options.examples && self.options.examples.length) {
            self.options.examples.forEach(function(example) {
                var path = self.options.examplesPath + example;
                Ox.get(path + '/index.html', function(html) {
                    var match = html.match(/<title>(.+)<\/title>/),
                        title = match ? match[1] : Ox._('Untitled');
                    Ox.get(path + '/js/example.js', function(js) {
                        var references = js.match(self.options.references);
                        if (references) {
                            Ox.unique(references).forEach(function(reference) {
                                var item = getItemByName(reference);
                                if (item) {
                                    item.examples = (
                                        item.examples || []
                                    ).concat({
                                        id: example.split('/').pop(),
                                        title: title
                                    });
                                }
                            });
                        }
                        if (++i == self.options.examples.length) {
                            self.options.items.forEach(function(item) {
                                if (item.examples) {
                                    item.examples.sort(function(a, b) {
                                        a = a.title.toLowerCase();
                                        b = b.title.toLowerCase();
                                        return a < b ? -1 : a > b ? 1 : 0;
                                    });
                                }
                            });
                            callback();
                        }
                    });
                });
            });
        } else {
            callback();
        }
    }

    function getIcon(id, expanded) {
        var $icon = null, results = self.options.results[id];
        if (!Ox.isEmpty(self.options.results)) {
            $icon = Ox.Theme.getColorImage(
                'symbol' + (expanded === true ? 'Down' : expanded === false ? 'Right' : 'Center'),
                !results ? '' : results.failed === 0 ? 'passed' : 'failed',
                self.options.showTooltips ? getTooltip(results) : null
            );
        } else if (!Ox.endsWith(id, '/')) {
            $icon = $('<img>').attr({src: Ox.UI.getImageURL('symbolCenter')});
        }
        return $icon;
    }

    function getItemByName(name) {
        var item = null;
        Ox.forEach(self.options.items, function(v) {
            if (v.name == name) {
                item = v;
                return false; // break
            }
        });
        return item;
    }

    function getTooltip(results) {
        return results
            ? results.passed + ' test'
                + (results.passed == 1 ? '' : 's') + ' passed'
                + (results.failed
                    ? ', ' + results.failed + ' test'
                        + (results.failed == 1 ? '' : 's') + ' failed'
                    : ''
                )
            : 'No tests';
    }

    function hideLoadingScreen() {
        self.$loadingIcon.stop().remove();
        self.$loadingText.remove();
    }

    function parseFiles(callback) {
        var counter = 0,
            docItems = [],
            length = self.options.files.length;
        self.options.files.forEach(function(file) {
            Ox.doc(self.options.path + file, function(fileItems) {
                docItems = docItems.concat(fileItems);
                ++counter == length && callback(docItems);
            });
        });
    }

    function renderList() {
        var treeItems = [];
        self.options.items.forEach(function(docItem) {
            var moduleIndex, results, sectionIndex;
            docItem.module = self.options.getModule(docItem);
            moduleIndex = Ox.getIndexById(treeItems, docItem.module + '/');
            if (moduleIndex == -1) {
                treeItems.push({
                    id: docItem.module + '/',
                    items: [],
                    title: docItem.module
                });
                moduleIndex = treeItems.length - 1;
            }
            docItem.section = self.options.getSection(docItem);
            if (docItem.section) {
                sectionIndex = Ox.getIndexById(
                    treeItems[moduleIndex].items,
                    docItem.module + '/' + docItem.section + '/'
                );
                if (sectionIndex == -1) {
                    treeItems[moduleIndex].items.push({
                        id: docItem.module + '/' + docItem.section + '/',
                        items: [],
                        title: docItem.section
                    });
                    sectionIndex = treeItems[moduleIndex].items.length - 1;
                }
            }
            (
                docItem.section
                ? treeItems[moduleIndex].items[sectionIndex]
                : treeItems[moduleIndex]
            ).items.push({
                id: docItem.module + '/' + (
                    docItem.section ? docItem.section + '/' : ''
                ) + docItem.name,
                title: docItem.name
            });
        });
        treeItems.sort(sortByTitle);
        treeItems.forEach(function(item) {
            item.items.sort(sortByTitle);
            item.items.forEach(function(subitem) {
                subitem.items.sort(sortByTitle);
            });
        });
        self.$list = Ox.TreeList({
                expanded: self.options.expanded,
                icon: self.options.showTests
                    ? getIcon
                    : Ox.UI.getImageURL('symbolCenter'),
                items: treeItems,
                selected: self.options.selected ? [self.options.selected] : '',
                width: self.options.size
            })
            .bindEvent({
                select: function(data) {
                    if (!data.ids[0] || !Ox.endsWith(data.ids[0], '/')) {
                        selectItem(
                            data.ids[0] ? data.ids[0].split('/').pop() : ''
                        );
                    }
                }
            });
        self.$sidebar.replaceElement(0, self.$list);
        selectItem(self.options.selected);
    }

    function runTests() {
        self.$testsButton.remove();
        self.$testsStatus.html('Running Tests...').show();
        Ox.load({Geo: {}, Image: {}, Unicode: {}}, function() {
            Ox.test(self.options.items, function(results) {
                results.forEach(function(result) {
                    var item = getItemByName(result.name),
                        passed = result.passed ? 'passed' : 'failed';
                    item.tests[Ox.indexOf(item.tests, function(test) {
                        return test.statement == result.statement;
                    })] = result;
                    ['', item.module + '/'].concat(
                        item.section ? item.module + '/' + item.section + '/' : [],
                        item.module + '/' + (item.section ? item.section + '/' : '') + item.name
                    ).forEach(function(key) {
                        self.options.results[key] = self.options.results[key] || {passed: 0, failed: 0};
                        self.options.results[key][passed]++;
                    });
                });
                self.$testsStatus.html(formatResults());
                renderList();
                that.triggerEvent('tests', {results: self.options.results});
            });
        });
    }

    function selectItem(id) {
        var item = id ? getItemByName(id) : null;
        if (item) {
            self.options.selected = id;
            self.$list.options({
                selected: [item.module + '/' + (
                    item.section ? item.section + '/' : ''
                ) + item.name]
            });
            self.$page = Ox.DocPage({
                    item: item,
                    replace: self.options.replace,
                    stripComments: self.options.stripComments
                })
                .bindEvent({
                    close: function() {
                        selectItem();
                    },
                    example: function(data) {
                        that.triggerEvent('example', data);
                    }
                });
            self.$panel.replaceElement(1, self.$page);
        } else {
            self.options.selected = '';
            self.$list.options({selected: []});
            self.$page.empty().append(self.options.element || $('<div>'));
        }
        that.triggerEvent('select', {id: self.options.selected});
    }

    function showLoadingScreen() {
        self.$loadingIcon = Ox.LoadingIcon({size: 16})
            .css({
                position: 'absolute',
                left: (self.$page.width() - self.options.size) / 2 - 8,
                top: self.$page.height() / 2 - 20
            })
            .appendTo(self.$page)
            .start();
        self.$loadingText = $('<div>')
            .addClass('OxLight')
            .css({
                position: 'absolute',
                left: (self.$page.width() - self.options.size) / 2 - 128,
                top: self.$page.height() / 2 + 4,
                width: 256,
                textAlign: 'center'
            })
            .html(Ox._('Generating Documentation...'))
            .appendTo(self.$page);
    }

    function sortByTitle(a, b) {
        var a = Ox.stripTags(a.title).toLowerCase(),
            b = Ox.stripTags(b.title).toLowerCase();
        return a < b ? -1 : a > b ? 1 : 0;
    }

    return that;

};
