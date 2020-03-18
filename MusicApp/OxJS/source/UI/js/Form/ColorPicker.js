'use strict';

/*@
Ox.ColorPicker <f> ColorPicker Element
    options <o> Options object
        mode <s|'rgb'> Mode ('rgb' or 'hsl')
        value <[n]|[0, 0, 0]> Value
    self <o>    Shared private variable
    ([options[, self]]) -> <o:Ox.Picker> ColorPicker Element
        change <!> triggered on change of value
@*/

Ox.ColorPicker = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
            .defaults({
                mode: 'rgb',
                value: options && options.mode == 'hsl' ? [0, 1, 0.5] : [0, 0, 0]
            })
            .options(options || {});

    //Ox.Log('Form', self)
    self.$ranges = [];

    Ox.loop(3, function(i) {
        self.$ranges[i] = Ox.Range({
                arrows: true,
                changeOnDrag: true,
                id: self.options.id + i,
                max: self.options.mode == 'rgb' ? 255 : i == 0 ? 359 : 1,
                size: self.options.mode == 'rgb' ? 328 : 432, // 256|360 + 16 + 40 + 16
                step: self.options.mode == 'rgb' || i == 0 ? 1 : 0.01,
                thumbSize: 40,
                thumbValue: true,
                trackColors: getColors(i),
                trackGradient: true,
                value: self.options.value[i]
            })
            .css({
                position: 'absolute',
                top: (i * 15) + 'px'
            })
            .bindEvent({
                change: function(data) {
                    change(i, data.value);
                }
            })
            .appendTo(that);
        if (i == 0) {
            // fixme: this should go into Ox.UI.css
            self.$ranges[i].children('input.OxOverlapRight').css({
                borderRadius: 0
            });
            self.$ranges[i].children('input.OxOverlapLeft').css({
                borderRadius: '0 8px 0 0'
            });
        } else {
            self.$ranges[i].children('input').css({
                borderRadius: 0
            });
        }
    });

    that = Ox.Picker({
        element: that,
        elementHeight: 46,
        elementWidth: self.options.mode == 'rgb' ? 328 : 432
    });

    function change(index, value) {
        self.options.value[index] = value;
        that.$label.css({
            background: 'rgb(' + getRGB(self.options.value).join(', ') + ')'
        });
        Ox.loop(3, function(i) {
            if (i != index) {
                self.$ranges[i].options({
                    trackColors: getColors(i)
                });
            }
        });
        that.triggerEvent('change', {value: self.options.value});
    }

    function getColors(index) {
        return (
            self.options.mode == 'rgb' ? [
                Ox.range(3).map(function(i) {
                    return i == index ? 0 : self.options.value[i];
                }),
                Ox.range(3).map(function(i) {
                    return i == index ? 255 : self.options.value[i];
                })
            ]
            : index == 0 ? Ox.range(7).map(function(i) {
                return [i * 60, self.options.value[1], self.options.value[2]];
            })
            : Ox.range(3).map(function(i) {
                return [
                    self.options.value[0],
                    index == 1 ? i / 2 : self.options.value[1],
                    index == 2 ? i / 2 : self.options.value[2]
                ];
            })
        ).map(function(values) {
            return 'rgb(' + getRGB(values).join(', ') + ')';
        });
    }

    function getRGB(values) {
        return self.options.mode == 'rgb' ? values : Ox.rgb(values);
    }

    return that;

};
