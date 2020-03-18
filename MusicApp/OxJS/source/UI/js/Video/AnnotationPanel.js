'use strict';

// FIXME: should be Ox.AnnotationFolders

/*@
Ox.AnnotationPanel <f> Video Annotation Panel
    options <o> Options object
        calendarSize         <n|256>        calendar size
        clickLink            <f|null>       click link callback
        editable             <b|false>      if true, annotations can be edited
        highlight            <s|''>         highlight given string in annotations
        highlightAnnotations <b|false>      highlight annotations that match selection
        highlightLayer       <s|'*'> l      limit highlight to specific layer
        layers               <a|[]>         array with annotation objects
        mapSize              <n|256>        map size
        range                <s|'all'>      all, position, selection
        selected             <s|''>         selected annotation
        showCalendar         <b|false>      if true, calendar is shown
        showLayers           <o|{}>         object with layers to show
        showMap              <b|false>      if true, show map
        showUsers            <b|false>      if true show user
        sort                 <s|'position'> position, start, text
        width                <n|256>        panel width
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.SplitPanel> AnnotationPanel Object
        add <!> add
        annotationsID <!> annotationsID
        blur <!> blur
        change <!> change
        define <!> define
        edit <!> edit
        findannotations <!> findannotations
        find <!> find
        focus <!> focus
        info <!> info
        open <!> open
        remove <!> remove
        resize <!> resize
        submit <!> submit
        togglelayer <!> togglelayer
        toggle* <!> toggle*
@*/

Ox.AnnotationPanel = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({
            calendarSize: 256,
            clickLink: null,
            editable: false,
            enableExport: false,
            enableImport: false,
            highlight: '',
            highlightAnnotations: 'none',
            highlightLayer: '*',
            itemName: {singular: 'video', plural: 'videos'},
            layers: [],
            mapSize: 256,
            range: 'all',
            selected: '',
            separator: ';',
            showCalendar: false,
            showFind: false,
            showLayers: {},
            showMap: false,
            showUsers: false,
            sort: 'position',
            width: 256
        })
        .options(options || {})
        .update(function(key, value) {
            if (key == 'highlight' || key == 'highlightLayer') {
                self.$folder.forEach(function($folder) {
                    $folder.options({
                        highlight: getHighlight($folder.options('id'))
                    });
                });
            } else if (key == 'highlightAnnotations') {
                self.$folder.forEach(function($folder) {
                    $folder.options({
                        highlightAnnotations: self.options.highlightAnnotations
                    });
                });
            } else if (['in', 'out', 'position'].indexOf(key) > -1) {
                self.$folder.forEach(function($folder) {
                    $folder.options(key, value);
                });
            } else if (key == 'layers') {
                renderFolders();
            } else if (key == 'selected') {
                self.options.editable && updateEditMenu();
                if (value) {
                    var folder = getFolder(value)
                    folder && folder.options({selected: value});
                } else {
                    self.$folder.forEach(function($folder) {
                        $folder.options({selected: ''});
                    });
                }
            } else if (key == 'showLayers') {
                self.options.layers.forEach(function(layer, index) {
                    self.$folder[index].options({
                        collapsed: !self.options.showLayers[layer.id]
                    });
                });
            } else if (key == 'width') {
                self.$folder.forEach(function($folder) {
                    $folder.options({width: self.options.width - Ox.UI.SCROLLBAR_SIZE});
                });
            }
        })
        .addClass('OxAnnotationPanel');

    self.editing = false;

    self.languages = getLanguages();
    self.enabledLanguages = self.languages.map(function(language) {
        return language.code;
    });

    if (self.options.showUsers) {
        self.users = getUsers();
        self.enabledUsers = self.users;
    } else {
        self.enabledUsers = 'all';
    }

    self.$menubar = Ox.Bar({
            size: 16
        })
        .addClass('OxVideoPlayer')
        .bindEvent({
            doubleclick: function(e) {
                if ($(e.target).is('.OxBar')) {
                    self.$folders.animate({scrollTop: 0}, 250);
                }
            }
        });

    self.$folders = Ox.Element().css({overflowY: 'scroll'});
    self.$folder = [];

    renderFolders();
    renderOptionsMenu();
    self.options.editable && renderEditMenu();

    that.setElement(
        self.$panel = Ox.SplitPanel({
            elements: [
                {
                    element: self.$menubar,
                    size: 16
                },
                {
                    element: self.$folders
                }
            ],
            orientation: 'vertical'
        })
    );

    function getAnnotation(annotationId) {
        var found = false, annotation;
        Ox.forEach(self.options.layers, function(layer, i) {
            Ox.forEach(layer.items, function(item) {
                if (item.id == annotationId) {
                    annotation = item;
                    found = true;
                    return false; // break
                }
            });
            if (found) {
                return false; // break
            }
        });
        return annotation;
    }

    function getFolder(annotationId) {
        var found = false, folder;
        Ox.forEach(self.options.layers, function(layer, i) {
            Ox.forEach(layer.items, function(item) {
                if (item.id == annotationId) {
                    folder = self.$folder[i];
                    found = true;
                    return false; // break
                }
            });
            if (found) {
                return false; // break
            }
        });
        return folder;
    }

    function getHighlight(layer) {
        return Ox.contains(['*', layer], self.options.highlightLayer) ? self.options.highlight : '';
    }

    function getLanguages() {
        return Ox.sortBy(Ox.map(Ox.unique(Ox.flatten(
            self.options.layers.map(function(layer) {
                return layer.items.map(function(item) {
                    return item.languages;
                });
            })
        )), function(language) {
            return {
                code: language,
                name: Ox.getLanguageNameByCode(language)
            };
        }), 'name');
    }

    function getUsers() {
        return Ox.sort(Ox.unique(Ox.flatten(
            self.options.layers.map(function(layer) {
                return layer.items.map(function(item) {
                    return item.user;
                });
            })
        )));
    }

    function insert(data) {
        var id = data.id;
        Ox.InsertHTMLDialog(Ox.extend({
            callback: function(data) {
                Ox.$elements[id]
                    .value(data.value)
                    .focusInput(data.position)
                    .triggerEvent('change', data.value);
            }
        }, data)).open();
    }

    function renderEditMenu() {
        var annotation, annotationTitle, folder, hasManualCalendarOrMap,
            isDefined, isEditable, isEntity, isEvent, isEventOrPlace, isPlace, isString,
            key, manageTitle, type, value;
        if (self.options.selected) {
            annotation = getAnnotation(self.options.selected);
            folder = getFolder(self.options.selected);
            if (annotation && folder) {
                key = folder.options('id');
                type = folder.options('type');
                value = annotation.entity ? annotation.entity.name : annotation.value;
                isEditable = annotation.editable;
                isEntity = !!annotation.entity;
                isEvent = type == 'event';
                isPlace = type == 'place';
                isEventOrPlace = isEvent || isPlace;
                isString = type != 'text';
                // fixme: absence of annotation[type] may be an error
                isDefined = isEventOrPlace && !!annotation[type] && !!annotation[type].type;
                annotationTitle = folder.options('item') + ': "' + Ox.stripTags(value) + '"';
            }
        }
        hasManualCalendarOrMap = self.options.layers.some(function(layer) {
            return layer.type == 'event' || layer.type == 'place';
        });
        manageTitle = Ox._((isDefined ? 'Edit' : 'Define') + ' '
            + (isPlace ? 'Place' : isEvent ? 'Event' : 'Place or Event') + '...');
        self.$editMenuButton && self.$editMenuButton.remove();
        self.$editMenuButton = Ox.MenuButton({
            items: [].concat(
                self.options.layers.map(function(layer, i) {
                    return {
                        id: 'add' + layer.id,
                        disabled: !layer.editable,
                        title: Ox._('Add {0}', [layer.item]),
                        keyboard: i < 9 ? i + 1 + '' : null
                    }
                }),
                [
                    {},
                    {id: 'deselect', title: Ox._('Deselect Annotation'), disabled: !self.options.selected || self.editing, keyboard: 'escape'},
                    {id: 'edit', title: Ox._('Edit Annotation'), disabled: !self.options.selected || !isEditable || self.editing, keyboard: 'return'},
                    {id: 'delete', title: Ox._('Delete Annotation'), disabled: !self.options.selected || !isEditable, keyboard: 'delete'},
                    {},
                    {id: 'insert', title: Ox._('Insert...'), disabled: isString || !self.editing, keyboard: 'control i'},
                    {id: 'undo', title: Ox._('Undo Changes'), disabled: !self.editing, keyboard: 'escape'},
                    {id: 'save', title: Ox._('Save Changes'), disabled: !self.editing, keyboard: isString ? 'return' : 'shift return'},
                ],
                hasManualCalendarOrMap ? [
                    {},
                    {id: 'manage', title: manageTitle, disabled: !self.options.selected || !isEventOrPlace},
                ] : [],
                isString ? [
                    {},
                    {id: 'annotation', title: annotationTitle, disabled: true}
                ].concat(
                    isEntity ? [
                        {id: 'showentityinfo', title: Ox._('Show Entity Info'), keyboard: 'e'}
                    ] : [],
                    [
                        {id: 'findannotations', title: Ox._('Find in All {0}', [Ox.toTitleCase(self.options.itemName.plural)])},
                        {id: 'find', title: Ox._('Find in This {0}', [Ox.toTitleCase(self.options.itemName.singular)])}
                    ]
                ) : [],
                [
                    {},
                    {id: 'import', title: Ox._('Import Annotations...'), disabled: !self.options.enableImport},
                    {id: 'export', title: Ox._('Export Annotations...'), disabled: !self.options.enableExport},
                ]
            ),
            maxWidth: 256,
            style: 'square',
            title: 'edit',
            tooltip: Ox._('Editing Options'),
            type: 'image'
        })
        .css({float: 'right'})
        .bindEvent({
            click: function(data) {
                if (Ox.startsWith(data.id, 'add')) {
                    that.triggerEvent('add', {layer: data.id.slice(3), value: ''});
                } else if (data.id == 'delete') {
                    getFolder(self.options.selected).removeItem();
                } else if (data.id == 'deselect') {
                    getFolder(self.options.selected).options({selected: ''});
                } else if (data.id == 'edit') {
                    getFolder(self.options.selected).editItem();
                } else if (data.id == 'export') {
                    that.triggerEvent('exportannotations');
                } else if (data.id == 'find') {
                    that.triggerEvent('find', {value: value});
                } else if (data.id == 'findannotations') {
                    that.triggerEvent('findannotations', {key: key, value: value});
                } else if (data.id == 'import') {
                    that.triggerEvent('importannotations');
                } else if (data.id == 'insert') {
                    var id = $('.OxEditableElement div.OxInput').data('oxid'),
                        element = $('.OxEditableElement textarea.OxInput')[0];
                    insert({
                        end: element.selectionEnd,
                        id: id,
                        selection: element.value.slice(
                            element.selectionStart, element.selectionEnd
                        ),
                        start: element.selectionStart,
                        value: element.value
                    });
                } else if (data.id == 'manage') {
                    that.triggerEvent('define', {
                        id: getAnnotation(self.options.selected)[type].id,
                        type: type
                    });
                } else if (data.id == 'save') {
                    // ...
                } else if (data.id == 'showentityinfo') {
                    that.triggerEvent('showentityinfo', annotation.entity);
                } else if (data.id == 'undo') {
                    // ...
                }
            },
            hide: function() {
                var folder = self.options.selected
                    ? getFolder(self.options.selected)
                    : null;
                folder ? folder.gainFocus() : that.triggerEvent('focus');
            }
        })
        .appendTo(self.$menubar);
    }
    function renderFolder(layer) {
        var index = Ox.getIndexById(self.options.layers, layer.id),
            item = Ox.getObjectById(layer.items, self.options.selected),
            selected = item ? item.id : '';
        self.$folder[index] = Ox.AnnotationFolder(
                Ox.extend({
                    clickLink: self.options.clickLink,
                    collapsed: !self.options.showLayers[layer.id],
                    editable: self.options.editable,
                    highlight: getHighlight(layer.id),
                    highlightAnnotations: self.options.highlightAnnotations,
                    id: layer.id,
                    'in': self.options['in'],
                    keyboard: index < 9 ? index + 1 + '' : '',
                    out: self.options.out,
                    position: self.options.position,
                    range: self.options.range,
                    selected: selected,
                    separator: self.options.separator,
                    sort: self.options.sort,
                    width: self.options.width - Ox.UI.SCROLLBAR_SIZE
                }, layer, layer.type == 'event' ? {
                    showWidget: self.options.showCalendar,
                    widgetSize: self.options.calendarSize
                } : layer.type == 'place' ? {
                    showWidget: self.options.showMap,
                    widgetSize: self.options.mapSize
                } : {})
            )
            .bindEvent({
                add: function(data) {
                    that.triggerEvent('add', Ox.extend({layer: layer.id}, data));
                },
                blur: function() {
                    that.triggerEvent('blur');
                },
                change: function(data) {
                    that.triggerEvent('change', Ox.extend({layer: layer.id}, data));
                },
                edit: function() {
                    self.editing = true;
                    renderEditMenu();
                    that.triggerEvent('edit');
                },
                info: function(data) {
                    that.triggerEvent('info', {layer: layer.id});
                },
                insert: insert,
                key_e: function(data) {
                    var entity = getAnnotation(self.options.selected).entity;
                    entity && that.triggerEvent('showentityinfo', entity);
                },
                open: function() {
                    that.triggerEvent('open');
                },
                remove: function(data) {
                    that.triggerEvent('remove', Ox.extend({layer: layer.id}, data));
                },
                resizewidget: function(data) {
                    that.triggerEvent('resize' + (
                        layer.type == 'event' ? 'calendar' : 'map'
                    ), data);
                },
                select: function(data) {
                    selectAnnotation(data, index);
                },
                selectnext: function() {
                    selectNext(layer.id, 1);
                },
                selectprevious: function() {
                    selectNext(layer.id, -1);
                },
                selectnone: selectNone,
                submit: function(data) {
                    that.triggerEvent('submit', Ox.extend({layer: layer.id}, data));
                },
                togglelayer: function(data) {
                    self.options.showLayers[layer.id] = !data.collapsed;
                    that.triggerEvent('togglelayer', Ox.extend({layer: layer.id}, data));
                },
                togglewidget: function(data) {
                    that.triggerEvent('toggle' + (
                        layer.type == 'event' ? 'calendar' : 'map'
                    ), data);
                }
            })
            .appendTo(self.$folders);
        [
            '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
            'b', 'backslash', 'closebracket', 'comma', 'dot',
            'equal', 'f', 'g', 'h', 'i', 'minus', 'n', 'o',
            'openbracket', 'p', 'shift_0', 'shift_equal',
            'shift_g', 'shift_i', 'shift_minus', 'shift_o',
            'slash', 'space'
        ].forEach(function(key) {
            key = 'key.' + key;
            self.$folder[index].bindEvent(key, function() {
                that.triggerEvent(key);
            });
        });
    }

    function renderFolders() {
        self.$folders.empty();
        self.options.layers.forEach(function(layer, index) {
            renderFolder(layer);
        });
    }

    function renderOptionsMenu() {
        self.$optionsMenuButton && self.$optionsMenuButton.remove();
        self.$optionsMenuButton = Ox.MenuButton({
                items: [].concat(
                    [
                        {id: 'showannotations', title: Ox._('Show Annotations'), disabled: true},
                        {group: 'range', min: 1, max: 1, items: [
                            {id: 'all', title: Ox._('All'), checked: self.options.range == 'all'},
                            {id: 'selection', title: Ox._('In Current Selection'), checked: self.options.range == 'selection'},
                            {id: 'position', title: Ox._('At Current Position'), checked: self.options.range == 'position'}
                        ]},
                        {},
                        {id: 'sortannotations', title: Ox._('Sort Annotations'), disabled: true},
                        {group: 'sort', min: 1, max: 1, items: [
                            {id: 'position', title: Ox._('By Position'), checked: self.options.sort == 'position'},
                            {id: 'duration', title: Ox._('By Duration'), checked: self.options.sort == 'duration'},
                            {id: 'text', title: Ox._('By Text'), checked: self.options.sort == 'text'},
                            {id: 'created', title: Ox._('By Creation Time'), checked: self.options.sort == 'created'}
                        ]}
                    ],
                    self.options.showFind ? [
                        {},
                        {id: 'results', title: Ox._('Find Annotations'), disabled: true},
                        {group: 'results', max: 1, items: [
                            {
                                id: 'result_*',
                                title: Ox._('All'),
                                checked: self.options.highlightLayer == '*'
                            }
                        ].concat(self.options.layers.map(function(result) {
                            return {
                                id: 'result_' + result.id,
                                title: result.title,
                                checked: result.id == self.options.highlightLayer
                            };
                        }))}
                    ] : [],
                    self.options.editable ? [
                        {},
                        {id: 'highlightannotations', title: Ox._('Highlight Annotations'), disabled: true},
                        {group: 'highlight', max: 1, items: [
                            {id: 'none', title: Ox._('None'), checked: self.options.highlightAnnotations == 'none'},
                            {id: 'value', title: Ox._('Same Value'), checked: self.options.highlightAnnotations == 'value'},
                            {id: 'selection', title: Ox._('Same Selection'), checked: self.options.highlightAnnotations == 'selection'}
                        ]}
                    ] : [],
                    self.languages.length > 1 ? [
                        {},
                        {id: 'languages', title: Ox._('Show Languages'), disabled: true},
                        {group: 'languages', min: 1, max: -1, items: self.languages.map(function(language) {
                            return {
                                id: language.code,
                                title: Ox._(language.name),
                                checked: Ox.contains(self.enabledLanguages, language.code)
                            };
                        })}
                    ] : [],
                    self.options.showUsers && self.users.length ? [
                        {},
                        {id: 'users', title: Ox._('Show Users'), disabled: true},
                        {group: 'users', min: 0, max: -1, items: self.users.map(function(user) {
                            return {
                                id: 'user_' + user,
                                title: Ox.encodeHTMLEntities(user),
                                checked: self.enabledUsers == 'all' || Ox.contains(self.enabledUsers, user)
                            };
                        })}
                    ] : [],
                    self.options.showUsers && self.users.length > 1 ? [
                        {},
                        {id: 'allusers', title: Ox._('Show All Users')},
                        {id: 'nousers', title: Ox._('Show No Users')}
                    ] : []
                ),
                style: 'square',
                title: 'set',
                tooltip: Ox._('Options'),
                type: 'image'
            })
            .css({float: 'left'})
            .bindEvent({
                change: function(data) {
                    var set = {};
                    if (data.id == 'languages') {
                        self.enabledLanguages = data.checked.map(function(checked) {
                            return checked.id;
                        });
                        self.$folder.forEach(function($folder) {
                            $folder.options({languages: self.enabledLanguages});
                        });
                    } else if (data.id == 'users') {
                        self.enabledUsers = data.checked.map(function(checked) {
                            return checked.id.slice(5);
                        });
                        self.$folder.forEach(function($folder) {
                            $folder.options({users: self.enabledUsers});
                        });
                    } else if (data.id == 'results') {
                        var layer = data.checked[0].id.split('_').pop()
                        that.options({highlightLayer: layer});
                        that.triggerEvent('highlightlayer', self.options.highlightLayer);
                    } else if (data.id == 'highlight') {
                        var value = data.checked[0].id
                        that.options({highlightAnnotations: value});
                        that.triggerEvent('highlightannotations', self.options.highlightAnnotations);
                    } else {
                        self.options[data.id] = data.checked[0].id;
                        set[data.id] = self.options[data.id];
                        self.$folder.forEach(function($folder) {
                            $folder.options(set);
                        });
                        that.triggerEvent('annotations' + data.id, set);
                    }
                },
                click: function(data) {
                    if (data.id == 'allusers') {
                        self.enabledUsers = Ox.clone(self.users);
                        self.users.forEach(function(user) {
                            self.$optionsMenuButton.checkItem('user_' + user);
                        });
                        self.$folder.forEach(function($folder) {
                            $folder.options({users: self.enabledUsers});
                        });
                    } else if (data.id == 'nousers') {
                        self.enabledUsers = [];
                        self.users.forEach(function(user) {
                            self.$optionsMenuButton.uncheckItem('user_' + user);
                        });
                        self.$folder.forEach(function($folder) {
                            $folder.options({users: self.enabledUsers});
                        });
                    }
                },
                hide: function() {
                    var folder = self.options.selected
                        ? getFolder(self.options.selected)
                        : null;
                    folder ? folder.gainFocus() : that.triggerEvent('focus');
                }
            })
            .appendTo(self.$menubar);
    }

    function scrollToSelected(type) {
        var $item = that.find('.OxEditableElement.OxSelected'),
            itemHeight = $item.height() + (type == 'text' ? 8 : 0),
            itemTop = ($item.offset() || {}).top,
            itemBottom = itemTop + itemHeight,
            height = self.$folders.height(),
            scrollTop = self.$folders.scrollTop(),
            top = self.$folders.offset().top;
        if (itemTop < top || itemBottom > top + height) {
            if (itemTop < top) {
                scrollTop += itemTop - top;
            } else {
                scrollTop += itemBottom - top - height;
            }
            self.$folders.animate({
                scrollTop: scrollTop + 'px'
            }, 0);
        }
    }

    function selectAnnotation(data, index) {
        if (data.id) {
            Ox.forEach(self.$folder, function($folder, i) {
                if (i != index && $folder.options('selected')) {
                    self.deselecting = true;
                    $folder.options({selected: ''});
                    self.deselecting = false;
                    return false; // break
                }
            });
            scrollToSelected(self.options.layers[index].type);
        }
        if (!self.deselecting) {
            self.options.selected = data.id;
            self.options.editable && renderEditMenu();
            that.triggerEvent('select', data);
        }
    }

    function selectNone() {
        if (self.options.selected) {
            getFolder(self.options.selected).options({selected: ''});
        }
    }

    function selectNext(layer, direction) {
        var index = Ox.mod(
            Ox.getIndexById(self.options.layers, layer) + direction,
            self.options.layers.length
        );
        self.$folder[index].selectItem(direction == 1 ? 0 : -1);
    }

    function updateEditMenu() {
        var action = self.options.selected ? 'enableItem' : 'disableItem';
        self.$editMenuButton[action]('edit');
        self.$editMenuButton[action]('delete');
    }

    function updateLanguages() {
        var languages = self.languages,
            enabledLanguages = self.enabledLanguages;
        self.languages = getLanguages();
        self.enabledLanguages = self.languages.filter(function(language) {
            // enabled if it was enabled, was just added, or is the only
            // language
            return Ox.contains(enabledLanguages, language)
                || !Ox.contains(languages, language)
                || self.languages.length == 1;
        }).map(function(language) {
            return language.code;
        });
        if (
            self.languages.length == 1
            && !Ox.contains(enabledLanguages, self.languages[0].code)
        ) {
            // last remaining language was enabled by removing all other
            // languages
            self.$folder.forEach(function($folder) {
                $folder.options({languages: self.enabledLanguages});
            });
        }
    }

    /*@
    addItem <f> add item
        (layer, item) -> <o> AnnotationPanel
    @*/
    that.addItem = function(layer, item) {
        // called from addannotation callback
        var i = Ox.getIndexById(self.options.layers, layer);
        self.$folder[i].addItem(item);
        updateLanguages();
        self.users = getUsers();
        if (self.enabledUsers != 'all' && self.enabledUsers.indexOf(item.user) == -1) {
            self.enabledUsers.push(item.user);
            self.$folder[i].options({users: self.enabledUsers});
        }
        renderOptionsMenu();
        renderEditMenu();
        return that;
    };

    /*@
    addLayer <f> Add a layer
        (layer[, index]) -> <o> AnnotationPanel
    @*/
    that.addLayer = function(layer, index) {
        // FIXME: add/remove/updateLayer don't update users yet
        index = index || self.options.layers.length;
        self.options.layers.splice(index, 0, layer);
        renderFolders();
        return that;
    };

    /*@
    blurItem <f> Blur selected item
        () -> <o> AnnotationPanel
    @*/
    that.blurItem = function() {
        self.editing = false;
        getFolder(self.options.selected).blurItem();
        renderEditMenu();
        return that;
    };

    /*@
    editItem <f> Put selected item into edit mode
        () -> <o> AnnotationPanel
    @*/
    that.editItem = function() {
        self.editing = true;
        getFolder(self.options.selected).editItem();
        renderEditMenu();
        return that;
    };

    that.getCurrentAnnotations = function() {
        var annotations = {};
        self.options.layers.forEach(function(layer) {
            annotations[layer.id] = self.$folder[
                Ox.getIndexById(self.options.layers, layer.id)
            ].getCurrentAnnotations();
        });
        return annotations;
    };

    /*@
    removeItem <f> Remove selected item
        () -> <o> AnnotationPanel
    @*/
    that.removeItem = function(remove) {
        if (remove) {
            // remove initiated by video editor
            getFolder(self.options.selected).removeItem();
        } else {
            // called from removeannotation callback
            self.options.selected = '';
            updateLanguages();
            self.users = getUsers();
            renderOptionsMenu();
            renderEditMenu();
        }
        return that;
    };

    /*@
    removeLayer <f> Remove a layer
        (id) -> <o> AnnotationPanel
    @*/
    that.removeLayer = function(id) {
        var $folder = getFolder(self.options.selected),
            index = Ox.getIndexById(self.options.layers, id);
        if (self.$folder[index] == $folder) {
            $folder.blurItem();
        }
        self.options.layers.splice(index, 1);
        renderFolders();
        return that;
    };

    /*@
    updateItem <f> Update an item
        (id, item) -> <o> AnnotationPanel
    @*/
    that.updateItem = function(id, item) {
        // called from editannotation callback
        // on the first update of a new annotation, the id will change
        self.options.selected = item.id;
        getFolder(id).updateItem(id, item);
        updateLanguages();
        renderOptionsMenu();
        renderEditMenu();
        return that;
    };

    /*@
    updateLayer <f> Update a layer
        (id, items) -> <o> AnnotationPanel
    @*/
    that.updateLayer = function(id, items) {
        var $folder = getFolder(self.options.selected),
            index = Ox.getIndexById(self.options.layers, id);
        if (self.$folder[index] == $folder) {
            $folder.blurItem();
        }
        self.options.layers[index].items = items;
        self.$folder[index].replaceWith(
            self.$folder[index] = renderFolder(self.options.layers[index])
        );
        return that;
    };

    return that;

};
