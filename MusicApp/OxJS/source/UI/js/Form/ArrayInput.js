'use strict';

/*@
Ox.ArrayInput <f> Array input
    options <o> Options object
        input       <o> Optional functions for complex input elements
        label       <s> string, ''
        max         <n> integer, maximum number of items, 0 for all
        sort        <b> fixme: this should probably be removed
        value       <[]>    value
        width       <n|256> width
    self <o>    Shared private variable
    ([options[, self]]) -> <o:Ox.Element> Array input
        change <!> change
@*/

Ox.ArrayInput = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({
            input: {
                get: Ox.Input,
                getEmpty: function() {
                    return '';
                },
                isEmpty: function(value) {
                    return value === '';
                },
                setWidth: function($input, width) {
                    $input.options({width: width});
                }
            },
            label: '',
            max: 0,
            sort: false, // fixme: this should probably be removed
            value: [],
            width: 256
        })
        .options(options || {})
        .update({
            value: setValue,
            width: setWidths
        });

    self.options.value = self.options.value || [];

    if (self.options.label) {
        self.$label = Ox.Label({
            title: self.options.label,
            width: self.options.width
        })
        .appendTo(that);
    }

    self.$element = [];
    self.$input = [];
    self.$removeButton = [];
    self.$addButton = [];

    (
        self.options.value.length
        ? self.options.value
        : [self.options.input.getEmpty()]
    ).forEach(function(value, i) {
        addInput(i, value);
    });

    self.options.value = getValue();

    function addInput(index, value, focus) {
        self.$element.splice(index, 0, Ox.Element()
            .css({
                height: '16px',
                marginTop: self.options.label || index > 0 ? '8px' : 0
            })
            .data({index: index}));
        if (index == 0) {
            self.$element[index].appendTo(that);
        } else {
            self.$element[index].insertAfter(self.$element[index - 1]);
        }
        self.$input.splice(
            index, 0, self.options.input.get({
                width: self.options.width - 48
            })
            .css({float: 'left'})
            .bindEvent({
                change: function(data) {
                    if (
                        self.options.sort
                        && !self.options.input.isEmpty(data.value)
                    ) {
                        sortInputs();
                    }
                    self.options.value = getValue();
                    that.triggerEvent('change', {
                        value: self.options.value
                    });
                }
            })
            .appendTo(self.$element[index]));
        if (value) {
            self.$input[index].options({value: value})
        }
        if (focus && self.$input[index].focusInput) {
            self.$input[index].focusInput(true);
        }
        self.$removeButton.splice(index, 0, Ox.Button({
                title: self.$input.length == 1 ? 'close' : 'remove',
                type: 'image'
            })
            .css({float: 'left', marginLeft: '8px'})
            .on({
                click: function() {
                    var index = $(this).parent().data('index');
                    if (!self.options.input.isEmpty(self.$input[index])) {
                        self.$input[index].value(self.options.input.getEmpty());
                        self.options.value = getValue();
                        that.triggerEvent('change', {
                            value: self.options.value
                        });
                    }
                    if (self.$input.length == 1) {
                        if (self.$input[0].focusInput) {
                            self.$input[0].focusInput(true);
                        }
                    } else {
                        removeInput(index);
                        that.triggerEvent('remove');
                    }
                }
            })
            .appendTo(self.$element[index]));
        self.$addButton.splice(index, 0, Ox.Button({
                disabled: index == self.options.max - 1,
                title: 'add',
                type: 'image'
            })
            .css({float: 'left', marginLeft: '8px'})
            .on({
                click: function() {
                    var index = $(this).parent().data('index');
                    addInput(index + 1, self.options.input.getEmpty(), true);
                    that.triggerEvent('add');
                }
            })
            .appendTo(self.$element[index]));
        updateInputs();
    }

    function getValue() {
        return Ox.map(self.$input, function($input) {
            return $input.value();
        }).filter(function(value) {
            return !self.options.input.isEmpty(value);
        });
    };

    function removeInput(index) {
        Ox.Log('Form', 'remove', index);
        [
            'input', 'removeButton', 'addButton', 'element'
        ].forEach(function(element) {
            var key = '$' + element;
            self[key][index].remove();
            self[key].splice(index, 1);
        });
        updateInputs();
    }

    function setValue() {
        while (self.$input.length) {
            removeInput(0);
        }
        (
            self.options.value.length
            ? self.options.value
            : [self.options.input.getEmpty()]
        ).forEach(function(value, i) {
            addInput(i, value);
        });
    }

    function setWidths() {
        self.$label && self.$label.options({width: self.options.width});
        self.$element.forEach(function($element, i) {
            $element.css({width: self.options.width + 'px'});
            self.options.input.setWidth(self.$input[i], self.options.width - 48);
        });
    }

    function sortInputs() {
        Ox.sort(self.$element, function($element) {
            return self.$input[$element.data('index')].value();
        }).forEach(function($element) {
            $element.detach();
        });
        self.$element.forEach(function($element, i) {
            $element.data({index: i}).appendTo(that);
        });
    }

    function updateInputs() {
        self.$element.forEach(function($element, i) {
            $element.data({index: i});
            self.$removeButton[i].options({
                title: self.$element.length == 1 ? 'close' : 'remove'
            });
            self.$addButton[i].options({
                disabled: self.$element.length == self.options.max
            });
        });
    }

    /*@
    setErrors <f> setErrors
        (values) -> <u> set errors
    @*/
    that.setErrors = function(values) {
        self.$input.forEach(function($input) {
            $input[
                values.indexOf($input.value()) > -1 ? 'addClass' : 'removeClass'
            ]('OxError');
        });
    };

    return that;

};
