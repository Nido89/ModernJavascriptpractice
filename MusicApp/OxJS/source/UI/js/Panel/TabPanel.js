'use strict';

/*@
Ox.TabPanel <f> Tabbed panel
    options <o> Options
        content <o|f> Content per tab
            Either `({id1: $element1, id2: $element2}}` or `function(id) {
            return $element; })`
        size <n|24> Height of the tab bar
        tabs [o] Tabs
            id <s> Tab id
            title <s> Tab title
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.SplitPanel> Panel
        change <!> change
@*/

Ox.TabPanel = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({
            content: null,
            size: 24,
            style: 'default',
            tabs: []
        })
        .options(options || {})
        .update({
            content: function() {
                self.$panel.replaceElement(1, getContent());
            }
        });

    self.isObject = Ox.isObject(self.options.content);
    self.selected = getSelected();

    self.$bar = Ox.Bar({size: 24});

    self.$tabs = Ox.ButtonGroup({
            buttons: self.options.tabs,
            id: 'tabs',
            selectable: true,
            style: self.options.style,
            value: self.selected
        })
        .css({top: (self.options.size - 16) / 2 + 'px'})
        .bindEvent({
            change: function(data) {
                self.selected = data.value;
                self.$panel.replaceElement(1, getContent());
                that.triggerEvent('change', {selected: self.selected});
            }
        })
        .appendTo(self.$bar);

    self.$panel = Ox.SplitPanel({
            elements: [
                {
                    element: self.$bar,
                    size: self.options.size
                },
                {
                    element: getContent()
                }
            ],
            orientation: 'vertical'
        })
        .addClass('OxTabPanel');

    that.setElement(self.$panel);

    function getContent() {
        return self.isObject
            ? self.options.content[self.selected]
            : self.options.content(self.selected);
    }

    function getSelected() {
        var selected = self.options.tabs.filter(function(tab) {
            return tab.selected;
        });
        return (selected.length ? selected : self.options.tabs)[0].id;
    }

    //@ reloadPanel <f> reload panel
    that.reloadPanel = function() {
        self.$panel.replaceElement(1, getContent());
        return that;
    };

    /*@
    select <f> select
        (id) -> <o>  select panel
    @*/
    // FIXME: remove select (collides with a jquery method)
    that.select = that.selectTab = function(id) {
        if (Ox.getIndexById(self.options.tabs, id) > -1) {
            self.$tabs.options({value: id});
        }
        return that;
    };

    /*@
    selected <f> selected
        () -> <b>  return selected panel
    @*/
    that.selected = function() {
        return self.selected;
    };

    return that;

};
