'use strict';

/*@
Ox.ListItem <f> ListItem Object
    options <o> Options object
        construct <f> construct function
        data <o|{}> item data
        draggable <b|false> can be dragged
        position <n|0> item position
        unique <s|''> unique key
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.Element> ListItem Object
        cancel <!> triggered if cancel button is pressed
        save <!> triggered if save button is pressed
@*/

Ox.ListItem = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({
            construct: null,
            data: {},
            draggable: false,
            position: 0,
            unique: ''
        })
        .options(options || {})
        .update({
            data: function() {
                if (!that.find('.OxEdit').length) {
                    constructItem(true);
                }
            },
            position: function() {
                that.data({position: self.options.position});
            }
        });

    constructItem();

    function constructItem(update) {
        var $element = self.options.construct(self.options.data)
            .addClass('OxItem')
            .data({
                id: self.options.data[self.options.unique],
                position: self.options.position
            });
        if (update) {
            that.hasClass('OxSelected') && $element.addClass('OxSelected');
        }
        that.setElement($element);
    }

    return that;

};
