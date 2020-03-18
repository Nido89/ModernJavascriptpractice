'use strict';

/*@
Ox.Checkbox <f> Checkbox Element
    options <o> Options object
        disabled <b> if true, checkbox is disabled
        group <b> if true, checkbox is part of a group
        indeterminate <b> if true, checkbox appears as indeterminate
        label <s> Label (on the left side)
        labelWidth <n|64> Label width
        title <s> Title (on the right side)
        value <b> if true, checkbox is checked
        width <n> width in px
    self <o>    Shared private variable
    ([options[, self]]) -> <o:Ox.Element> Checkbox Element
        change <!> triggered when value changes
@*/

Ox.Checkbox = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
            .defaults({
                disabled: false,
                group: false,
                indeterminate: false,
                label: '',
                labelWidth: 64,
                overlap: 'none',
                style: 'rounded',
                title: '',
                value: false,
                width: options && (options.label || options.title) ? 'auto' : 16
            })
            .options(options || {})
            .update({
                disabled: function() {
                    var disabled = self.options.disabled;
                    that.attr({disabled: disabled});
                    self.$button.options({disabled: disabled});
                    self.$title && self.$title.options({disabled: disabled});
                },
                indeterminate: function() {
                    if (self.options.indeterminate) {
                        self.$button.options({values: ['remove']});
                        self.$button.options({value: 'remove'});
                    } else {
                        self.$button.options({values: ['none', 'check']});
                        self.$button.options({
                            value: self.options.value ? 'check' : 'none'
                        });
                    }
                },
                label: function() {
                    self.$label.options({title: self.options.label});
                },
                title: function() {
                    self.$title.options({title: self.options.title});
                },
                value: function() {
                    self.$button.toggle();
                },
                width: function() {
                    that.css({width: self.options.width + 'px'});
                    self.$title && self.$title.options({width: getTitleWidth()});
                }
            })
            .addClass('OxCheckbox' + (
                self.options.overlap == 'none'
                ? '' : ' OxOverlap' + Ox.toTitleCase(self.options.overlap)
            ))
            .attr({
                disabled: self.options.disabled
            })
            .css(self.options.width != 'auto' ? {
                width: self.options.width
            } : {});

    if (self.options.title) {
        self.options.width != 'auto' && that.css({
            width: self.options.width + 'px'
        });
        self.$title = Ox.Label({
                disabled: self.options.disabled,
                id: self.options.id + 'Label',
                overlap: 'left',
                style: self.options.style,
                title: self.options.title,
                width: getTitleWidth()
            })
            .css({float: 'right'})
            .on({click: clickTitle})
            .appendTo(that);
    }

    if (self.options.label) {
        self.$label = Ox.Label({
                overlap: 'right',
                textAlign: 'right',
                title: self.options.label,
                width: self.options.labelWidth
            })
            .css({float: 'left'})
            .appendTo(that);
    }

    self.$button = Ox.Button({
            disabled: self.options.disabled,
            id: self.options.id + 'Button',
            style: self.options.style != 'rounded' ? self.options.style : '',
            type: 'image',
            value: self.options.indeterminate ? 'remove'
                : self.options.value ? 'check' : 'none',
            values: self.options.indeterminate ? ['remove'] : ['none', 'check']
        })
        .addClass('OxCheckbox')
        .bindEvent({
            change: clickButton
        })
        .appendTo(that);

    function clickButton() {
        self.options.value = !self.options.value;
        if (self.options.indeterminate) {
            self.options.indeterminate = false;
            self.$button.options({values: ['none', 'check']});
            self.$button.options({value: self.options.value ? 'check' : 'none'});
        }
        that.triggerEvent('change', {
            value: self.options.value
        });
    }

    function clickTitle() {
        !self.options.disabled && self.$button.trigger('click');
    }

    function getTitleWidth() {
        return self.options.width - 16
            - !!self.options.label * self.options.labelWidth;
    }

    return that;

};
