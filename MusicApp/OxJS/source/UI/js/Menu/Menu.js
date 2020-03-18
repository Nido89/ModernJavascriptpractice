'use strict';

/*@
Ox.Menu <f> Menu Object
    options <o> Options object
        edge     <s>       open to 'bottom' or 'right'
        element  <o>         the element the menu is attached to
        id       <s>        the menu id
        items    <a>        array of menu items
        mainmenu <o>       the main menu this menu is part of, if any
        offset   <o>       offset of the menu, in px
            left <n>   left
            top  <n>   top
        parent   <o>          the supermenu, if any
        selected <b>       the position of the selected item
        size     <s>       'large', 'medium' or 'small'
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.Element> Menu Object
        change_groupId  <!>  {id, value}     checked item of a group has changed
        click_itemId    <!>                    item not belonging to a group was clicked
        click_menuId    <!>    {id, value}     item not belonging to a group was clicked
        deselect_menuId <!> {id, value}     item was deselected                             not needed, not implemented
        hide_menuId     <!>                     menu was hidden
        select_menuId   <!>   {id, value}     item was selected
        click <!> click
        change <!> change
        select <!> select
        deselect <!> deselect
@*/

Ox.Menu = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({
            edge: 'bottom',
            element: null,
            id: '',
            items: [],
            mainmenu: null,
            maxWidth: 0,
            offset: {
                left: 0,
                top: 0
            },
            parent: null,
            selected: -1,
            size: 'medium' // fixme: remove
        })
        .options(options || {})
        .update({
            items: function() {
                renderItems(self.options.items);
            },
            selected: function() {
                that.$content.find('.OxSelected').removeClass('OxSelected');
                selectItem(self.options.selected);
            }
        })
        .addClass(
            'OxMenu Ox' + Ox.toTitleCase(self.options.edge) +
            ' Ox' + Ox.toTitleCase(self.options.size)
        )
        .on({
            mouseenter: mouseenter,
            mouseleave: mouseleave,
            mousemove: mousemove,
            mouseup: mouseup,
            mousewheel: mousewheel
        })
        .bindEvent({
            key_up: selectPreviousItem,
            key_down: selectNextItem,
            key_left: selectSupermenu,
            key_right: selectSubmenu,
            key_escape: hideMenu,
            key_enter: clickSelectedItem
        });

    self.itemHeight = self.options.size == 'small'
        ? 12 : self.options.size == 'medium' ? 16 : 20;
    self.scrollSpeed = 1;

    // render
    that.items = [];
    that.submenus = {};
    that.$scrollbars = [];
    that.$top = $('<div>')
        .addClass('OxTop')
        .appendTo(that);
    that.$scrollbars.up = renderScrollbar('up')
        .appendTo(that);
    that.$container = $('<div>')
        .addClass('OxContainer')
        .appendTo(that);
    that.$content = $('<table>')
        .addClass('OxContent')
        .appendTo(that.$container);
    renderItems(self.options.items);
    that.$scrollbars.down = renderScrollbar('down')
        .appendTo(that);
    that.$bottom = $('<div>')
        .addClass('OxBottom')
        .appendTo(that);

    function clickItem(position, files) {
        var item = that.items[position],
            group = item.options('group'),
            menu = self.options.mainmenu || self.options.parent || that,
            offset,
            toggled;
        that.hideMenu();
        if (!item.options('items').length) {
            if (self.options.parent) {
                self.options.parent.hideMenu(true).triggerEvent('click', Ox.extend({
                    id: item.options('id'),
                    title: parseTitle(item.options('title')[0])
                }, files ? {files: files} : {}));
            }
            if (item.options('checked') !== null) {
                if (group) {
                    offset = self.optionGroupOffset[group];
                    toggled = self.optionGroup[group].toggle(position - offset);
                    if (toggled.length) {
                        toggled.forEach(function(pos) {
                            that.items[pos + offset].toggleChecked();
                        });
                        menu.triggerEvent('change', {
                            id: item.options('group'),
                            checked: self.optionGroup[group].checked().map(function(pos) {
                                return {
                                    id: that.items[pos + offset].options('id'),
                                    title: Ox.isString(that.items[pos + offset].options('title')[0])
                                        ? parseTitle(that.items[pos + offset].options('title')[0]) : ''
                                };
                            })
                        });
                    }
                } else {
                    item.toggleChecked();
                    menu.triggerEvent('change', {
                        checked: item.options('checked'),
                        id: item.options('id'),
                        title: Ox.isString(item.options('title')[0])
                            ? parseTitle(item.options('title')[0]) : ''
                    });
                }
            } else {
                // if item.options.files && !files, the click happened outside
                // the title - as a workaround, we don't trigger a click event.
                if (!item.options('file') || files) {
                    menu.triggerEvent('click', Ox.extend({
                        id: item.options('id'),
                        title: parseTitle(item.options('title')[0])
                    }, files ? {files: files} : {}));
                }
            }
            if (item.options('title').length == 2) {
                item.toggleTitle();
            }
        }
    }

    function clickLayer() {
        that.hideMenu();
    }

    function clickSelectedItem() {
        // called on key.enter
        if (self.options.selected > -1) {
            clickItem(self.options.selected);
        }
    }

    function getElement(id) {
        // fixme: needed?
        return $('#' + Ox.toCamelCase(options.id + '/' + id));
    }

    function getItemPositionById(id) {
        // fixme: this exists in ox.js by now
        var position;
        Ox.forEach(that.items, function(item, i) {
            if (item.options('id') == id) {
                position = i;
                return false; // break
            }
        });
        return position;
    }

    function hideMenu() {
        // called on key.escape
        that.hideMenu();
    }

    function isFirstEnabledItem() {
        var ret = true;
        Ox.forEach(that.items, function(item, i) {
            if (i < self.options.selected && !item.options('disabled')) {
                ret = false;
                return false; // break
            }
        });
        return ret;
    }

    function isLastEnabledItem() {
        var ret = true;
        Ox.forEach(that.items, function(item, i) {
            if (i > self.options.selected && !item.options('disabled')) {
                ret = false;
                return false; // break
            }
        });
        return ret;
    }

    function mouseenter() {
        that.gainFocus();
    }

    function mouseleave() {
        if (
            self.options.selected > -1
            && !that.items[self.options.selected].options('items').length
        ) {
            selectItem(-1);
        }
    }

    function mousemove(event) {
        var item,
            position,
            $target = $(event.target),
            $parent = $target.parent(),
            $grandparent = $parent.parent();
        if ($parent.is('.OxCell')) {
            $target = $parent;
            $parent = $target.parent();
        } else if ($grandparent.is('.OxCell')) {
            $target = $grandparent;
            $parent = $target.parent();
        }
        if ($target.is('.OxCell')) {
            position = $parent.data('position');
            item = that.items[position];
            if (position != self.options.selected) {
                if (!item.options('disabled')) {
                    selectItem(position);
                } else {
                    mouseleave();
                }
            }
        } else {
            mouseleave();
        }
    }

    function mouseup(event) {
        var item,
            position,
            $target = $(event.target),
            $parent = $target.parent();
        // necessary for highlight
        if ($parent.is('.OxCell')) {
            $target = $parent;
            $parent = $target.parent();
        }
        if ($target.is('.OxCell')) {
            position = $parent.data('position');
            item = that.items[position];
            if (!item.options('disabled')) {
                clickItem(position);
            } else {
                that.hideMenu();
            }
        } else {
            that.hideMenu();
        }
    }

    function mousewheel(e, delta, deltaX, deltaY) {
        var $scrollbar;
        if (deltaY && !$(e.target).is('.OxScrollbar')) {
            $scrollbar = that.$scrollbars[deltaY < 0 ? 'down' : 'up'];
            Ox.loop(0, Math.abs(deltaY), function() {
                if ($scrollbar.is(':visible')) {
                    $scrollbar.trigger('mouseenter').trigger('mouseleave');
                }
            });
        }
    }

    function parseTitle(title) {
        return Ox.decodeHTMLEntities(Ox.stripTags(title));
    }

    function renderItems(items) {

        var offset = 0;

        that.$content.empty();
        scrollMenuUp();

        self.optionGroup = {};
        self.optionGroupOffset = {};
        items.forEach(function(item, i) {
            if (item.group) {
                items[i] = item.items.map(function(v) {
                    return Ox.extend(v, {
                        group: item.group
                    });
                });
                self.optionGroup[item.group] = new Ox.OptionGroup(
                    items[i].filter(function(v) {
                        return 'id' in v;
                    }),
                    'min' in item ? item.min : 1,
                    'max' in item ? item.max : 1
                );
                self.optionGroupOffset[item.group] = offset;
                offset += items[i].length;
            } else if ('id' in item) {
                offset += 1;
            }
        });
        items = Ox.flatten(items);

        that.items = [];
        items.forEach(function(item) {
            var position;
            if ('id' in item) {
                position = that.items.length;
                that.items.push(
                    Ox.MenuItem(Ox.extend(Ox.clone(item), {
                        maxWidth: self.options.maxWidth,
                        menu: that,
                        position: position
                    }))
                    .data('position', position)
                    // fixme: jquery bug when passing {position: position}? does not return the object?
                    .appendTo(that.$content)
                );
                if (item.items) {
                    that.submenus[item.id] = Ox.Menu({
                        edge: 'right',
                        element: that.items[position],
                        id: Ox.toCamelCase(self.options.id + '/' + item.id),
                        items: item.items,
                        mainmenu: self.options.mainmenu,
                        offset: {left: 0, top: -4},
                        parent: that,
                        size: self.options.size
                    });
                }
            } else {
                that.$content.append(renderSpace());
                that.$content.append(renderLine());
                that.$content.append(renderSpace());
            }
        });

        if (!that.is(':hidden')) {
            that.hideMenu();
            that.showMenu();
        }

    }

    function renderLine() {
        return $('<tr>').append(
            $('<td>').addClass('OxLine').attr({colspan: 5})
        );
    }

    function renderScrollbar(direction) {
        var interval,
            speed = direction == 'up' ? -1 : 1;
        return $('<div/>', {
            'class': 'OxScrollbar Ox' + Ox.toTitleCase(direction),
            html: Ox.SYMBOLS['triangle_' + direction],
            mousedown: function() {
                self.scrollSpeed = 2;
                return false;
            },
            mouseenter: function() {
                self.scrollSpeed = 1;
                var $otherScrollbar = that.$scrollbars[direction == 'up' ? 'down' : 'up'];
                $(this).addClass('OxSelected');
                if ($otherScrollbar.is(':hidden')) {
                    $otherScrollbar.show();
                    that.$container.height(that.$container.height() - self.itemHeight);
                    if (direction == 'down') {
                        that.$content.css({
                            top: -self.itemHeight + 'px'
                        });
                    }
                }
                scrollMenu(speed);
                interval = setInterval(function() {
                    scrollMenu(speed);
                }, 100);
            },
            mouseleave: function() {
                self.scrollSpeed = 1;
                $(this).removeClass('OxSelected');
                clearInterval(interval);
            },
            mouseup: function() {
                self.scrollSpeed = 1;
                return false;
            }
        });
    }

    function renderSpace() {
        return $('<tr>').append(
            $('<td>').addClass('OxSpace').attr({colspan: 5})
        );
    }

    function scrollMenu(speed) {
        var containerHeight = that.$container.height(),
            contentHeight = that.$content.height(),
            top = parseInt(that.$content.css('top'), 10) || 0,
            min = containerHeight - contentHeight + self.itemHeight,
            max = 0;
        top += speed * self.scrollSpeed * -self.itemHeight;
        if (top <= min) {
            top = min;
            that.$scrollbars.down.hide().trigger('mouseleave');
            that.$container.height(containerHeight + self.itemHeight);
            that.items[that.items.length - 1].trigger('mouseover');
        } else if (top >= max - self.itemHeight) {
            top = max;
            that.$scrollbars.up.hide().trigger('mouseleave');
            that.$container.height(containerHeight + self.itemHeight);
            that.items[0].trigger('mouseover');
        }
        that.$content.css({
            top: top + 'px'
        });
    }

    function scrollMenuUp() {
        if (that.$scrollbars.up.is(':visible')) {
            that.$content.css({
                top: '0px'
            });
            that.$scrollbars.up.hide();
            if (that.$scrollbars.down.is(':hidden')) {
                that.$scrollbars.down.show();
            } else {
                that.$container.height(that.$container.height() + self.itemHeight);
            }
        }
    }

    function selectItem(position) {
        var item;
        if (self.options.selected > -1) {
            item = that.items[self.options.selected];
            if (item) {
                item.removeClass('OxSelected');
                if (item.options('file')) {
                    item.$button.blurButton();
                    that.bindEvent({key_enter: clickSelectedItem})
                }
            }
            /* disabled
            that.triggerEvent('deselect', {
                id: item.options('id'),
                title: Ox.parseTitle(item.options('title')[0])
            });
            */
        }
        if (position > -1) {
            item = that.items[position];
            Ox.forEach(that.submenus, function(submenu, id) {
                if (!submenu.is(':hidden')) {
                    submenu.hideMenu();
                    return false; // break
                }
            });
            item.options('items').length && that.submenus[item.options('id')].showMenu();
            item.addClass('OxSelected');
            if (item.options('file')) {
                item.$button.focusButton();
                that.unbindEvent('key_enter');
            }
            that.triggerEvent('select', {
                id: item.options('id'),
                title: Ox.isString(item.options('title')[0])
                    ? parseTitle(item.options('title')[0]) : ''
            });
        }
        self.options.selected = position;
    }

    function selectNextItem() {
        var offset,
            selected = self.options.selected;
        //Ox.Log('Menu', 'sNI', selected)
        if (!isLastEnabledItem()) {
            if (selected == -1) {
                scrollMenuUp();
            } else {
                that.items[selected].removeClass('OxSelected');
            }
            do {
                selected++;
            } while (that.items[selected].options('disabled'))
            selectItem(selected);
            offset = that.items[selected].offset().top + self.itemHeight -
                    that.$container.offset().top - that.$container.height();
            if (offset > 0) {
                if (that.$scrollbars.up.is(':hidden')) {
                    that.$scrollbars.up.show();
                    that.$container.height(that.$container.height() - self.itemHeight);
                    offset += self.itemHeight;
                }
                if (selected == that.items.length - 1) {
                    that.$scrollbars.down.hide();
                    that.$container.height(that.$container.height() + self.itemHeight);
                } else {
                    that.$content.css({
                        top: ((parseInt(that.$content.css('top'), 10) || 0) - offset) + 'px'
                    });
                }
            }
        }
    }

    function selectPreviousItem() {
        var offset,
            selected = self.options.selected;
        //Ox.Log('Menu', 'sPI', selected)
        if (selected > - 1) {
            if (!isFirstEnabledItem()) {
                that.items[selected].removeClass('OxSelected');
                do {
                    selected--;
                } while (that.items[selected].options('disabled'))
                selectItem(selected);
            }
            offset = that.items[selected].offset().top - that.$container.offset().top;
            if (offset < 0) {
                if (that.$scrollbars.down.is(':hidden')) {
                    that.$scrollbars.down.show();
                    that.$container.height(that.$container.height() - self.itemHeight);
                }
                if (selected == 0) {
                    that.$scrollbars.up.hide();
                    that.$container.height(that.$container.height() + self.itemHeight);
                }
                that.$content.css({
                    top: ((parseInt(that.$content.css('top'), 10) || 0) - offset) + 'px'
                });
            }
        }
    }

    function selectSubmenu() {
        //Ox.Log('Menu', 'selectSubmenu', self.options.selected)
        if (self.options.selected > -1) {
            var submenu = that.submenus[that.items[self.options.selected].options('id')];
            //Ox.Log('Menu', 'submenu', submenu, that.submenus);
            if (submenu && submenu.hasEnabledItems()) {
                submenu.gainFocus();
                submenu.selectFirstItem();
            } else if (self.options.mainmenu) {
                self.options.mainmenu.selectNextMenu();
            }
        } else if (self.options.mainmenu) {
            self.options.mainmenu.selectNextMenu();
        }
    }

    function selectSupermenu() {
        //Ox.Log('Menu', 'selectSupermenu', self.options.selected)
        if (self.options.parent) {
            self.options.selected > -1 && that.items[self.options.selected].trigger('mouseleave');
            scrollMenuUp();
            self.options.parent.gainFocus();
        } else if (self.options.mainmenu) {
            self.options.mainmenu.selectPreviousMenu();
        }
    }

    function setCSS() {
        var offset = self.options.element.offset(),
            width = self.options.element.outerWidth(),
            height = self.options.element.outerHeight(),
            menuWidth = that.width(),
            windowWidth = Ox.$window.width(),
            windowHeight = Ox.$window.height(),
            left = offset.left + self.options.offset.left + (self.options.edge == 'bottom' ? 0 : width),
            top = offset.top + self.options.offset.top + (self.options.edge == 'bottom' ? height : 0),
            menuHeight = that.$content.outerHeight(), // fixme: why is outerHeight 0 when hidden?
            menuMaxHeight = Math.floor(Ox.$window.height() - top - 16);
        if (self.options.edge == 'bottom' && left + menuWidth > windowWidth) {
            left = offset.left + width - menuWidth;
            that.is('.OxRight') && that.removeClass('OxRight') && that.addClass('OxLeft');
        }
        if (self.options.parent) {
            if (menuHeight > menuMaxHeight) {
                top = Ox.limit(top - menuHeight + menuMaxHeight, self.options.parent.offset().top, top);
                menuMaxHeight = Math.floor(windowHeight - top - 16);
            }
        }
        that.css({
            left: left + 'px',
            top: top + 'px'
        });
        if (menuHeight > menuMaxHeight) {
            that.$container.height(menuMaxHeight - self.itemHeight - 8); // margin
            that.$scrollbars.down.show();
        } else {
            that.$container.height(menuHeight);
        }
    }

    /*@
    addItem <f>
    @*/
    that.addItem = function(item, position) {

    };

    /*@
    addItemAfter <f>
    @*/
    that.addItemAfter = function(item, id) {

    };

    /*@
    addItemBefore <f> addItemBefore
    @*/
    that.addItemBefore = function(item, id) {

    };

    /*@
    checkItem <f> checkItem
        (id, checked) -> <u> check item, checked can be undefined/true or false
    @*/
    that.checkItem = function(id, checked) {
        Ox.Log('Menu', 'checkItem id', id)
        var group,
            ids = Ox.isEmpty(that.submenus) ? [id] : id.split('_'),
            item,
            offset,
            position,
            toggled;
        checked = Ox.isUndefined(checked) ? true : checked;
        if (ids.length == 1) {
            item = that.getItem(id);
            group = item.options('group');
            if (group) {
                offset = self.optionGroupOffset[group];
                position = getItemPositionById(id);
                if (item.options('checked') != checked) {
                    toggled = self.optionGroup[item.options('group')].toggle(position - offset);
                    if (toggled.length) {
                        toggled.forEach(function(pos) {
                            that.items[pos + offset].toggleChecked();
                        });
                    }
                }
            } else {
                item.options({checked: checked});
            }
        } else {
            that.submenus[ids.shift()].checkItem(ids.join('_'), checked);
        }
        return that;
    };

    /*@
    clickItem <f> clickItem
        (position, files) -> <o> click item at position
    @*/
    that.clickItem = function(position, files) {
        clickItem(position, files);
        return that;
    };

    /*@
    getItem <f> getItem
        (id) -> <o> get item
    @*/
    that.getItem = function(id) {
        //Ox.Log('Menu', 'getItem id', id)
        var ids = Ox.isEmpty(that.submenus) ? [id] : id.split('_'),
            item;
        if (ids.length == 1) {
            Ox.forEach(that.items, function(v) {
                if (v.options('id') == id) {
                    item = v;
                    return false; // break
                }
            });
            if (!item) {
                Ox.forEach(that.submenus, function(submenu) {
                    item = submenu.getItem(id);
                    if (item) {
                        return false; // break
                    }
                });
            }
        } else {
            item = that.submenus[ids.shift()].getItem(ids.join('_'));
        }
        return item;
    };

    /*@
    getSubmenu <f> getSubmenu
        (id) -> <o> get submenu by id
    @*/
    that.getSubmenu = function(id) {
        var ids = id.split('_'),
            submenu;
        if (ids.length == 1) {
            submenu = that.submenus[id];
        } else {
            submenu = that.submenus[ids.shift()].getSubmenu(ids.join('_'));
        }
        //Ox.Log('Menu', 'getSubmenu', id, submenu);
        return submenu;
    }

    /*@
    hasEnabledItems <f> hasEditableItems
        () -> <b> menu has editable items
    @*/
    that.hasEnabledItems = function() {
        var ret = false;
        Ox.forEach(that.items, function(item) {
            if (!item.options('disabled')) {
                ret = true;
                return false; // break
            }
        });
        return ret;
    };

    /*@
    hideMenu <f> hideMenu
        () -> <f> Menu Object
    @*/
    that.hideMenu = function(hideParent) {
        if (that.is(':hidden')) {
            return;
        }
        Ox.forEach(that.submenus, function(submenu) {
            if (submenu.is(':visible')) {
                submenu.hideMenu();
                return false; // break
            }
        });
        selectItem(-1);
        scrollMenuUp();
        that.$scrollbars.up.is(':visible') && that.$scrollbars.up.hide();
        that.$scrollbars.down.is(':visible') && that.$scrollbars.down.hide();
        if (self.options.parent) {
            //self.options.element.removeClass('OxSelected');
            self.options.parent.options({
                selected: -1
            });
            hideParent && self.options.parent.hideMenu(true);
        }
        that.$layer && that.$layer.hide();
        that.hide().loseFocus().triggerEvent('hide');
        return that;
    };

    /*@
    removeElement <f> removeElement
    @*/
    that.removeElement = function() {
        Ox.forEach(that.submenus, function(submenu) {
            submenu.remove();
        });
        return Ox.Element.prototype.removeElement.apply(that, arguments);
    };

    /*@
    removeItem <f> removeItem
    @*/
    that.removeItem = function() {

    };

    /*@
    selectFirstItem <f> selectFirstItem
    @*/
    that.selectFirstItem = function() {
        selectNextItem();
        return that;
    };

    that.setItemKeyboard = function(id, keyboard) {
        var item = that.getItem(id);
        item && item.options({keyboard: keyboard});
        return that;
    };

    /*@
    setItemTitle <f> setItemTitle
        (id, title) -> <o>  set item title
    @*/
    that.setItemTitle = function(id, title) {
        var item = that.getItem(id);
        item && item.options({title: title});
        return that;
    };

    /*@
    showMenu <f> showMenu
        () -> <f> Menu Object
    @*/
    that.showMenu = function() {
        if (!that.is(':hidden')) {
            return;
        }
        that.appendTo(Ox.Fullscreen.element ? Ox.Fullscreen.element : Ox.$body);
        that.css({
            position: 'fixed',
            left: '-1000px',
            top: '-1000px'
        }).show();
        setCSS();
        if (!self.options.parent) {
            that.gainFocus();
            that.$layer = Ox.Layer({type: 'menu'})
                .css({top: self.options.mainmenu ? '20px' : 0})
                .on({mouseup: clickLayer})
                .show();
        }
        return that;
        //that.triggerEvent('show');
    };

    /*@
    toggleMenu <f> toggleMenu
    @*/
    that.toggleMenu = function() {
        return that.is(':hidden') ? that.showMenu() : that.hideMenu();
    };

    /*@
    uncheckItem <f> uncheckItem
        (id) -> <o>  uncheck item
    @*/
    that.uncheckItem = function(id) {
        that.checkItem(id, false);
        return that;
    };

    that.updatePosition = function() {
        setCSS();
        return that;
    };

    return that;

};
