'use strict';

/*@
Ox.ButtonGroup <f> ButtonGroup Object
    options <o> Options object
        buttons     <[o]> array of button options
        max         <n> integer, maximum number of selected buttons, 0 for all
        min         <n> integer, minimum number of selected buttons, 0 for none
        selectable  <b> if true, buttons are selectable
        type        <s> string, 'image' or 'text'
    self <o>    Shared private variable
    ([options[, self]]) -> <o:Ox.Element> ButtonGroup Object
        change <!>    {id, value}     selection within a group changed
@*/

Ox.ButtonGroup = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
            .defaults({
                buttons: [],
                max: 1,
                min: 1,
                overlap: 'none',
                selectable: false,
                size: 'medium',
                style: 'default',
                type: 'text',
                value: options.max != 1 ? [] : ''
            })
            .options(options || {})
            .update({
                value: function() {
                    // fixme: this doesn't work in cases where 
                    // multiple buttons can be selected 
                    var position = Ox.getIndexById(
                        self.options.buttons, self.options.value
                    );
                    if (position > -1) { 
                        self.$buttons[position].trigger('click'); 
                    } else if (self.options.min == 0) {
                        self.$buttons.forEach(function($button, i) {
                            $button.options('value') && $button.trigger('click');
                        });
                    }
                }
            })
            .addClass(
                'OxButtonGroup'
                + (self.options.style != 'default' ? ' Ox' + Ox.toTitleCase(self.options.style) : '')
                + (self.options.overlap != 'none' ? ' OxOverlap' + Ox.toTitleCase(self.options.overlap) : '')
            );

    self.options.buttons = self.options.buttons.map(function(button, i) {
        return Ox.extend({
            disabled: button.disabled,
            id: button.id || button,
            overlap: self.options.overlap == 'left' && i == 0 ? 'left'
                : self.options.overlap == 'right' && i == self.options.buttons.length - 1 ? 'right'
                : 'none',
            style: self.options.style,
            title: button.title || button,
            tooltip: button.tooltip,
            width: button.width
        }, self.options.selectable ? {
            selected: Ox.makeArray(self.options.value).indexOf(button.id || button) > -1
        } : {});
    });

    if (self.options.selectable) {
        self.optionGroup = new Ox.OptionGroup(
            self.options.buttons,
            self.options.min,
            self.options.max,
            'selected'
        );
        self.options.buttons = self.optionGroup.init();
        self.options.value = self.optionGroup.value();
    }

    self.$buttons = [];
    self.options.buttons.forEach(function(button, pos) {
        self.$buttons[pos] = Ox.Button({
                disabled: button.disabled || false, // FIXME: getset should handle undefined
                group: true,
                id: button.id,
                overlap: button.overlap,
                selectable: self.options.selectable,
                size: self.options.size,
                style: self.options.style == 'squared' ? 'default' : self.options.style, // FIXME: ugly
                title: button.title,
                tooltip: button.tooltip,
                type: self.options.type,
                value: button.selected || false, // FIXME: getset should handle undefined
                width: button.width
            })
            .bindEvent(self.options.selectable ? {
                change: function() {
                    toggleButton(pos);
                }
            } : {
                click: function() {
                    that.triggerEvent('click', {id: button.id});
                }
            })
            .appendTo(that);
    });

    function getButtonById(id) {
        return self.$buttons[Ox.getIndexById(self.options.buttons, id)];
    }

    function toggleButton(pos) {
        var toggled = self.optionGroup.toggle(pos);
        if (!toggled.length) {
            // FIXME: fix and use that.toggleOption()
            self.$buttons[pos].value(!self.$buttons[pos].value());
        } else {
            toggled.forEach(function(i) {
                i != pos && self.$buttons[i].value(!self.$buttons[i].value());
            });
            self.options.value = self.optionGroup.value();
            that.triggerEvent('change', {
                title: self.options.value === '' ? ''
                    : Ox.isString(self.options.value)
                    ? Ox.getObjectById(self.options.buttons, self.options.value).title
                    : self.options.value.map(function(value) {
                        return Ox.getObjectById(self.options.buttons, value).title;
                    }),
                value: self.options.value
            });
        }
    }

    /*@
    disableButton <f> Disable button
    @*/
    that.disableButton = function(id) {
        getButtonById(id).options({disabled: true});
    };

    /*@
    enableButton <f> Enable button
    @*/
    that.enableButton = function(id) {
        getButtonById(id).options({disabled: false});
    };

    /*
    buttonOptions <f> Get or set button options
    */
    that.buttonOptions = function(id, options) {
        return getButtonById(id).options(options);
    };

    return that;

};
