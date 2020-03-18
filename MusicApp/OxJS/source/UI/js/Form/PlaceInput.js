'use strict';

/*@
Ox.PlaceInput <f> PlaceInput Object
    options <o> Options object
        id <s> element id
        value <s|United States> default value of place input
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.FormElementGroup> PlaceInput Object
@*/

Ox.PlaceInput = function(options, self) {

    var that;
    self = Ox.extend(self || {}, {
            options: Ox.extend({
                id: '',
                value: 'United States'
            }, options)
        });
    that = Ox.FormElementGroup({
            id: self.options.id,
            elements: [
                Ox.Input({
                    id: 'input',
                    value: self.options.value
                }),
                Ox.PlacePicker({
                    id: 'picker',
                    overlap: 'left',
                    value: self.options.value
                })
            ],
            float: 'right'
        }, self)
        .bindEvent('change', change);

    function change() {
        
    }

    return that;

};
