'use strict';

Ox.ClipPanel = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({
            annotationsCalendarSize: 256,
            annotationsMapSize: 256,
            annotationsRange: 'all',
            annotationsSort: 'position',
            clipRatio: 16/9,
            clips: [],
            clickLink: null,
            duration: 0,
            editable: false,
            formatTitle: function() {
                return Ox.last(arguments);
            },
            getClipImageURL: null,
            'in': 0,
            layers: [],
            out: 0,
            position: 0,
            selected: [],
            sort: [],
            sortOptions: [],
            showAnnotationsCalendar: false,
            showAnnotationsMap: false,
            showLayers: {},
            showUsers: false,
            view: 'list',
            width: 0
        })
        .options(options || {})
        .update({
            clips: function() {
                var action = self.options.clips.length && self.options.view != 'annotations'
                    ? 'enableItem' : 'disableItem';
                self.$list.options({
                    items: Ox.clone(self.options.clips),
                    sort: getListSort(),
                    sortable: isSortable()
                });
                self.$menu[action]('selectclip');
                self.$menu[action]('splitclip');
                updateStatus();
            },
            duration: updateStatus,
            height: function() {
                self.$list.size();
            },
            position: function() {
                if (self.options.view == 'annotations') {
                    self.$list.options({
                        position: self.options.position
                    });
                }
            },
            selected: selectClips,
            showLayers: function() {
                if (self.options.view == 'annotations') {
                    self.$list.options({
                        showLayers: Ox.clone(self.options.showLayers)
                    });
                }
            },
            sort: function() {
                updateSortElement();
                self.$list.options({
                    sort: getListSort(),
                    sortable: isSortable(),
                });
            },
            view: function() {
                updateView();
                self.$menu.checkItem(self.options.view);
            },
            width: function() {
                self.$list.options({
                    width: self.options.width
                });
            }
        })
        .bindEvent({
            resize: function(data) {
                self.$sortSelect.options({width: getSortSelectWidth(data.size)});
                self.$list.size();
            }
        });

    self.columns = [
        {
            align: 'right',
            id: 'index',
            format: function(value) {
                return value + 1;
            },
            operator: '+',
            title: Ox._('Index'),
            visible: false,
            width: 60
        },
        {
            format: function(value, data) {
                return data.annotation ? data.annotation :  data.item;
            },
            id: 'id',
            operator: '+',
            sort: function(value, data) {
                return data.sort;
            },
            title: Ox._('ID'),
            unique: true,
            width: 60
        },
        {
            addable: false,
            id: 'item',
            operator: '+',
            sort: function(value, data) {
                return data.sort;
            }
        },
        {
            format: self.options.formatTitle,
            id: 'title',
            operator: '+',
            sort: function(value, data) {
                return data.sort;
            },
            title: Ox._('Title'),
            visible: true,
            width: 120
        },
        {
            align: 'right',
            editable: isEditable,
            format: function(value, data) {
                return (
                    isEditable(data) ? ['', '']
                    : ['<span class="OxLight">', '</span>']
                ).join(Ox.formatDuration(value, 3));
            },
            id: 'in',
            operator: '+',
            sort: function(value, data) {
                return data.sort;
            },
            title: Ox._('In'),
            visible: true,
            width: 90
        },
        {
            align: 'right',
            editable: isEditable,
            format: function(value, data) {
                return (
                    isEditable(data) ? ['', '']
                    : ['<span class="OxLight">', '</span>']
                ).join(Ox.formatDuration(value, 3));
            },
            id: 'out',
            title: Ox._('Out'),
            visible: true,
            width: 90
        },
        {
            align: 'right',
            editable: isEditable,
            format: function(value, data) {
                return (
                    isEditable(data) ? ['', '']
                    : ['<span class="OxLight">', '</span>']
                ).join(Ox.formatDuration(value, 3));
            },
            id: 'duration',
            operator: '+',
            sort: function(value, data) {
                return data.sort;
            },
            title: Ox._('Duration'),
            visible: true,
            width: 90
        },
        {
            align: 'right',
            editable: self.options.editable,
            format: function(value, data) {
                return Ox.formatNumber(value, 2);
            },
            id: 'volume',
            operator: '+',
            sort: function(value, data) {
                return data.sort;
            },
            title: Ox._('Volume'),
            visible: false,
            width: 45
        },
        {
            addable: false,
            id: 'sort',
            operator: '+',
            // title: Ox._('Sort'),
            visible: false
        }
    ];

    self.$menubar = Ox.Bar({
            size: 24
        })
        .bindEvent({
            doubleclick: function(e) {
                if ($(e.target).is('.OxBar')) {
                    (
                        self.options.view == 'list'
                        ? self.$list.$body
                        : self.$list
                    ).animate({
                        scrollTop: 0
                    }, 250);
                }
            }
        });

    self.$menu = Ox.MenuButton({
            items: [
                {group: 'view', min: 1, max: 1, items: [
                    {id: 'list', title: Ox._('View Clips as List'), checked: self.options.view == 'list'},
                    {id: 'grid', title: Ox._('View Clips as Grid'), checked: self.options.view == 'grid'},
                    {id: 'annotations', title: Ox._('View Annotations'), checked: self.options.view == 'annotations'},
                ]},
                {},
                {id: 'selectclip', title: 'Select Clip at Current Position', keyboard: '\\', disabled: self.options.clips.length == 0 || self.options.view == 'annotations'},
                {id: 'splitclip', title: 'Split Clip at Current Position', keyboard: 'shift \\', disabled: self.options.clips.length == 0 || self.options.view == 'annotations'},
                {},
                {id: 'split', title: Ox._('Split Selected Clips at Cuts'), disabled: !self.options.editable || self.options.selected.length == 0 || self.options.view == 'annotations'},
                {id: 'join', title: Ox._('Join Selected Clips at Cuts'), disabled: !self.options.editable || self.options.selected.length < 2 || self.options.view == 'annotations'},
                {id: 'makeeditable', title: Ox._('Make Selected Clips Editable'), disabled: !self.options.editable || self.options.selected.length == 0 || self.options.view == 'annotations'}
            ],
            title: 'set',
            tooltip: Ox._('Options'),
            type: 'image'
        })
        .css({
            float: 'left',
            margin: '4px 2px 4px 4px'
        })
        .bindEvent({
            change: function(data) {
                if (data.id == 'view') {
                    self.options.view = data.checked[0].id;
                    updateView();
                    that.triggerEvent('view', {view: self.options.view});
                }
            },
            click: function(data) {
                if (data.id == 'selectclip') {
                    that.selectClip();
                    self.$list.gainFocus();
                } else if (data.id == 'splitclip') {
                    splitClip();
                } else if (data.id == 'split') {
                    splitClips();
                } else if (data.id == 'join') {
                    joinClips();
                } else if (data.id == 'makeeditable') {
                    makeClipsEditable();
                }
            }
        })
        .appendTo(self.$menubar),

    self.$sortSelect = Ox.Select({
            items: self.options.sortOptions,
            value: self.options.sort[0].key,
            width: getSortSelectWidth(self.options.width)
        })
        .bindEvent({
            change: function(data) {
                self.options.sort = [{
                    key: data.value,
                    operator: Ox.getObjectById(
                        self.options.sortOptions, data.value
                    ).operator
                }];
                updateSortElement();
                that.triggerEvent('sort', self.options.sort);
                self.$list.options({sortable: isSortable()});
            }
        });

    self.$orderButton = Ox.Button({
            overlap: 'left',
            title: getButtonTitle(),
            tooltip: getButtonTooltip(),
            type: 'image'
        })
        .bindEvent({
            click: function() {
                self.options.sort = [{
                    key: self.options.sort[0].key,
                    operator: self.options.sort[0].operator == '+' ? '-' : '+'
                }];
                updateSortElement();
                that.triggerEvent('sort', self.options.sort);
            }
        });

    self.$sortElement = Ox.FormElementGroup({
            elements: [self.$sortSelect, self.$orderButton],
            float: 'right'
        })
        .css({
            float: 'right',
            margin: '4px 4px 4px 2px'
        })
        .appendTo(self.$menubar);

    self.$list = getList();

    self.$statusbar = Ox.Bar({
        size: 16
    });

    self.$status = Ox.Element()
        .css({
            marginTop: '2px',
            fontSize: '9px',
            textAlign: 'center',
            textOverflow: 'ellipsis'
        })
        .appendTo(self.$statusbar);

    that.setElement(
        self.$panel = Ox.SplitPanel({
            elements: [
                {
                    element: self.$menubar,
                    size: 24
                },
                {
                    element: self.$list
                },
                {
                    element: self.$statusbar,
                    size: 16
                }
            ],
            orientation: 'vertical'
        })
    );

    updateStatus();

    function editClip(data) {
        var value = self.$list.value(data.id, data.key);
        if (data.value != value && !(data.value === '' && value === null)) {
            self.$list.value(data.id, data.key, data.value || null);
            that.triggerEvent('edit', data);
        }
    }

    function getButtonTitle() {
        return self.options.sort[0].operator == '+' ? 'up' : 'down';
    }

    function getButtonTooltip() {
        return Ox._(self.options.sort[0].operator == '+' ? 'Ascending' : 'Descending');
    }

    function getEditable(ids) {
        return ids.filter(function(id) {
            return isEditable(Ox.getObjectById(self.options.clips, id));
        });
    }

    function getList() {
        var $list;
        if (self.options.view == 'list') {
            $list = Ox.TableList({
                columns: self.columns,
                columnsMovable: true,
                columnsRemovable: true,
                columnsResizable: true,
                columnsVisible: true,
                items: Ox.clone(self.options.clips),
                keys: ['director', 'year', 'annotation'],
                pageLength: 1000,
                scrollbarVisible: true,
                selected: self.options.selected,
                sort: getListSort(),
                sortable: isSortable(),
                unique: 'id'
            });
        } else if (self.options.view == 'grid') {
            $list = Ox.IconList({
                draggable: true,
                fixedRatio: self.options.clipRatio,
                item: function(data, sort, size) {
                    size = size || 128; // fixme: is this needed?
                    var ratio = data.videoRatio,
                        fixedRatio = self.options.clipRatio,
                        width = ratio > fixedRatio ? size : Math.round(size * ratio / fixedRatio),
                        height = Math.round(width / ratio),
                        info,
                        title = self.options.formatTitle(data),
                        url = self.options.getClipImageURL(data.id, width, height);
                    if (['text', 'position', 'duration', 'random'].indexOf(sort[0].key) > -1) {
                        info = Ox.formatDuration(data['in']) + ' - '
                            + Ox.formatDuration(data.out);
                    } else {
                        info = Ox.formatDuration(data['in']) + ' - '
                            + Ox.formatDuration(data.out);
                    }
                    return {
                        height: height,
                        id: data.id,
                        info: info,
                        title: title,
                        url: url,
                        width: width
                    };
                },
                items: self.options.clips,
                keys: ['annotation', 'id', 'in', 'out'],
                orientation: 'both',
                selected: self.options.selected,
                sort: getListSort(),
                unique: 'id'
            });
        } else if (self.options.view == 'annotations') {
            $list = Ox.AnnotationPanel({
                    calendarSize: self.options.annotationsCalendarSize,
                    clickLink: self.options.clickLink,
                    editable: false,
                    //highlight: self.options.find,
                    //'in': self.options['in'],
                    layers: self.options.layers,
                    mapSize: self.options.annotationsMapSize,
                    //out: self.options.out,
                    position: self.options.position,
                    range: self.options.annotationsRange,
                    showCalendar: self.options.showAnnotationsCalendar,
                    showLayers: Ox.clone(self.options.showLayers),
                    showMap: self.options.showAnnotationsMap,
                    showUsers: self.options.showUsers,
                    sort: self.options.annotationsSort,
                    width: self.options.width
                }).bindEvent({
                    select: function(data) {
                        that.triggerEvent('selectannotation', data);
                    },
                    open: function(data) {
                        // ..
                    }
                });
            $list.size = function() {
                $list.options({
                    width: self.options.width
                });
            };
            return $list;
        }
        $list.bindEvent({
            copy: function(data) {
                that.triggerEvent('copy', data);
            },
            copyadd: function(data) {
                that.triggerEvent('copyadd', data);
            },
            cut: function(data) {
                if (self.options.editable) {
                    that.triggerEvent('cut', data);
                    self.options.selected = [];
                    selectClips();
                    that.triggerEvent('select', {ids: []});
                }
            },
            cutadd: function(data) {
                if (self.options.editable) {
                    that.triggerEvent('cutadd', data);
                    self.options.selected = [];
                    selectClips();
                    that.triggerEvent('select', {ids: []});
                }
            },
            'delete': function(data) {
                self.options.editable && that.triggerEvent('delete', data);
            },
            key_backslash: function(data) {
                that.selectClip();
                self.$list.gainFocus();
            },
            key_shift_backslash: function(data) {
                splitClip();
            },
            move: function(data) {
                data.ids.forEach(function(id, index) {
                    self.$list.value(id, 'index', index);
                });
                that.triggerEvent('move', data);
            },
            open: function(data) {
                that.triggerEvent('open', data);
            },
            paste: function() {
                self.options.editable && that.triggerEvent('paste');
            },
            select: function(data) {
                self.options.selected = data.ids;
                selectClips();
                that.triggerEvent('select', data);
            },
            sort: function(data) {
                if (data.key == 'in') {
                    data.key = 'position';
                }
                self.options.sort = [data];
                updateSortElement();
                self.$list.options({sortable: isSortable()});
                that.triggerEvent('sort', self.options.sort);
            },
            submit: function(data) {
                var value = self.$list.value(data.id);
                if (data.key == 'volume') {
                    data.value = parseFloat(data.value);
                    if (data.value >= 1 || Ox.isNaN(data.value)) {
                        data.value = 1;
                    } else if (data.value < 0) {
                        data.value = 0;
                    }
                    self.$list.value(data.id, data.key, data.value);
                    that.triggerEvent('edit', data);
                } else {
                    data.value = Ox.parseDuration(data.value);
                    if (
                        (data.key == 'in' && data.value < value.out)
                        || (data.key == 'out' && data.value > value['in'])
                        || (data.key == 'duration' && data.value > 0)
                    ) {
                        self.$list.value(data.id, data.key, data.value);
                        if (data.key == 'in') {
                            self.$list.value(data.id, 'duration', value.out - data.value);
                        } else if (data.key == 'out') {
                            self.$list.value(data.id, 'duration', data.value - value['in']);
                        } else if (data.key == 'duration') {
                            self.$list.value(data.id, 'out', value['in'] + data.value);
                        }
                        that.triggerEvent('edit', data);
                    } else {
                        self.$list.value(data.id, data.key, value[data.key]);
                    }
                }
            }
        });
        return $list;
    }

    function getListSort() {
        var sort = [{key: 'index', operator: '+'}];
        if (self.options.sort && self.options.sort.length) {
            sort[0].operator = self.options.sort[0].operator;
            sort[0].key = Ox.getObjectById(self.columns, self.options.sort[0].key)
                    ?  self.options.sort[0].key
                    : 'sort';
            if (self.options.sort[0].key == 'position') {
                sort[0].key = 'in';
            }
        }
        return sort;
    }

    function getSortSelectWidth(width) {
        return Math.min(144, width - 52 + Ox.UI.SCROLLBAR_SIZE);
    }

    function isEditable(data) {
        return self.options.editable && !data.annotation;
    }

    function isSortable() {
        return self.options.editable
            && self.options.sort && self.options.sort.length
            && self.options.sort[0].key == 'index'
            && self.options.sort[0].operator == '+';
    }

    function joinClips() {
        var clips = getEditable(self.options.selected).map(function(id) {
                return Ox.clone(Ox.getObjectById(self.options.clips, id));
            }),
            ids = [], join = [], joined;
        do {
            joined = false;
            Ox.forEach(clips, function(outClip) {
                var outPoint = outClip.item + '/' + outClip.out;
                Ox.forEach(clips, function(inClip, index) {
                    var inPoint = inClip.item + '/' + inClip['in'];
                    if (inPoint == outPoint) {
                        ids = Ox.unique(ids.concat([outClip.id, inClip.id]));
                        join = Ox.unique(join.concat([outClip.id]));
                        outClip.out = inClip.out;
                        if (Ox.contains(join, inClip.id)) {
                            join.splice(join.indexOf(inClip.id), 1);
                        }
                        clips.splice(index, 1);
                        joined = true;
                        return false; // break
                    }
                });
                if (joined) {
                    return false; // break;
                }
            });
        } while (joined);
        join = join.map(function(id) {
            var clip = Ox.getObjectById(clips, id);
            return {'in': clip['in'], item: clip.item, out: clip.out};
        });
        if (ids.length) {
            that.triggerEvent('join', {ids: ids, join: join});
        }
    }

    function makeClipsEditable() {
        if (!self.options.editable) {
            return
        }
        var clips = self.options.clips.filter(function(clip) {
            return Ox.contains(self.options.selected, clip.id) && clip.annotation;
        });
        clips.forEach(function(clip) {
            self.$list.value(clip.id, {annotation: ''});
            that.triggerEvent('edit', {id: clip.id, key: 'annotation', value: ''});
        })
    }

    function selectClips() {
        if (self.options.editable) {
            self.$menu[
                self.options.selected.length > 0 ? 'enableItem' : 'disableItem'
            ]('split');
            self.$menu[
                self.options.selected.length > 1 ? 'enableItem' : 'disableItem'
            ]('join');
            self.$menu[
                self.options.selected.length > 0 ? 'enableItem' : 'disableItem'
            ]('makeeditable');
        }
        self.$list.options({selected: self.options.selected});
    }

    function splitClip() {
        that.selectClip();
        var index;
        Ox.forEach(self.options.clips, function(clip, i) {
            if (clip.position <= self.options.position) {
                index = i
            } else {
                return false; // break
            }
        });
        var clip = self.options.clips[index];
        if (clip) {
            var position = self.options.position - clip.position + clip['in'];
            if (position != clip['in'] && position != clip['out']) {
                var ids = [clip.id];
                var split = [
                    {'in': clip['in'], 'out': position, 'item': clip.item},
                    {'in': position, 'out': clip['out'], 'item': clip.item}
                ];
                that.triggerEvent('split', {ids: ids, split: split});
            }
        }
    }

    function splitClips() {
        var ids = getEditable(self.options.selected).filter(function(id) {
                var clip = Ox.getObjectById(self.options.clips, id);
                return clip.cuts.length;
            }),
            split = Ox.flatten(ids.map(function(id) {
                var clip = Ox.getObjectById(self.options.clips, id),
                    cuts = [clip['in']].concat(clip.cuts).concat([clip.out]);
                return Ox.range(0, cuts.length - 1).map(function(i) {
                    return {'in': cuts[i], item: clip.item, out: cuts[i + 1]};
                });
            }));
        if (split.length > ids.length) {
            that.triggerEvent('split', {ids: ids, split: split});
        }
    }

    function updateSortElement() {
        self.$sortSelect.options({
            value: self.options.sort[0].key,
        });
        self.$orderButton.options({
            title: getButtonTitle(),
            tooltip: getButtonTooltip(),
        });
    }

    function updateStatus() {
        self.$status.html(
            Ox.toTitleCase(Ox.formatCount(self.options.clips.length, 'Clip'))
            + ', ' + Ox.formatDuration(self.options.duration, 3)
        );
    }

    function updateView() {
        var action = self.options.editable
            && self.options.selected.length
            && self.options.view != 'annotations'
            ? 'enableItem' : 'disableItem';
        self.$menu[action]('split');
        self.$menu[
            self.options.editable
            && self.options.selected.length > 1
            && self.options.view != 'annotations'
            ? 'enableItem' : 'disableItem'
        ]('join');
        self.$menu[action]('makeeditable');
        self.$panel.replaceElement(1, self.$list = getList());
    }

    that.getPasteIndex = function() {
        return self.$list.getPasteIndex();
    };

    that.invertSelection = function() {
        self.$list.invertSelection();
    };

    that.selectAll = function() {
        self.$list.selectAll();
    };

    that.selectClip = function() {
        var index;
        Ox.forEach(self.options.clips, function(clip, i) {
            Ox.print('CLIP', i, clip.position, clip.duration, self.options.position)
            if (clip.position <= self.options.position) {
                index = i
            } else {
                return false; // break
            }
        });
        self.options.selected = [self.options.clips[index].id];
        selectClips();
        that.triggerEvent('select', {ids: self.options.selected});
        return that;
    };

    that.updateItem = function(id, data) {
        self.options.clips[Ox.getIndexById(self.options.clips, id)] = data;
        self.$list.value(id, {
            duration: data.duration,
            'in': data['in'],
            out: data.out,
            sort: data.sort
        });
        return that;
    };

    return that;

};
