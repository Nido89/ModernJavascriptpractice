'use strict';

/*@
Ox.TableList <f> TableList Widget
    options <o> Options object
        clearButton <b|false> If true and columns are visible, show clear button
        clearButtonTooltip <s|''> Clear button tooltip
        columns <[o]|[]> Columns
            # Fixme: There's probably more...
            addable <b|true> ...
            align <s|'left'> ...
            editable <b> ...
            format <f> ...
            id <s> ...
            operator <s> default sort operator
            removable <b|true> ...
            resizable <b> ...
            sort <f> function(value, object) that maps values to sort values
            title <s> ...
            titleImage <s> ...
            unformat <f> Applied before editing
            unique <b> If true, this column acts as unique id (deprecated)
            visible <b> ...
            width <n> ...
        columnsMovable <b|false> If true, columns can be re-ordered
        columnsRemovable <b|false> If true, columns are removable
        columnsResizable <b|false> If true, columns are resizable
        columnsVisible <b|false> If true, columns are visible
        columnWidth <[n]|[40, 800]> Minimum and maximum column width
        disableHorizontalScrolling <b|false> If true, disable scrolling
        draggable <b|false> If true, items can be dragged
        droppable <b> If true, items can be dropped
        id <s|''> Id
        items <f|null> function() {} {sort, range, keys, callback} or array
        keys <[s]|[]> Additional keys (apart from keys of visible columns)
        max <n|-1> Maximum number of items that can be selected (-1 for all)
        min <n|0> Minimum number of items that must be selected
        pageLength <n|100> Number of items per page
        query <o> Query
        scrollbarVisible <b|false> If true, the scrollbar is always visible
        selectAsYouType <s|''> If set to a key, enables select-as-you-type
        selected <[s]|[]> Array of selected ids
        sort <[o]|[s]|[]> ['+foo', ...] or [{key: 'foo', operator: '+'}, ...]
        sortable <b|false> If true, elements can be re-ordered
        sums <[s]|[]> Sums to be included in totals
        unique <s|''> Key of the unique id
            This has precedence over a unique id specified via columns (which is
            deprecated).
        columnresize <!> columnresize
        columnchange <!> columnchange
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.Element> TableList Object
@*/

// fixme: options.columnsMovable, but options.sortable ... pick one.

Ox.TableList = function(options, self) {

    // fixme: in columns, "operator" should be "sortOperator"

    self = self || {};
    var that = Ox.Element({}, self)
            .defaults({
                clearButton: false,
                clearButtonTooltip: '',
                columns: [],
                columnsMovable: false,
                columnsRemovable: false,
                columnsResizable: false,
                columnsVisible: false,
                columnWidth: [40, 800],
                disableHorizontalScrolling: false,
                draggable: false,
                droppable: false,
                id: '',
                items: null,
                keys: [],
                max: -1,
                min: 0,
                pageLength: 100,
                query: {conditions: [], operator: '&'},
                scrollbarVisible: false,
                selected: [],
                sort: [],
                sortable: false,
                sums: [],
                unique: ''
            })
            .options(options || {})
            .update({
                disableHorizontalScrolling: function() {
                    self.options.disableHorizontalScrolling
                        ? disableHorizontalScrolling()
                        : enableHorizontalScrolling();
                },
                draggable: function() {
                    that.$body.options({sortable: self.options.draggable});
                },
                items: function() {
                    that.$body.options({items: self.options.items});
                },
                paste: function() {
                    that.$body.options({paste: self.options.paste});
                },
                query: function() {
                    that.$body.options({query: self.options.query});
                },
                selected: function() {
                    that.$body.options({selected: self.options.selected});
                    // updateImages();
                    updateClearButton();
                },
                sort: function() {
                    updateColumn();
                    that.$body.options({sort: self.options.sort});
                },
                sortable: function() {
                    that.$body.options({sortable: self.options.sortable});
                }
            })
            .addClass('OxTableList');
    
    self.options.columns.forEach(function(column) { // fixme: can this go into a generic ox.js function?
        // fixme: and can't these just remain undefined?
        if (Ox.isUndefined(column.align)) {
            column.align = 'left';
        }
        if (Ox.isUndefined(column.clickable)) {
            column.clickable = false;
        }
        if (Ox.isUndefined(column.editable)) {
            column.editable = false;
        }
        if (Ox.isUndefined(column.unique)) {
            column.unique = false;
        }
        if (Ox.isUndefined(column.visible)) {
            column.visible = false;
        }
        if (column.unique && !self.options.unique) {
            self.options.unique = column.id;
        }
    });

    if (Ox.isEmpty(self.options.sort)) {
        self.options.sort = [{
            key: self.options.unique,
            operator: Ox.getObjectById(self.options.columns, self.options.unique).operator
        }];
    } else {
        self.options.sort = self.options.sort.map(function(sort) {
            return Ox.isString(sort) ? {
                key: sort.replace(/^[\+\-]/, ''),
                operator: sort[0] == '-' ? '-' : '+'
            } : sort;
        });
    }

    Ox.extend(self, {
        columnPositions: [],
        defaultColumnWidths: self.options.columns.map(function(column) {
            return column.defaultWidth || column.width;
        }),
        hasItemsArray: Ox.isArray(self.options.items),
        itemHeight: 16,
        page: 0,
        pageLength: 100,
        scrollLeft: 0,
        selectedColumn: getColumnIndexById(self.options.sort[0].key),
        visibleColumns: self.options.columns.filter(function(column) {
            return column.visible;
        })
    });
    // fixme: there might be a better way than passing both visible and position
    self.options.columns.forEach(function(column) {
        if (!Ox.isUndefined(column.position)) {
            self.visibleColumns[column.position] = column;
        }
    });
    Ox.extend(self, {
        columnWidths: self.visibleColumns.map(function(column) {
            return column.width;
        }),
        pageHeight: self.options.pageLength * self.itemHeight
    });

    self.format = {};
    self.map = {};
    self.options.columns.forEach(function(column) {
        if (column.format) {
            self.format[column.id] = column.format;
        }
        if (column.sort) {
            self.map[column.id] = column.sort;
        }
    });

    // Head

    if (self.options.columnsVisible) {
        that.$bar = Ox.Bar({
            orientation: 'horizontal',
            size: 16
        }).appendTo(that);
        that.$head = Ox.Container()
            .addClass('OxHead')
            .css({
                right: self.options.scrollbarVisible
                    ? Ox.UI.SCROLLBAR_SIZE + 'px' : 0
            })
            .appendTo(that.$bar);
        that.$head.$content.addClass('OxTitles');
        constructHead();
        if (self.options.columnsRemovable) {
            that.$select = Ox.Select({
                    id: self.options.id + 'SelectColumns',
                    items: self.options.columns.filter(function(column){
                        return column.addable !== false;
                    }).map(function(column) {
                        return {
                            disabled: column.removable === false,
                            id: column.id,
                            title: column.title
                        };
                    }),
                    max: -1,
                    min: 1,
                    type: 'image',
                    value: Ox.filter(self.options.columns, function(column) {
                        return column.visible;
                    }).map(function(column) {
                        return column.id;
                    })
                })
                .css(Ox.UI.SCROLLBAR_SIZE == 16 ? {
                    right: 0,
                    width: '14px'
                } : {
                    right: '-1px',
                    width: '8px',
                })
                .bindEvent('change', changeColumns)
                .appendTo(that.$bar);
            Ox.UI.SCROLLBAR_SIZE < 16 && $(that.$select.find('input')[0]).css({
                marginRight: '-3px',
                marginTop: '1px',
                width: '8px',
                height: '8px'
            });
        } else if (self.options.clearButton) {
            self.$clearButton = Ox.Element({
                    element: '<img>',
                    tooltip: self.options.clearButtonTooltip
                })
                .addClass('OxClear')
                .attr({src: Ox.UI.getImageURL('symbolClose')})
                .css(Ox.UI.SCROLLBAR_SIZE == 16 ? {
                    paddingLeft: '4px',
                    paddingRight: '2px',
                    marginRight: 0
                } : {
                    paddingRight: '1px',
                    marginRight: '-2px'
                })
                [self.options.selected.length ? 'show' : 'hide']()
                .bindEvent({
                    anyclick: function() {
                        self.$clearButton.hide();
                        self.options.selected = [];
                        that.$body.options({selected: self.options.selected});
                        that.triggerEvent('select', {ids: []});
                    }
                })
                .appendTo(that.$bar);
        }
    }

    // Body

    that.$body = Ox.List({
            construct: constructItem,
            disableHorizontalScrolling: self.options.disableHorizontalScrolling,
            draggable: self.options.draggable,
            id: self.options.id,
            itemHeight: 16,
            items: self.options.items,
            itemWidth: getItemWidth(),
            format: self.format, // fixme: not needed, happens in TableList
            keys: Ox.unique(
                (
                    self.hasItemsArray
                    ? self.options.columns
                    : self.visibleColumns
                ).map(function(column) {
                    return column.id;
                })
                .concat(self.options.unique)
                .concat(self.options.keys)
            ),
            map: self.map,
            max: self.options.max,
            min: self.options.min,
            orientation: 'vertical',
            pageLength: self.options.pageLength,
            paste: self.options.paste,
            query: self.options.query,
            selectAsYouType: self.options.selectAsYouType,
            selected: self.options.selected,
            sort: self.options.sort,
            sortable: self.options.sortable,
            sums: self.options.sums,
            type: 'text',
            unique: self.options.unique
        })
        .addClass('OxBody')
        .css({
            top: (self.options.columnsVisible ? 16 : 0) + 'px',
            overflowY: (self.options.scrollbarVisible ? 'scroll' : 'hidden')
        })
        .on({
            scroll: function() {
                var scrollLeft = $(this).scrollLeft();
                if (scrollLeft != self.scrollLeft) {
                    self.scrollLeft = scrollLeft;
                    that.$head && that.$head.scrollLeft(scrollLeft);
                }
            }
        })
        .bindEvent(function(data, event) {
            if (event == 'cancel') {
                Ox.Log('List', 'cancel edit', data);
            } else if (event == 'edit') {
                that.editCell(data.id, data.key);
            } else if (event == 'select') {
                self.options.selected = data.ids;
                // updateImages();
                updateClearButton();
            }
            that.triggerEvent(event, data);
        })
        .appendTo(that);

    that.$body.$content.css({
        width: getItemWidth() + 'px'
    });

    self.options.disableHorizontalScrolling
        ? disableHorizontalScrolling()
        : enableHorizontalScrolling();

    //Ox.Log('List', 's.vC', self.visibleColumns)

    function addColumn(id) {
        //Ox.Log('List', 'addColumn', id);
        var column, ids,
            index = 0;
        Ox.forEach(self.options.columns, function(v) {
            if (v.visible) {
                index++;
            } else if (v.id == id) {
                column = v;
                return false; // break
            }
        });
        column.visible = true;
        self.visibleColumns.splice(index, 0, column);
        self.columnWidths.splice(index, 0, column.width);
        that.$head.$content.empty();
        constructHead();
        !self.hasItemsArray && that.$body.options({
            keys: self.visibleColumns.map(function(column) {
                return column.id;
            }).concat(self.options.keys)
        });
        that.$body.reloadPages();
    }

    function changeColumns(data) {
        var add,
            ids = [];
        Ox.forEach(data.value, function(id) {
            var index = getColumnIndexById(id);
            if (!self.options.columns[index].visible) {
                addColumn(id);
                add = true;
                return false; // break
            }
            ids.push(id);
        });
        if (!add) {
            Ox.forEach(self.visibleColumns, function(column) {
                if (ids.indexOf(column.id) == -1) {
                    removeColumn(column.id);
                    return false; // break
                }
            });
        }
        triggerColumnChangeEvent();
    }

    function clickColumn(id) {
        Ox.Log('List', 'clickColumn', id);
        var i = getColumnIndexById(id),
            isSelected = self.options.sort[0].key == self.options.columns[i].id;
        self.options.sort = [{
            key: self.options.columns[i].id,
            operator: isSelected ?
                (self.options.sort[0].operator == '+' ? '-' : '+') :
                self.options.columns[i].operator
        }];
        updateColumn();
        // fixme: strangely, sorting the list blocks updating the column,
        // so we use a timeout for now
        setTimeout(function() {
            that.$body.options({sort: self.options.sort});
            that.gainFocus().triggerEvent('sort', {
                key: self.options.sort[0].key,
                operator: self.options.sort[0].operator
            });
        }, 10);
    }

    function constructHead() {
        var pos;
        self.$heads = [];
        self.$titles = [];
        self.$titleImages = [];
        self.$orderImages = [];
        self.visibleColumns.forEach(function(column, i) {
            var $resize;
            self.$heads[i] = Ox.Element()
                .addClass('OxHeadCell ' + getColumnClassName(column.id))
                .css({width: self.columnWidths[i] - 5 + 'px'})
                .appendTo(that.$head.$content);
            // if sort operator is set, bind click event
            if (column.operator) {
                self.$heads[i].bindEvent({
                    anyclick: function() {
                        clickColumn(column.id);
                    }
                });
            }
            // if columns are movable, bind drag events
            if (self.options.columnsMovable) {
                self.$heads[i].bindEvent({
                    dragstart: function(data) {
                        dragstartColumn(column.id, data);
                    },
                    drag: function(data) {
                        dragColumn(column.id, data);
                    },
                    dragpause: function(data) {
                        dragpauseColumn(column.id, data);
                    },
                    dragend: function(data) {
                        dragendColumn(column.id, data);
                    }
                });
            }
            self.$titles[i] = Ox.Element()
                .addClass('OxTitle')
                .css({
                    width: self.columnWidths[i] - 9 + 'px',
                    textAlign: column.align
                })
                .appendTo(self.$heads[i]);
            if (column.titleImage) {
                self.$titleImages[i] = $('<img>').
                    attr({
                        src: Ox.UI.getImageURL(
                            'symbol' + Ox.toTitleCase(column.titleImage)
                        )
                    })
                    .appendTo(self.$titles[i]);
            } else {
                self.$titles[i].html(column.title);
            }
            if (column.operator) {
                self.$orderImages[i] = $('<img>')
                    .attr({
                        src: Ox.UI.getImageURL(
                            'symbol' + (column.operator == '+' ? 'Up' : 'Down'),
                            'selected'
                        )
                    })
                    .addClass('OxOrder')
                    .css({marginTop: (column.operator == '+' ? 3 : 2) + 'px'})
                    .click(function() {
                        $(this).parent().trigger('click');
                    })
                    .appendTo(self.$heads[i]);
            }
            $resize = Ox.Element()
                .addClass('OxResize')
                .appendTo(that.$head.$content);
            $('<div>').appendTo($resize);
            $('<div>').addClass('OxCenter').appendTo($resize);
            $('<div>').appendTo($resize);
            // if columns are resizable, bind doubleclick and drag events
            if (self.options.columnsResizable && column.resizable !== false) {
                $resize.addClass('OxResizable')
                    .bindEvent({
                        doubleclick: function(data) {
                            resetColumn(column.id, data);
                        },
                        dragstart: function(data) {
                            dragstartResize(column.id, data);
                        },
                        drag: function(data) {
                            dragResize(column.id, data);
                        },
                        dragend: function(data) {
                            dragendResize(column.id, data);
                        }
                    });
            }
        });
        that.$head.$content.css({
            width: (Ox.sum(self.columnWidths) + 2) + 'px'
        });
        pos = getColumnPositionById(self.options.columns[self.selectedColumn].id);
        if (pos > -1) {
            toggleSelected(self.options.columns[self.selectedColumn].id);
            self.$titles[pos].css({
                width: (self.options.columns[self.selectedColumn].width - 25) + 'px'
            });
        }
    }

    function constructItem(data) {
        var $item = $('<div>')
            .addClass('OxTarget')
            .css({
                width: getItemWidth(true) + 'px'
            });
        self.visibleColumns.forEach(function(v, i) {
            var clickable = Ox.isBoolean(v.clickable) ? v.clickable : v.clickable(data),
                editable = Ox.isBoolean(v.editable) ? v.editable : v.editable(data),
                // if the column id is not in data, we're constructing an empty cell
                value = v.id in data ? formatValue(v.id, data[v.id], data) : '',
                $cell;
            if (v.tooltip) {
                $cell = Ox.Element({
                    tooltip: function() {
                        return self.options.selected.indexOf(data[self.options.unique]) > -1
                            ? (Ox.isString(v.tooltip) ? v.tooltip : v.tooltip(data)) : '';
                    }
                });
            } else if (self.options.droppable) {
                $cell = Ox.Element();
            } else {
                // this is faster
                $cell = $('<div>');
            }
            $cell.addClass(
                    'OxCell ' + getColumnClassName(v.id)
                    + (clickable ? ' OxClickable' : '')
                    + (editable ? ' OxEditable' : '')
                )
                .css({
                    width: (self.columnWidths[i] - (self.options.columnsVisible ? 9 : 8)) + 'px',
                    borderRightWidth: (self.options.columnsVisible ? 1 : 0) + 'px',
                    textAlign: v.align
                })
                [Ox.isString(value) ? 'html' : 'append'](value)
                .appendTo($item);
        });
        return $item;
    }

    function disableHorizontalScrolling() {
        that.$body.options({
                disableHorizontalScrolling: true
            })
            .css({overflowX: 'hidden'});
        // fixme: is there a way to pass an array?
        that.unbindEvent('key_left').unbindEvent('key_right');
    }

    function dragstartColumn(id, e) {
        Ox.$body.addClass('OxDragging');
        self.drag = {
            columnOffsets: getColumnOffsets(),
            listOffset: that.offset().left - that.$body.scrollLeft(),
            startPos: getColumnPositionById(id)
        }
        self.drag.stopPos = self.drag.startPos;
        $('.' + getColumnClassName(id)).css({opacity: 0.5});
        self.drag.startPos > 0 && self.$heads[self.drag.startPos].prev().children().eq(2).css({opacity: 0.5});
        self.$heads[self.drag.startPos].next().children().eq(0).css({opacity: 0.5});
        self.$heads[self.drag.startPos].addClass('OxDrag').css({ // fixme: why does the class not work?
            cursor: 'ew-resize'
        });
    }

    function dragColumn(id, e) {
        var listLeft = that.offset().left,
            listRight = listLeft + that.width(),
            pos = self.drag.stopPos;
        Ox.forEach(self.drag.columnOffsets, function(offset, i) {
            var x = self.drag.listOffset + offset + self.columnWidths[i] / 2;
            if (i < self.drag.startPos && e.clientX < x) {
                self.drag.stopPos = i;
                return false; // break
            } else if (i > self.drag.startPos && e.clientX > x) {
                self.drag.stopPos = i;
            }
        });
        if (self.drag.stopPos != pos) {
            moveColumn(id, self.drag.stopPos);
            self.drag.columnOffsets = getColumnOffsets();
            self.drag.startPos = self.drag.stopPos;
            ///*
            var left = self.drag.columnOffsets[self.drag.startPos],
                right = left + self.columnWidths[self.drag.startPos];
            if (left < that.$body.scrollLeft() || right > that.width()) {
                that.$body.scrollLeft(
                    left < that.$body.scrollLeft() ? left : right - that.width()
                );
                self.drag.listOffset = that.offset().left - that.$body.scrollLeft();
            }
            //*/
        }
        if (e.clientX < listLeft + 16 || e.clientX > listRight - 16) {
            if (!self.scrollInterval) {
                self.scrollInterval = setInterval(function() {
                    that.$body.scrollLeft(
                        that.$body.scrollLeft() + (e.clientX < listLeft + 16 ? -16 : 16)
                    );
                    self.drag.listOffset = that.offset().left - that.$body.scrollLeft();
                }, 100);
            }
        } else if (self.scrollInterval) {
            clearInterval(self.scrollInterval);
            self.scrollInterval = 0;
        }
    }

    function dragpauseColumn(id, e) {
    }

    function dragendColumn(id, e) {
        var column = self.visibleColumns.splice(self.drag.stopPos, 1)[0],
            width = self.columnWidths.splice(self.drag.stopPos, 1)[0];
        Ox.$body.removeClass('OxDragging');
        self.visibleColumns.splice(self.drag.stopPos, 0, column);
        self.columnWidths.splice(self.drag.stopPos, 0, width);
        that.$head.$content.empty();
        constructHead();
        $('.' + getColumnClassName(id)).css({opacity: 1});
        self.$heads[self.drag.stopPos].removeClass('OxDrag').css({
            cursor: 'default'
        });
        that.$body.clearCache();
        triggerColumnChangeEvent();
    }

    function dragstartResize(id, e) {
        var pos = getColumnPositionById(id);
        Ox.$body.addClass('OxDragging');
        self.drag = {
            startWidth: self.columnWidths[pos]
        };
    }

    function dragResize(id, e) {
        var width = Ox.limit(
                self.drag.startWidth + e.clientDX,
                self.options.columnWidth[0],
                self.options.columnWidth[1]
            );
        resizeColumn(id, width);
    }

    function dragendResize(id, e) {
        var pos = getColumnPositionById(id);
        // fixme: shouldn't this be resizecolumn?
        Ox.$body.removeClass('OxDragging');
        that.triggerEvent('columnresize', {
            id: id,
            width: self.columnWidths[pos]
        });
    }

    function enableHorizontalScrolling() {
        that.$body.options({
                disableHorizontalScrolling: false
            })
            .css({overflowX: 'auto'});
        that.bindEvent({
            key_left: function () {
                that.$body.animate({
                    scrollLeft: that.$body[0].scrollLeft - that.$body.width()
                }, 250);
            },
            key_right: function() {
                that.$body.animate({
                    scrollLeft: that.$body[0].scrollLeft + that.$body.width()
                }, 250);
            }
        });
    }

    function formatValue(key, value, data) {
        // fixme: this may be obscure...
        // since the format of a value may depend on another value,
        // we pass all data as a second parameter to the supplied format function
        var format = self.format[key];
        // FIXME: this keeps null from ever reaching a format function!
        if (value === null) {
            value = '';
        } else if (format) {
            if (Ox.isObject(format)) {
                value = (
                    /^color/.test(format.type.toLowerCase()) ? Ox.Theme : Ox
                )['format' + Ox.toTitleCase(format.type)].apply(
                    this, [value].concat(format.args || [])
                );
            } else {
                value = format(value, data);
            }
        } else if (Ox.isArray(value)) {
            value = value.join(', ');
        }
        return value;
    }

    function getCell(id, key) {
        var $item = getItem(id);
        key = key || ''; // fixme: what is this?
        return $($item.find('.OxCell.' + getColumnClassName(key))[0]);
    }

    function getColumnClassName(id) {
        return 'OxColumn' + id[0].toUpperCase() + id.slice(1);
    }

    function getColumnOffsets() {
        return self.visibleColumns.map(function(column, i) {
            return Ox.sum(self.visibleColumns.map(function(column_, i_) {
                return i_ < i ? self.columnWidths[i_] : 0;
            }));
        });
    }

    function getColumnIndexById(id) {
        return Ox.getIndexById(self.options.columns, id);
    }

    function getColumnPositionById(id) {
        return Ox.getIndexById(self.visibleColumns, id);
    }

    function getItem(id) {
        var $item = null;
        that.find('.OxItem').each(function() {
            var $this = $(this);
            if ($this.data('id') == id) {
                $item = $this;
                return false; // break
            }
        });
        return $item;
    }

    function getItemWidth(cached) {
        // fixme: this gets called for every constructItem and is slooow
        // the proper way to fix this would be to find out how and when
        // that.width() might change... which would probably mean binding to
        // every SplitPanel and window resize... for now, use a cached value
        if (!cached) {
            self.cachedWidth = that.width();
        } else if ((!self.cachedWidth && self.cachedWidth !== 0) || self.cachedWidthTime < +new Date() - 5000) {
            self.cachedWidth = that.width();
            self.cachedWidthTime = +new Date();
        }
        return Math.max(
            Ox.sum(self.columnWidths),
            self.cachedWidth -
            (self.options.scrollbarVisible ? Ox.UI.SCROLLBAR_SIZE : 0)
        );
    }

    function moveColumn(id, pos) {
        //Ox.Log('List', 'moveColumn', id, pos)
        var startPos = getColumnPositionById(id),
            stopPos = pos,
            startSelector = '.' + getColumnClassName(id),
            stopSelector = '.' + getColumnClassName(self.visibleColumns[stopPos].id),
            insert = startPos < stopPos ? 'insertAfter' : 'insertBefore',
            $column = $('.OxHeadCell' + startSelector),
            $resize = $column.next();
        //Ox.Log('List', startSelector, insert, stopSelector)
        $column.detach()[insert](insert == 'insertAfter'
            ? $('.OxHeadCell' + stopSelector).next()
            : $('.OxHeadCell' + stopSelector));
        $resize.detach().insertAfter($column);
        that.$body.find('.OxItem').each(function() {
            var $this = $(this);
            $this.children(startSelector).detach()[insert](
                $this.children(stopSelector)
            );
        });
        var $head = self.$heads.splice(startPos, 1)[0],
            columnWidth = self.columnWidths.splice(startPos, 1)[0],
            visibleColumn = self.visibleColumns.splice(startPos, 1)[0];
        self.$heads.splice(stopPos, 0, $head);
        self.columnWidths.splice(stopPos, 0, columnWidth);
        self.visibleColumns.splice(stopPos, 0, visibleColumn);
        var pos = getColumnPositionById(self.options.columns[self.selectedColumn].id);
        if (pos > -1) {
            that.find('.OxResize .OxSelected').removeClass('OxSelected');
            pos > 0 && self.$heads[pos].prev().children().eq(2).addClass('OxSelected');
            self.$heads[pos].next().children().eq(0).addClass('OxSelected');
            if (pos == stopPos) {
                pos > 0 && self.$heads[pos].prev().children().eq(2).css({opacity: 0.5});
                self.$heads[pos].next().children().eq(0).css({opacity: 0.5});
            }
        }
    }

    function removeColumn(id) {
        //Ox.Log('List', 'removeColumn', id);
        var index = getColumnIndexById(id),
            itemWidth,
            position = getColumnPositionById(id),
            selector = '.' + getColumnClassName(id),
            $column = $('.OxHeadCell ' + selector),
            $order = $column.next(),
            $resize = $order.next();
        self.options.columns[index].visible = false;
        self.visibleColumns.splice(position, 1);
        self.columnWidths.splice(position, 1);
        that.$head.$content.empty();
        constructHead();
        itemWidth = getItemWidth();
        that.$body.find('.OxItem').each(function() {
            var $this = $(this);
            $this.children(selector).remove();
            $this.css({width: itemWidth + 'px'});
        });
        that.$body.$content.css({
            width: itemWidth + 'px'
        });
        !self.hasItemsArray && that.$body.options({
            keys: self.visibleColumns.map(function(column) {
                return column.id;
            }).concat(self.options.keys)
        });
        //that.$body.clearCache();
    }

    function resetColumn(id) {
        var width = self.defaultColumnWidths[getColumnIndexById(id)];
        resizeColumn(id, width);
        that.triggerEvent('columnresize', {
            id: id,
            width: width
        });
    }

    function resizeColumn(id, width) {
        var i = getColumnIndexById(id),
            pos = getColumnPositionById(id);
        self.options.columns[i].width = width;
        self.columnWidths[pos] = width;
        if (self.options.columnsVisible) {
            that.$head.$content.css({
                width: (Ox.sum(self.columnWidths) + 2) + 'px'
            });
            self.$heads[pos].css({
                width: width - 5 + 'px'
            });
            self.$titles[pos].css({
                width: width - 9 - (i == self.selectedColumn ? 16 : 0) + 'px'
            });
        }
        that.find(
            '.OxCell.' + getColumnClassName(self.options.columns[i].id)
        ).css({
            width: width - (self.options.columnsVisible ? 9 : 8) + 'px'
        });
        setWidth();
    }

    function setWidth() {
        var width = getItemWidth();
        that.$body.find('.OxItem').css({ // fixme: can we avoid this lookup?
            width: width + 'px'
        });
        that.$body.$content.css({
            width: width + 'px' // fixme: check if scrollbar visible, and listen to resize/toggle event
        });
    }

    function toggleSelected(id) {
        var isSelected,
            pos = getColumnPositionById(id);
        if (pos > -1) {
            updateOrder(id);
            pos > 0 && self.$heads[pos].prev().children().eq(2).toggleClass('OxSelected');
            self.$heads[pos].toggleClass('OxSelected');
            self.$heads[pos].next().children().eq(0).toggleClass('OxSelected');
            isSelected = self.$heads[pos].hasClass('OxSelected');
            self.$titles[pos].css({
                width: self.$titles[pos].width()
                    + (isSelected ? -16 : 16)
                    + 'px'
            });
            if (self.visibleColumns[pos].titleImage) {
                self.$titleImages[pos].attr({
                    src: Ox.UI.getImageURL(
                        'symbol' + Ox.toTitleCase(self.visibleColumns[pos].titleImage),
                        isSelected ? 'selected' : ''
                    )
                });
            }
        }
    }

    function triggerColumnChangeEvent() {
        that.triggerEvent('columnchange', {
            ids: self.visibleColumns.map(function(column) {
                return column.id;
            })
        });
    }

    function updateClearButton() {
        if (self.options.clearButton) {
            self.$clearButton[self.options.selected.length ? 'show' : 'hide']();
        }
    }

    function updateColumn() {
        var columnId = self.options.columns[self.selectedColumn].id,
            isSelected = columnId == self.options.sort[0].key;
        if (self.options.columnsVisible) {
            if (isSelected) {
                updateOrder(columnId);
            } else {
                toggleSelected(columnId);
                self.selectedColumn = getColumnIndexById(self.options.sort[0].key);
                toggleSelected(self.options.columns[self.selectedColumn].id);
            }
        }
    }

    function updateImages() {
        // FIXME: not yet used
        that.$body.find('img').each(function(i, element) {
            var $element = $(element),
                data = Ox.UI.getImageData($element.attr('src'));
            if (data && data.color == 'selected') {
                $element.attr({src: Ox.UI.getImageURL(data.name, 'default')});
            }
        });
        that.$body.find('.OxSelected img').each(function(i, element) {
            var $element = $(element),
                data = Ox.UI.getImageData($element.attr('src'));
            if (data && data.color == 'default') {
                $element.attr({src: Ox.UI.getImageURL(data.name, 'selected')});
            }
        });
    }

    function updateOrder(id) {
        var operator = self.options.sort[0].operator,
            pos = getColumnPositionById(id);
        if (pos > -1) {
            self.$orderImages[pos].attr({
                src: Ox.UI.getImageURL(
                    'symbol' + (operator == '+' ? 'Up' : 'Down'),
                    'selected'
                )
            }).css({
                marginTop: (operator == '+' ? 3 : 2) + 'px'
            });
        }
    }

    that.addColumn = function(id) {
        addColumn(id);
    };

    that.addItems = function(items) {
        that.$body.addItems(items);
    };

    that.api = that.$body.options('items');

    /*@
    closePreivew <f> closePreview
    @*/
    that.closePreview = function() {
        that.$body.closePreview();
        return that;
    };

    /*@
    editCell <f> editCell
        (id, key, select) -> <u> edit cell
    @*/
    that.editCell = function(id, key, select) {
        Ox.Log('List', 'editCell', id, key)
        var $item = getItem(id),
            $cell = getCell(id, key),
            $input,
            html = $cell.html(),
            clickableCells = $item.find('.OxClickable').removeClass('OxClickable'),
            editableCells = $item.find('.OxEditable').removeClass('OxEditable'),
            index = getColumnIndexById(key),
            column = self.options.columns[index],
            width = column.width - self.options.columnsVisible;
        $cell.empty()
            .addClass('OxEdit')
            .css({width: width + 'px'});
        $input = Ox.Input({
                autovalidate: column.input ? column.input.autovalidate : null,
                style: 'square',
                textAlign: column.align || 'left',
                value: column.unformat ? column.unformat(html) : html,
                width: width - 2
            })
            .css({padding: '0 1px'})
            .on({
                mousedown: function(e) {
                    // keep mousedown from reaching list
                    e.stopPropagation();
                }
            })
            .bindEvent({
                blur: submit,
                cancel: submit,
                submit: submit
            })
            .appendTo($cell);
        // use timeout to prevent key to be inserted
        // into $input if triggered via keyboard shortcut
        setTimeout(function() {
            $input.focusInput(select);
        });
        function submit() {
            var value = $input.value();
            $input.remove();
            $cell.removeClass('OxEdit')
                .css({
                     // account for padding
                    width: (width - 8) + 'px'
                })
                .html(value);
            setTimeout(function() {
                clickableCells.addClass('OxClickable');
                editableCells.addClass('OxEditable');
            }, 250);
            that.triggerEvent('submit', {
                id: id,
                key: key,
                value: value
            });
        }
    };

    /*@
    gainFocus <f> gainFocus
    @*/
    that.gainFocus = function() {
        that.$body.gainFocus();
        return that;
    };

    that.getColumnWidth = function(id) {
        var pos = getColumnPositionById(id);
        return self.columnWidths[pos];
    };

    that.getPasteIndex = function() {
        return that.$body.getPasteIndex();
    };

    // FIXME: needed?
    that.getVisibleColumns = function() {
        return self.visibleColumns.map(function(column) {
            return column.id;
        });
    };

    /*@
    hasFocus <f> hasFocus
    @*/
    that.hasFocus = function() {
        return that.$body.hasFocus();
    };

    that.invertSelection = function() {
        that.$body.invertSelection();
        return that;
    };

    /*@
    loseFocus <f> loseFocus
    @*/
    that.loseFocus = function() {
        that.$body.loseFocus();
        return that;
    };

    /*@
    openPreview <f> openPreview
    @*/
    that.openPreview = function() {
        that.$body.openPreview();
        return that;
    };

    /*@
    reloadList <f> reloadList
        (stayAtPosition) -> <o> reload list
    @*/
    that.reloadList = function(stayAtPosition) {
        that.$body.reloadList(stayAtPosition);
        return that;
    };

    that.removeColumn = function(id) {
        removeColumn(id);
        return that;
    };

    that.selectAll = function() {
        that.$body.selectAll();
        return that;
    };

    that.selectPosition = function(pos) {
        that.$body.selectPosition(pos);
        return that;
    };

    that.selectSelected = function(offset) {
        that.$body.selectSelected(offset);
        return that;
    };

    that.setColumnTitle = function(id, title) {
        var index = getColumnIndexById(id);
        self.options.columns[index].title = title;
        if (self.options.columns[index].visible) {
            self.$titles[getColumnPositionById(id)].html(title);
        }
        return that;
    };

    /*@
    resizeColumn <f> resizeColumn
        (id, width) -> <o> resize column id to width
    @*/
    that.setColumnWidth = that.resizeColumn = function(id, width) {
        resizeColumn(id, width);
        return that;
    };

    // FIXME: needed?
    that.setVisibleColumns = function(ids) {
        Ox.forEach(ids, function(id) {
            var index = getColumnIndexById(id);
            if (!self.options.columns[index].visible) {
                addColumn(id);
            }
        });
        Ox.forEach(self.visibleColumns, function(column) {
            if (ids.indexOf(column.id) == -1) {
                removeColumn(column.id);
            }
        });
        triggerColumnChangeEvent();
        return that;
    };

    /*@
    size <f> size
    @*/
    that.size = function() {
        setWidth();
        that.$body.size();
        return that;
    };

    // fixme: deprecated
    that.sortList = function(key, operator) {
        Ox.Log('List', '$$$$ DEPRECATED $$$$')
        var isSelected = key == self.options.sort[0].key;
        self.options.sort = [{
            key: key,
            operator: operator,
            map: self.options.columns[self.selectedColumn].sort
        }];
        if (self.options.columnsVisible) {
            if (isSelected) {
                updateOrder(self.options.columns[self.selectedColumn].id);
            } else {
                toggleSelected(self.options.columns[self.selectedColumn].id);
                self.selectedColumn = getColumnIndexById(key);
                toggleSelected(self.options.columns[self.selectedColumn].id);
            }
        }
        // fixme: strangely, sorting the list blocks toggling the selection,
        // so we use a timeout for now
        setTimeout(function() {
            that.$body.options({sort: self.options.sort});
            /*
            that.$body.sortList(
                self.options.sort[0].key,
                self.options.sort[0].operator,
                self.options.sort[0].map
            );
            */
        }, 10);
        return that;
    };

    /*@
    value <f> value
        (id) -> get values of row id
        (id, key) -> get value of cell id, key
        (id, key, value) -> set id, key to value
        (id, {key: value, ...}) -> set id, keys to values
    @*/
    that.value = function() {
        var $cell,
            args = Ox.slice(arguments),
            id = args.shift(),
            sort = false;
        if (arguments.length == 1) {
            return that.$body.value(id);
        } else if (arguments.length == 2 && Ox.isString(arguments[1])) {
            return that.$body.value(id, arguments[1]);
        } else {
            that.$body.value(id, Ox.makeObject(args));
            Ox.forEach(Ox.makeObject(args), function(value, key) {
                var changed = false;
                if (key == self.options.unique) {
                    // unique id has changed
                    self.options.selected = self.options.selected.map(function(id_) {
                        return id_ == id ? value : id_
                    });
                    id = value;
                }
                $cell = getItem(id) && getCell(id, key);
                if ($cell && !$cell.is('.OxEdit')) {
                    var value = formatValue(key, value, that.$body.value(id));
                    if (value != $cell.html()) {
                        $cell.html(value);
                        changed = true;
                    }
                }
                if (changed && !self.options.sortable && key == self.options.sort[0].key) {
                    // sort key has changed
                    sort = true;
                }
            });
            sort && that.$body.sort();
            return that;
        }
    };

    return that;

};
