'use strict';

/*@
Ox.ObjectArrayInput <f> Object Array Input
    options <o> Options
        buttonTitles
        inputs
        labelWidth
        max
        value
        width
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.Element> Object Array Input
        change <!> change
@*/
Ox.ObjectArrayInput = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({
            buttonTitles: {add: Ox._('Add'), remove: Ox._('Remove')},
            inputs: [],
            labelWidth: 128,
            max: 0,
            value: [],
            width: 256
        })
        .options(options || {})
        .update({
            value: function() {
                setValue(self.options.value);
            }
        })
        .addClass('OxObjectArrayInput');

    if (Ox.isEmpty(self.options.value)) {
        self.options.value = [getDefaultValue()];
    }

    self.$element = [];
    self.$input = [];
    self.$removeButton = [];
    self.$addButton = [];
    self.buttonWidth = self.options.width / 2 - 4;

    setValue(self.options.value);

    function addInput(index, value) {
        self.$element.splice(index, 0, Ox.Element()
            .css({
                width: self.options.width + 'px',
            })
        );
        if (index == 0) {
            self.$element[index].appendTo(that);
        } else {
            self.$element[index].insertAfter(self.$element[index - 1]);
        }
        self.$input.splice(index, 0, Ox.ObjectInput({
                elements: self.options.inputs.map(function(input) {
                    return Ox[input.element](input.options || {})
                        .bindEvent(input.events || {});
                }),
                labelWidth: self.options.labelWidth,
                value: value,
                width: self.options.width
            })
            .bindEvent({
                change: function(data) {
                    var index = $(this).parent().data('index');
                    self.options.value[index] = self.$input[index].value();
                    that.triggerEvent('change', {
                        value: self.options.value
                    });
                }
            })
            .appendTo(self.$element[index])
        );
        self.$removeButton.splice(index, 0, Ox.Button({
                disabled: self.$input.length == 1,
                title: self.options.buttonTitles.remove,
                width: self.buttonWidth
            })
            .css({margin: '8px 4px 0 0'})
            .on({
                click: function() {
                    var index = $(this).parent().data('index');
                    if (self.$input.length > 1) {
                        removeInput(index);
                        self.options.value = getValue();
                        that.triggerEvent('change', {
                            value: self.options.value
                        });
                    }
                }
            })
            .appendTo(self.$element[index])
        );
        self.$addButton.splice(index, 0, Ox.Button({
                disabled: index == self.options.max - 1,
                title: self.options.buttonTitles.add,
                width: self.buttonWidth
            })
            .css({margin: '8px 0 0 4px'})
            .on({
                click: function() {
                    var index = $(this).parent().data('index');
                    addInput(index + 1, getDefaultValue());
                    self.options.value = getValue();
                    that.triggerEvent('change', {
                        value: self.options.value
                    });
                }
            })
            .appendTo(self.$element[index])
        );
        updateInputs();
    }

    function getDefaultValue() {
        var value = {};
        self.options.inputs.forEach(function(input) {
            value[input.options.id] = '';
        });
        return value;
    }

    function getValue() {
        return self.$input.map(function($input) {
            return $input.value();
        });
    }

    function removeInput(index) {
        [
            'input', 'removeButton', 'addButton', 'element'
        ].forEach(function(element) {
            var key = '$' + element;
            self[key][index].remove();
            self[key].splice(index, 1);
        });
        updateInputs();
    }

    function setValue(value) {
        while (self.$element.length) {
            removeInput(0);
        }
        value.forEach(function(value, i) {
            addInput(i, value);
        });
    }

    function updateInputs() {
        var length = self.$element.length;
        self.$element.forEach(function($element, i) {
            $element
                [i == 0 ? 'addClass' : 'removeClass']('OxFirst')
                [i == length - 1 ? 'addClass' : 'removeClass']('OxLast')
                .data({index: i});
            self.$removeButton[i].options({
                disabled: length == 1
            });
            self.$addButton[i].options({
                disabled: length == self.options.max
            });
        });
    }

    return that;

};
