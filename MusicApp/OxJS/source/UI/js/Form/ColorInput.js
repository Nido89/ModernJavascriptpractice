'use strict';

/*@
Ox.ColorInput <f> ColorInput Element
    options <o> Options object
        mode <s|'rgb'> Mode ('rgb' or 'hsl')
        value <[n]|[0, 0, 0]> Value
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.InputGroup> ColorInput Element
        change <!> change
@*/
Ox.ColorInput = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({
            mode: 'rgb',
            value: options.mode == 'hsl' ? [0, 1, 0.5] : [0, 0, 0]
        })
        .options(options || {});

    self.$inputs = [];
    Ox.loop(3, function(i) {
        self.$inputs[i] = Ox.Input({
            max: self.options.mode == 'rgb' ? 255 : i == 0 ? 360 : 1,
            type: self.options.mode == 'rgb' || i == 0 ? 'int' : 'float',
            value: self.options.value[i],
            width: 40
        })
        .bindEvent('autovalidate', change);
    });
    self.$inputs[3] = Ox.Label({
            width: 40
        })
        .css({
            background: 'rgb(' + getRGB().join(', ') + ')'
        });
    self.$inputs[4] = Ox.ColorPicker({
            mode: self.options.mode,
            width: 16
        })
        .bindEvent({
            change: function(data) {
                self.options.value = data.value;
                Ox.loop(3, function(i) {
                    self.$inputs[i].options({value: self.options.value[i]});
                });
                self.$inputs[3].css({
                    background: 'rgb(' + getRGB().join(', ') + ')'
                });
            }
        })
        .options({
            width: 16 // this is just a hack to make the InputGroup layout work
        });

    that.setElement(Ox.InputGroup({
            inputs: self.$inputs,
            separators: [
                {title: ',', width: 8},
                {title: ',', width: 8},
                {title: '', width: 8},
                {title: '', width: 8}
            ],
            value: Ox.clone(self.options.value)
        })
        .bindEvent('change', change)
    );

    function change() {
        self.options.value = Ox.range(3).map(function(i) {
            return self.$inputs[i].options('value');
        })
        self.$inputs[3].css({
            background: 'rgb(' + getRGB().join(', ') + ')'
        });
        that.triggerEvent('change', {value: self.options.value});
    }

    function getRGB() {
        return self.options.mode == 'rgb'
            ? self.options.value
            : Ox.rgb(self.options.value);
    }

    return that;

};
