'use strict';

/*@
Ox.CalendarEditor <f> Calendar Editor
    ([options[, self]]) -> <o:Ox.SplitPanel> Calendar Editor
    options <o> Options
    self <o> Shared private variable
    loadlist <!> loadlist
@*/

Ox.CalendarEditor = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({
            addEvent: null,
            collapsible: false,
            editEvent: null,
            events: [],
            hasMatches: false,
            height: 256,
            mode: 'add',
            pageLength: 100,
            removeEvent: null,
            selected: '',
            showControls: false,
            sort: [{key: 'name', operator: '+'}],
            width: 256
        })
        .options(options || {})
        .update({
            height: function() {
                // fixme: should be .resizeList
                self.$list.size();
                self.$calendar.resizeCalendar();
            },
            width: function() {
                self.$calendar.resizeCalendar();
            }
        })
        .css({
            width: self.options.width + 'px',
            height: self.options.height + 'px'
        });

    self.durationCache = {};
    self.durationSize = {
        86400: 10,
        31622400: 12
    };

    self.columns = [
        {
            format: function(value, data) {
                var eventDuration = (Ox.parseDate(data.end) - Ox.parseDate(data.start)) / 1000,
                    iconSize = 8;
                Ox.forEach(self.durationSize, function(size, duration) {
                    if (eventDuration > duration) {
                        iconSize = size;
                    } else {
                        return false; // break
                    }
                });
                return data.type
                    ? $('<div>')
                        .addClass('OxEvent Ox' + Ox.toTitleCase(data.type))
                        .css({
                            width: iconSize + 'px',
                            height: iconSize + 'px',
                            margin: [0, 0, 0, -3].map(function(v) {
                                return v + (14 - iconSize) / 2 + 'px';
                            }).join(' '),
                            borderRadius: '2px'
                        })
                    : '';
            },
            id: 'type',
            operator: '+',
            title: Ox._('Type'),
            titleImage: 'icon',
            visible: true,
            width: 16
        },
        {
            format: function(value, data) {
                return data.type
                    ? value
                    : $('<span>').addClass('OxWarning').html(value);
            },
            id: 'name',
            operator: '+',
            removable: false,
            title: Ox._('Name'),
            visible: true,
            width: 144
        },
        {
            editable: false,
            format: function(value) {
                return value.join('; ');
            },
            id: 'alternativeNames',
            operator: '+',
            title: Ox._('Alternative Names'),
            visible: true,
            width: 144
        },
        {
            id: 'start',
            operator: '-',
            sort: function(value) {
                return Ox.parseDate(value);
            },
            title: Ox._('Start'),
            visible: true,
            width: 144
        },
        {
            id: 'end',
            operator: '-',
            sort: function(value) {
                return Ox.parseDate(value);
            },
            title: Ox._('End'),
            visible: true,
            width: 144
        },
        {
            format: function(value, data) {
                var key = data.start + ' - ' + data.end;
                if (!self.durationCache[key]) {
                    self.durationCache[key] = data.start
                        ? Ox.formatDateRangeDuration(data.start, data.end, true)
                        : '';
                }
                return self.durationCache[key];
            },
            id: 'id',
            operator: '-',
            sort: function(value, data) {
                return Ox.parseDate(data.end) - Ox.parseDate(data.start);
            },
            title: Ox._('Duration'),
            visible: true,
            width: 256
        },
        {
            format: function(value) {
                return Ox.encodeHTMLEntities(value);
            },
            id: 'user',
            operator: '+',
            title: Ox._('User'),
            visible: false,
            width: 96
        },
        {
            format: function(value) {
                return value.replace('T', ' ').replace('Z', '');
            },
            id: 'created',
            operator: '-',
            title: Ox._('Date Created'),
            visible: false,
            width: 128
        },
        {
            format: function(value) {
                return value.replace('T', ' ').replace('Z', '');
            },
            id: 'modified',
            operator: '-',
            title: Ox._('Date Modified'),
            visible: false,
            width: 128
        }
    ];

    self.options.hasMatches && self.columns.push({
        align: 'right',
        id: 'matches',
        operator: '-',
        title: Ox._('Matches'),
        visible: true,
        width: 64
    });

    self.$listToolbar = Ox.Bar({
        size: 24
    });

    self.$findElement = Ox.FormElementGroup({
            elements: [
                self.$findSelect = Ox.Select({
                        items: [
                            {id: 'all', title: Ox._('Find: All')},
                            {id: 'name', title: Ox._('Find: Name')},
                            {id: 'alternativeNames', title: Ox._('Find: Alternative Names')},
                        ],
                        overlap: 'right',
                        type: 'image'
                    })
                    .bindEvent({
                        change: function(data) {
                            var key = data.value,
                                value = self.$findInput.value();
                            value && updateList(key, value);
                        }
                    }),
                self.$findInput = Ox.Input({
                        clear: true,
                        placeholder: Ox._('Find in List'),
                        width: 234
                    })
                    .bindEvent({
                        submit: function(data) {
                            var key = self.$findSelect.value(),
                                value = data.value;
                            updateList(key, value);
                        }
                    })
            ]
        })
        .css({float: 'right', margin: '4px'})
        .appendTo(self.$listToolbar);

    self.$list = Ox.TableList({
            columns: self.columns,
            columnsRemovable: true,
            columnsVisible: true,
            // we have to clone so that when self.options.events changes,
            // self.$list.options({items: self.options.events}) still
            // registers as a change
            items: Ox.clone(self.options.events, true),
            max: 1,
            min: 0,
            pageLength: self.options.pageLength,
            scrollbarVisible: true,
            selected: self.options.selected ? [self.options.selected] : [],
            sort: self.options.sort,
            unique: 'id'
        })
        .bindEvent({
            'delete': removeEvent,
            init: initList, // fixme: won't fire from static list
            key_0: function() {
                self.$calendar.panToEvent();
            },
            key_equal: function() {
                self.$calendar.zoom(1);
            },
            key_minus: function() {
                self.$calendar.zoom(-1);
            },
            key_shift_0: function() {
                self.$calendar.zoomToEvent();
            },
            load: function() {
                that.triggerEvent('loadlist');
            },
            open: openItem,
            select: function(data) {
                selectItem(data);
            }
        });

    self.$listStatusbar = Ox.Bar({
        size: 16
    });

    self.$status = Ox.Element()
        .css({paddingTop: '2px', margin: 'auto', fontSize: '9px', textAlign: 'center'})
        .html(
            Ox.formatCount(self.options.events, Ox._('Event'), Ox._('Events'))
        )
        .appendTo(self.$listStatusbar);

    self.$calendar = Ox.Calendar({
        date: new Date(0),
        //events: Ox.clone(self.options.events, true),
        events: self.options.events.filter(function(event) {
            return !!event.type;
        }),
        height: self.options.height,
        showControls: self.options.showControls,
        showToolbar: true,
        showZoombar: true,
        width: self.options.width - 514,
        zoom: 4
    })
    .bindEvent({
        resize: function(data) {
            // triggered by SplitPanel
            self.$calendar.resizeCalendar();
        },
        select: selectEvent
    });

    self.$eventTitlebar = Ox.Bar({
        size: 24
    });
    self.$eventTitle = $('<div>')
        .hide()
        .appendTo(self.$eventTitlebar);
    self.$eventName = Ox.Label({
            title: '',
            width: 228
        })
        .css({float: 'left', margin: '4px'})
        .bindEvent({
            singleclick: function() {
                self.$calendar.panToEvent();
            },
            doubleclick: function() {
                self.$calendar.zoomToEvent();
            }
        })
        .appendTo(self.$eventTitle);
    self.$deselectEventButton = Ox.Button({
            title: 'close',
            tooltip: Ox._('Done'),
            type: 'image'
        })
        .css({float: 'left', margin: '4px 4px 4px 0'})
        .bindEvent({
            click: function() {
                self.$list.options({selected: []});
                // FIXME: list doesn't fire select event
                selectItem({ids: []});
            }
        })
        .appendTo(self.$eventTitle);

    self.$eventData = Ox.Element();

    self.$eventForm = Ox.Form({
            items: [
                self.$nameInput = Ox.Input({
                    id: 'name',
                    label: Ox._('Name'),
                    labelWidth: 64,
                    width: 240
                }),
                self.$alternativeNamesInput = Ox.ArrayInput({
                    id: 'alternativeNames',
                    label: Ox._('Alternative Names'),
                    max: 10,
                    values: [],
                    width: 240
                }),
                Ox.Select({
                    id: 'type',
                    items: [
                        {id: 'date', title: Ox._('Date')},
                        {id: 'place', title: Ox._('Place')},
                        {id: 'person', title: Ox._('Person')},
                        {id: 'other', title: Ox._('Other')}
                    ],
                    label: Ox._('Type'),
                    labelWidth: 64,
                    width: 240
                }),
                self.$startInput = Ox.Input({
                    id: 'start',
                    label: Ox._('Start'),
                    labelWidth: 64,
                    width: 240
                }),
                self.$endInput = Ox.Input({
                    id: 'end',
                    label: Ox._('End'),
                    labelWidth: 64,
                    width: 240
                }),
                self.$durationInput = Ox.Input({
                    disabled: true,
                    id: 'durationText',
                    label: Ox._('Duration'),
                    labelWidth: 64,
                    width: 240
                })
            ],
            width: 240
        })
        .css({margin: '8px'})
        .hide()
        .bindEvent({
            change: function(data) {
                var exists = false, values;
                if (['name', 'alternativeNames'].indexOf(data.id) > -1) {
                    exists = '';
                    values = data.id == 'name' ? [data.data.value] : data.data.value;
                    Ox.forEach(self.options.events, function(event) {
                        Ox.forEach(values, function(value) {
                            if (event.type && (
                                event.name == data.data.value
                                || event.alternativeNames.indexOf(data.data.value) > -1
                            )) {
                                exists = value;
                                return false; // break
                            }
                        });
                        if (exists) {
                            return false; // break
                        }
                    });
                }
                if (data.id == 'name') {
                    if (!exists) {
                        // FIXME: can we change this to data.value?
                        editEvent('name', data.data.value);
                    } else {
                        self.$nameInput.addClass('OxError');
                    }
                } else if (data.id == 'alternativeNames') {
                    if (!exists) {
                        editEvent('alternativeNames', data.data.value);
                    } else {
                        self.$alternativeNamesInput.setErrors([exists]);
                    }
                } else if (data.id == 'type') {
                    editEvent('type', data.data.value);
                } else if (data.id == 'start') {
                    editEvent('start', data.data.value);
                } else if (data.id == 'end') {
                    editEvent('end', data.data.value);
                }
            }
        })
        .appendTo(self.$eventData);

    if (self.options.hasMatches) {
        self.$matchesInput = Ox.Input({
            disabled: true,
            id: 'matches',
            label: Ox._('Matches'),
            labelWidth: 64,
            type: 'int',
            width: 240
        })
        .css({margin: '8px'})
        .hide()
        .appendTo(self.$eventData);
    }

    self.$eventStatusbar = Ox.Bar({
        size: 24
    });

    self.$removeEventButton = Ox.Button({
            title: Ox._('Remove Event'),
            width: 90
        })
        .css({float: 'left', margin: '4px'})
        .bindEvent({
            click: removeEvent
        })
        .hide()
        .appendTo(self.$eventStatusbar);
    
    self.$newEventButton = Ox.Button({
            title: Ox._('New Event'),
            width: 70
        })
        .css({float: 'right', margin: '4px'})
        .bindEvent({
            click: addEvent
        })
        .appendTo(self.$eventStatusbar);

    if (self.options.mode == 'define') {
        self.$defineEventButton = Ox.Button({
                title: Ox._('Define Event'),
                width: 80
            })
            .css({float: 'right', margin: '4px 0 4px 0'})
            .bindEvent({
                click: function() {
                    if (this.options('title') == Ox._('Define Event')) {
                        defineEvent();
                    } else {
                        clearEvent();
                    }
                }
            })
            .hide()
            .appendTo(self.$eventStatusbar);
    }

    that.setElement(
        Ox.SplitPanel({
            elements: [
                {
                    collapsible: self.options.collapsible,
                    element: Ox.SplitPanel({
                        elements: [
                            {
                                element: self.$listToolbar,
                                size: 24
                            },
                            {
                                element: self.$list
                            },
                            {
                                element: self.$listStatusbar,
                                size: 16
                            }
                        ],
                        orientation: 'vertical'
                    }),
                    resizable: true,
                    resize: [256, 384, 512],
                    size: 256
                },
                {
                    element: self.$calendar
                },
                {
                    collapsible: self.options.collapsible,
                    element: Ox.SplitPanel({
                        elements: [
                            {
                                element: self.$eventTitlebar,
                                size: 24
                            },
                            {
                                element: self.$eventData
                            },
                            {
                                element: self.$eventStatusbar,
                                size: 24
                            }
                        ],
                        orientation: 'vertical'
                    })
                    .bindEvent({
                        resize: function(data) {
                            self.$eventName.options({width: data.size - 28});
                            // fixme: pass width through form
                            self.$eventForm.options('items').forEach(function($item) {
                                $item.options({width: data.size - 16});
                            });
                            self.$matchesInput.options({width: data.size - 16});
                        }
                    }),
                    resizable: true,
                    resize: [256, 384],
                    size: 256
                }
            ],
            orientation: 'horizontal'
        })
        .addClass('OxCalendarEditor')
    );

    // if loaded with selection, set calendar and form
    self.options.selected && self.$list.triggerEvent({
        select: {ids: [self.options.selected]}
    });

    function addEvent() {
        Ox.Log('Calendar', 'ADD', self.$calendar.getBounds())
        var bounds = self.$calendar.getBounds(),
            middle = +self.$calendar.options('date'),
            startTime = +new Date((+bounds.startTime + middle) / 2),
            endTime = +new Date((+bounds.endTime + middle) / 2),
            event = {},
            i = 1;
        event.name = Ox._('Untitled');
        while (nameExists(event.name)) {
            event.name = Ox._('Untitled') + ' [' + (++i) + ']';
        };
        event.alternativeNames = [];
        event.type = 'other';
        event.start = Ox.formatDate(startTime, '%Y-%m-%d %H:%M:%S', true);
        event.end = Ox.formatDate(endTime, '%Y-%m-%d %H:%M:%S', true);
        Ox.Log('Calendar', event);
        self.$newEventButton.options({disabled: true});
        self.$removeEventButton.options({disabled: true});
        self.options.addEvent(encodeValues(event), function(result) {
            if (result.status.code == '200') {
                event.id = result.data.id;
                event.created = result.data.created;
                event.modified = result.data.modified;
                if (self.options.hasMatches) {
                    event.matches = result.data.matches;
                }
                self.options.events.push(event);
                // var time0 = +new Date()
                self.$list.options({items: Ox.clone(self.options.events, true)});
                // Ox.Log('Calendar', 'TIME TO SET LIST OPTIONS:', +new Date() - time0);
                self.$calendar.addEvent(event);
                selectEvent(event);
                self.$nameInput.focusInput(true);
                self.$newEventButton.options({disabled: false});
                self.$removeEventButton.options({disabled: false});
            } else {
                // FIXME
                // alert(result.status.text);
            }
        });
    }

    function clearEvent() {
        var event = Ox.getObjectById(self.options.events, self.options.selected),
            values = {
                id: self.options.selected,
                alternativeNames: [], type: '',
                start: '', end: ''
            };
        self.$defineEventButton.options({disabled: true, title: Ox._('Clear Event')});
        self.options.editEvent(encodeValues(values), function() {
            Ox.forEach(values, function(value, key) {
                self.$list.value(self.options.selected, key, value);
            });
            self.$list.reloadList();
            self.$calendar.removeEvent();
            self.$eventForm.hide();
            self.$defineEventButton.options({disabled: false, title: Ox._('Define Event')});
        });
    }

    function decodeValues(place) {
        return Ox.map(place, function(value) {
            var type = Ox.typeOf(value);
            return type == 'string' ? Ox.decodeHTMLEntities(value)
                : type == 'array' ? Ox.map(value, function(value) {
                    return decodeValues(value);
                })
                : value;
        });
    }

    function defineEvent() {
        var bounds = self.$calendar.getBounds(),
            middle = +self.$calendar.options('date'),
            startTime = +new Date((+bounds.startTime + middle) / 2),
            endTime = +new Date((+bounds.endTime + middle) / 2),
            event = Ox.getObjectById(self.options.events, self.options.selected);
        event.name = self.$list.value(self.options.selected, 'name');
        event.alternativeNames = [];
        event.type = 'other';
        event.start = Ox.formatDate(startTime, '%Y-%m-%d %H:%M:%S', true);
        event.end = Ox.formatDate(endTime, '%Y-%m-%d %H:%M:%S', true);
        self.$list.options({items: Ox.clone(self.options.events, true)});
        self.$calendar.addEvent(event);
        self.$defineEventButton.options({title: Ox._('Clear Event')});
    }

    function editEvent(key, value) {
        var id = self.selectedEvent,
            index = Ox.getIndexById(self.options.events, id),
            data = {id: id};
        data[key] = value;
        self.options.editEvent(encodeValues(data), function(result) {
            if (result.status.code == 200) {
                self.options.events[index][key] = value;
                if (self.options.hasMatches) {
                    self.options.events[index].matches = result.data.matches;
                }
                self.$list.options({items: Ox.clone(self.options.events, true)});
                self.$calendar.editEvent(id, key, value);
                if (key == 'name') {
                    self.$eventName.options({title: value});
                } else if (['start', 'end'].indexOf(key) > -1) {
                    self.$durationInput.value(
                        Ox.formatDateRangeDuration(
                            self.$startInput.value(),
                            self.$endInput.value()
                                || Ox.formatDate(new Date(), '%Y-%m-%d %H%:%M:%S'),
                            true
                        )
                    );
                }
                self.options.hasMatches && self.$matchesInput.value(result.data.matches);
                self.options.mode == 'define' && self.$removeEventButton.options({
                    disabled: !!result.data.matches
                });
            } else {
                // ...
            }
        });
    }

    function encodeValues(place) {
        return Ox.map(place, function(value) {
            var type = Ox.typeOf(value);
            return type == 'string' ? Ox.encodeHTMLEntities(value)
                : type == 'array' ? Ox.map(value, function(value) {
                    return encodeValues(value);
                })
                : value;
        });
    }

    function initList(data) {
        self.$status.html(
            Ox.formatCount(data.items, Ox._('Event'), Ox._('Events'))
        );
    }

    function nameExists(name) {
        var exists = false;
        Ox.forEach(self.options.events, function(event) {
            if (
                event.name == name
                || event.alternativeNames.indexOf(name) > -1
            ) {
                exists = true;
                return false; // break
            }
        });
        return exists;
    }

    function openItem(data) {
        selectItem(data);
        self.$calendar.zoomToEvent(data.ids[0]);
    }

    function removeEvent() {
        var id = self.selectedEvent,
            index = Ox.getIndexById(self.options.events, id);
        self.$newEventButton.options({disabled: true});
        self.$removeEventButton.options({disabled: true});        
        self.options.removeEvent({id: id}, function(result) {
            if (result.status.code == '200') {
                selectEvent({});
                self.options.events.splice(index, 1);
                var time0 = +new Date();
                self.$list.options({items: Ox.clone(self.options.events, true)});
                Ox.Log('Calendar', 'TIME TO SET LIST OPTIONS:', +new Date() - time0);
                self.$calendar.removeEvent();
                self.$newEventButton.options({disabled: false});
                self.$removeEventButton.options({disabled: false});
            } else {
                // FIXME
                // alert(result.status.text);
            }
        });
    }

    function selectEvent(event) {
        // Select event on calendar
        var isUndefined = !!self.options.selected
                && !self.$list.value(self.options.selected, 'type');
        self.selectedEvent = event.id || '';
        if (!self.selectedEvent && isUndefined) {
            // deselect triggered by selecting an undefined item,
            // so do nothing
        } else {
            self.options.selected = self.selectedEvent;
            self.$list.options({
                selected: self.options.selected ? [self.options.selected] : []
            });
            selectItem({ids: self.$list.options('selected')}, event);
        }
    }

    function selectItem(data, event) {
        // Select item in list
        var fromCalendar = !!event, isUndefined, selectedEvent;
        self.options.selected = data.ids.length ? data.ids[0] : '';
        event = event || (
            self.options.selected
                ? Ox.getObjectById(self.options.events, self.options.selected)
                : {}
        );
        isUndefined = !fromCalendar && !!self.options.selected && !event.type;
        if (!fromCalendar) {
            selectedEvent = self.options.selected && !isUndefined
                ? self.options.selected
                : '';
            self.$calendar.options({selected: selectedEvent});
            selectedEvent && self.$calendar.panToEvent();
        }
        if (self.options.selected) {
            self.$eventName.options({title: event.name || ''});
            self.$eventTitle.show();            
            if (!isUndefined) {
                self.$eventForm.values(
                    decodeValues(Ox.extend({}, event, {
                        end: event.current ? '' : event.end,
                        durationText: Ox.formatDateRangeDuration(
                            event.start, event.end, true
                        )
                    }))
                ).show();
            } else {
                self.$eventForm.hide();
            }
            self.options.hasMatches && self.$matchesInput.value(event.matches || 0).show();
            self.options.mode == 'define' && self.$defineEventButton.options({
                disabled: !event.matches,
                title: isUndefined ? 'Define Event' : 'Clear Event'
            }).show();
            self.$removeEventButton.options({
                disabled: self.options.mode == 'define' && !!event.matches
            }).show();
        } else {
            self.$eventTitle.hide();
            self.$eventForm.hide();
            self.options.hasMatches && self.$matchesInput.hide();
            self.options.mode == 'define' && self.$defineEventButton.hide();
            self.$removeEventButton.hide();
        }
    }

    function updateList(key, value) {
        var events;
        if (value === '') {
            events = Ox.clone(self.options.events);
        } else {
            events = [];
            self.options.events.forEach(function(event) {
                if ((
                    ['all', 'name'].indexOf(key) > -1
                    && event.name.toLowerCase().indexOf(value) > -1
                ) || (
                    ['all', 'alternativeNames'].indexOf(key) > -1
                    && event.alternativeNames.join('\n').toLowerCase().indexOf(value) > -1
                )) {
                    events.push(event)
                }
            });
        }
        self.$list.options({items: events});
    }

    return that;

};
