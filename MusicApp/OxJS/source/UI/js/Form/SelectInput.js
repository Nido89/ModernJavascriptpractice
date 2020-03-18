'use strict';
//FIXME: does not work without options
/*@
Ox.SelectInput <f> Select Input
    options <o> Options
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.FormElementGroup> Select Input
@*/
Ox.SelectInput = function(options, self) {

    var that;
    self = Ox.extend(self || {}, {
        options: Ox.extend({
            inputValue: '',
            inputWidth: 128,
            items: [],
            label: '',
            labelWidth: 128,
            max: 1,
            min: 0,
            placeholder: '',
            style: 'rounded',
            title: '',
            value: options.max == 1 || options.max == void 0 ? '' : [],
            width: 384
        }, options || {})
    });

    self.other = self.options.items[self.options.items.length - 1].id;
    self.otherWidth = self.options.width - self.options.inputWidth;

    self.$select = Ox.Select({
            items: self.options.items,
            label: self.options.label,
            labelWidth: self.options.labelWidth,
            max: self.options.max,
            min: self.options.min,
            style: self.options.style, 
            title: getTitle(),
            value: self.options.value,
            width: self.options.width
        })
        .bindEvent({
            change: function(data) {
                self.options.value = getValue();
                setValue(self.isOther);
            }
        });

    self.$input = Ox.Input({
            placeholder: self.options.placeholder,
            style: self.options.style, 
            width: self.options.inputWidth,
            value: self.options.inputValue
        })
        .bindEvent({
            change: function(data) {
                self.options.value = data.value;
            }
        })
        .hide();

    setValue();

    that = Ox.FormElementGroup({
            elements: [
                self.$select,
                self.$input
            ],
            id: self.options.id,
            join: function(value) {
                return value[value[0] == self.other ? 1 : 0]
            },
            split: function(value) {
                return Ox.filter(self.options.items, function(item, i) {
                    return i < item.length - 1;
                }).map(function(item) {
                    return item.id;
                }).indexOf(value) > -1 ? [value, ''] : [self.other, value];
            },
            width: self.options.width
        })
        .update({
            label: function() {
                self.$select.options({label: self.options.label});
            },
            value: function() {
                self.options.value = that.options('value');
                setValue();
            }
        });

    function getTitle() {
        var value = self.$select ? self.$select.value() : self.options.value;
        return Ox.isEmpty(value)
            ? self.options.title
            : Ox.getObjectById(self.options.items, value).title;
    }

    function getValue() {
        self.isOther = self.$select.value() == self.other;
        return !self.isOther ? self.$select.value() : self.$input.value();
    }

    function setValue(isOther) {
        if (
            (!self.options.value && isOther !== true)
            || Ox.filter(self.options.items, function(item) {
                return item.id != self.other;
            }).map(function(item) {
                return item.id;
            }).indexOf(self.options.value) > -1
        ) {
            self.$select.options({
                    title: !self.options.value
                        ? self.options.title
                        : Ox.getObjectById(self.options.items, self.options.value).title,
                    value: self.options.value,
                    width: self.options.width
                })
                .removeClass('OxOverlapRight');
            self.$input.hide();
        } else {
            self.$select.options({
                    title: Ox.getObjectById(self.options.items, self.other).title,
                    value: self.other,
                    width: self.otherWidth
                })
                .addClass('OxOverlapRight');
            self.$input.show().focusInput(true);
        }
        self.$select.options({title: getTitle()});
    }

    /*@
    value <f> get/set value
        () -> value     get value
        (value) -> <o>  set value
    @*/
    that.value = function() {
        if (arguments.length == 0) {
            return getValue();
        } else {
            self.options.value = arguments[0];
            setValue();
            return that;
        }
    };

    return that;

};
