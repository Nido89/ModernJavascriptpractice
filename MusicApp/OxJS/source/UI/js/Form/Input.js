'use strict';

/*@
Ox.Input <f> Input Element
    options <o> Options object
        arrows                      <b> if true, and type is 'float' or 'int', display arrows
        arrowStep                   <n> step when clicking arrows
        autocomplete                <a> array of possible values, or
                                    <f> function(key, value, callback), returns one or more values
        autocompleteReplace         <b> if true, value is replaced
        autocompleteReplaceCorrect  <b> if true, only valid values can be entered
        autocompleteSelect          <b> if true, menu is displayed
        autocompleteSelectHighlight <b> if true, value in menu is highlighted
        autocompleteSelectMaxWidth  <n|0> Maximum width of autocomplete menu, or 0
        autocompleteSelectOffset    <o|{left: 4, top: 0}> Offset of autocomplete menu
        autocompleteSelectSubmit    <b> if true, submit input on menu selection
        autocompleteSelectUpdate    <b> if true, update menu position on keypress
        autocorrect                 <s|r|f|null> ('email', 'float', 'int', 'phone', 'url'), or
                                    <r> regexp(value), or
                                    <f> function(key, value, blur, callback), returns value
        autovalidate                <f> --remote validation--
        clear                       <b> if true, has clear button
        clearTooltip                <s|f|''> clear button tooltip
        changeOnKeypress            <b> if true, fire change event while typing
        disabled                    <b> if true, is disabled
        height                      <n> px (for type='textarea' and type='range' with orientation='horizontal')
        id                          <s> element id
        key                         <s> to be passed to autocomplete and autovalidate functions
        label                       <s|''> Label
        labelWidth                  <n|64> Label width
        max                         <n> max value if type is 'int' or 'float'
        min                         <n> min value if type is 'int' or 'float'
        name                        <s> will be displayed by autovalidate function ('invalid ' + name)
        overlap                     <s> '', 'left' or 'right', will cause padding and negative margin
        picker                  <o> picker object
        rangeOptions          <o> range options
            arrows              <b>boolean, if true, display arrows
            //arrowStep         <n> number, step when clicking arrows
            //arrowSymbols      <a> array of two strings
            max                 <n> number, maximum value
            min                 <n> number, minimum value
            orientation         <s> 'horizontal' or 'vertical'
            step                <n> number, step
            thumbValue          <b> boolean, if true, value is displayed on thumb, or
                                <a> array of strings per value, or
                                <f> function(value), returns string
            thumbSize           <n> integer, px
            trackGradient       <s> string, css gradient for track
            trackImage          <s> string, image url, or
                                <a> array of image urls
            //trackStep         <n>   number, 0 for 'scroll here', positive for step
            trackValues         <b> boolean
        readonly                    <b> if true, is readonly
        serialize                   <f> function used to serialize value in submit
        style                       <s> 'rounded' or 'square'
        textAlign                   <s> 'left', 'center' or 'right'
        type                        <s> 'float', 'int', 'password', 'text', 'textarea'
        value                       <s> string
        validate                    <f> remote validation
        width                       <n> px
    ([options[, self]]) -> <o:Ox.Element> Input Element
        autocomplete <!> autocomplete
        autovalidate <!> autovalidate
        blur <!> blur
        cancel <!> cancel
        change <!> input changed event
        clear <!> clear
        focus <!> focus
        insert <!> insert
        submit <!> input submit event
        validate <!> validate
@*/

Ox.Input = function(options, self) {

    self = self || {};
    var that = Ox.Element({
                element: (options || {}).element || '<div>'
            }, self)
            .defaults({
                arrows: false,
                arrowStep: 1,
                autocomplete: null,
                autocompleteReplace: false,
                autocompleteReplaceCorrect: false,
                autocompleteSelect: false,
                autocompleteSelectHighlight: false,
                autocompleteSelectMax: 0,
                autocompleteSelectMaxWidth: 0,
                autocompleteSelectOffset: {left: 4, top: 0},
                autocompleteSelectSubmit: false,
                autocompleteSelectUpdate: false,
                autovalidate: null,
                changeOnKeypress: false,
                clear: false,
                clearTooltip: '',
                decimals: 0,
                disabled: false,
                height: 16,
                key: '',
                min: -Infinity,
                max: Infinity,
                label: '',
                labelWidth: 64,
                overlap: 'none',
                placeholder: '',
                readonly: false,
                serialize: null,
                style: 'rounded',
                textAlign: 'left',
                type: 'text',
                validate: null,
                value: '',
                width: 128
            })
            .options(options || {})
            .update(function(key, value) {
                var inputWidth;
                if ([
                    'autocomplete', 'autocompleteReplace', 'autocompleteSelect', 'autovalidate'
                ].indexOf(key) > -1) {
                    if (self.options.autocomplete && self.options.autocompleteSelect) {
                        self.$autocompleteMenu = constructAutocompleteMenu();
                    }
                    self.bindKeyboard = self.options.autocomplete || self.options.autovalidate;
                } else if (key == 'disabled') {
                    self.$input.attr({disabled: value});
                } else if (key == 'height') {
                    that.css({height: value + 'px'});
                    self.$input.css({height: value - 6 + 'px'});
                } else if (key == 'label') {
                    self.$label.options({title: value});
                } else if (key == 'labelWidth') {
                    self.$label.options({width: value});
                    inputWidth = getInputWidth();
                    self.$input.css({
                        width: inputWidth + 'px'
                    });
                    self.hasPasswordPlaceholder && self.$placeholder.css({
                        width: inputWidth + 'px'
                    });
                } else if (key == 'placeholder') {
                    setPlaceholder();
                } else if (key == 'readonly') {
                    self.$input.attr({readonly: value});
                } else if (key == 'type') {
                    // jQuery does not allow update via attr({type: value}) due to IE 6 bug
                    self.$input[0].type = value
                } else if (key == 'value') {
                    if (self.options.type == 'float' && self.options.decimals) {
                        self.options.value = self.options.value.toFixed(self.options.decimals);
                    }
                    self.$input.val(self.options.value);
                    that.is('.OxError') && that.removeClass('OxError');
                    setPlaceholder();
                } else if (key == 'width') {
                    that.css({width: self.options.width + 'px'});
                    inputWidth = getInputWidth();
                    self.$input.css({
                        width: inputWidth + 'px'
                    });
                    self.hasPasswordPlaceholder && self.$placeholder.css({
                        width: inputWidth + 'px'
                    });
                }
            })
            .addClass(
                'OxInput OxKeyboardFocus OxMedium Ox' + Ox.toTitleCase(self.options.style)
                + (self.options.type == 'textarea' ? ' OxTextarea' : '') /*+ (
                    self.options.overlap != 'none' ?
                    ' OxOverlap' + Ox.toTitleCase(self.options.overlap) : ''
                )*/
            )
            .css(
                Ox.extend({
                    width: self.options.width + 'px'
                }, self.options.type == 'textarea' ? {
                    height: self.options.height + 'px'
                } : {})
            )
            .bindEvent(Ox.extend(self.options.type != 'textarea' ? {
                key_enter: submit
            } : {}, {
                key_control_i: insert,
                key_escape: cancel,
                key_shift_enter: submit
            }));

    if (
        Ox.isArray(self.options.autocomplete)
        && self.options.autocompleteReplace
        && self.options.autocompleteReplaceCorrect
        && self.options.value === ''
    ) {
        self.options.value = self.options.autocomplete[0]
    }

    // fixme: set to min, not 0
    // fixme: validate self.options.value !
    if (self.options.type == 'float') {
        self.decimals = Ox.repeat('0', self.options.decimals || 1)
        Ox.extend(self.options, {
            autovalidate: 'float',
            textAlign: 'right',
            value: self.options.value || '0.' + self.decimals
        });
    } else if (self.options.type == 'int') {
        Ox.extend(self.options, {
            autovalidate: 'int',
            textAlign: 'right',
            value: self.options.value || '0'
        });
    }

    if (self.options.label) {
        self.$label = Ox.Label({
            overlap: 'right',
            style: self.options.style,
            textAlign: 'right',
            title: self.options.label,
            width: self.options.labelWidth
        })
        .css({
            float: 'left' // fixme: use css rule
        })
        .on({
            click: function() {
                // fixme: ???
                // that.focus();
            }
        })
        .appendTo(that);
    }

    if (self.options.arrows) {
        self.arrows = [];
        self.arrows[0] = [
            Ox.Button({
                    overlap: 'right',
                    title: 'left',
                    type: 'image'
                })
                .css({float: 'left'})
                .on({
                    click: function() {
                        clickArrow(-1);
                    }
                })
                .appendTo(that),
            Ox.Button({
                    overlap: 'left',
                    title: 'right',
                    type: 'image'
                })
                .css({float: 'right'})
                .on({
                    click: function() {
                        clickArrow(1);
                    }
                })
                .appendTo(that)
        ]
    }

    self.bindKeyboard = self.options.autocomplete
        || self.options.autovalidate
        || self.options.changeOnKeypress;
    self.hasPasswordPlaceholder = self.options.type == 'password'
        && self.options.placeholder;
    self.inputWidth = getInputWidth();

    if (self.options.clear) {
        self.$button = Ox.Button({
                overlap: 'left',
                // FIXME: should always be self.options.style, but there
                // is a CSS bug for rounded image buttons
                style: self.options.style == 'squared' ? 'squared' : '',
                title: 'close',
                tooltip: self.options.clearTooltip,
                type: 'image'
            })
            .css({
                float: 'right' // fixme: use css rule
            })
            .bindEvent({
                click: clear,
                doubleclick: submit
            })
            .appendTo(that);
    }

    self.$input = $(self.options.type == 'textarea' ? '<textarea>' : '<input>')
        .addClass('OxInput OxKeyboardFocus OxMedium Ox' + Ox.toTitleCase(self.options.style))
        .attr({
            disabled: self.options.disabled,
            readonly: self.options.readonly,
            type: self.options.type == 'password' ? 'password' : 'text'
        })
        .css(
            Ox.extend({
                width: self.inputWidth + 'px',
                textAlign: self.options.textAlign
            }, self.options.type == 'textarea' ? {
                height: self.options.height - 6 + 'px'
            } : {})
        )
        .val(self.options.value)
        .on({
            click: function() {
                self.options.disabled && that.gainFocus();
            },
            blur: blur,
            change: change,
            focus: focus
        })
        .appendTo(that);

    if (self.bindKeyboard) {
        self.$input.on({
            paste: keydown
        });
    }

    if (self.options.type == 'textarea') {
        Ox.Log('Form', 'TEXTAREA', self.options.width, self.options.height, '...', that.css('width'), that.css('height'), '...', self.$input.css('width'), self.$input.css('height'), '...', self.$input.css('border'))
    }

    // fixme: is there a better way than this one?
    // should at least go into ox.ui.theme.foo.js
    // probably better: divs in the background
    /*
    if (self.options.type == 'textarea') {
        Ox.extend(self, {
            colors: Ox.Theme() == 'oxlight' ?
                [208, 232, 244] :
                //[0, 16, 32],
                [32, 48, 64],
            colorstops: [8 / self.options.height, self.options.height - 8 / self.options.height]
        });
        self.$input.css({
            background: '-moz-linear-gradient(top, rgb(' +
                [self.colors[0], self.colors[0], self.colors[0]].join(', ') + '), rgb(' +
                [self.colors[1], self.colors[1], self.colors[1]].join(', ') + ') ' + 
                Math.round(self.colorstops[0] * 100) + '%, rgb(' +
                [self.colors[1], self.colors[1], self.colors[1]].join(', ') + ') ' + 
                Math.round(self.colorstops[1] * 100) + '%, rgb(' +
                [self.colors[2], self.colors[2], self.colors[2]].join(', ') + '))' 
        });
        self.$input.css({
            background: '-webkit-linear-gradient(top, rgb(' +
                [self.colors[0], self.colors[0], self.colors[0]].join(', ') + '), rgb(' +
                [self.colors[1], self.colors[1], self.colors[1]].join(', ') + ') ' + 
                Math.round(self.colorstops[0] * 100) + '%, rgb(' +
                [self.colors[1], self.colors[1], self.colors[1]].join(', ') + ') ' + 
                Math.round(self.colorstops[1] * 100) + '%, rgb(' +
                [self.colors[2], self.colors[2], self.colors[2]].join(', ') + '))' 
        });
    }
    */

    if (self.hasPasswordPlaceholder) {
        self.$input.hide();
        self.$placeholder = $('<input>')
            .addClass('OxInput OxKeyboardFocus OxMedium Ox' +
                Ox.toTitleCase(self.options.style) +
                ' OxPlaceholder')
            .attr({type: 'text'})
            .css({width: self.inputWidth + 'px'})
            .val(self.options.placeholder)
            .on({focus: focus})
            .appendTo(that);
    }

    if (self.options.autocomplete && self.options.autocompleteSelect) {
        self.$autocompleteMenu = constructAutocompleteMenu();
    }

    self.options.placeholder && setPlaceholder();

    function autocomplete(oldValue, oldCursor) {

        oldValue = Ox.isUndefined(oldValue) ? self.options.value : oldValue;
        oldCursor = Ox.isUndefined(oldCursor) ? cursor() : oldCursor;

        Ox.Log('AUTO', 'autocomplete', oldValue, oldCursor)

        if (self.options.value || self.options.autocompleteReplaceCorrect) {
            var id = Ox.uid();
            self.autocompleteId = id;
            if (Ox.isFunction(self.options.autocomplete)) {
                if (self.options.key) {
                    self.options.autocomplete(
                        self.options.key, self.options.value, autocompleteCallback
                    );
                } else {
                    self.options.autocomplete(
                        self.options.value, autocompleteCallback
                    );
                }
            } else {
                autocompleteCallback(autocompleteFunction());
            }
        }
        if (!self.options.value) {
            if (self.options.autocompleteSelect) {
                self.$autocompleteMenu
                    .unbindEvent('select')
                    .hideMenu();
                that.gainFocus();
                self.selectEventBound = false;
            }
        }

        function autocompleteFunction() {
            return Ox.find(
                self.options.autocomplete,
                self.options.value,
                self.options.autocompleteReplace
            );
        }

        function autocompleteCallback(values) {

            if (self.autocompleteId != id) {
                return;
            }
            //Ox.Log('Form', 'autocompleteCallback', values[0], self.options.value, self.options.value.length, oldValue, oldCursor)

            var length = self.options.value.length,
                newValue, newLength,
                pos = cursor(),
                selected = -1,
                selectEnd = length == 0 || (values[0] && values[0].length),
                value;

            if (values[0]) {
                if (self.options.autocompleteReplace &&
                        Ox.startsWith(values[0].toLowerCase(),
                            self.options.value.toLowerCase())) {
                    newValue = values[0];
                    selected = 0;
                } else {
                    newValue = self.options.value;
                }
            } else {
                if (self.options.autocompleteReplaceCorrect) {
                    newValue = oldValue;
                } else {
                    newValue = self.options.value
                }
            }
            newLength = newValue.length;

            if (self.options.autocompleteReplace) {
                value = self.options.value;
                self.options.value = newValue;
                self.$input.val(self.options.value);
                if (selectEnd) {
                    cursor(length, newLength);
                } else if (self.options.autocompleteReplaceCorrect) {
                    cursor(oldCursor);
                } else {
                    cursor(pos);
                }
            }

            if (self.options.autocompleteSelect) {
                value = (
                    self.options.autocompleteReplace
                    ? value : self.options.value
                ).toLowerCase();
                if (values.length) {
                    self.oldCursor = cursor();
                    self.oldValue = self.options.value;
                    self.$autocompleteMenu.options({
                        items: Ox.filter(values, function(v, i) {
                            var ret = false;
                            if (
                                !self.options.autocompleteSelectMax ||
                                i < self.options.autocompleteSelectMax
                            ) {
                                if (v.toLowerCase() === value) {
                                    selected = i;
                                }
                                ret = true;
                            }
                            return ret;
                        }).map(function(v) {
                            return {
                                id: v.toLowerCase().replace(/ /g, '_'), // fixme: need function to do lowercase, underscores etc?
                                title: self.options.autocompleteSelectHighlight
                                    ? Ox.highlight(v, value, 'OxHighlight') : v
                            };
                        })
                    });
                    if (!self.selectEventBound) {
                        self.$autocompleteMenu.bindEvent({
                            select: selectMenu
                        });
                        self.selectEventBound = true;
                    }
                    self.$autocompleteMenu.options({
                        selected: selected
                    }).showMenu();
                    if (self.options.autocompleteSelectUpdate) {
                        self.$autocompleteMenu.updatePosition();
                    }
                } else {
                    self.$autocompleteMenu
                        .unbindEvent('select')
                        .hideMenu();
                    that.gainFocus();
                    self.selectEventBound = false;
                }
            }

            that.triggerEvent('autocomplete', {
                value: newValue
            });

        }

    }

    function autovalidate() {

        var blur, oldCursor, oldValue;

        if (arguments.length == 1) {
            blur = arguments[0];
        } else {
            blur = false;
            oldValue = arguments[0];
            oldCursor = arguments[1];
        }

        if (Ox.isFunction(self.options.autovalidate)) {
            if (self.options.key) {
                self.options.autovalidate(
                    self.options.key, self.options.value, blur, autovalidateCallback
                );
            } else {
                self.options.autovalidate(
                    self.options.value, blur, autovalidateCallback
                );
            }
        } else if (Ox.isRegExp(self.options.autovalidate)) {
            autovalidateCallback(autovalidateFunction(self.options.value));
        } else {
            autovalidateTypeFunction(self.options.type, self.options.value);
        }

        function autovalidateFunction(value) {
            value = value.split('').map(function(v) {
                return self.options.autovalidate.test(v) ? v : null;
            }).join('');
            return {
                valid: !!value.length,
                value: value
            };
        }

        function autovalidateTypeFunction(type, value) {
            // fixme: remove trailing zeroes on blur
            // /(^\-?\d+\.?\d{0,8}$)/('-13000.12345678')
            var cursor,
                length,
                regexp = type == 'float' ? new RegExp(
                    '(^' + (self.options.min < 0 ? '\\-?' : '') + '\\d+\\.?\\d'
                    + (self.options.decimals ? '{0,' + self.options.decimals + '}' : '*')
                    + '$)'
                ) : new RegExp('(^' + (self.options.min < 0 ? '\\-?' : '') + '\\d+$)');
            if (type == 'float') {
                if (value === '') {
                    value = '0.' + self.decimals;
                    cursor = [0, value.length];
                } else if (value == '-') {
                    value = '-0.' + self.decimals;
                    cursor = [1, value.length];
                } else if (value == '.') {
                    value = '0.' + self.decimals;
                    cursor = [2, value.length];
                } else if (!/\./.test(value)) {
                    value += '.' + self.decimals;
                    cursor = [value.indexOf('.'), value.length];
                } else if (/^\./.test(value)) {
                    value = '0' + value;
                    cursor = [2, value.length];
                } else if (/\.$/.test(value)) {
                    value += self.decimals;
                    cursor = [value.indexOf('.') + 1, value.length];
                } else if (/\./.test(value) && self.options.decimals) {
                    length = value.split('.')[1].length;
                    if (length > self.options.decimals) {
                        value = value.slice(0, value.indexOf('.') + 1 + self.options.decimals);
                        cursor = [oldCursor[0] + 1, oldCursor[1] + 1];
                    } else if (length < self.options.decimals) {
                        value += Ox.repeat('0', self.options.decimals - length);
                        cursor = [value.indexOf('.') + 1 + length, value.length];
                    }
                }
            } else {
                if (value === '') {
                    value = '0';
                    cursor = [0, 1];
                }
            }
            while (/^0\d/.test(value)) {
                value = value.slice(1);
            }
            if (!regexp.test(value) || value < self.options.min || value > self.options.max) {
                value = oldValue;
                cursor = oldCursor;
            }
            autovalidateCallback({
                cursor: cursor,
                valid: true,
                value: value
            });
        }

        function autovalidateCallback(data) {
            //Ox.Log('Form', 'autovalidateCallback', newValue, oldCursor)
            self.options.value = data.value;
            self.$input.val(self.options.value);
            !blur && cursor(
                data.cursor || (oldCursor[1] + data.value.length - oldValue.length)
            );
            that.triggerEvent('autovalidate', {
                valid: data.valid,
                value: data.value
            });
        }

    }

    /*

    function autovalidate(blur) {
        Ox.Log('Form', 'autovalidate', self.options.value, blur || false)
        self.autocorrectBlur = blur || false;
        self.autocorrectCursor = cursor();
        Ox.isFunction(self.options.autocorrect) ?
            (self.options.key ? self.options.autocorrect(
                self.options.key,
                self.options.value,
                self.autocorrectBlur,
                autocorrectCallback
            ) : self.options.autocorrect(
                self.options.value,
                self.autocorrectBlur,
                autocorrectCallback
            )) : autocorrectCallback(autocorrect(self.options.value));
    }

    function autovalidateFunction(value) {
        var length = value.length;
        return value.toLowerCase().split('').map(function(v) {
            if (new RegExp(self.options.autocorrect).test(v)) {
                return v;
            } else {
                return null;
            }
        }).join('');
    }

    */

    function blur() {
        that.loseFocus();
        //that.removeClass('OxFocus');
        self.options.value = self.$input.val();
        self.options.autovalidate && autovalidate(true);
        self.options.placeholder && setPlaceholder();
        self.options.validate && validate();
        self.bindKeyboard && Ox.$document.off('keydown', keydown);
        if (!self.cancelled && !self.submitted) {
            that.triggerEvent('blur', {value: self.options.value});
            self.options.value !== self.originalValue && that.triggerEvent('change', {
                value: self.options.value
            });
        }
    }

    function cancel() {
        self.cancelled = true;
        self.$input.val(self.originalValue).blur();
        self.cancelled = false;
        that.triggerEvent('cancel');
    }

    function cancelAutocomplete() {
        self.autocompleteId = null;
    }

    function change() {
        // change gets invoked before blur
        self.options.value = self.$input.val();
        self.originalValue = self.options.value;
        !self.options.changeOnKeypress && that.triggerEvent('change', {
            value: self.options.value
        });
    }

    function clear() {
        // fixme: set to min, not zero
        // fixme: make this work for password
        if (!self.clearTimeout) {
            that.triggerEvent('clear');
            self.options.value = '';
            self.options.value = self.options.type == 'float' ? '0.0'
                : self.options.type == 'int' ? '0'
                : '';
            self.$input.val(self.options.value);
            cursor(0, self.options.value.length);
            self.options.changeOnKeypress && that.triggerEvent({
                change: {value: self.options.value}
            });
            self.clearTimeout = setTimeout(function() {
                self.clearTimeout = 0;
            }, 500);
        }
    }

    function clickArrow(i) {
        var originalValue = self.options.value;
        self.options.value = Ox.limit(
            parseFloat(self.options.value) + i * self.options.arrowStep,
            self.options.min,
            self.options.max
        ).toString();
        if (self.options.value != originalValue) {
            self.$input.val(self.options.value);//.focus();
            that.triggerEvent('change', {value: self.options.value});
        }
    }

    function clickMenu(data) {
        //Ox.Log('Form', 'clickMenu', data);
        self.options.value = data.title;
        self.$input.val(self.options.value).focus();
        that.gainFocus();
        self.options.autocompleteSelectSubmit && submit();
    }

    function constructAutocompleteMenu() {
        return Ox.Menu({
                element: self.$input,
                id: self.options.id + 'Menu', // fixme: we do this in other places ... are we doing it the same way? var name?,
                maxWidth: self.options.autocompleteSelectMaxWidth,
                offset: self.options.autocompleteSelectOffset
            })
            .addClass('OxAutocompleteMenu OxKeyboardFocus')
            .bindEvent({
                click: clickMenu,
                key_enter: function() {
                    if (self.$autocompleteMenu.is(':visible')) {
                        self.$autocompleteMenu.hideMenu();
                        that.gainFocus();
                        submit();
                    }
                }
            });
    }

    function cursor(start, end) {
        /*
        cursor()                returns [start, end]
        cursor(start)           sets start
        cursor([start, end])    sets start and end
        cursor(start, end)      sets start and end
        */
        var isArray = Ox.isArray(start);
        if (arguments.length == 0) {
            return [self.$input[0].selectionStart, self.$input[0].selectionEnd];
        } else {
            end = isArray ? start[1] : (end ? end : start);
            start = isArray ? start[0] : start;
            //IE8 does not have setSelectionRange
            self.$input[0].setSelectionRange && self.$input[0].setSelectionRange(start, end);
        }
    }

    function deselectMenu() {
        return;
        //Ox.Log('Form', 'deselectMenu')
        /*
        self.options.value = self.oldValue;
        self.$input.val(self.options.value);
        cursor(self.oldCursor);
        */
    }

    function focus() {
        if (
            // that.hasClass('OxFocus') || // fixme: this is just a workaround, since for some reason, focus() gets called twice on focus
            (self.$autocompleteMenu && self.$autocompleteMenu.is(':visible')) ||
            (self.hasPasswordPlaceholder && self.$input.is(':visible'))
        ) {
            return;
        }
        self.originalValue = self.options.value;
        that.gainFocus();
        that.is('.OxError') && that.removeClass('OxError');
        self.options.placeholder && setPlaceholder();
        if (self.bindKeyboard) {
            // fixme: different in webkit and firefox (?), see keyboard handler, need generic function
            Ox.$document.keydown(keydown);
            //Ox.$document.keypress(keypress);
            // temporarily disabled autocomplete on focus
            //self.options.autocompleteSelect && setTimeout(autocomplete, 0); // fixme: why is the timeout needed?
        }
        that.triggerEvent('focus');
    }

    function getInputWidth() {
        return self.options.width
            - (self.options.arrows ? 32 : 0)
            - (self.options.clear ? 16 : 0)
            - (self.options.label ? self.options.labelWidth : 0)
            - (Ox.contains(['rounded', 'squared'], self.options.style) ? 14 : 6);
    }

    function insert() {
        var input = self.$input[0];
        that.triggerEvent('insert', {
            end: input.selectionEnd,
            id: that.oxid,
            selection: input.value.slice(input.selectionStart, input.selectionEnd),
            start: input.selectionStart,
            value: input.value
        });
    }

    function keydown(event) {
        var oldCursor = cursor(),
            oldValue = self.options.value,
            newValue = oldValue.toString().slice(0, oldCursor[0] - 1),
            hasDeletedSelectedEnd = (event.keyCode == 8 || event.keyCode == 46)
                && oldCursor[0] < oldCursor[1]
                && oldCursor[1] == oldValue.length;
        if (
            event.keyCode != 9 // tab
            && (self.options.type == 'textarea' || event.keyCode != 13) // enter
            && event.keyCode != 27 // escape
        ) { // fixme: can't 13 and 27 return false?
            setTimeout(function() { // wait for val to be set
                var value = self.$input.val();
                if ((self.options.autocompleteReplace || self.options.decimals) && hasDeletedSelectedEnd) {
                    //Ox.Log('Form', 'HAS DELETED SELECTED END', event.keyCode)
                    value = newValue;
                    self.$input.val(value);
                }
                if (value != self.options.value) {
                    self.options.value = value;
                    Ox.Log('AUTO', 'call autocomplete from keydown')
                    self.options.autocomplete && autocomplete(oldValue, oldCursor);
                    self.options.autovalidate && autovalidate(oldValue, oldCursor);
                    self.options.changeOnKeypress && that.triggerEvent({
                        change: {value: self.options.value}
                    });
                }
            });
        }
        if (
            (event.keyCode == 38 || event.keyCode == 40) // up/down
            && self.options.autocompleteSelect
            && self.$autocompleteMenu.is(':visible')
        ) {
            //return false;
        }
    }

    function paste() {
        // fixme: unused
        var data = Ox.Clipboard.paste();
        data.text && self.$input.val(data.text);
    }

    function selectMenu(data) {
        var pos = cursor();
        //if (self.options.value) {
            //Ox.Log('Form', 'selectMenu', pos, data.title)
            self.options.value = Ox.decodeHTMLEntities(data.title);
            self.$input.val(self.options.value);
            cursor(pos[0], self.options.value.length);
            self.options.changeOnKeypress && that.triggerEvent({
                change: {value: self.options.value}
            });
            if (self.options.autocompleteSelectUpdate) {
                self.$autocompleteMenu.updatePosition();
            }
        //}
    }

    function setPlaceholder() {
        if (self.options.placeholder) {
            if (that.hasClass('OxFocus')) {
                if (self.options.value === '') {
                    if (self.options.type == 'password') {
                        self.$placeholder.hide();
                        self.$input.show().focus();
                    } else {
                        self.$input
                            .removeClass('OxPlaceholder')
                            .val('');
                    }
                }
            } else {
                if (self.options.value === '') {
                    if (self.options.type == 'password') {
                        self.$input.hide();
                        self.$placeholder.show();
                    } else {
                        self.$input
                            .addClass('OxPlaceholder')
                            .val(self.options.placeholder)
                    }
                } else {
                    self.$input
                        .removeClass('OxPlaceholder')
                        .val(self.options.value)
                }
            }
        } else {
            self.$input
                .removeClass('OxPlaceholder')
                .val(self.options.value);
        }
    }

    function setWidth() {
        
    }

    function submit() {
        cancelAutocomplete();
        self.submitted = true;
        self.$input.blur();
        self.submitted = false;
        //self.options.type == 'textarea' && self.$input.blur();
        that.triggerEvent('submit', {value: self.options.value});
    }

    function validate() {
        self.options.validate(self.options.value, function(data) {
            that.triggerEvent('validate', data);
        });
    }

    /*@
    blurInput <f> blurInput
    @*/
    that.blurInput = function() {
        self.$input.blur();
        return that;
    };

    /*@
    clearInput <f> clearInput
    @*/
    that.clearInput = function() {
        clear();
        return that;
    };

    /*@
    focusInput <f> Focus input element
        (select) -> <o> Input object
        (start, end) -> <o> Input object
        select <b|false> If true, select all, otherwise position cursor at the end
        start <n> Selection start (can be negative)
        end <n> Selection end (can be negative), or equal to start if omitted
    @*/
    that.focusInput = function() {
        var length = self.$input.val().length,
            start = Ox.isNumber(arguments[0])
                ? (arguments[0] < 0 ? length + arguments[0] : arguments[0])
                : arguments[0] ? 0 : length,
            stop = Ox.isNumber(arguments[1])
                ? (arguments[1] < 0 ? length + arguments[1] : arguments[1])
                : Ox.isNumber(arguments[0]) ? arguments[0]
                : arguments[0] ? length : 0;
        self.$input.focus();
        cursor(start, stop);
        return that;
    };

    /*@
    value <f> get/set value
    @*/
    // FIXME: deprecate, options are enough
    that.value = function() {
        if (arguments.length == 0) {
            var value = self.$input.hasClass('OxPlaceholder') ? '' : self.$input.val();
            if (self.options.type == 'float') {
                value = parseFloat(value);
            } else if (self.options.type == 'int') {
                value = parseInt(value); // cannot have leading zero
            }
            return value;
        } else {
            return that.options({value: arguments[0]});
        }
    };

    return that;

};
