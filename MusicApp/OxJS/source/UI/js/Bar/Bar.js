'use strict';
/*@
Ox.Bar <f> Bar
    options <o> Options object
        orientation <s|'horizontal'> Orientation ('horizontal' or 'vertical')
        size        <n|s|'medium'> can be 'small', 'medium', 'large' or number
    self    <o> Shared private variable
    ([options[, self]]) -> <o:Ox.Element> Bar object
@*/
Ox.Bar = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
            .defaults({
                orientation: 'horizontal',
                size: 16
            })
            .options(options || {})
            .addClass('OxBar Ox' + Ox.toTitleCase(self.options.orientation));

    self.dimensions = Ox.UI.DIMENSIONS[self.options.orientation];

    that.css(self.dimensions[0], '100%')
        .css(self.dimensions[1], self.options.size + 'px');

    return that;

};
