'use strict';

/*@
Ox.InputGroup <f> InputGroup Object
    options <o> Options object
        id     <s|''> id
        inputs <a|[]> inputs
        separators <a|[]> seperators
        width <n|0> width
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.Element> InputGroup Object
        change <!> change
        validate <!> validate
@*/

Ox.InputGroup = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({
            id: '',
            inputs: [],
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
        .addClass('OxInputGroup')
        .on({click: click});

    if (Ox.isEmpty(self.options.value)) {
        self.options.value = getValue();
    } else {
        setValue();
    }

    if (self.options.width) {
        setWidths();
    } else {
        self.options.width = getWidth();
    }
    that.css({
        width: self.options.width + 'px'
    });

    self.$separator = [];

    self.options.separators.forEach(function(v, i) {
        self.$separator[i] = Ox.Label({
            textAlign: 'center',
            title: v.title,
            width: v.width + 32
        })
        .addClass('OxSeparator')
        .css({
            marginLeft: (self.options.inputs[i].options('width') - (i == 0 ? 16 : 32)) + 'px'
        })
        .appendTo(that);
    });

    self.options.inputs.forEach(function($input, i) {
        $input.options({
                id: self.options.id + Ox.toTitleCase($input.options('id') || '')
            })
            .css({
                marginLeft: -Ox.sum(self.options.inputs.map(function($input, i_) {
                    return i_ > i
                        ? self.options.inputs[i_ - 1].options('width')
                            + self.options.separators[i_ - 1].width
                        : i_ == i ? 16
                        : 0;
                })) + 'px'
            })
            .bindEvent({
                change: change,
                submit: change,
                validate: validate
            })
            .appendTo(that);
    });

    function change(data) {
        self.options.value = getValue();
        that.triggerEvent('change', {
            value: self.options.value
        });
    }

    function click(event) {
        if ($(event.target).hasClass('OxSeparator')) {
            Ox.forEach(self.options.inputs, function($input) {
                if ($input.focusInput) {
                    $input.focusInput(true);
                    return false; // break
                }
            });
        }
    }

    function getValue() {
        var value = self.options.inputs.map(function($input) {
            return $input.value();
        });
        return self.options.join ? self.options.join(value) : value;
    }

    function getWidth() {
        return Ox.sum(self.options.inputs.map(function(v) {
            return v.options('width');
        })) + Ox.sum(self.options.separators.map(function(v) {
            return v.width;
        }));
    }

    function setValue() {
        var values = self.options.split
            ? self.options.split(self.options.value)
            : self.options.value;
        values.forEach(function(value, i) {
            self.options.inputs[i].value(value);
        });
    }

    function setWidths() {
        var length = self.options.inputs.length,
            inputWidths = Ox.splitInt(
                self.options.width - Ox.sum(self.options.separators.map(function(v) {
                    return v.width;
                })), length
            );
        self.options.inputs.forEach(function(v) {
            v.options({
                width: inputWidths[1] // fixme: 1?? i?
            });
        });
    }

    function validate(data) {
        that.triggerEvent('validate', data);
    }

    // fixme: is this used?
    that.getInputById = function(id) {
        var input = null;
        Ox.forEach(self.options.inputs, function(v, i) {
            if (v.options('id') == self.options.id + Ox.toTitleCase(id)) {
                input = v;
                return false; // break
            }
        });
        return input;
    };

    return that;

};
