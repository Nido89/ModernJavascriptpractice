'use strict';

/*@
Ox.ObjectInput <f> Object Input
    options <o> Options
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.Element> Object Input
        change <!> change
@*/
Ox.ObjectInput = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({
            elements: [],
            labelWidth: 128,
            value: {},
            width: 256
        })
        .options(options || {})
        .update({
            value: function() {
                setValue(self.options.value);
            }
        })
        .addClass('OxObjectInput')
        .css({
            width: self.options.width + 'px',
        });

    if (Ox.isEmpty(self.options.value)) {
        self.options.value = getValue();
    } else {
        setValue(self.options.value);
    }

    self.options.elements.forEach(function($element) {
        $element.options({
            labelWidth: self.options.labelWidth,
            width: self.options.width
        })
        .bindEvent({
            change: function(data) {
                self.options.value = getValue();
                that.triggerEvent('change', {
                    value: self.options.value
                });
            }
        })
        .appendTo(that);
    });

    function getValue() {
        var value = {};
        self.options.elements.forEach(function(element) {
            value[element.options('id')] = element.value();
        });
        return value;
    }

    function setValue(value) {
        self.options.elements.forEach(function(element) {
            element.value(value[element.options('id')]);
        });
    }

    return that;

};
