'use strict';

/*@
Ox.Editable <f> Editable element
    options <o> Options object
        editing <b|false> If true, loads in editing state
        format <f|null> Format function
            (value) -> <s> Formatted value
            value <s> Input value
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.Element> Input Element
        blur <!> blur
        cancel <!> cancel
        edit <!> edit
        open <!> open
        submit <!> submit
@*/
Ox.Editable = function(options, self) {

    self = self || {};
    var that = Ox.Element({
            element: options.type == 'textarea' ? '<div>' : '<span>',
            tooltip: options.tooltip
        }, self)
        .defaults({
            blurred: false,
            clickLink: null,
            editable: true,
            editing: false,
            format: null,
            globalAttributes: [],
            height: 0,
            highlight: null,
            maxHeight: void 0,
            placeholder: '',
            submitOnBlur: true,
            tags: null,
            tooltip: '',
            type: 'input',
            unformat: null,
            value: '',
            width: 0
        })
        .options(options || {})
        .update({
            editing: function() {
                if (self.options.editing) {
                    // edit will toggle self.options.editing
                    self.options.editing = false;
                    edit();
                } else {
                    submit();
                }
            },
            height: function() {
                setCSS({height: self.options.height + 'px'});
            },
            width: function() {
                setCSS({width: self.options.width + 'px'});
            },
            highlight: function() {
                formatValue();
            },
            placeholder: function() {
                formatValue();
            },
            value: function() {
                formatValue();
                self.$input && self.$input.options({value: formatInputValue()});
            }
        })
        .addClass(
            'OxEditableElement OxKeyboardFocus'
            + (self.options.editable ? ' OxEditable' : '')
        )
        .on({
            click: function(e) {
                var $target = $(e.target);
                if (!e.shiftKey && ($target.is('a') || ($target = $target.parents('a')).length)) {
                    e.preventDefault();
                    if (self.options.clickLink) {
                        e.target = $target[0];
                        self.options.clickLink(e);
                    } else {
                        document.location.href = $target.attr('href');
                    }
                }
                return false;
            }
        })
        .bindEvent({
            doubleclick: edit,
            singleclick: function(e) {
            }
        });

    self.options.value = self.options.value.toString();

    self.css = {};
    self.$value = Ox.Element(self.options.type == 'input' ? '<span>' : '<div>')
        .addClass('OxValue')
        .appendTo(that);
    formatValue();

    if (self.options.editing) {
        // need timeout so that when determining height
        // the element is actually in the DOM
        setTimeout(function() {
            // edit will toggle self.options.editing
            self.options.editing = false;
            edit();
        });
    }

    function blur(data) {
        self.options.value = parseValue();
        if (self.options.value !== self.originalValue) {
            self.originalValue = self.options.value;
            that.triggerEvent('change', {value: self.options.value});
        }
        that.triggerEvent('blur', data);
    }

    function cancel() {
        self.options.editing = false;
        that.removeClass('OxEditing');
        self.options.value = self.originalValue;
        self.$input.value(formatInputValue()).hide();
        self.$test.html(formatTestValue());
        formatValue();
        self.$value.show();
        that.triggerEvent('cancel', {value: self.options.value});
    }

    function change(data) {
        self.options.value = parseValue(data.value);
        formatValue();
        self.$test.html(formatTestValue());
        setSizes();
    }

    function edit() {
        var height, width;
        if (self.options.editable && !self.options.editing) {
            self.options.editing = true;
            that.addClass('OxEditing');
            self.originalValue = self.options.value;
            if (!self.$input) {
                self.$input = Ox.Input({
                        autocomplete: self.options.autocomplete,
                        autocompleteReplace: self.options.autocompleteReplace,
                        autocompleteReplaceCorrect: self.options.autocompleteReplaceCorrect,
                        autocompleteSelect: self.options.autocompleteSelect,
                        autocompleteSelectHighlight: self.options.autocompleteSelectHighlight,
                        autocompleteSelectMaxWidth: self.options.autocompleteSelectMaxWidth,
                        autocompleteSelectOffset: self.options.autocompleteSelectOffset,
                        autocompleteSelectSubmit: self.options.autocompleteSelectSubmit,
                        autocompleteSelectUpdate: self.options.autocompleteSelectUpdate,
                        changeOnKeypress: true,
                        element: self.options.type == 'input' ? '<span>' : '<div>',
                        style: 'square',
                        type: self.options.type,
                        value: formatInputValue()
                    })
                    .css(self.css)
                    .bindEvent({
                        blur: self.options.submitOnBlur ? submit : blur,
                        cancel: cancel,
                        change: change,
                        insert: function(data) {
                            that.triggerEvent('insert', data);
                        },
                        submit: submit
                    })
                    .appendTo(that);
                self.$input.find('input').css(self.css);
                self.$test = self.$value.clone()
                    .css(Ox.extend({display: 'inline-block'}, self.css))
                    .html(formatTestValue())
                    .css({background: 'rgb(192, 192, 192)'})
                    .appendTo(that);
            }
            self.minWidth = 8;
            self.maxWidth = that.parent().width();
            self.minHeight = 13;
            self.maxHeight = self.options.type == 'input'
                ? self.minHeight
                : self.options.maxHeight || that.parent().height();
            setSizes();
            self.$value.hide();
            self.$input.show();
            if (!self.options.blurred) {
                setTimeout(function() {
                    self.$input.focusInput(self.options.type == 'input');
                }, 0);
                that.$tooltip && that.$tooltip.options({title: ''});
                that.triggerEvent('edit');
            }
        } else if (!self.options.editable) {
            that.triggerEvent('open');
        }
        self.options.blurred = false;
    }

    function formatInputValue() {
        return self.options.type == 'input'
            ? (self.options.unformat || Ox.decodeHTMLEntities)(self.options.value)
            : self.options.value.replace(/<br\/?><br\/?>/g, '\n\n');
    }

    function formatTestValue() {
        var value = Ox.encodeHTMLEntities(
            (self.options.unformat || Ox.identity)(self.$input.options('value'))
        );
        return !value ? '&nbsp;'
            : self.options.type == 'input'
                ? value.replace(/ /g, '&nbsp;')
                : value.replace(/\n$/, '\n ')
                    .replace(/  /g, ' &nbsp;')
                    .replace(/(^ | $)/, '&nbsp;')
                    .replace(/\n/g, '<br/>')
    }

    function formatValue() {
        var value = self.options.value;
        that.removeClass('OxPlaceholder');
        if (self.options.value === '' && self.options.placeholder) {
            value = self.options.placeholder;
            that.addClass('OxPlaceholder');
        } else if (self.options.format) {
            value = self.options.format(self.options.value);
        }
        if (self.options.highlight) {
            value = Ox.highlight(
                value, self.options.highlight, 'OxHighlight', true
            );
        }

        self.$value.html(value);
        self.$value[
            self.options.value === '' ? 'removeClass' : 'addClass'
        ]('OxSelectable');
    }

    function parseValue() {
        var value = Ox.clean(
            self.$input.value().replace(/\n\n+/g, '\0')
        ).replace(/\0/g, '\n\n').trim();
        return (
            self.options.type == 'input'
            ? Ox.encodeHTMLEntities(value)
            : Ox.sanitizeHTML(value, self.options.tags, self.options.globalAttributes)
        );
    }

    function setCSS(css) {
        self.$test && self.$test.css(css);
        self.$input && self.$input.css(css);
        self.$input && self.$input.find(self.options.type).css(css);
    }

    function setSizes() {
        var height, width;
        self.$test.css({display: 'inline-block'});
        height = self.options.height || Ox.limit(self.$test.height(), self.minHeight, self.maxHeight);
        width = self.$test.width();
        // +Ox.UI.SCROLLBAR_SIZE to prevent scrollbar from showing up
        if (self.options.type == 'textarea') {
            width += Ox.UI.SCROLLBAR_SIZE;
        }
        width = self.options.width || Ox.limit(width, self.minWidth, self.maxWidth);
        self.$test.css({display: 'none'});
        /*
        that.css({
            width: width + 'px',
            height: height + 'px'
        });
        */
        self.$input.options({
            width: width,
            height: height
        });
        self.$input.find(self.options.type).css({
            width: width + 'px',
            height: height + 'px'
        });
    }

    function submit() {
        self.options.editing = false;
        that.removeClass('OxEditing');
        self.$input.value(formatInputValue()).hide();
        self.$test.html(formatTestValue());
        formatValue();
        self.$value.show();
        that.$tooltip && that.$tooltip.options({title: self.options.tooltip});
        that.triggerEvent('submit', {value: self.options.value});
    }

    /*@
    css <f> css
    @*/
    that.css = function(css) {
        self.css = css;
        that.$element.css(css);
        self.$value.css(css);
        self.$test && self.$test.css(css);
        self.$input && self.$input.css(css);
        return that;
    };

    return that;

};
