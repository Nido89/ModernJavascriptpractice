'use strict';

Ox.SlidePanel = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({
            animate: 250,
            elements: [],
            orientation: 'horizontal',
            selected: ''
        })
        .options(options || {})
        .update({
            selected: function() {
                selectElement(self.options.selected);
            },
            size: updateElements
        })
        .addClass('OxSlidePanel');

    if (!self.options.selected) {
        self.options.selected = self.options.elements[0].id
    }
    self.elements = self.options.elements.length;
    self.$content = Ox.Element()
        .css(getContentCSS())
        .appendTo(that);
    updateElements();
    self.options.elements.forEach(function(element, index) {
        element.element.appendTo(self.$content);
    });

    function getContentCSS() {
        return {
            left: -Ox.getIndexById(self.options.elements, self.options.selected)
                * self.options.size + 'px',
            width: self.elements * self.options.size + 'px'
        };
    }

    function getElementCSS(index) {
        return {
            left: index * self.options.size + 'px',
            width: self.options.size + 'px'
        };
    }

    function selectElement(id) {
        self.$content.animate({
            left: getContentCSS().left,
        }, self.options.animate);
    }

    function updateElements() {
        self.$content.css(getContentCSS());
        self.options.elements.forEach(function(element, index) {
            element.element.css(getElementCSS(index));
        });
    }

    that.replaceElement = function(idOrIndex, element) {
        var index = Ox.isNumber(idOrIndex) ? idOrIndex
            : Ox.getIndexById(self.options.elements, idOrIndex);
        self.options.elements[index].element.replaceWith(
            self.options.elements[index].element = element.css(getElementCSS(index))
        );
        return that;
    };

    return that;

};