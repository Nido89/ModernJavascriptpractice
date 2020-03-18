'use strict';
/*@
Ox.Tabbar <f> Tabbar
    options <o> Options object
        selected <n|0>  selected item
        tabs     <a|[]> tabs
    self    <o> Shared private variable
    ([options[, self]]) -> <o:Ox.Bar> Tabbar object
@*/
Ox.Tabbar = function(options, self) {

    self = self || {};
    var that = Ox.Bar({
                size: 20
            }, self)
            .defaults({
                selected: 0,
                tabs: []
            })
            .options(options || {})
            .addClass('OxTabbar');

    Ox.ButtonGroup({
        buttons: self.options.tabs,
        group: true,
        selectable: true,
        selected: self.options.selected,
        size: 'medium',
        style: 'tab'
    }).appendTo(that);

    return that;

};
