'use strict';

/*@
Ox.AnnotationFolder <f> AnnotationFolder Object
    options <o> Options object
        editable <b|false> If true, annotations can be added
        id <s> id
        items <a|[]> items
        title <s> title
        type <s|'text'> panel type
        width <n|0>
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.CollapsePanel> AnnotationFolder Object
        add <!> add
        blur <!> blur
        change <!> change
        edit <!> edit
        info <!> info
        insert <!> insert
        key_* <!> key_*
        open <!> open
        remove <!> remove
        selectnext <!> selectnext
        selectprevious <!> selectprevious
        selectnone <!> selectnone
        select <!> select
        submit <!> submit
        togglelayer <!> togglelayer
        togglewidget <!> togglewidget
@*/

Ox.AnnotationFolder = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({
            clickLink: null,
            collapsed: false,
            editable: false,
            highlight: '',
            highlightAnnotations: 'none',
            id: '',
            'in': 0,
            item: '',
            items: [],
            keyboard: '',
            languages: 'all',
            out: 0,
            position: 0,
            range: 'all',
            selected: '',
            separator: ';',
            showInfo: false,
            showWidget: false,
            sort: 'position',
            translate: false,
            title: '',
            type: 'text',
            users: 'all',
            widgetSize: 256,
            width: 0
        })
        .options(options || {})
        .update(function(key, value) {
            if (key == 'highlight') {
                self.$annotations.options({highlight: value});
            }
            if (key == 'highlightAnnotations') {
                self.$annotations.options({highlightGroup: value});
                updateAnnotations();
            }
            if (['in', 'out'].indexOf(key) > -1 && self.editing) {
                var item = Ox.getObjectById(self.options.items, self.options.selected);
                item[key] = value;
                item.duration = self.options.out - self.options['in'];
                self.points = getPoints();
            }
            if (key == 'in') {
                //fixme: array editable should support item updates while editing
                self.options.range == 'selection' && updateAnnotations();
            } else if (key == 'out') {
                self.options.range == 'selection' && updateAnnotations();
            } else if (key == 'position') {
                if (self.options.range == 'position') {
                    crossesPoint() && updateAnnotations();
                    self.position = self.options.position;
                }
            } else if (key == 'collapsed') {
                self.options.collapsed = !self.options.collapsed;
                self.$panel.options({collapsed: !self.options.collapsed});
                self.options.type == 'event' && self.$calendar.resizeCalendar()
                self.options.type == 'map' && self.$map.resizeMap()
            } else if (key == 'languages') {
                updateAnnotations();
            } else if (key == 'range') {
                updateAnnotations();
                self.$annotations.options({placeholder: getPlaceholder()});
            } else if (key == 'selected') {
                if (value === '') {
                    self.editing = false;
                }
                if (value && self.options.collapsed) {
                    self.$panel.options({animate: false});
                    self.$panel.options({collapsed: false});
                    self.$panel.options({animate: true});
                }
                self.$annotations.options({selected: value});
            } else if (key == 'sort') {
                self.sort = getSort();
                self.$annotations.options({sort: self.sort});
                showWarnings();
            } else if (key == 'users') {
                updateAnnotations();
            } else if (key == 'width') {
                if (self.widget) {
                    self.$outer.options({width: self.options.width});
                    self.$inner.options({width: self.options.width});
                    self.$widget.options({width: self.options.width});
                }
                self.$annotations.options({
                    width: self.options.type == 'text'
                        ? self.options.width + 8
                        : self.options.width
                });
            }
        });

    if (self.options.selected) {
        self.options.collapsed = false;
    }

    self.annotations = getAnnotations();
    self.points = getPoints();
    self.position = self.options.position;
    self.sort = getSort();
    self.widget = self.options.type == 'event' ? 'Calendar'
        : self.options.type == 'place' ? 'Map' : '';

    self.$addButton = Ox.Button({
            id: 'add',
            style: 'symbol',
            title: 'add',
            tooltip: Ox._('Add {0}', [self.options.item])
                + (self.options.keyboard ? ' [' + self.options.keyboard + ']' : ''),
            type: 'image'
        })
        .bindEvent({
            click: function() {
                that.triggerEvent('add', {value: ''});
            }
        });

    self.$infoButton = Ox.Button({
            style: 'symbol',
            title: 'info',
            type: 'image'
        })
        .bindEvent({
            click: function() {
                that.triggerEvent('info');
            }
        });

    self.$panel = Ox.CollapsePanel({
            collapsed: self.options.collapsed,
            extras: [self.options.editable ? self.$addButton : self.$infoButton],
            size: 16,
            title: self.options.title
        })
        .addClass('OxAnnotationFolder')
        .bindEvent({
            toggle: toggleLayer
        });

    that.setElement(self.$panel);
    that.$content = self.$panel.$content;

    if (self.widget) {
        self.widgetSize = self.options.showWidget * self.options.widgetSize;
        self.$outer = Ox.Element()
            .css({
                display: 'table-cell',
                width: self.options.width + 'px'
            })
            .appendTo(that.$content);
        self.$inner = Ox.Element()
            .css({
                height: self.widgetSize + 'px',
                overflow: 'hidden'
            })
            .appendTo(self.$outer);
        if (options.type == 'event') {
            self.$widget = self.$calendar = Ox.Calendar({
                    events: getEvents(),
                    height: self.widgetSize,
                    showZoombar: true,
                    width: self.options.width,
                    zoomOnlyWhenFocused: true
                })
                .css({
                    width: self.options.width + 'px',
                    height: self.widgetSize + 'px'
                })
                .bindEvent({
                    select: function(data) {
                        if (
                            !data.id && self.options.selected
                            && isDefined(Ox.getObjectById(self.options.items, self.options.selected))
                        ) {
                            // only deselect annotation if the event deselect was not
                            // caused by switching to an annotation without event
                            self.$annotations.options({selected: ''});
                        } else if (
                            data.annotationIds
                            && data.annotationIds.indexOf(self.options.selected) == -1
                        ) {
                            // only select a new annotation if the currently selected
                            // annotation does not match the selected event
                            self.$annotations.options({selected: data.annotationIds[0]});
                        }
                    }
                })
                .appendTo(self.$inner);
        } else { // place
            self.$widget = self.$map = Ox.Map({
                    places: getPlaces(),
                    showTypes: true,
                    // FIXME: should be showZoombar
                    zoombar: true,
                    zoomOnlyWhenFocused: true
                    // showLabels: true
                })
                .css({
                    width: self.options.width + 'px',
                    height: self.widgetSize + 'px'
                })
                .bindEvent({
                    // FIXME: duplicated!
                    select: function(data) {
                        if (
                            (!data || !data.id) && self.options.selected
                            && isDefined(Ox.getObjectById(self.options.items, self.options.selected))
                        ) {
                            // only deselect annotation if the place deselect was not
                            // caused by switching to an annotation without place
                            self.$annotations.options({selected: ''});
                        } else if (
                            data
                            && data.annotationIds
                            && data.annotationIds.indexOf(self.options.selected) == -1
                        ) {
                            // only select a new annotation if the currently selected
                            // annotation does not match the selected place
                            self.$annotations.options({selected: data.annotationIds[0]});
                        }
                    }
                })
                .appendTo(self.$inner);
        }
        self.$resizebar = Ox.Element({
                tooltip: Ox._('Drag to resize or click to toggle map') // fixme: update as w/ splitpanels
            })
            .addClass('OxResizebar OxHorizontal')
            .css({
                position: 'absolute',
                top: self.widgetSize + 'px',
                cursor: 'ns-resize'
            })
            .append($('<div>').addClass('OxSpace'))
            .append($('<div>').addClass('OxLine'))
            .append($('<div>').addClass('OxSpace'))
            .bindEvent({
                anyclick: toggleWidget,
                dragstart: dragstart,
                drag: drag,
                dragend: dragend
            })
            .appendTo(self.$outer);
    }
    self.$annotations = Ox.ArrayEditable(Ox.extend({
            clickLink: self.options.clickLink,
            editable: self.options.editable,
            getSortValue: self.options.type == 'text'
                ? function(value) {
                    return Ox.stripTags(value);
                }
                : null,
            globalAttributes: ['data', 'lang'],
            highlight: self.options.translate ? Ox._(self.options.highlight) : self.options.highlight,
            highlightGroup: self.options.highlightAnnotations,
            placeholder: Ox._('Loading...'),
            separator: self.options.separator,
            sort: self.sort,
            submitOnBlur: false,
            tooltipText: self.options.showInfo ? function(item) {
                return Ox.encodeHTMLEntities(item.user) + ', '
                    + Ox.formatDate(item.modified.slice(0, 10), '%B %e, %Y');
            } : '',
            width: self.options.width,
            maxHeight: self.options.type == 'text' ? Infinity : void 0,
            type: self.options.type == 'text' ? 'textarea' : 'input'
        }, self.options.autocomplete ? {
            autocomplete: function(value, callback) {
                self.options.autocomplete(self.options.id, value, callback);
            },
            autocompleteReplace: self.options.type == 'entity',
            //autocompleteReplaceCorrect: true,
            autocompleteSelect: true,
            autocompleteSelectHighlight: true,
            autocompleteSelectMaxWidth: 256,
            autocompleteSelectOffset: {left: 0, top: 0},
            autocompleteSelectUpdate: true,
            format: self.options.translate ? function(value) {
                return Ox._(value);
            } : null,
            unformat: function(value) {
                return Ox.decodeHTMLEntities(Ox.stripTags(value));
            }
        } : {}))
        .bindEvent({
            add: function(data) {
                if (self.editing) {
                    // FIXME: changed value will not be saved!
                }
                that.triggerEvent('add', {value: data.value || ''});
            },
            blur: function(data) {
                if (data && data.id[0] == '_') {
                    changeAnnotation(data);
                    that.triggerEvent('blur');
                } else {
                    // the video editor will, if it has not received focus,
                    // call blurItem
                    that.triggerEvent('blur');
                }
            },
            change: changeAnnotation,
            'delete': removeAnnotation,
            edit: function() {
                self.editing = true;
                that.triggerEvent('edit');
            },
            insert: function(data) {
                that.triggerEvent('insert', data);
            },
            open: function() {
                that.triggerEvent('open');
            },
            select: selectAnnotation,
            selectnext: function() {
                that.triggerEvent('selectnext');
            },
            selectprevious: function() {
                that.triggerEvent('selectprevious');
            },
            selectnone: function() {
                that.triggerEvent('selectnone');
            },
            submit: submitAnnotation
        })
        .appendTo(
            ['event', 'place'].indexOf(self.options.type) > -1
            ? self.$outer : that.$content
        );

    [
        '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
        'b', 'backslash', 'closebracket', 'comma', 'dot',
        'equal', 'e', 'f', 'g', 'h', 'i', 'minus', 'n', 'o',
        'openbracket', 'p', 'shift_0', 'shift_equal',
        'shift_g', 'shift_i', 'shift_minus', 'shift_o',
        'slash', 'space'
    ].forEach(function(key) {
        key = 'key.' + key;
        self.$annotations.bindEvent(key, function() {
            that.triggerEvent(key);
        });
    });

    self.loaded = false;
    setTimeout(function() {
        self.$annotations.options({
            items: self.annotations,
            placeholder: getPlaceholder(),
            selected: self.options.selected
        });
        self.loaded = true;
        if (self.options.selected) {
            // need timeout in order to trigger events
            if (self.options.collapsed) {
                self.$panel.options({collapsed: false});
            }
            selectAnnotation({id: self.options.selected});
        };
    });
    [
        '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
        'b', 'backslash', 'closebracket', 'comma', 'dot',
        'equal', 'f', 'g', 'h', 'i', 'minus', 'n', 'o',
        'openbracket', 'p', 'shift_0', 'shift_equal',
        'shift_g', 'shift_i', 'shift_minus', 'shift_o',
        'slash', 'space'
    ].forEach(function(key) {
        key = 'key_' + key;
        self.$annotations.bindEvent(key, function() {
            that.triggerEvent(key);
        });
    });

    showWarnings();

    function changeAnnotation(data) {
        var item = Ox.getObjectById(self.options.items, data.id);
        if (item.value != data.value) {
            item.value = data.value;
            that.triggerEvent('change', item);
        }
    }

    function crossesPoint() {
        var positions = Ox.sort([self.position, self.options.position]);
        return self.points.some(function(point) {
            return point >= positions[0] && point <= positions[1];
        });
    }

    function dragstart() {
        if (self.options.showWidget) {
            Ox.$body.addClass('OxDragging');
            self.drag = {
                startSize: self.options.widgetSize
            };
        }
    }

    function drag(e) {
        if (self.options.showWidget) {
            self.options.widgetSize = Ox.limit(
                self.drag.startSize + e.clientDY, 128, 384
            );
            if (self.options.widgetSize >= 248 && self.options.widgetSize <= 264) {
                self.options.widgetSize = 256;
            }
            self.$resizebar.css({top: self.options.widgetSize + 'px'});
            self.$inner.css({height: self.options.widgetSize + 'px'});
            self.$widget.options({height: self.options.widgetSize});
        }
    }

    function dragend(e) {
        if (self.options.showWidget) {
            Ox.$body.removeClass('OxDragging');
            self.options.type == 'event'
                ? self.$calendar.resizeCalendar()
                : self.$map.resizeMap();
            that.triggerEvent('resizewidget', {size: self.options.widgetSize});
        }
    }

    function getAnnotations() {
        var annotations = Ox.filter(self.options.items, function(item) {
            return self.editing && item.id == self.options.selected || (
                (
                    self.options.range == 'all' || (
                        self.options.range == 'selection'
                        && item['in'] <= self.options.out
                        && item.out >= self.options['in']
                    ) || (
                        self.options.range == 'position'
                        && item['in'] <= self.options.position
                        && item.out >= self.options.position
                    )
                ) && (
                    self.options.languages == 'all'
                    || self.options.languages.some(function(language) {
                        return item.languages && item.languages.indexOf(language) > -1;
                    })
                ) && (
                    self.options.users == 'all'
                    || self.options.users.indexOf(item.user) > -1
                )
            );
        }).map(function(item) {
            return Ox.extend(item, {
                group: self.options.highlightAnnotations == 'none' ? ''
                    : self.options.highlightAnnotations == 'value' ? item.value
                    : item['in'] + '-' + item.out
            });
        });
        return annotations;
    }

    function getEvents() {
        var events = [];
        self.annotations.filter(function(item) {
            return isDefined(item);
        }).forEach(function(item) {
            var index = Ox.getIndexById(events, item.event.id);
            if (index == -1) {
                events.push(Ox.extend({
                    annotationIds: [item.id]
                }, item.event))
            } else {
                events[index].annotationIds.push(item.id);
            }
        });
        return events;
    }

    function getPlaceholder() {
        return 'No ' + self.options.title.toLowerCase() + (
            self.options.range == 'position' ? ' at current position'
            : self.options.range == 'selection' ? ' in current selection'
            : ''
        );
    }

    function getPlaces() {
        var places = [];
        self.annotations.filter(function(item) {
            return isDefined(item);
        }).forEach(function(item) {
            var index = Ox.getIndexById(places, item.place.id);
            if (index == -1) {
                places.push(Ox.extend({
                    annotationIds: [item.id]
                }, item.place));
            } else {
                places[index].annotationIds.push(item.id);
            }
        });
        return places;
    }

    function getPoints() {
        return Ox.unique(Ox.flatten(
            self.options.items.map(function(item) {
                return [item['in'], item.out];
            })
        ));
    }

    function getSort() {
        return ({
            duration: ['-duration', '+in', self.options.type == 'text' ? '+created' : '+value'],
            position: ['+in', '+duration', self.options.type == 'text' ? '+created' : '+value'],
            text: ['+value', '+in', '+duration'],
            created: ['+created', '+in', '+duration', '+value']
        })[self.options.sort];
    }

    function isDefined(item) {
        return !!item[self.options.type]
            && !!item[self.options.type].type;
    }

    function removeAnnotation(data) {
        var item;
        self.editing = false;
        if (self.widget) {
            item = Ox.getObjectById(self.options.items, data.id);
            if (isDefined(item)) {
                if (self.options.type == 'event') {
                    self.$calendar.options({selected: ''})
                        .options({events: getEvents()});
                } else {
                    self.$map.options({selected: ''})
                        .options({places: getPlaces()});
                }
            }
        }
        showWarnings();
        that.triggerEvent('remove', {id: data.id});
    }

    function selectAnnotation(data) {
        if (self.loaded) {
            var item = Ox.getObjectById(self.options.items, data.id);
            self.options.selected = item ? data.id : '';
            if (self.widget) {
                if (self.options.type == 'event') {
                    self.$calendar.options({
                            selected: item && isDefined(item) ? item.event.id : ''
                        })
                        .panToEvent();
                } else {
                    self.$map.options({
                            selected: item && isDefined(item) ? item.place.id : ''
                        })
                        .panToPlace();
                }
            }
            that.triggerEvent('select', Ox.extend(data, item ? {
                'in': item['in'],
                out: item.out,
                layer: self.options.id
            } : {}));
        }
    }

    function showWarnings() {
        if (self.widget && self.options.items.length) {
            self.$annotations.find('.OxEditableElement').each(function() {
                var $element = $(this);
                // We don't want to catch an eventual placeholder,
                // which is an EditableElement without .data('id')
                if (
                    $element.data('id')
                    && !isDefined(
                        Ox.getObjectById(self.options.items, $element.data('id'))
                    )
                ) {
                    $element.addClass('OxWarning');
                } else {
                    $element.removeClass('OxWarning');
                }
            });
        }
    }

    function submitAnnotation(data) {
        var item = Ox.getObjectById(self.options.items, data.id);
        item.value = data.value;
        self.editing = false;
        self.options.sort == 'text' && self.$annotations.reloadItems();
        that.triggerEvent('submit', item);
    }

    function toggleLayer() {
        self.options.collapsed = !self.options.collapsed;
        if (
            !self.options.collapsed
            && self.options.type == 'place'
            && self.options.showWidget
        ) {
            self.$map.resizeMap();
        }
        if (self.options.collapsed) {
            self.editing && that.blurItem();
            self.$annotations.loseFocus();
        }
        that.triggerEvent('togglelayer', {collapsed: self.options.collapsed});
    }

    function toggleWidget() {
        self.options.showWidget = !self.options.showWidget;
        self.widgetSize = self.options.showWidget * self.options.widgetSize;
        self.$resizebar.animate({top: self.widgetSize + 'px'}, 250);
        self.$inner.animate({height: self.widgetSize + 'px'}, 250);
        self.$widget.animate({height: self.widgetSize + 'px'}, 250, function() {
            self.$widget.options({height: self.widgetSize});
        });
        that.triggerEvent('togglewidget', {collapsed: !self.options.showWidget});
    }

    function updateAnnotations() {
        self.annotations = getAnnotations();
        self.$annotations.options({highlightGroup: self.options.highlightAnnotations != 'none'});
        self.$annotations.options({items: self.annotations});
        self.$annotations.updateItemGroup();
        showWarnings();
        if (self.widget) {
            self.options.type == 'event'
                ? self.$calendar.options({events: getEvents()})
                : self.$map.options({places: getPlaces()});
        }
    }

    /*@
    addItem <f> addItem
    @*/
    that.addItem = function(item) {
        var pos = 0;
        self.options.items.splice(pos, 0, item);
        self.$panel.options({collapsed: false});
        self.$annotations
            .addItem(pos, Ox.extend(item, {
                group: item['in'] + '-' + item.out
            }))
            .options({selected: item.id})
            .editItem();
        showWarnings();
        self.points = getPoints();
        return that;
    };

    /*@
    blurItem <f> blur item
        () -> <o>  blur selected item
    @*/
    that.blurItem = function() {
        self.editing = false;
        self.$annotations.blurItem();
        return that;
    };

    /*@
    editItem <f> edit item
        () -> <o>  edit selected item
    @*/
    that.editItem = function() {
        self.editing = true;
        self.$panel.options({collapsed: false});
        self.$annotations.editItem();
        return that;
    };

    /*@
    gainFocus <f> gain focus
        () -> <o> gain focus
    @*/
    that.gainFocus = function() {
        self.$annotations.gainFocus();
        return that;
    };

    that.getCurrentAnnotations = function() {
        return getAnnotations();
    };

    /*@
    removeItem <f> remove item
        () -> <o>  remove selected item
    @*/
    that.removeItem = function() {
        self.$annotations.removeItem();
    };

    /*@
    selectItem <f> select item
        (position) -> <o>  select item at position
    @*/
    that.selectItem = function(position) {
        // selects the first (0) or last (-1) visible annotation
        if (self.annotations.length) {
            that.options({selected: self.annotations[
                position == 0 ? 0 : self.annotations.length - 1
            ].id});
            self.$annotations.gainFocus();
        } else {
            that.triggerEvent(
                position == 0 ? 'selectnext' : 'selectprevious'
            );
        }
    };

    /*@
    updateItem <f> update item
        (id, data) -> <o>  update item
    @*/
    that.updateItem = function(id, data) {
        var item = Ox.getObjectById(self.options.items, id);
        Ox.forEach(data, function(value, key) {
            item[key] = value;
        });
        item.group = self.options.highlightAnnotations == 'none' ? ''
            : self.options.highlightAnnotations == 'value' ? item.value
            : item['in'] + '-' + item.out;
        self.$annotations.updateItemGroup();
        if (id != item.id) {
            self.$annotations.find('.OxEditableElement').each(function() {
                var $element = $(this);
                if ($element.data('id') == self.options.selected) {
                    $element.data({id: item.id});
                }
            });
            self.options.selected = item.id;
        }
        if (self.options.type == 'entity') {
            // data.value is missing if input did not match any existing entity
            if (data.value) {
                self.$annotations.updateItem(data.value);
            } else {
                that.removeItem();
            }
        }
        if (self.$widget) {
            // update may have made the item match,
            // or no longer match, an event or place
            if (isDefined(item)) {
                self.$widget.options(
                        self.options.type == 'event'
                            ? {events: getEvents()}
                            : {places: getPlaces()}
                    )
                    .options({
                        selected: item[self.options.type].id
                    });
                self.$widget[
                    self.options.type == 'event' ? 'panToEvent' : 'panToPlace'
                ]();
            } else {
                self.$widget.options({
                        selected: ''
                    })
                    .options(
                        self.options.type == 'event'
                            ? {events: getEvents()}
                            : {places: getPlaces()}
                    );
            }
        }
        if (!self.editing && id != item.id) {
            self.$annotations.options({selected: self.options.selected});
        }
        showWarnings();
        return that;
    };

    return that;

};
