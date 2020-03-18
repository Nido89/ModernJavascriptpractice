'use strict';

/*@
Ox.SplitPanel <f> SpliPanel Object
    options <o> Options object
        elements <[o]|[]> Array of two or three element objects
            collapsible <b|false> If true, can be collapsed (if outer element)
            collapsed <b|false> If true, is collapsed (if collapsible)
            defaultSize <n|s|"auto"> Default size in px (restorable via reset)
            element <o> Any Ox.Element
                If any element is collapsible or resizable, all elements must
                have an id.
            resettable <b|false> If true, can be resetted (if outer element)
                Note that reset fires on doubleclick, and if the element is also
                collapsible, toggle now fires on singleclick, no longer on click.
                Singleclick happens 250 ms later.
            resizable <b|false> If true, can be resized (if outer element)
            resize <[n]|[]> Min size, optional snappy points, and max size
            size <n|s|"auto"> Size in px (one element must be "auto")
            tooltip <b|s|false> If true, show tooltip, if string, append it
        orientation <s|"horizontal"> orientation ("horizontal" or "vertical")
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.Element> SpliPanel Object
        resize <!> resize
            Fires on resize, on both elements being resized
        resizeend <!> resizeend
            Fires on resize, on both elements being resized
        resizepause <!> resizepause
            Fires on resize, on both elements being resized
        toggle <!> toggle
            Fires on collapse or expand, on the element being toggled
@*/

Ox.SplitPanel = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
            .defaults({
                elements: [],
                orientation: 'horizontal'
            })
            .options(options || {})
            .addClass('OxSplitPanel');

    self.defaultSize = self.options.elements.map(function(element) {
        return !Ox.isUndefined(element.defaultSize)
            ? element.defaultSize : element.size;
    });
    self.dimensions = Ox.UI.DIMENSIONS[self.options.orientation];
    self.edges = Ox.UI.EDGES[self.options.orientation];
    self.initialized = false;
    self.length = self.options.elements.length;

    self.$elements = [];
    self.$resizebars = [];
    self.options.elements.forEach(function(element, index) {
        var elementIndices = index == 0 ? [0, 1] : index == 1 ? [1, 0] : [2, 1],
            resizebarIndex = self.$resizebars.length;
        self.options.elements[index] = Ox.extend({
            collapsible: false,
            collapsed: false,
            defaultSize: 'auto',
            resettable: false,
            resizable: false,
            resize: [],
            size: 'auto',
            tooltip: false
        }, element);
        // top and bottom (horizontal) or left and right (vertical)
        self.edges.slice(2).forEach(function(edge) {
            element.element.css(
                edge, (parseInt(element.element.css(edge)) || 0) + 'px'
            );
        });
        if (element.collapsed) {
            // left/right (horizontal) or top/bottom (vertical)
            that.css(self.edges[index == 0 ? 0 : 1], -element.size + 'px');
        }
        self.$elements[index] = element.element.appendTo(that);
        if (element.collapsible || element.resizable) {
            self.$resizebars[resizebarIndex] = Ox.Resizebar({
                collapsed: element.collapsed,
                collapsible: element.collapsible,
                edge: self.edges[index == 0 ? 0 : 1],
                orientation: self.options.orientation == 'horizontal'
                    ? 'vertical' : 'horizontal',
                resettable: element.resettable,
                resizable: element.resizable,
                resize: element.resize,
                size: element.size,
                tooltip: element.tooltip === true ? '' : element.tooltip
            })
            .bindEvent({
                reset: function() {
                    that.resetElement(index);
                },
                resize: function(data) {
                    onResize(elementIndices, data.size);
                    triggerEvents(elementIndices, 'resize', data);
                },
                resizepause: function(data) {
                    triggerEvents(elementIndices, 'resizepause', data);
                },
                resizeend: function(data) {
                    triggerEvents(elementIndices, 'resizeend', data);
                },
                toggle: function(data) {
                    that.toggleElement(index);
                }
            })
            [index == 0 ? 'insertAfter' : 'insertBefore'](self.$elements[index]);
        }
    });

    setSizes();

    function getSize(index) {
        var element = self.options.elements[index];
        return element.size + (element.collapsible || element.resizable);
    }

    function getVisibleSize(index) {
        var element = self.options.elements[index];
        return getSize(index) * !element.collapsed;
    }

    function onResize(elementIndices, size) {
        var dimension = self.dimensions[0],
            edge = self.edges[elementIndices[0] == 0 ? 0 : 1];
        self.options.elements[elementIndices[0]].size = size;
        elementIndices.forEach(function(elementIndex, index) {
            self.$elements[elementIndex].css(
                index == 0 ? dimension : edge,
                (index == 0 ? size : size + 1) + 'px'
            );
        });
    }

    function setSizes(animate) {
        // will animate if animate is truthy and call animate if it's a function
        self.options.elements.forEach(function(element, index) {
            var $resizebar,
                css = {},
                edges = self.edges.slice(0, 2).map(function(edge) {
                     // left/right (horizontal) or top/bottom (vertical)
                     var value = parseInt(self.$elements[index].css(edge));
                     return !self.initialized && value || 0;
                });
            if (element.size != 'auto') {
                // width (horizontal) or height (vertical)
                css[self.dimensions[0]] = element.size + 'px';
            }
            if (index == 0) {
                // left (horizontal) or top (vertical)
                css[self.edges[0]] = edges[0] + 'px';
                // right (horizontal) or bottom (vertical)
                if (element.size == 'auto') {
                    css[self.edges[1]] = getSize(1) + (
                        self.length == 3 ? getVisibleSize(2) : 0
                    ) + 'px';
                }
            } else if (index == 1) {
                // left (horizontal) or top (vertical)
                if (self.options.elements[0].size != 'auto') {
                    css[self.edges[0]] = edges[0] + getSize(0) + 'px';
                } else {
                    css[self.edges[0]] = 'auto'; // fixme: why is this needed?
                }
                // right (horizontal) or bottom (vertical)
                css[self.edges[1]] = (self.length == 3 ? getSize(2) : 0) + 'px';
            } else {
                // left (horizontal) or top (vertical)
                if (element.size == 'auto') {
                    css[self.edges[0]] = getVisibleSize(0) + getSize(1) + 'px';
                } else {
                    css[self.edges[0]] = 'auto'; // fixme: why is this needed?
                }
                // right (horizontal) or bottom (vertical)
                css[self.edges[1]] = edges[1] + 'px';
            }
            if (animate) {
                self.$elements[index].animate(css, 250, function() {
                    index == 0 && Ox.isFunction(animate) && animate();
                });
            } else {
                self.$elements[index].css(css);
            }
            if (element.collapsible || element.resizable) {
                $resizebar = self.$resizebars[
                    index < 2 ? 0 : self.$resizebars.length - 1
                ];
                // left or right (horizontal) or top or bottom (vertical)
                css = Ox.extend(
                    {}, self.edges[index == 0 ? 0 : 1], element.size + 'px'
                );
                if (animate) {
                    $resizebar.animate(css, 250);
                } else {
                    $resizebar.css(css);
                }
                $resizebar.options({size: element.size});
            }
        });
        self.initialized = true;
    }

    function triggerEvents(elementIndices, event, data) {
        elementIndices.forEach(function(elementIndex, index) {
            var $element = self.$elements[elementIndex],
                size = index == 0 ? data.size : $element[self.dimensions[0]]();
            $element.triggerEvent(event, {size: size});
        });
    }

    /*@
    isCollapsed <f> Tests if an outer element is collapsed
        (index) -> <b> True if collapsed
        index <i> The element's index
    @*/
    that.isCollapsed = function(index) {
        return self.options.elements[index].collapsed;
    };

    /*@
    replaceElement <f> Replaces an element
        (index, element) -> <f> replace element
        index <n> The element's index
        element <o> New element
    @*/
    that.replaceElement = function(index, element) {
        // top and bottom (horizontal) or left and right (vertical)
        self.edges.slice(2).forEach(function(edge) {
            element.css(edge, (parseInt(element.css(edge)) || 0) + 'px');
        });
        self.$elements[index] = element;
        self.options.elements[index].element.replaceWith(
            self.options.elements[index].element = element
        );
        setSizes();
        return that;
    };

    /*@
    resetElement <f> Resets an outer element to its initial size
    @*/
    that.resetElement = function(index) {
        var element = self.options.elements[index];
        element.size = self.defaultSize[index];
        setSizes(function() {
            element.element.triggerEvent('resize', {
                size: element.size
            });
            element = self.options.elements[index == 0 ? 1 : index - 1];
            element.element.triggerEvent('resize', {
                size: element.element[self.dimensions[0]]()
            });
        });
        return that;
    };

    /*@
    size <f> Get or set size of an element
        (index) -> <i> Returns size
        (index, size) -> <o> Sets size, returns SplitPanel
        (index, size, callback) -> <o> Sets size with animation, returns SplitPanel
        index <i> The element's index
        size <i> New size, in px
        callback <b|f> Callback function (passing true animates w/o callback)
    @*/
    that.resizeElement = that.size = function(index, size, callback) {
        var element = self.options.elements[index];
        if (arguments.length == 1) {
            return element.element[self.dimensions[0]]()
                * !that.isCollapsed(index);
        } else {
            element.size = size;
            setSizes(callback);
            return that;
        }
    };

    /*@
    toggleElement <f> Toggles collapsed state of an outer element
        (index) -> <o> The SplitPanel
        index <s|i> The element's index
    @*/
    that.toggleElement = function(index) {
        if (self.toggling) {
            return that;
        }
        var element = self.options.elements[index],
            value = parseInt(that.css(self.edges[index == 0 ? 0 : 1]))
                + element.element[self.dimensions[0]]()
                * (element.collapsed ? 1 : -1),
            animate = Ox.extend({}, self.edges[index == 0 ? 0 : 1], value);
        self.toggling = true;
        that.animate(animate, 250, function() {
            element.collapsed = !element.collapsed;
            element.element.triggerEvent('toggle', {
                collapsed: element.collapsed
            });
            self.$resizebars[index < 2 ? 0 : self.$resizebars.length - 1].options({
                collapsed: element.collapsed
            });
            element = self.options.elements[index == 0 ? 1 : index - 1];
            element.element.triggerEvent('resize', {
                size: element.element[self.dimensions[0]]()
            });
            self.toggling = false;
        });
        return that;
    };

    return that;

};
