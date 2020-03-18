Ox.EditableContent = function(options, self) {

    self = self || {};
    if (options.tooltip) {
        self.tooltip = options.tooltip;
        options.tooltip = function(e) {
            return that.hasClass('OxEditing') ? ''
                : Ox.isString(self.tooltip) ? self.tooltip
                : self.tooltip(e);
        }
    }
    var that = Ox.Element(options.type == 'textarea' ? '<div>' : '<span>', self)
        .defaults({
            clickLink: null,
            collapseToEnd: true,
            editable: true,
            editing: false,
            format: null,
            globalAttributes: [],
            highlight: null,
            placeholder: '',
            submitOnBlur: true,
            tags: null,
            tooltip: '',
            type: 'input',
            value: ''
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
            placeholder: function() {
                !self.options.editing && that.html(formatValue());
            },
            highlight: function() {
                !self.options.editing && that.html(formatValue());
            },
            value: function() {
                !self.options.editing && that.html(formatValue());
            }
        })
        .addClass('OxEditableContent OxKeyboardFocus')
        .on({
            blur: self.options.submitOnBlur ? submit : blur,
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
            },
            keydown: function(e) {
                if (e.keyCode == 13) {
                    if (e.shiftKey || self.options.type == 'input') {
                        submit();
                    } else {
                        var selection = window.getSelection(),
                            node = selection.anchorNode,
                            offset = selection.anchorOffset,
                            range = document.createRange(),
                            text = node.textContent;
                        e.preventDefault();
                        node.textContent = text.substr(0, offset)
                            + '\n' + (text.substr(offset) || ' ');
                        range.setStart(node, offset + 1);
                        range.setEnd(node, offset + 1);
                        selection.removeAllRanges();
                        selection.addRange(range);
                    }
                    return false;
                } else if (e.keyCode == 27) {
                    cancel();
                    return false;
                }
                setTimeout(function() {
                    that.css({padding: that.text() ? 0 : '0 2px'});
                });
            },
            paste: function(e) {
                //Ox.print('PASTE', e);
                if (e.originalEvent.clipboardData && e.originalEvent.clipboardData.getData) {
                    //Ox.print('TYPES', e.originalEvent.clipboardData.types);
                    var value = e.originalEvent.clipboardData.getData('text/plain');
                    value = Ox.encodeHTMLEntities(value).replace(/\n\n\n/g, '<br/><br/>\n');
                    document.execCommand('insertHTML', false, value);
                    e.originalEvent.stopPropagation();
                    e.originalEvent.preventDefault();
                    return false;
                }
            }
        })
        .bindEvent({
            doubleclick: edit
        });

    self.options.value = self.options.value.toString();

    that.html(formatValue());

    if (self.options.editing) {
        // wait for the element to be in the DOM
        setTimeout(function() {
            // edit will toggle self.options.editing
            self.options.editing = false;
            edit();
        });
    }

    function blur() {
        // ...
    }

    function cancel() {
        if (self.options.editing) {
            that.loseFocus();
            self.options.editing = false;
            that.removeClass('OxEditing')
                .attr({contenteditable: false})
                .html(formatValue());
            if (self.options.type == 'input') {
                that.css({padding: 0});
            }
            that.triggerEvent('cancel', {value: self.options.value});
        }
    }

    function edit() {
        if (self.options.editable && !self.options.editing) {
            var value = formatInputValue();
            that.$tooltip && that.$tooltip.remove();
            that.addClass('OxEditing')
                .removeClass('OxPlaceholder')
                .attr({contenteditable: true});
            if (value) {
                that.text(value);
            } else {
                that.text('');
                if (self.options.type == 'input') {
                    that.css({padding: '0 2px'});
                }
            }
            self.options.editing = true;
            that.gainFocus();
            setTimeout(updateSelection);
            that.triggerEvent('edit');
        } else if (!self.options.editable) {
            that.triggerEvent('open');
        }
    }

    function formatInputValue() {
        return self.options.type == 'input'
            ? Ox.decodeHTMLEntities(self.options.value)
            : self.options.value.replace(/<br\/?><br\/?>/g, '\n\n');
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
        that[
            self.options.value === '' ? 'removeClass' : 'addClass'
        ]('OxSelectable');
        return value;
    }

    function parseValue() {
        var value = Ox.clean(
            that.text().replace(/\n\n+/g, '\0')
        ).replace(/\0/g, '\n\n').trim();
        return (
            self.options.type == 'input'
            ? Ox.encodeHTMLEntities(value)
            : Ox.sanitizeHTML(value, self.options.tags, self.options.globalAttributes)
        );
    }

    function submit() {
        if (self.options.editing) {
            that.loseFocus();
            self.options.editing = false;
            self.options.value = parseValue();
            that.removeClass('OxEditing')
                .attr({contenteditable: false})
                .html(formatValue());
            if (self.options.type == 'input') {
                that.css({padding: 0});
            }
            that.triggerEvent('submit', {value: self.options.value});
        }
    }

    function updateSelection() {
        var range = document.createRange(),
            selection = window.getSelection();
        that[0].focus();
        if (self.options.collapseToEnd) {
            selection.removeAllRanges();
            range.selectNodeContents(that[0]);
            selection.addRange(range);
        }
        setTimeout(function() {
            selection.collapseToEnd();
        });
    }

    return that;

};
