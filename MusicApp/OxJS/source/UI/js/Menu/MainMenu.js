'use strict';

/*@
Ox.MainMenu <f> MainMenu Object
    options <o> Options object
        extras <a|[]> extra menus
        menus <a|[]> submenus
        size <s|medium> can be small, medium, large
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.Bar> MainMenu Object
@*/

Ox.MainMenu = function(options, self) {

    self = self || {};
    var that = Ox.Bar({}, self)
            .defaults({
                extras: [],
                menus: [],
                size: 'medium'
            })
            .options(options || {})
            .addClass('OxMainMenu Ox' + Ox.toTitleCase(self.options.size)) // fixme: bar should accept small/medium/large ... like toolbar
            .on({
                click: click,
                mousemove: mousemove
            });

    self.focused = false;
    self.selected = -1;
    that.menus = [];
    that.titles = [];
    that.layer = $('<div>').addClass('OxLayer');

    self.options.menus.forEach(function(menu, position) {
        addMenu(menu, position);
    });

    if (self.options.extras.length) {
        that.extras = $('<div>')
            .addClass('OxExtras')
            .appendTo(that);
        self.options.extras.forEach(function(extra) {
            extra && extra.appendTo(that.extras);
        });
    }

    function addMenu(menu, position) {
        that.titles[position] = $('<div>')
            .addClass('OxTitle')
            .html(menu.title)
            .data({position: position});
        if (position == 0) {
            if (that.titles.length == 1) {
                that.titles[position].appendTo(that);
            } else {
                that.titles[position].insertBefore(that.titles[1]);
            }
        } else {
            that.titles[position].insertAfter(that.titles[position - 1])
        }
        that.menus[position] = Ox.Menu(Ox.extend(menu, {
                element: that.titles[position],
                mainmenu: that,
                size: self.options.size
            }))
            .bindEvent({
                hide: onHideMenu
            });
    }

    function click(event) {
        var $element = getElement(event),
            position = typeof $element.data('position') != 'undefined'
                ? $element.data('position') : -1;
        clickTitle(position);
    }

    function clickTitle(position) {
        var selected = self.selected;
        if (self.selected > -1) {
            that.menus[self.selected].hideMenu();
        }
        if (position > -1) {
            if (position != selected) {
                self.focused = true;
                self.selected = position;
                that.titles[self.selected].addClass('OxSelected');
                that.menus[self.selected].showMenu();
            }
        }
    }

    function getElement(event) {
        var $element = $(event.target);
        return $element.is('img') ? $element.parent() : $element;
    }

    function mousemove(event) {
        var $element = getElement(event),
            focused,
            position = typeof $element.data('position') != 'undefined'
                ? $element.data('position') : -1;
        if (self.focused && position != self.selected) {
            if (position > -1) {
                clickTitle(position);
            } else {
                focused = self.focused;
                that.menus[self.selected].hideMenu();
                self.focused = focused;
            }
        }
    }

    function onHideMenu() {
        if (self.selected > -1) {
            that.titles[self.selected].removeClass('OxSelected');
            self.selected = -1;
        }
        self.focused = false;
    }

    function removeMenu(position) {
        that.titles[position].remove();
        that.menus[position].remove();
    }

    that.addMenuAfter = function(id) {
        
    };

    that.addMenuBefore = function(id) {
        
    };

    /*@
    checkItem <f> checkItem
    @*/
    that.checkItem = function(id) {
        var ids = id.split('_'),
            item = that.getItem(id);
        if (item) {
            if (item.options('group')) {
                item.options('menu').checkItem(ids[ids.length - 1]);
            } else {
                item.options({checked: true});
            }
        }
        return that;
    };

    /*@
    disableItem <f> disableItem
    @*/
    that.disableItem = function(id) {
        var item = that.getItem(id);
        item && item.options({disabled: true});
        return that;
    };

    /*@
    enableItem <f> enableItem
    @*/
    that.enableItem = function(id) {
        var item = that.getItem(id);
        item && item.options({disabled: false});
        return that;
    };

    /*@
    getItem <f> getItem
    @*/
    that.getItem = function(id) {
        var ids = id.split('_'),
            item;
        if (ids.length == 1) {
            Ox.forEach(that.menus, function(menu) {
                item = menu.getItem(id);
                if (item) {
                    return false; // break
                }
            });
        } else {
            item = that.getMenu(ids.shift()).getItem(ids.join('_'));
        }
        Ox.Log('Menu', 'getItem', id, item);
        return item;
    };

    /*@
    getMenu <f> getMenu
    @*/
    that.getMenu = function(id) {
        var ids = id.split('_'),
            menu;
        if (ids.length == 1) {
            Ox.forEach(that.menus, function(v) {
                if (v.options('id') == id) {
                    menu = v;
                    return false; // break
                }
            });
        } else {
            menu = that.getMenu(ids.shift()).getSubmenu(ids.join('_'));
        }
        return menu;
    };

    that.highlightMenu = function(id) {
        var position = Ox.getIndexById(self.options.menus, id);
        self.highlightTimeout && clearTimeout(self.highlightTimeout);
        that.titles[position].addClass('OxHighlight');
        self.highlightTimeout = setTimeout(function() {
            that.titles[position].removeClass('OxHighlight');
            delete self.highlightTimeout;
        }, 500);
    };

    that.isSelected = function() {
        return self.selected > -1;
    };

    that.removeMenu = function() {
        
    };

    /*@
    replaceMenu <f> replace menu 
        (id, menu) -> <u>  replace menu
    @*/
    that.replaceMenu = function(id, menu) {
        var position = Ox.getIndexById(self.options.menus, id);
        self.options.menus[position] = menu;
        removeMenu(position);
        addMenu(menu, position);
    };

    /*@
    selectNextMenu <f> selectNextMenu
    @*/
    that.selectNextMenu = function() {
        if (self.selected < self.options.menus.length - 1) {
            clickTitle(self.selected + 1);
        }
        return that;
    };

    /*@
    selectPreviousMenu <f> selectPreviousMenu
    @*/
    that.selectPreviousMenu = function() {
        if (self.selected) {
            clickTitle(self.selected - 1);
        }
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
    uncheckItem <f> uncheckItem
    @*/
    that.uncheckItem = function(id) {
        var item = that.getItem(id);
        item && item.options({checked: false});
        return that;
    };

    return that;

};
