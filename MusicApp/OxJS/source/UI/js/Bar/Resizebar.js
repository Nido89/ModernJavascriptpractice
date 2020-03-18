'use strict';
/*@
Ox.Resizebar <f> Resizebar
    options <o> Options object
        collapsed   <b|false> Inital collapse state
        collapsible <b|true> If true, can be collapsed/expanded
        edge        <s|left> Edge
        elements    <a|[]> Elements of the bar
        orientation <s|horizontal> Orientation ('horizontal' or 'vertical')
        panel       <o|null> Panel object
        resizeable  <b|true> If true, can be resetted to default or original size
        resizeable  <b|true> If true, can be resized
        resize      <a|[]> Array of sizes
        size        <n|0> Default size
        tooltip     <b|s|false> If true, display tooltip, if string, append it
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.Element> Resizebar object
@*/
Ox.Resizebar = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({
            collapsed: false,
            collapsible: false,
			defaultSize: null,
            edge: 'left',
            orientation: 'horizontal',
			resettable: false,
            resizable: false,
            resize: [],
            size: 0,
            tooltip: false
        })
        .options(options || {})
        .update({
            collapsed: function() {
                that.css({cursor: getCursor()});
                self.$tooltip && self.$tooltip.options({title: getTooltipTitle()});
            }
        })
        .addClass('OxResizebar Ox' + Ox.toTitleCase(self.options.orientation))
        .bindEvent(Ox.extend({
			dragstart: onDragstart,
			drag: onDrag,
			dragpause: onDragpause,
			dragend: onDragend
        }, self.options.resettable ? {
        	doubleclick: reset,
			singleclick: toggle
        } : {
        	anyclick: toggle
        }))
        .append(Ox.$('<div>').addClass('OxSpace'))
        .append(Ox.$('<div>').addClass('OxLine'))
        .append(Ox.$('<div>').addClass('OxSpace'));

    if (Ox.isString(self.options.tooltip)) {
        // FIXME: Use Ox.Element's tooltip
        self.$tooltip = Ox.Tooltip({title: getTooltipTitle()});
        that.on({
            mouseenter: self.$tooltip.show,
            mouseleave: self.$tooltip.hide
        });
    }

	self.clientXY = self.options.orientation == 'horizontal'
		? 'clientY' : 'clientX';
	self.dimensions = Ox.UI.DIMENSIONS[self.options.orientation];
	self.edges = Ox.UI.EDGES[self.options.orientation];
	self.isLeftOrTop = self.options.edge == 'left' || self.options.edge == 'top';

    that.css({cursor: getCursor()});

    function getCursor() {
        var cursor = '';
        if (self.options.collapsed) {
            cursor = self.options.orientation == 'horizontal'
                ? (self.isLeftOrTop ? 's' : 'n')
                : (self.isLeftOrTop ? 'e' : 'w');
        } else {
            if (self.options.resizable) {
                cursor = self.options.orientation == 'horizontal'
                    ? 'ns' : 'ew';
            } else if (self.options.collapsible) {
                cursor = self.options.orientation == 'horizontal'
                    ? (self.isLeftOrTop ? 'n' : 's')
                    : (self.isLeftOrTop ? 'w' : 'e');
            }
        }
        return cursor + '-resize';
    }

    function getTooltipTitle() {
        var title = '';
        if (self.options.collapsed) {
            title = Ox._('Click to show');
        } else {
            if (self.options.resizable) {
                title = Ox._('Drag to resize');
            }
            if (self.options.collapsible) {
                title = title
                    ? Ox._('{0}{1} click to hide', [
						title, self.options.resettable ? ',' : ' or'
					])
                    : Ox._('Click to hide');
            }
			if (self.options.resettable) {
				title += ' or doubleclick to reset'
			}
        }
        if (title && self.options.tooltip) {
            title += ' ' + self.options.tooltip;
        }
        return title;
    }

	function onDragstart(data) {
        if (self.options.resizable && !self.options.collapsed) {
            Ox.$body.addClass('OxDragging');
            self.drag = {
                startPos: data[self.clientXY],
                startSize: self.options.size
            }
        }
		that.triggerEvent('resizestart', {size: self.options.size});
	}

	function onDrag(data) {
        if (self.options.resizable && !self.options.collapsed) {
            var delta = data[self.clientXY] - self.drag.startPos,
                size = self.options.size;
            self.options.size = Ox.limit(
                self.drag.startSize + delta * (self.isLeftOrTop ? 1 : -1),
                self.options.resize[0],
                self.options.resize[self.options.resize.length - 1]
            );
            Ox.forEach(self.options.resize, function(value) {
                if (
					self.options.size >= value - 8
					&& self.options.size <= value + 8
				) {
                    self.options.size = value;
                    return false; // break
                }
            });
			if (self.options.size != size) {
                that.css(
						self.edges[self.isLeftOrTop ? 2 : 3],
						self.options.size + 'px'
					)
					.triggerEvent('resize', {size: self.options.size});
			}
		}
	}

	function onDragpause() {
        if (self.options.resizable && !self.options.collapsed) {
            if (self.options.size != self.drag.startSize) {
				that.triggerEvent('resizepause', {size: self.options.size});
            }
		}
	}

	function onDragend() {
        if (self.options.resizable && !self.options.collapsed) {
            Ox.$body.removeClass('OxDragging');
            if (self.options.size != self.drag.startSize) {
				that.triggerEvent('resizeend', {size: self.options.size});
            }
		}
	}

    function reset() {
        if (self.options.resizable && !self.options.collapsed) {
            that.triggerEvent('reset');
        }
    }

    function toggle() {
        if (self.options.collapsible) {
            self.options.collapsed = !self.options.collapsed;
            that.css({cursor: getCursor()});
            self.$tooltip && self.$tooltip.hide(function() {
                self.$tooltip.options({title: getTooltipTitle()});
            });
			that.triggerEvent('toggle', {collapsed: self.options.collapsed});
        }
    }

    return that;

};
