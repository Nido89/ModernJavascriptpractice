'use strict';

/*@
Ox.FormElementGroup <f> FormElementGroup Element
    options <o> Options object
        id <s> element id
        elements <[o:Ox.Element]|[]> elements in group
        float <s|left> alignment
        separators <a|[]> separators (not implemented)
        width <n|0> group width
    self <o>    Shared private variable
    ([options[, self]]) -> <o:Ox.Element> FormElementGroup Element
        autovalidate <!> autovalidate
        change <!> change
        validate <!> validate
@*/

Ox.FormElementGroup = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
            .defaults({
                id: '',
                elements: [],
                float: 'left',
                join: null,
                separators: [],
                split: null,
                value: options.split ? '' : [],
                width: 0
            })
            .options(options || {})
            .update({
                value: setValue
            })
            .addClass('OxInputGroup');

    if (Ox.isEmpty(self.options.value)) {
        self.options.value = getValue();
    } else {
        setValue();
    }

    (
        self.options.float == 'left' ?
        self.options.elements : Ox.clone(self.options.elements).reverse()
    ).forEach(function($element) {
        $element.css({
                float: self.options.float // fixme: make this a class
            })
            .bindEvent({
                autovalidate: function(data) {
                    that.triggerEvent({autovalidate: data});
                },
                change: change,
                //submit: change,
                validate: function(data) {
                    that.triggerEvent({validate: data});
                }
            })
            .appendTo(that);
    });

    function change(data) {
        self.options.value = getValue();
        that.triggerEvent('change', {value: self.options.value});
    }

    /*
    if (self.options.width) {
        setWidths();
    } else {
        self.options.width = getWidth();
    }
    that.css({
        width: self.options.width + 'px'
    });
    */

    function getValue() {
        var value = self.options.elements.map(function($element) {
            return $element.value ? $element.value() : void 0;
        });
        return self.options.join ? self.options.join(value) : value;
    }

    function getWidth() {
        
    }

    function setValue() {
        var values = self.options.split
            ? self.options.split(self.options.value)
            : self.options.value;
        values.forEach(function(value, i) {
            self.options.elements[i].value && self.options.elements[i].value(value);
        });
    }

    function setWidth() {
        
    }

    /*@
    replaceElement <f> replaceElement
        (pos, element) -> <u> replace element at position
    @*/
    that.replaceElement = function(pos, element) {
        Ox.Log('Form', 'Ox.FormElementGroup replaceElement', pos, element)
        self.options.elements[pos].replaceWith(element.$element);
        self.options.elements[pos] = element;
    };

    /*@
    value <f> value
    @*/
    that.value = function() {
        var values;
        if (arguments.length == 0) {
            values = self.options.elements.map(function(element) {
                return element.value ? element.value() : void 0;
            });
            return self.options.join
                ? self.options.join(values)
                : values;
        } else {
            return that.options({value: arguments[0]});
            //return that;
        }
    };

    return that;

};
