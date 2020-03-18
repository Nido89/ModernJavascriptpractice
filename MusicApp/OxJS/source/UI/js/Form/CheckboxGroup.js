'use strict';

/*@
Ox.CheckboxGroup <f> CheckboxGroup Object
    options <o> Options object
        checkboxes      <a|[]>      array of checkboxes
        max             <n|1>       max selected
        min             <n|1>       min selected
        type            <s|"group"> type ("group" or "list")    
        width           <n>         width in px
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.Element> CheckboxGroup Object
        change <!> triggered when checked property changes
            passes {id, title, value}
@*/

Ox.CheckboxGroup = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
            .defaults({
                // fixme: 'checkboxes' should be 'items'?
                checkboxes: [],
                max: 1,
                min: 1,
                type: 'group',
                value: options.max != 1 ? [] : '',
                width: 256
            })
            .options(options || {})
            .update({
                value: function() {
                    var value = Ox.clone(self.options.value);
                    self.$checkboxes.forEach(function($checkbox, index) {
                        var checked = Ox.contains(value, $checkbox.options('id'));
                        if (checked != $checkbox.value()) {
                            $checkbox.value(!$checkbox.value());
                            toggleCheckbox(index);
                        }
                    });
                },
                width: function() {
                    self.$checkboxes.forEach(function($checkbox) {
                        $checkbox.options({width: self.options.width});
                    });
                }
            })
            .addClass('OxCheckboxGroup Ox' + Ox.toTitleCase(self.options.type));

    self.options.checkboxes = self.options.checkboxes.map(function(checkbox) {
        return {
            checked: Ox.makeArray(self.options.value).indexOf(checkbox.id || checkbox) > -1,
            id: checkbox.id || checkbox,
            title: checkbox.title || checkbox
        };
    });

    self.optionGroup = new Ox.OptionGroup(
        self.options.checkboxes,
        self.options.min,
        self.options.max,
        'checked'
    );
    self.options.checkboxes = self.optionGroup.init();
    self.options.value = self.optionGroup.value();

    self.$checkboxes = [];
    if (self.options.type == 'group') {
        self.checkboxWidth = Ox.splitInt(
            self.options.width + (self.options.checkboxes.length - 1) * 6,
            self.options.checkboxes.length
        ).map(function(v, i) {
            return v + (i < self.options.checkboxes.length - 1 ? 10 : 0);
        });
    };

    self.options.checkboxes.forEach(function(checkbox, pos) {
        self.$checkboxes[pos] = Ox.Checkbox(Ox.extend(checkbox, {
                group: true,
                id: checkbox.id,
                width: self.options.type == 'group'
                    ? self.checkboxWidth[pos] : self.options.width,
                value: checkbox.checked
            }))
            .bindEvent('change', function() {
                toggleCheckbox(pos);
            })
            .appendTo(that);
    });

    function toggleCheckbox(pos) {
        var toggled = self.optionGroup.toggle(pos);
        Ox.Log('Form', 'change', pos, 'toggled', toggled)
        if (!toggled.length) {
            // FIXME: fix and use that.toggleOption()
            self.$checkboxes[pos].value(!self.$checkboxes[pos].value());
        } else {
            toggled.forEach(function(i) {
                i != pos && self.$checkboxes[i].value(!self.$checkboxes[i].value());
            });
            self.options.value = self.optionGroup.value();
            that.triggerEvent('change', {
                title: Ox.isString(self.options.value)
                    ? (
                        self.options.value
                        ? Ox.getObjectById(self.options.checkboxes, self.options.value).title
                        : ''
                    )
                    : self.options.value.map(function(value) {
                        return Ox.getObjectById(self.options.checkboxes, value).title;
                    }),
                value: self.options.value
            });
        }
    }

    return that;

};
