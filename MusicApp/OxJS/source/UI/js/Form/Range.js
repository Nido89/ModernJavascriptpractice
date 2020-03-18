'use strict';

/*@
Ox.Range <f> Range Object
    options <o> Options object
        arrows        <b>          if true, show arrows
        arrowStep     <n>          step when clicking arrows
        arrowSymbols  <[s]>        arrow symbols, like ['minus', 'plus']
        arrowTooltips <[s]>        arrow tooltips
        max           <n>          maximum value
        min           <n>          minimum value
        orientation   <s>          'horizontal' or 'vertical'
        step          <n>          step between values
        size          <n>          width or height, in px
        thumbSize     <n>          minimum width or height of thumb, in px
        thumbStyle    <s|'opaque'> Thumb style ('opaque' or 'transparent')
        thumbValue    <b>          if true, display value on thumb
        trackColors   <[s]>        CSS colors
        trackGradient <b|false>    if true, display track colors as gradient
        trackImages   <s|[s]>      one or multiple track background image URLs
        trackStep     <n>          0 (scroll here) or step when clicking track
        value         <n>          initial value
        values        <[s]>        values to display on thumb
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.Element> Range Object
        change <!> triggered on change of the range
@*/

Ox.Range = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({
            arrows: false,
            arrowStep: 1,
            arrowSymbols: ['left', 'right'],
            arrowTooltips: ['', ''],
            changeOnDrag: false,
            disabled: false,
            max: 100,
            min: 0,
            orientation: 'horizontal',
            step: 1,
            size: 128, // fixme: shouldn't this be width?
            thumbSize: 16,
            thumbStyle: 'default',
            thumbValue: false,
            trackColors: [],
            trackGradient: false,
            trackImages: [],
            trackStep: 0,
            value: 0,
            values: []
        })
        .options(options || {})
        .update({
            disabled: setDisabled,
            max: setSizes,
            min: setSizes,
            step: setSizes,
            size: setSizes,
            trackColors: setTrackColors,
            value: setThumb
        })
        .addClass('OxRange')
        .css({
            width: self.options.size + 'px'
        });

    self.hasValues = !Ox.isEmpty(self.options.values);
    if (self.hasValues) {
        self.options.max = self.options.values.length - 1;
        self.options.min = 0;
        self.options.step = 1;
        self.options.thumbValue = true;
        self.options.value = Ox.isNumber(self.options.value)
            ? self.options.values[self.options.value] : self.options.value;
    }
    self.options.arrowStep = options.arrowStep || self.options.step;
    self.options.trackImages = Ox.makeArray(self.options.trackImages);

    self.trackColors = self.options.trackColors.length;
    self.trackImages = self.options.trackImages.length;

    setSizes();

    if (self.options.arrows) {
        self.$arrows = [];
        Ox.range(2).forEach(function(i) {
            self.$arrows[i] = Ox.Button({
                disabled: self.options.disabled,
                overlap: i == 0 ? 'right' : 'left',
                title: self.options.arrowSymbols[i],
                tooltip: self.options.arrowTooltips[i],
                type: 'image'
            })
            .addClass('OxArrow')
            .bindEvent({
                mousedown: function(data) {
                    clickArrow(data, i, true);
                },
                mouserepeat: function(data) {
                    clickArrow(data, i, false);
                }
            })
            .appendTo(that);
        });
    }

    self.$track = Ox.Element()
        .addClass('OxTrack')
        .css(Ox.extend({
            width: (self.trackSize - 2) + 'px'
        }, self.trackImages == 1 ? {
            background: 'rgb(0, 0, 0)'
        } : {}))
        .bindEvent(Ox.extend({
            mousedown: clickTrack,
            drag: dragTrack
        }, self.options.changeOnDrag ? {} : {
            dragend: dragendTrack
        }))
        .appendTo(that);

    self.trackColors && setTrackColors();

    if (self.trackImages) {
        self.$trackImages = $('<div>')
            .css({
                width: self.trackSize + 'px',
                marginRight: (-self.trackSize - 1) + 'px'
            })
            .appendTo(self.$track.$element);
        self.options.trackImages.forEach(function(v, i) {
            $('<img>')
                .attr({
                    src: v
                })
                .addClass(i == 0 ? 'OxFirstChild' : '')
                .addClass(i == self.trackImages - 1 ? 'OxLastChild' : '')
                .css({
                    width: self.trackImageWidths[i] + 'px'
                })
                .on({
                    mousedown: function(e) {
                        e.preventDefault(); // prevent drag
                    }
                })
                .appendTo(self.$trackImages);
            //left += self.trackImageWidths[i];
        });
    }

    self.$thumb = Ox.Button({
            disabled: self.options.disabled,
            id: self.options.id + 'Thumb',
            width: self.thumbSize
        })
        .addClass('OxThumb' + (
            self.options.thumbStyle == 'transparent' ? ' OxTransparent' : ''
        ))
        .appendTo(self.$track);

    setThumb();

    function clickArrow(data, i, animate) {
        // fixme: shift doesn't work, see menu scrolling
        setValue(
            self.options.value
            + self.options.arrowStep * (i == 0 ? -1 : 1) * (data.shiftKey ? 2 : 1),
            animate,
            true
        );
    }

    function clickTrack(data) {
        // fixme: thumb ends up a bit too far on the right
        if (self.options.disabled) {
            return;
        }
        var isThumb = $(data.target).hasClass('OxThumb');
        self.drag = {
            left: self.$track.offset().left,
            offset: isThumb ? data.clientX - self.$thumb.offset().left - 8 /*self.thumbSize / 2*/ : 0
        };
        setValue(getValue(data.clientX - self.drag.left - self.drag.offset), !isThumb, true);
    }

    function dragTrack(data) {
        if (self.options.disabled) {
            return;
        }
        setValue(
            getValue(data.clientX - self.drag.left - self.drag.offset),
            false,
            self.options.changeOnDrag
        );
    }

    function dragendTrack(data) {
        if (self.options.disabled) {
            return;
        }
        self.options.value = void 0;
        setValue(getValue(data.clientX - self.drag.left - self.drag.offset), false, true);
    }

    function getPx(value) {
        var pxPerValue = (self.trackSize - self.thumbSize)
            / (self.options.max - self.options.min);
        value = self.hasValues ? self.options.values.indexOf(value) : value;
        return Math.ceil((value - self.options.min) * pxPerValue);
    }

    /*
    function getTime(oldValue, newValue) {
        return self.animationTime * Math.abs(oldValue - newValue) / (self.options.max - self.options.min);
    }
    */

    function getValue(px) {
        var px = self.trackSize / self.values >= 16 ? px : px - 8,
            valuePerPx = (self.options.max - self.options.min)
                / (self.trackSize - self.thumbSize),
            value = Ox.limit(
                self.options.min
                    + Math.floor(px * valuePerPx / self.options.step) * self.options.step,
                self.options.min,
                self.options.max
            );
        return self.hasValues ? self.options.values[value] : value;
    }

    function setDisabled() {
        if (self.options.arrows) {
            self.$arrows[0].options({disabled: self.options.disabled});
            self.$arrows[1].options({disabled: self.options.disabled});
        }
        self.$thumb.options({disabled: self.options.disabled});
    }

    function setSizes() {
        self.values = (
            self.options.max - self.options.min + self.options.step
        ) / self.options.step;
        self.trackSize = self.options.size - self.options.arrows * 32;
        self.thumbSize = Math.max(self.trackSize / self.values, self.options.thumbSize);
        self.trackImageWidths = self.trackImages == 1
            ? [self.trackSize - 16]
            : Ox.splitInt(self.trackSize - 2, self.trackImages);
        self.trackColorStart = self.options.trackGradient
            ? self.thumbSize / 2 / self.options.size : 0;
        self.trackColorStep = self.options.trackGradient
            ? (self.options.size - self.thumbSize) / (self.trackColors - 1) / self.options.size
            : 1 / self.trackColors;
        that.css({
            width: self.options.size + 'px'
        });
        self.$track && self.$track.css({
            width: (self.trackSize - 2) + 'px'
        });
        if (self.$thumb) {
            self.$thumb.options({width: self.thumbSize});
            setThumb();
        }
    }

    function setThumb(animate) {
        self.$thumb.stop().animate({
            marginLeft: getPx(self.options.value) - 1 + 'px'
            //, width: self.thumbSize + 'px'
        }, animate ? 250 : 0, function() {
            self.options.thumbValue && self.$thumb.options({
                title: self.options.value
            });
        });
    }

    function setTrackColors() {
        ['moz', 'o', 'webkit'].forEach(function(browser) {
            self.$track.css({
                background: '-' + browser + '-linear-gradient(left, '
                    + self.options.trackColors[0] + ' 0%, '
                    + self.options.trackColors.map(function(v, i) {
                        var ret = v + ' ' + (
                            self.trackColorStart + self.trackColorStep * i
                        ) * 100 + '%';
                        if (!self.options.trackGradient) {
                            ret += ', ' + v + ' ' + (
                                self.trackColorStart + self.trackColorStep * (i + 1)
                            ) * 100 + '%';
                        }
                        return ret;
                    }).join(', ') + ', '
                    + self.options.trackColors[self.trackColors - 1] + ' 100%)'
            });
        });
    }

    function setValue(value, animate, trigger) {
        // fixme: toPrecision helps with imprecise results of divisions,
        // but won't work for very large values. And is 10 a good value?
        value = Ox.limit(
            self.hasValues ? self.options.values.indexOf(value) : value.toPrecision(10),
            self.options.min,
            self.options.max
        );
        value = self.hasValues ? self.options.values[value] : value;
        if (value != self.options.value) {
            //time = getTime(self.options.value, value);
            self.options.value = value;
            setThumb(animate);
            trigger && that.triggerEvent('change', {value: self.options.value});
        }
    }

    return that;

};
