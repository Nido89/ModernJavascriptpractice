'use strict';

/*@
Ox.Button <f> Button Object
    options <o> Options object
        If a button is both selectable and has two values, its value is the
        selected id, and the second value corresponds to the selected state
        disabled    <b|false>       If true, button is disabled
        group       <b|false>       If true, button is part of group
        id          <s|''>          Element id
        overlap     <s|'none'>      'none', 'left' or 'right'
        selectable  <b|false>       If true, button is selectable
        style       <s|'default'>   'default', 'checkbox', 'symbol', 'tab' or 'video'
        title       <s|''>          Button title
        tooltip     <s|[s]|''>      Tooltip
        type        <s|text>        'text' or 'image'
        value       <b|s|undefined> True for selected, or current value id
        values      <[o]|[]>        [{id, title}, {id, title}] 
        width       <s|'auto'>      Button width
    self <o>    Shared private variable
    ([options[, self]]) -> <o:Ox.Element> Button Object
        click    <!> non-selectable button was clicked
        change   <!> selectable button was clicked
@*/

Ox.Button = function(options, self) {

    self = self || {};
    var that = Ox.Element('<input>', self)
            .defaults({
                disabled: false,
                group: false,
                id: '',
                overlap: 'none',
                selectable: false,
                size: 'medium',
                // fixme: 'default' or ''?
                style: 'default',
                title: '',
                tooltip: '',
                type: 'text',
                value: void 0,
                values: [],
                width: 'auto'
            })
            .options(Ox.isArray(options.tooltip) ? Ox.extend(Ox.clone(options), {
                tooltip: options.tooltip[0]
            }) : options || {})
            .update({
                disabled: setDisabled,
                tooltip: function() {
                    if (Ox.isArray(self.options.tooltip) && that.$tooltip) {
                        that.$tooltip.options({
                            title: self.options.tooltip[self.value]
                        });
                    }
                },
                title: setTitle,
                value: function() {
                    setValue();
                    setTitle();
                    self.options.selectable && setSelected();
                },
                values: function() {
                    setValue();
                    setTitle();
                },
                width: function() {
                    that.css({width: (self.options.width - 14) + 'px'});
                }
            })
            .addClass(
                'OxButton Ox' + Ox.toTitleCase(self.options.size)
                + (self.options.disabled ? ' OxDisabled': '')
                + (self.options.selectable && self.options.value ? ' OxSelected' : '')
                + (self.options.style != 'default' ? ' Ox' + Ox.toTitleCase(self.options.style) : '')
                + (self.options.overlap != 'none' ? ' OxOverlap' + Ox.toTitleCase(self.options.overlap) : '')
            )
            .attr({
                disabled: self.options.disabled,
                type: self.options.type == 'text' ? 'button' : 'image'
            })
            .css(self.options.width == 'auto' ? {} : {
                width: (self.options.width - 14) + 'px'
            })
            .on({
                click: click,
                mousedown: mousedown
            });

    if (self.options.values.length) {
        self.options.values = self.options.values.map(function(value) {
            return {
                id: value.id || value,
                title: value.title || value
            };
        });
        self.value = Ox.getIndexById(self.options.values, self.options.value);
        if (self.value == -1) {
            self.value = 0;
            self.options.value = self.options.values[0].id;
        }
        self.options.title = self.options.values[self.value].title;
    } else if (self.options.selectable) {
        self.options.value = self.options.value || false;
    }

    setValue();
    setTitle();

    if (Ox.isArray(options.tooltip)) {
        self.options.tooltip = options.tooltip;
        // Ox.Element creates tooltip only on mouse over.
        // create here to overwrite tooltip title
        if (!that.$tooltip) {
            that.$tooltip = Ox.Tooltip();
        }
        that.$tooltip.options({
            title: self.options.tooltip[self.value]
        });
    }

    function click() {
        if (!self.options.disabled) {
            that.$tooltip && that.$tooltip.hide();
            that.triggerEvent('click');
            if (self.options.values.length || self.options.selectable) {
                that.toggle();
                that.triggerEvent('change', {value: self.options.value});
            }
        }
    }

    function mousedown(e) {
        if (self.options.type == 'image' && $.browser.safari) {
            // keep image from being draggable
            e.preventDefault();
        }
    }

    function setDisabled() {
        that.attr({disabled: self.options.disabled});
        that[self.options.disabled ? 'addClass' : 'removeClass']('OxDisabled');
        self.options.disabled && that.$tooltip && that.$tooltip.hide();
        self.options.type == 'image' && setTitle();
    }

    function setSelected() {
        that[self.options.value ? 'addClass' : 'removeClass']('OxSelected');
        self.options.type == 'image' && setTitle();
    }

    function setTitle() {
        if (self.options.type == 'image') {
            that.attr({
                src: Ox.UI.getImageURL(
                    'symbol' + self.options.title[0].toUpperCase()
                        + self.options.title.slice(1),
                    self.options.style == 'overlay' ? 'overlay' + (
                            self.options.disabled ? 'Disabled'
                            : self.options.selectable && self.options.value ? 'Selected'
                            : ''
                        )
                        : self.options.style == 'video' ? 'video'
                        : self.options.disabled ? 'disabled'
                        : self.options.selectable && self.options.value ? 'selected'
                        : ''
                )
            });
        } else {
            that.val(self.options.title);
        }
    }

    function setValue() {
        if (self.options.values.length) {
            self.options.values = self.options.values.map(function(value) {
                return {
                    id: value.id || value,
                    title: value.title || value
                };
            });
            self.value = Ox.getIndexById(self.options.values, self.options.value);
            if (self.value == -1) {
                self.value = 0;
                self.options.value = self.options.values[0].id;
            }
            self.options.title = self.options.values[self.value].title;
        } else if (self.options.selectable) {
            self.options.value = self.options.value || false;
        }
    }

    /*@
    toggle <f> toggle
        () -> <o> toggle button 
    @*/
    that.toggle = function() {
        if (self.options.values.length > 1) {
            self.value = 1 - Ox.getIndexById(self.options.values, self.options.value);
            self.options.title = self.options.values[self.value].title;
            self.options.value = self.options.values[self.value].id;
            setTitle();
            // fixme: if the tooltip is visible
            // we also need to call show()
            that.$tooltip && that.$tooltip.options({
                title: self.options.tooltip[self.value]
            });
        } else {
            self.options.value = !self.options.value;
        }
        self.options.selectable && setSelected();
        return that;
    }

    return that;

};
