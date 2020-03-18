'use strict';

/*@
Ox.List <f> List constructor
    options <o> Options object
        centered <b|false> if true, and orientation is 'horizontal', then keep the selected item centered
        construct   <f|null> (data) returns the list item HTML
        disableHorizontalScrolling <b|false> If true, disable scrolling
        draggable <b|false> If true, items can be dragged
        format <[]> ???
        itemHeight <n|16> item height
        items <a|f|null> <a> list of items, <f> (data) returns {items, size, ...}, (data, callback) returns [items]
        itemWidth <n|16> item width
        keys <a|[]> keys of the list items
        max <n|-1> Maximum number of items that can be selected (-1 for all)
        min <n|0> Minimum number of items that must be selected
        orientation <s|vertical> 'horizontal', 'vertical' or 'both'
        pageLength <n|100> number of items per page
        query <o> Query
            conditions <[o]> Conditions
                key <s> Key
                operator <s> Operator (like `'='` or `'!='`)
                    Can be `'='` (contains) `'=='` (is), `'^'` (starts with),
                    `'$'` (ends with), `'<'`, `'<='`,  `'>'`, `'>='`, optionally
                    prefixed with `'!'` (not)
                value <*> Value
            operator <s> Operator (`'&'` or `'|'`)
        selectAsYouType <s|''> If set to a key, enables select-as-you-type
        selected <a|[]> ids of the selected elements
        sort <a|[]> sort order
        sortable <b|false> If true, items can be re-ordered
        sums <[s]|[]> sums to be included in totals
        type <s|'text'> type
        unique <s|''> name of the key that acts as unique id
    self <o> shared private variable
    ([options[, self]]) -> <o:Ox.Container> List object
        init <!> init
        add <!> item added
        closepreview <!> preview closed
        copy <!> copy and replace clipboard
        copyadd <!> copy and add to clipboard
        cut <!> cut and replace clipboard
        cutadd <!> cut and add to clipboard
        delete <!> item removed
        draganddrop <!> Fires during drag
        draganddropend <!> Fires on drop
        draganddropenter <!> Fires when entering an element during drag
        draganddropleave <!> Fires when leaving an element during drag
        draganddroppause <!> Fires when the mouse stops moving during drag
        draganddropstart <!> Fires when drag starts
        paste <!> paste
        load <!> list loaded
        move <!> move item
        openpreview <!> preview of selected item opened
        select <!> select item
        selectnext <!> selectnext
        selectprevious <!> selectprevious
        toggle <!> toggle
@*/

// fixme: rename the add event to new, or the delete event to remove

Ox.List = function(options, self) {

    self = self || {};
    var that = Ox.Container({}, self)
            .defaults({
                _tree: false,
                centered: false,
                construct: null,
                disableHorizonzalScrolling: false,
                draggable: false,
                format: [],
                itemHeight: 16,
                items: null,
                itemWidth: 16,
                keys: [],
                max: -1,
                min: 0,
                orientation: 'vertical',
                pageLength: 100,
                query: {conditions: [], operator: '&'},
                selected: [],
                sort: [],
                sortable: false,
                sums: [],
                type: 'text',
                unique: ''
            })
            .options(options || {})
            .update({
                draggable: updateDraggable,
                items: function() {
                    if (!self.isAsync) {
                        updateItems();
                    } else {
                        if (Ox.isArray(self.options.items)) {
                            // FIXME: retarded workaround
                            self.items = self.options.items;
                            self.options.items = self.itemsAPI.update(self.items);
                            /*
                            self.listLength = self.options.items.length;
                            updateSelected();
                            updateSort();
                            */
                        }
                        updateQuery();
                    }
                },
                query: function() {
                    that.reloadList();
                },
                selected: function() {
                    setSelected(self.options.selected);
                },
                sort: updateSort,
                sortable: updateSortable
            })
            .on({
                scroll: scroll
            });

    self.options.sort = self.options.sort.map(function(sort) {
        return Ox.isString(sort) ? {
            key: sort.replace(/^[\+\-]/, ''),
            operator: sort[0] == '-' ? '-' : '+'
        } : sort;
    });

    if (Ox.isArray(self.options.items) && !self.options._tree) {
        self.items = self.options.items;
        self.options.items = Ox.api(self.items, {
            cache: true,
            map: self.options.map,
            sort: self.options.sort,
            sums: self.options.sums,
            unique: self.options.unique
        });
        // FIXME: this is retarded, only needed because setting items later will
        // overwrite the items API.
        self.itemsAPI = self.options.items;
    }

    that.$content.bindEvent({
        mousedown: mousedown,
        singleclick: singleclick,
        doubleclick: doubleclick
    }).on({
        touchend: function(e) {
            if (
                self.touchSelection.length
                && self.options.selected[0] == self.touchSelection[0]
            ) {
                doubleclick(e);
            } else {
                self.touchSelection = Ox.clone(self.options.selected);
            }
        }
    
    });
    self.options.draggable && updateDraggable();
    self.options.sortable && updateSortable();

    // fixme: without this, horizontal lists don't get their full width
    self.options.orientation == 'horizontal' && that.$content.css({height: '1px'});

    Ox.extend(self, {
        $items: [],
        $pages: [],
        format: {},
        //isAsync: true,
        isAsync: !self.options._tree,
        itemMargin: self.options.type == 'text' ? 0 : 8, // 2 x 4 px margin ... fixme: the 2x should be computed later
        keyboardEvents: {
            key_control_c: function() {
                copyItems();
            },
            key_control_shift_c: function() {
                copyItems(true);
            },
            key_control_e: editItems,
            key_control_n: function() {
                addItem('');
            },
            key_alt_control_n: function() {
                addItem('alt');
            },
            key_alt_control_shift_n: function() {
                addItem('alt_shift');
            },
            key_control_shift_n: function() {
                addItem('shift');
            },
            key_control_v: pasteItems,
            key_control_x: function() {
                cutItems();
            },
            key_control_shift_x: function() {
                cutItems(true);
            },
            key_delete: deleteItems,
            key_end: scrollToLast,
            key_enter: open,
            key_home: scrollToFirst,
            key_pagedown: scrollPageDown,
            key_pageup: scrollPageUp,
            key_section: preview, // fixme: firefox gets keyCode 0 when pressing space
            key_space: preview
        },
        listMargin: self.options.type == 'text' ? 0 : 8, // 2 x 4 px padding
        page: 0,
        preview: false,
        requests: [],
        scrollTimeout: 0,
        selected: [],
        touchSelection: []
    });
    if (!self.isAsync) {
        self.selected = self.options.items.map(function(item, i) {
            return Ox.extend(item, {_index: i})
        }).filter(function(item) {
            return Ox.contains(self.options.selected, item[self.options.unique]);
        }).map(function(item) {
            return item['_index'];
        });
    }
    self.options.max == -1 && Ox.extend(self.keyboardEvents, {
        key_alt_control_a: function() {
            that.invertSelection();
        },
        key_control_a: function() {
            that.selectAll();
        }
    });
    self.options.min == 0 && Ox.extend(self.keyboardEvents, {
        key_control_shift_a: selectNone
    });
    self.keyboardEvents[
        'key_' + (self.options.orientation == 'vertical' ? 'up' : 'left')
    ] = selectPrevious;
    self.keyboardEvents[
        'key_' + (self.options.orientation == 'vertical' ? 'down' : 'right')
    ] = selectNext;
    if (self.options.max == -1) {
        self.keyboardEvents[
            'key_shift_' + (self.options.orientation == 'vertical' ? 'up' : 'left')
        ] = addPreviousToSelection;
        self.keyboardEvents[
            'key_shift_' + (self.options.orientation == 'vertical' ? 'down' : 'right'
            )
        ] = addNextToSelection;
    }
    if (self.options.orientation == 'vertical') {
        Ox.extend(self.keyboardEvents, {
            key_left: function() {
                triggerToggleEvent(false);
            },
            key_right: function() {
                triggerToggleEvent(true);
            }
        });
    } else if (self.options.orientation == 'both') {
        Ox.extend(self.keyboardEvents, {
            key_down: selectBelow,
            key_up: selectAbove
        });
        if (self.options.max == -1) {
            Ox.extend(self.keyboardEvents, {
                key_shift_down: addBelowToSelection,
                key_shift_up: addAboveToSelection
            });
        }
        self.pageLengthByRowLength = [
            0, 60, 60, 60, 60, 60, 60, 63, 64, 72,
            80, 88, 96, 104, 112, 120, 128, 136, 144, 152,
            160, 168, 176, 184, 192
        ];
    }
    if (self.options.selectAsYouType) {
        Ox.extend(self.keyboardEvents, {keys: selectAsYouType});
    }

    that.bindEvent(self.keyboardEvents);

    !self.isAsync ? updateItems() : updateQuery();

    function addAboveToSelection() {
        var pos = getAbove();
        if (pos > -1) {
            addToSelection(pos);
            scrollToPosition(pos);
        }
    }

    function addAllToSelection(pos) {
        var arr, i, len = self.$items.length;
        if (!isSelected(pos)) {
            if (self.selected.length == 0) {
                addToSelection(pos);
            } else {
                arr = [pos];
                if (Ox.min(self.selected) < pos) {
                    for (i = pos - 1; i >= 0; i--) {
                        if (isSelected(i)) {
                            break;
                        }
                        arr.push(i);
                    }
                }
                if (Ox.max(self.selected) > pos) {
                    for (i = pos + 1; i < len; i++) {
                        if (isSelected(i)) {
                            break;
                        }
                        arr.push(i);
                    }
                }
                addToSelection(arr);
            }
        }
    }

    function addBelowToSelection() {
        var pos = getBelow();
        if (pos > -1) {
            addToSelection(pos);
            scrollToPosition(pos);
        }
    }

    function addItem(keys) {
        that.triggerEvent('add', {keys: keys});
    }

    function addNextToSelection() {
        var pos = getNext();
        if (pos > -1) {
            addToSelection(pos);
            scrollToPosition(pos);
        }
    }

    function addPreviousToSelection() {
        var pos = getPrevious();
        if (pos > -1) {
            addToSelection(pos);
            scrollToPosition(pos);
        }
    }

    function addToSelection(pos) {
        Ox.makeArray(pos).reverse().forEach(function(pos) {
            if (!isSelected(pos)) {
                self.selected.unshift(pos);
                if (!Ox.isUndefined(self.$items[pos])) {
                    self.$items[pos].addClass('OxSelected');
                }
            } else {
                // allow for 'cursor navigation' within selection
                self.selected.splice(self.selected.indexOf(pos), 1);
                self.selected.unshift(pos);
            }
        });
        triggerSelectEvent();
    }

    function clear() {
        self.requests.forEach(function(request) {
            Ox.Request.cancel(request);
        });
        Ox.extend(self, {
            $items: [],
            $pages: [],
            page: 0,
            requests: []
        });
    }

    function constructEmptyPage(page) {
        var i, $page = Ox.Element().addClass('OxPage').css(getPageCSS(page));
        Ox.loop(getPageLength(page), function() {
            Ox.ListItem({
                construct: self.options.construct
            }).appendTo($page);
        });
        return $page;
    }

    function copyItems(add) {
        self.options.selected.length && that.triggerEvent('copy' + (add ? 'add' : ''), {
            ids: self.options.selected
        });
    }

    function cutItems(add) {
        self.options.selected.length && that.triggerEvent('cut' + (add ? 'add' : ''), {
            ids: self.options.selected
        });
    }

    function deleteItems() {
        self.options.selected.length && that.triggerEvent('delete', {
            ids: self.options.selected
        });
    }

    function deselect(pos) {
        var triggerEvent = false;
        Ox.makeArray(pos).forEach(function(pos) {
            if (isSelected(pos)) {
                self.selected.splice(self.selected.indexOf(pos), 1);
                !Ox.isUndefined(self.$items[pos])
                    && self.$items[pos].removeClass('OxSelected');
                triggerEvent = true;
            }
        });
        triggerEvent && triggerSelectEvent();
    }

    function doubleclick(data) {
        open(isSpecialTarget(data));
    }

    function dragstart(data) {
        var $target = $(data.target),
            $parent = $target.parent();
        if ((
            $target.is('.OxTarget') // icon lists
            || $parent.is('.OxTarget') // table lists
            || $parent.parent().is('.OxTarget') // table lists with div inside cell
        ) && !$target.is('.OxSpecialTarget')) {
            Ox.$body.addClass('OxDragging');
            self.drag = {
                ids: self.options.selected
            };
            // fixme: shouldn't the target have been
            // automatically passed already, somewhere?
            that.triggerEvent('draganddropstart', {
                event: data,
                ids: self.drag.ids
            });
        }
    }

    function drag(data) {
        self.drag && that.triggerEvent('draganddrop', {
            event: data,
            ids: self.drag.ids
        });
    }

    function dragpause(data) {
        self.drag && that.triggerEvent('draganddroppause', {
            event: data,
            ids: self.drag.ids
        });
    }

    function dragenter(data) {
        self.drag && that.triggerEvent('draganddropenter', {
            event: data,
            ids: self.drag.ids
        });
    }

    function dragleave(data) {
        self.drag && that.triggerEvent('draganddropleave', {
            event: data,
            ids: self.drag.ids
        });
    }

    function dragend(data) {
        if (self.drag) {
            Ox.$body.removeClass('OxDragging');
            that.triggerEvent('draganddropend', {
                event: data,
                ids: self.drag.ids
            });
            delete self.drag;
        }
    }

    function editItems() {
        /*
        self.options.selected.length && that.triggerEvent('edit', {
            ids: self.options.selected
        });
        */
    }

    function emptyFirstPage() {
        if (self.$pages[0]) {
            if (self.options.type == 'text') {
                self.$pages[0].find('.OxEmpty').each(function() {
                    Ox.UI.getElement($(this)).remove();
                });
            } else if (self.options.orientation == 'both') {
                that.$content.css({height: getListSize() + 'px'});
            }
        }
    }

    function fillFirstPage() {
        if (self.$pages[0]) {
            if (self.options.type == 'text') {
                var height = getHeight(),
                    lastItemHeight = height % self.options.itemHeight || self.options.itemHeight,
                    visibleItems = Math.ceil(height / self.options.itemHeight);
                if (self.listLength < visibleItems) {
                    Ox.range(self.listLength, visibleItems).forEach(function(i) {
                        var $item = Ox.ListItem({
                            construct: self.options.construct
                        });
                        $item.addClass('OxEmpty').removeClass('OxTarget');
                        if (i == visibleItems - 1) {
                            $item.$element.css({
                                height: lastItemHeight + 'px',
                                overflowY: 'hidden'
                            });
                        }
                        $item.appendTo(self.$pages[0]);
                    });
                }
            } else if (self.options.orientation == 'both') {
                var height = getHeight(),
                    listSize = getListSize();
                if (listSize < height) {
                    that.$content.css({height: height + 'px'});
                }
            }
        }
    }

    function findCell(e) {
        var $element = $(e.target);
        while (
            !$element.is('.OxCell')
            && !$element.is('.OxPage')
            && !$element.is('body')
        ) {
            $element = $element.parent();
        }
        return $element.is('.OxCell') ? $element : null;
    }

    function findItemPosition(e) {
        var $element = $(e.target),
            $parent,
            position = -1;
        while (
            !$element.is('.OxTarget') && !$element.is('.OxPage')
            && ($parent = $element.parent()).length
        ) {
            $element = $parent;
        }
        if ($element.is('.OxTarget')) {
            while (
                !$element.is('.OxItem') && !$element.is('.OxPage')
                && ($parent = $element.parent()).length
            ) {
                $element = $parent;
            }
            if ($element.is('.OxItem')) {
                position = $element.data('position');
            }
        }
        return position;
    }

    function getAbove() {
        var pos = -1;
        if (self.selected.length) {
            pos = self.selected[0] - self.rowLength;
            if (pos < 0) {
                pos = -1;
            }
        }
        return pos;
    }

    function getBelow() {
        var pos = -1;
        if (self.selected.length) {
            pos = self.selected[0] + self.rowLength;
            if (pos >= self.$items.length) {
                pos = -1;
            }
        }
        return pos;
    }

    function getHeight() {
        return that.height() - (
            !self.options.disableHorizontalScrolling
            && that.$content.width() > that.width()
                ? Ox.UI.SCROLLBAR_SIZE : 0
        );
    }

    function getListSize() {
        return Math.ceil(self.listLength / self.rowLength) * (self.options[
                self.options.orientation == 'horizontal' ? 'itemWidth' : 'itemHeight'
            ] + self.itemMargin);
    }

    function getNext() {
        var pos = -1;
        if (self.selected.length) {
            pos = self.selected[0] + 1;
            if (pos == self.$items.length) {
                pos = -1;
            }
        }
        return pos;
    }

    function getPage() {
        return Math.max(
            Math.floor(self.options.orientation == 'horizontal' ?
            (that.scrollLeft() - self.listMargin / 2) / self.pageWidth :
            (that.scrollTop() - self.listMargin / 2) / self.pageHeight
        ), 0);
    }

    function getPageByPosition(pos) {
        return Math.floor(pos / self.options.pageLength);
    }

    function getPageByScrollPosition(pos) {
        return getPageByPosition(pos / (
            self.options.orientation == 'vertical'
            ? self.options.itemHeight
            : self.options.itemWidth
        ));
    }

    function getPageCSS(page) {
        return self.options.orientation == 'horizontal' ? {
            left: (page * self.pageWidth + self.listMargin / 2) + 'px',
            top: (self.listMargin / 2) + 'px',
            width: (page < self.pages - 1 ? self.pageWidth :
                getPageLength(page) * (self.options.itemWidth + self.itemMargin)) + 'px'
        } : {
            top: (page * self.pageHeight + self.listMargin / 2) + 'px',
            width: self.pageWidth + 'px'
        };
    }

    function getPageHeight() {
         return Math.ceil(self.pageLength * (self.options.itemHeight + self.itemMargin) / self.rowLength);
    }

    function getPageLength(page) {
        var mod = self.listLength % self.pageLength;
        return page < self.pages - 1 || (self.listLength && mod == 0) ? self.pageLength : mod;
    }

    function getPositionById(id) {
        var pos = -1;
        Ox.forEach(self.$items, function($item, i) {
            if ($item.options('data')[self.options.unique] == id) {
                pos = i;
                return false; // break
            }
        });
        return pos;
    }

    function getPositions(callback) {
        // fixme: optimize: send non-selected ids if more than half of the items are selected
        if (self.options.selected.length/* && ids.length < self.listLength*/) {
            self.requests.push(self.options.items({
                positions: self.options.selected,
                query: self.options.query,
                sort: self.options.sort
            }, function(result) {
                getPositionsCallback(result, callback);
            }));
        } else {
            getPositionsCallback(null, callback);
        }
    }

    function getPositionsCallback(result, callback) {
        //Ox.Log('List', 'getPositionsCallback', result);
        var pos = 0, previousSelected = self.options.selected;
        if (result) {
            self.options.selected = [];
            self.positions = {};
            self.selected = [];
            Ox.forEach(result.data.positions, function(pos, id) {
                // fixme: in case the order of self.options.selected
                // is important - it may get lost here
                if (pos > -1) {
                    self.options.selected.push(id);
                    self.selected.push(pos);
                }
            });
            if (self.selected.length) {
                pos = Ox.min(self.selected);
                self.page = getPageByPosition(pos);
            }
            if (!Ox.isEqual(self.options.selected, previousSelected)) {
                that.triggerEvent('select', {ids: self.options.selected});
            }
        } else if (self.stayAtPosition) {
            self.page = getPageByScrollPosition(self.stayAtPosition);
        }
        that.$content.empty();
        loadPages(self.page, function() {
            scrollToPosition(pos, true);
            callback && callback();
        });
    }

    function getPrevious() {
        var pos = -1;
        if (self.selected.length) {
            pos = self.selected[0] - 1;
        }
        return pos;
    }

    function getRow(pos) {
        return Math.floor(pos / self.rowLength);
    }

    function getRowLength() {
        return self.options.orientation == 'both' ? Math.floor(
            (getWidth() - self.listMargin)
            / (self.options.itemWidth + self.itemMargin)
        ) : 1;
    }

    function getScrollPosition() {
        // if orientation is both, this returns the
        // element position at the current scroll position
        return Math.floor(
            that.scrollTop() / (self.options.itemHeight + self.itemMargin)
        ) * self.rowLength;
    }

    function getSelectedIds(callback) {
        var ids = [], notFound = false;
        if (self.$items.length == 0) {
            callback(self.options.selected);
        } else {
            Ox.forEach(self.selected, function(pos) {
                if (self.$items[pos]) {
                    ids.push(self.$items[pos].options('data')[self.options.unique]);
                } else {
                    notFound = true;
                    return false; // break
                }
            });
            if (notFound) {
                // selection across items that are not in the DOM
                self.options.items({
                    keys: [self.options.unique],
                    query: self.options.query,
                    range: [0, self.listLength],
                    sort: self.options.sort
                }, function(result) {
                    var ids = [], rest = [],
                        useRest = self.selected.length > self.listLength / 2;
                    result.data.items.forEach(function(item, i) {
                        if (isSelected(i)) {
                            ids.push(item[self.options.unique]);
                        } else if (useRest) {
                            rest.push(item[self.options.unique]);
                        }
                    });
                    useRest ? callback(ids, rest) : callback(ids);
                });
            } else {
                callback(ids);
            }
        }
    }

    function getWidth() {
        //Ox.Log('List', 'LIST THAT.WIDTH()', that.width())
        return that.width() - (
            that.$content.height() > that.height() ? Ox.UI.SCROLLBAR_SIZE : 0
        );
    }

    function isSelected(pos) {
        return Ox.contains(self.selected, pos);
    }

    function isSpecialTarget(e) {
        var $element = $(e.target),
            $parent;
        while (
            !$element.is('.OxSpecialTarget') && !$element.is('.OxPage')
            && ($parent = $element.parent()).length
        ) {
            $element = $parent;
        }
        return $element.is('.OxSpecialTarget');
    }

    function loadItems() {
        self.$pages[0].empty();
        self.$items = [];
        ////var timeC = 0, timeA = 0;
        self.options.items.forEach(function(item, pos) {
            // fixme: duplicated
            var time0 = +new Date();
            self.$items[pos] = Ox.ListItem({
                construct: self.options.construct,
                data: item,
                position: pos,
                unique: self.options.unique
            });
            ////timeC += +new Date() - time0;
            isSelected(pos) && self.$items[pos].addClass('OxSelected');
            ////var time0 = +new Date();
            self.$items[pos].appendTo(self.$pages[0]);
            ////timeA += +new Date() - time0;
        });
        // timeout needed so that height is present
        setTimeout(fillFirstPage, 0);
        self.selected.length && scrollToPosition(self.selected[0]);
        ////Ox.Log('List', 'CONSTRUCT:', timeC, 'APPEND:', timeA);
        that.triggerEvent('init', {items: self.options.items.length});
        // fixme: do sync lists need to trigger init?
    }

    function loadPage(page, callback) {
        if (page < 0 || page >= self.pages) {
            !Ox.isUndefined(callback) && callback();
            return;
        }
        Ox.Log('List', that.oxid, 'loadPage', page);
        var keys = Ox.unique(self.options.keys.concat(self.options.unique)),
            offset = page * self.pageLength,
            range = [offset, offset + getPageLength(page)];

        if (!Ox.isUndefined(self.$pages[page])) {
            Ox.Log('List', 'fixme: unload should have made this undefined already');
        }

        self.$pages[page] = constructEmptyPage(page);
        page == 0 && fillFirstPage();
        self.$pages[page].appendTo(that.$content);
        self.requests.push(self.options.items({
            keys: keys,
            query: self.options.query,
            range: range,
            sort: self.options.sort
        }, function(result) {
            var $emptyPage = self.$pages[page];
            self.$pages[page] = Ox.Element().addClass('OxPage').css(getPageCSS(page));
            result.data.items.forEach(function(v, i) {
                var pos = offset + i;
                self.$items[pos] = Ox.ListItem({
                    construct: self.options.construct,
                    data: v,
                    //format: self.options.format,
                    position: pos,
                    unique: self.options.unique
                });
                isSelected(pos) && self.$items[pos].addClass('OxSelected');
                self.$items[pos].appendTo(self.$pages[page]);
            });
            page == 0 && fillFirstPage();
            // FIXME: why does emptyPage sometimes have no methods?
            //Ox.Log('List', 'emptyPage', $emptyPage)
            $emptyPage && $emptyPage.remove && $emptyPage.remove();
            self.$pages[page].appendTo(that.$content);
            !Ox.isUndefined(callback) && callback(); // fixme: callback necessary? why not bind to event?
        }));
    }

    function loadPages(page, callback) {
        Ox.Log('List', 'loadPages', page);
        var counter = 0,
            fn = function() {
                if (++counter == 3) {
                    !Ox.isUndefined(callback) && callback();
                    that.triggerEvent('load');
                }
            };
        // fixme: find out which option is better
        /*
        loadPage(page, function() {
            loadPage(page - 1, fn);
            loadPage(page + 1, fn);
        });
        */
        loadPage(page, fn);
        loadPage(page - 1, fn);
        loadPage(page + 1, fn);
    }

    function mousedown(data) {
        var pos = findItemPosition(data);
        that.gainFocus();
        self.mousedownOnSelectedCell = false;
        if (pos > -1) {
            if (data.metaKey) {
                if (!isSelected(pos) && (self.options.max == -1 || self.options.max > self.selected.length)) {
                    // meta-click on unselected item
                    addToSelection(pos);
                } else if (isSelected(pos) && self.options.min < self.selected.length) {
                    // meta-click on selected item
                    deselect(pos);
                }
            } else if (data.shiftKey) {
                if (!isSelected(pos) && self.options.max == -1) {
                    // shift-click on unselected item
                    addAllToSelection(pos);
                } else if (isSelected(pos)) {
                    // shift-click on selected item
                    addToSelection(pos);
                }
            } else if (!isSelected(pos) && self.options.max != 0) {
                // click on unselected item
                select(pos);
            } else if (self.options.type == 'text') {
                // click on a selected table list cell
                self.mousedownOnSelectedCell = true;
            }
        } else if (!$(data.target).is('.OxToggle') && self.options.min == 0) {
            // click on empty area
            selectNone();
        }
        // note: we have to save if the mousedown was on a selected cell
        // since otherwise, mousedown would select a previously unselected item,
        // and the subsequent singleclick might trigger an unwanted edit event. 
    }

    function movestart(data) {
        Ox.$body.addClass('OxDragging');
        var pos = findItemPosition(data),
            $items = self.$items.filter(function($item, i) {
                if ($item.is('.OxSelected')) {
                    $item.addClass('OxDrag');
                    return true;
                }
                return false;
            });
        self.drag = {
            $items: $items,
            index: Ox.indexOf($items, function($item) {
                return $item.options('position') == pos;
            }),
            length: $items.length,
            startPos: pos,
            startY: data.clientY,
            stopPos: pos
        };
    }

    function move(data) {
        var clientY = data.clientY - that.offset().top,
            offset = clientY % 16,
            position = Ox.limit(
                Math.floor(clientY / 16),
                0, self.$items.length - 1
            );
        if (position < self.drag.startPos) {
            self.drag.stopPos = position + (offset > 8 ? 1 : 0);
        } else if (position > self.drag.startPos) {
            self.drag.stopPos = position - (offset <= 8 ? 1 : 0);
        }
        if (self.drag.stopPos != self.drag.startPos) {
            moveItems(self.drag.startPos, self.drag.stopPos);
            self.drag.startPos = self.drag.stopPos;
        }
    }

    function moveend(data) {
        var ids = [];
        Ox.$body.removeClass('OxDragging');
        self.$items.forEach(function($item) {
            $item.removeClass('OxDrag');
            ids.push($item.options('data')[self.options.unique]);
        });
        that.triggerEvent('move', {ids: ids});
        delete self.drag;
    }

    function moveItems(startPos, stopPos) {
        var pos = stopPos;
        while (self.$items[pos].is('.OxSelected')) {
            pos = pos + (pos < startPos ? -1 : 1);
            if (pos < 0 || pos > self.$items.length - 1) {
                // handle item can still be moved, but group cannot
                return;
            }
        }
        self.drag.$items.forEach(function($item) {
            $item.detach();
        });
        self.drag.$items.forEach(function($item, i) {
            if (i == 0) {
                $item[
                    pos < startPos ? 'insertBefore' : 'insertAfter'
                ](self.$items[pos].$element); // fixme: shouldn't require $element
            } else {
                $item.insertAfter(self.drag.$items[i - 1]);
            }
        });
        self.drag.$items.forEach(function($item, i) {
            self.$items.splice($item.options('position') - i, 1);
        });
        self.$items.splice.apply(
            self.$items,
            [stopPos - self.drag.index, 0].concat(self.drag.$items)
        );
        self.$items.forEach(function($item, pos) {
            $item.options({position: pos});
        });
        self.selected = [];
        self.drag.$items.forEach(function($item) {
            self.selected.push($item.options('position'));
        });
    }

    function open(isSpecialTarget) {
        self.options.selected.length && that.triggerEvent('open', {
            ids: self.options.selected,
            isSpecialTarget: isSpecialTarget == true
        });
    }

    function pasteItems() {
        that.triggerEvent('paste');
    }

    function preview() {
        if (self.options.selected.length) {
            self.preview = !self.preview;
            if (self.preview) {
                that.triggerEvent('openpreview', {
                    ids: self.options.selected
                });
            } else {
                that.triggerEvent('closepreview');
            }
        }
    }

    function scroll() {
        if (self.isAsync) {
            var page = self.page;
            self.scrollTimeout && clearTimeout(self.scrollTimeout);
            self.scrollTimeout = setTimeout(function() {
                self.scrollTimeout = 0;
                self.page = getPage();
                if (self.page == page - 1) {
                    unloadPage(self.page + 2);
                    loadPage(self.page - 1);
                } else if (self.page == page + 1) {
                    unloadPage(self.page - 2);
                    loadPage(self.page + 1);
                } else if (self.page == page - 2) {
                    unloadPage(self.page + 3);
                    unloadPage(self.page + 2);
                    loadPage(self.page);
                    loadPage(self.page - 1);
                } else if (self.page == page + 2) {
                    unloadPage(self.page - 3);
                    unloadPage(self.page - 2);
                    loadPage(self.page);
                    loadPage(self.page + 1);
                } else if (self.page != page) {
                    unloadPages(page);
                    loadPages(self.page);
                }
            }, 250);
        }
        //that.gainFocus();
    }

    function scrollPageDown() {
        that.scrollTop(that.scrollTop() + getHeight());
    }

    function scrollPageUp() {
        that.scrollTop(that.scrollTop() - getHeight());
    }

    function scrollTo(value) {
        that.animate(self.options.orientation == 'horizontal' ? {
            scrollLeft: (self.listSize * value) + 'px'
        } : {
            scrollTop: (self.listSize * value) + 'px'
        }, 0);
    }

    function scrollToFirst() {
        that[self.options.orientation == 'horizontal' ? 'scrollLeft' : 'scrollTop'](0);
    }

    function scrollToLast() {
        that[self.options.orientation == 'horizontal' ? 'scrollLeft' : 'scrollTop'](self.listSize);
    }

    function scrollToPosition(pos, leftOrTopAlign) {
        //Ox.Log('List', 'scrollToPosition', pos)
        var itemHeight = self.options.itemHeight + self.itemMargin,
            itemWidth = self.options.itemWidth + self.itemMargin,
            positions = [],
            scroll,
            size;
        if (self.options.orientation == 'horizontal') {
            if (self.options.centered) {
                that.stop().animate({
                    scrollLeft: self.listMargin / 2 + (pos + 0.5) * itemWidth
                        - that.width() / 2 + 'px'
                }, 250);
            } else {
                positions[0] = pos * itemWidth + self.listMargin / 2;
                positions[1] = positions[0] + itemWidth + self.itemMargin / 2;
                scroll = that.scrollLeft();
                size = getWidth();
                // fixme: css instead of animate(0)?
                if (positions[0] < scroll || leftOrTopAlign) {
                    that.animate({scrollLeft: positions[0] + 'px'}, 0);
                } else if (positions[1] > scroll + size) {
                    that.animate({scrollLeft: (positions[1] - size) + 'px'}, 0);
                }
            }
        } else {
            positions[0] = (
                self.options.orientation == 'vertical' ? pos : getRow(pos)
            ) * itemHeight;
            positions[1] = positions[0] + itemHeight + (
                self.options.orientation == 'vertical' ? 0 : self.itemMargin
            );
            scroll = that.scrollTop();
            size = getHeight();
            // fixme: css instead of animate(0)?
            if (positions[0] < scroll || leftOrTopAlign) {
                that.animate({scrollTop: positions[0] + 'px'}, 0);
            } else if (positions[1] > scroll + size) {
                that.animate({scrollTop: (positions[1] - size) + 'px'}, 0);
            }
        }
    }

    function select(pos) {
        if (!isSelected(pos) || self.selected.length > 1) {
            setSelected([pos]);
            triggerSelectEvent();
            self.options.centered && scrollToPosition(pos);
        }
    }

    function selectAbove() {
        var pos = getAbove();
        if (pos > -1) {
            select(pos);
            scrollToPosition(pos);
        }
    }

    function selectAsYouType(data) {

        self.options.items({
            keys: [self.options.unique],
            query: {
                conditions: [
                    self.options.query,
                    {
                        key: self.options.selectAsYouType,
                        operator: '^',
                        value: data.keys
                    },
                ],
                operator: '&'
            },
            range: [0, 1],
            sort: [{key: self.options.selectAsYouType, operator: '+'}]
        }, function(result) {
            result.data.items.length && that.options({
                selected: [result.data.items[0][self.options.unique]]
            });
        });
    }

    function selectBelow() {
        var pos = getBelow();
        if (pos > -1) {
            select(pos);
            scrollToPosition(pos);
        }
    }

    function selectNext() {
        var pos = getNext();
        if (pos > -1) {
            select(pos);
            scrollToPosition(pos);
        } else if (self.selected.length) {
            that.triggerEvent('selectnext');
        }
    }

    function selectNone() {
        deselect(Ox.clone(self.selected));
    }

    function selectPrevious() {
        var pos = getPrevious();
        if (pos > -1) {
            select(pos);
            scrollToPosition(pos);
        } else if (self.selected.length) {
            that.triggerEvent('selectprevious');
        }
    }

    function selectQuery(str) {
        Ox.forEach(self.$items, function(v, i) {
            if (Ox.toLatin(v.title).toUpperCase().indexOf(str) == 0) {
                select(i);
                scrollToPosition(i);
                return false; // break
            }
        });
    }

    function setSelected(ids, callback) {
        // ids can be positions
        // fixme: callback is never used
        // note: can't use selectNone here,
        // since it'd trigger a select event
        var counter = 0;
        self.$items.forEach(function($item, pos) {
            if (isSelected(pos)) {
                if (!Ox.isUndefined(self.$items[pos])) {
                    self.$items[pos].removeClass('OxSelected');
                }
            }
        });
        self.selected = [];
        ids.forEach(function(id, i) {
            var pos = Ox.isString(id) ? getPositionById(id) : id;
            if (pos > -1) {
                select(pos, i);
            } else if (self.isAsync) {
                // async and id not in current view
                self.options.items({
                    positions: [id],
                    query: self.options.query,
                    sort: self.options.sort
                }, function(result) {
                    pos = result.data.positions[id];
                    select(pos, i);
                });
            }
        });
        function select(pos, i) {
            self.selected.push(pos);
            if (!Ox.isUndefined(self.$items[pos])) {
                self.$items[pos].addClass('OxSelected');
            }
            i == 0 && scrollToPosition(pos);
            ++counter == ids.length && callback && callback();
        }
    }

    function singleclick(data) {
        // these can't trigger on mousedown, since the mousedown
        // could still be the start of a doubleclick or drag
        var pos = findItemPosition(data),
            $cell, clickable, editable;
        if (pos > -1) {
            if (
                !data.metaKey && !data.shiftKey
                && isSelected(pos) && self.selected.length > 1
            ) {
                // click on one of multiple selected items
                select(pos);
            } else if (self.mousedownOnSelectedCell) {
                $cell = findCell(data);
                if ($cell) {
                    clickable = $cell.is('.OxClickable');
                    editable = $cell.is('.OxEditable') && !$cell.is('.OxEdit');
                    if (clickable || editable) {
                        // click on a clickable or editable cell
                        triggerClickEvent(clickable ? 'click' : 'edit', self.$items[pos], $cell);
                    }
                }
            }
        }
    }

    function toggleSelection(pos) {
        // FIXME: unused
        if (!isSelected(pos)) {
            addToSelection(pos);
        } else {
            deselect(pos);
        }
    }

    function triggerClickEvent(event, $item, $cell) {
        // event can be 'click' or 'edit'
        var key;
        if ($cell) {
            key = $cell.attr('class').split('OxColumn')[1].split(' ')[0];
            key = key[0].toLowerCase() + key.slice(1);
        }
        that.triggerEvent(event, Ox.extend({
            id: $item.data('id')
        }, key ? {key: key} : {}));
    }

    var triggerSelectEvent = Ox.debounce(function() {
        // throttle in case shift+arrow is pressed
        getSelectedIds(function(ids, rest) {
            self.options.selected = ids;
            that.triggerEvent('select', Ox.extend({
                ids: ids
            }, rest ? {
                rest: rest
            } : {}));
            if (self.preview) {
                if (ids.length) {
                    that.triggerEvent('openpreview', {
                        ids: ids
                    });
                } else {
                    that.triggerEvent('closepreview');
                }
            }
        });
    }, true);

    function triggerToggleEvent(expanded) {
        that.triggerEvent('toggle', {
            expanded: expanded,
            ids: self.options.selected
        });
    }

    function unloadPage(page) {
        if (page < 0 || page >= self.pages) {
            return;
        }
        //Ox.Log('List', 'unloadPage', page)
        //Ox.Log('List', 'self.$pages', self.$pages)
        //Ox.Log('List', 'page not undefined', !Ox.isUndefined(self.$pages[page]))
        if (!Ox.isUndefined(self.$pages[page])) {
            self.$pages[page].remove();
            delete self.$pages[page];
        }
    }

    function unloadPages(page) {
        unloadPage(page);
        unloadPage(page - 1);
        unloadPage(page + 1)
    }

    function updateDraggable() {
        that.$content[self.options.draggable ? 'bindEvent' : 'unbindEvent']({
            dragstart: dragstart,
            drag: drag,
            dragpause: dragpause,
            dragenter: dragenter,
            dragleave: dragleave,
            dragend: dragend
        });
    }

    function updateItems() {
        clear();
        that.$content.empty();
        self.$pages = [];
        self.$pages[0] = Ox.Element()
            .addClass('OxPage')
            .css({
                left: self.listMargin / 2 + 'px',
                top: self.listMargin / 2 + 'px'
            })
            .appendTo(that.$content);
        self.listLength = self.options.items.length;
        loadItems();
    }

    function updatePages(pos, scroll) {
        // only used if orientation is both
        clear();
        self.pageLength = self.pageLengthByRowLength[self.rowLength]
        Ox.extend(self, {
            listSize: getListSize(),
            pages: Math.ceil(self.listLength / self.pageLength),
            pageWidth: (self.options.itemWidth + self.itemMargin) * self.rowLength,
            pageHeight: getPageHeight()
        });
        that.$content.css({
            height: self.listSize + 'px'
        });
        self.page = getPageByPosition(pos);
        //that.scrollTop(0);
        that.$content.empty();
        loadPages(self.page, function() {
            scrollTo(scroll);
        });
    }

    function updatePositions() {
        self.$items.forEach(function($item, pos) {
            $item.options({position: pos});
        });
    }

    function updateQuery(callback) { // fixme: shouldn't this be setQuery?
        var data;
        self.requests.push(data = self.options.items({
            query: self.options.query
        }, function(result) {
            var keys = {};
            // timeout needed since a synchronous items function
            // will reach here before one can bind to the init event,
            // and before any sizes can be determined via the DOM
            setTimeout(function() {
                clear(); // fixme: bad function name ... clear what?
                that.triggerEvent(
                    'init',
                    Ox.extend(
                        result.data,
                        data && data.query ? {query: data.query} : {}
                    )
                );
                self.rowLength = getRowLength();
                self.pageLength = self.options.orientation == 'both'
                    ? self.pageLengthByRowLength[self.rowLength]
                    : self.options.pageLength;
                Ox.extend(self, {
                    listLength: result.data.items,
                    pages: Math.max(Math.ceil(result.data.items / self.pageLength), 1),
                    pageWidth: self.options.orientation == 'vertical'
                            ? 0 : (self.options.itemWidth + self.itemMargin) * (
                                self.options.orientation == 'horizontal'
                                ? self.pageLength : self.rowLength
                            ),
                    pageHeight: self.options.orientation == 'horizontal'
                        ? 0 : Math.ceil(self.pageLength * (
                            self.options.itemHeight + self.itemMargin
                        ) / self.rowLength)
                });
                self.listSize = getListSize();
                that.$content.css(
                    self.options.orientation == 'horizontal' ? 'width' : 'height',
                    self.listSize + 'px'
                );
                getPositions(callback);
            });
        }));
    }

    function updateSelected() {
        //Ox.Log('List', 'updateSelected')
        getSelectedIds(function(oldIds) {
            var newIds = [];
            Ox.forEach(self.options.items, function(item) {
                if (Ox.contains(oldIds, item.id)) {
                    newIds.push(item.id);
                }
                if (newIds.length == oldIds.length) {
                    return false; // break
                }
            });
            setSelected(newIds);
        });
    }

    function updateSort() {
        var length = self.options.sort.length,
            operator = [],
            sort = [];
        //if (self.listLength > 1) {
            if (!self.isAsync) {
                getSelectedIds(function(selectedIds) {
                    self.options.sort.forEach(function(v, i) {
                        operator.push(v.operator);
                        sort.push({});
                        self.options.items.forEach(function(item) {
                            sort[i][item.id] = v.map
                                ? v.map(item[v.key], item)
                                : item[v.key]
                        });
                    });                        
                    self.options.items.sort(function(a, b) {
                        var aValue, bValue, index = 0, ret = 0;
                        while (ret == 0 && index < length) {
                            aValue = sort[index][a.id];
                            bValue = sort[index][b.id];
                            if (aValue < bValue) {
                                ret = operator[index] == '+' ? -1 : 1;
                            } else if (aValue > bValue) {
                                ret = operator[index] == '+' ? 1 : -1;
                            } else {
                                index++;
                            }
                        }
                        return ret;
                    });
                    if (selectedIds.length) {
                        self.selected = [];
                        self.options.items.forEach(function(item, i) {
                            if (Ox.contains(selectedIds, item.id)) {
                                self.selected.push(i);
                            }
                        });
                    }
                    loadItems();
                });
            } else {
                clear(); // fixme: bad function name
                getPositions();
            }
        //}
    }

    function updateSortable() {
        that.$content[self.options.sortable ? 'bindEvent' : 'unbindEvent']({
            dragstart: movestart,
            drag: move,
            dragend: moveend
        });
    }

    /*@
    addItems <f> add item to list
        (items) -> <u> add items at the end of the list
        (pos, items) -> <u> add items at position
        pos <n> position to add items
        items <a> array of items to add
    @*/
    that.addItems = function(pos, items) {
        if (arguments.length == 1) {
            items = pos;
            pos = self.listLength;
        }
        var $items = [],
            length = items.length;
        self.selected.forEach(function(v, i) {
            if (v >= pos) {
                self.selected[i] += length;
            }
        });
        items.forEach(function(item, i) {
            var $item;
            $items.push($item = Ox.ListItem({
                construct: self.options.construct,
                data: item,
                position: pos + i,
                unique: self.options.unique
            }));
            if (i == 0) {
                if (pos == 0) {
                    $item.insertBefore(self.$items[0]);
                } else {
                    $item.insertAfter(self.$items[pos - 1]);
                }
            } else {
                $item.insertAfter($items[i - 1]);
            }
        });
        self.options.items.splice.apply(self.options.items, [pos, 0].concat(items));
        self.$items.splice.apply(self.$items, [pos, 0].concat($items));
        self.listLength = self.options.items.length;
        //loadItems();
        updatePositions();
        emptyFirstPage();
        fillFirstPage();
    };

    /*@
    closePreview <f> to be called when preview is closed externally
        () -> <o> the list
    @*/
    that.closePreview = function() {
        self.preview = false;
        that.triggerEvent('closepreview');
        return that;
    };

    /*@
    clearCache <f> empty list cache
        () -> <o> the list
    @*/
    that.clearCache = function() { // fixme: was used by TableList resizeColumn, now probably no longer necessary
        self.$pages = [];
        return that;
    };

    that.getPasteIndex = function() {
        return self.selected.length
            ? Ox.max(self.selected) + 1
            : self.items.length;
    };

    /*@
    invertSelection <f> Invert selection
        () -> <o> The list
    @*/
    that.invertSelection = function() {
        var arr = Ox.range(self.listLength).filter(function(pos) {
            return !isSelected(pos);
        });
        setSelected(arr);
        triggerSelectEvent();
        return that;
    };

    /*@
    openPreview <f> to be called when preview is opened externally
    () -> <o> the list
    @*/
    that.openPreview = function() {
        self.preview = true;
        that.triggerEvent('openpreview', {ids: self.options.selected});
        return that;
    };

    /*@
    reloadList <f> reload list contents
        () -> <o> the list
    @*/
    that.reloadList = function(stayAtPosition) {
        var scrollTop = that.scrollTop();
        if (!self.isAsync) {
            loadItems();
            scrollList();
        } else {
            updateQuery(scrollList);
        }
        function scrollList() {
            stayAtPosition && that.scrollTop(scrollTop);
        }
        return that;
    };

    /*@
    reloadPages <f> reload list pages
        () -> <o> the list
    @*/
    that.reloadPages = function() {
        // this is called by TableList when the column layout changes
        var page, scrollLeft, scrollTop;
        if (!self.isAsync) {
            scrollLeft = that.scrollLeft();
            scrollTop = that.scrollTop();
            loadItems();
            that.scrollLeft(scrollLeft).scrollTop(scrollTop);
        } else {
            page = self.page;
            clear();
            self.page = page
            that.$content.empty();
            loadPages(self.page);
        }
        return that;
    };

    /*@
    removeItems <f> remove items from list
        (ids) -> <u> remove items
        (pos, length) -> <u> remove items
        ids <a> array of item ids
        pos <n> remove items starting at this position
        length <n> number of items to remove
    @*/
    that.removeItems = function(pos, length) {
        Ox.Log('List', 'removeItems', pos, length)
        if (Ox.isUndefined(length)) { // pos is list of ids
            pos.forEach(function(id) {
                var p = getPositionById(id);
                that.removeItems(p, 1);
            });
        } else { // remove items from pos to pos+length
            Ox.range(pos, pos + length).forEach(function(i) {
                isSelected(i) && deselect(i);
                self.$items[i].remove();
            });
            self.options.items.splice(pos, length);
            self.$items.splice(pos, length);
            self.selected.forEach(function(v, i) {
                if (v >= pos + length) {
                    self.selected[i] -= length;
                }
            });
            self.listLength = self.options.items.length;
            updatePositions();
        }
        emptyFirstPage();
        fillFirstPage();
    };

    /*@
    scrollToSelection <f> scroll list to current selection
        () -> <o> List Object
    @*/
    that.scrollToSelection = function() {
        self.selected.length && scrollToPosition(self.selected[0]);
        return that;
    };

    /*@
    selectAll <f> Select all
        () -> <o> The list
    @*/
    that.selectAll = function() {
        addToSelection(Ox.range(self.listLength));
        return that;
    };

    /*@
    selectPosition <f> select position
        (pos) -> <o> List Object
    @*/
    that.selectPosition = function(pos) {
        select(pos);
        return that;
    };

    /*@
    selectSelected <f> Change the first selected item within the selection
        (offset) -> <o> List Object
        offset <n> Offset (`-1` for previous, `1` for next)
    @*/
    that.selectSelected = function(offset) {
        var pos, positions;
        if (self.selected.length > 1) {
            positions = Ox.sort(Ox.clone(self.selected));
            pos = positions[
                Ox.mod(positions.indexOf(self.selected[0]) + offset, positions.length)
            ];
            addToSelection(pos);
            scrollToPosition(pos);
        }
        return that;
    };

    /*@
    size <f> Update list size
        () -> <o> List Object
    @*/
    that.size = function() { // fixme: not a good function name
        if (self.options.orientation == 'both') {
            var rowLength = getRowLength(),
                pageLength = self.pageLengthByRowLength[rowLength],
                pos = getScrollPosition(),
                scroll = that.scrollTop() / self.listSize;
            if (pageLength != self.pageLength) {
                self.pageLength = pageLength;
                self.rowLength = rowLength;
                updatePages(pos, scroll);
            } else if (rowLength != self.rowLength) {
                self.rowLength = rowLength;
                self.pageWidth = (self.options.itemWidth + self.itemMargin) * self.rowLength; // fixme: make function
                self.listSize = getListSize();
                self.pageHeight = getPageHeight();
                self.$pages.forEach(function($page, i) {
                    !Ox.isUndefined($page) && $page.css({
                        width: self.pageWidth + 'px',
                        top: (i * self.pageHeight + self.listMargin / 2) + 'px'
                    });
                });
                that.$content.css({
                    height: self.listSize + 'px'
                });
                scrollTo(scroll);
            }
            emptyFirstPage();
            fillFirstPage();
        } else if (self.options.type == 'text') {
            emptyFirstPage();
            fillFirstPage();
        }
        return that;
    };

    /*@
    sort <f> sort
    @*/
    // needed when a value has changed
    // but, fixme: better function name
    that.sort = function() {
        updateSort();
    };

    /*@
    sortList <f> sort list
        (key, operator) -> <f>  returns List Element
        key <s> key to sort list by
        operator <s> +/- sort ascending or descending
        map <f> function that maps values to sort values
    @*/
    // fixme: this (and others) should be deprecated,
    // one should set options instead
    that.sortList = function(key, operator, map) {
        // Ox.Log('List', 'sortList', key, operator, map)
        if (key != self.options.sort[0].key || operator != self.options.sort[0].operator) {
            self.options.sort[0] = {key: key, operator: operator, map: map};
            updateSort();
            that.triggerEvent('sort', self.options.sort[0]);
        }
        return that;
    };

    /*@
    value <f> get/set list value
        (id, {key: value, ...}) -> <f> sets value, returns List Element
        (id, key, value) -> <f> sets value, returns List Element
        (id, key) -> <a> returns value
        (id) -> <o> returns all values of id
        id <s|n> id of item (or a number, will be interpreted as position)
        key <s> key if item property
        value <*> value, can be whatever that property is
    @*/
    that.value = function() {
        var args = Ox.slice(arguments),
            id = args.shift(),
            pos = Ox.isNumber(id) ? id : getPositionById(id),
            $item = self.$items[pos],
            data = $item ? $item.options('data') : {},
            updateItems = false;
        if (arguments.length == 1) {
            return data;
        } else if (arguments.length == 2 && Ox.isString(arguments[1])) {
            return data[arguments[1]];
        } else if ($item) {
            Ox.forEach(Ox.makeObject(args), function(value, key) {
                if (key == self.options.unique) {
                    // unique id has changed
                    self.options.selected = self.options.selected.map(function(id_) {
                        return id_ == data[key] ? value : id_
                    });
                }
                if (!self.isAsync) {
                    self.options.items[pos][key] = value;
                } else if (self.items) {
                    // items array was passed to initialize the list
                    self.items[
                        Ox.getIndex(self.items, self.options.unique, id)
                    ][key] = value;
                    updateItems = true;
                }
                data[key] = value;
            });
            $item.options({data: data});
            if (updateItems) {
                self.options.items.update(self.items);
            }
            return that;
        }
    };

    return that;

};
