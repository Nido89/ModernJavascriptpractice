'use strict';

/*@
Ox.VideoPreview <f> Video Preview
    options <o> Options
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.Element> Video Preview
        click <!> click
@*/
Ox.VideoPreview = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({
            duration: 0,
            getFrame: null,
            fps: 25,
            frameRatio: 16/9,
            height: 256,
            position: void 0,
            scaleToFill: false,
            timeline: '',
            videoTooltip: null,
            width: 256
        })
        .options(options || {})
        .update({
            height: function() {
                that.css({height: self.options.height + 'px'});
                self.$frame.css(getFrameCSS());
            },
            position: function() {
                self.$frame.attr({src: self.options.getFrame(self.options.position)});
            },
            width: function() {
                that.css({width: self.options.width + 'px'});
                stopLoading();
                self.$frame.attr({src: self.options.getFrame()})
                    .css(getFrameCSS());
                self.$timeline && self.$timeline.css({width: self.options.width + 'px'});
            }
        })
        .addClass('OxVideoPreview')
        .css({
            width: self.options.width + 'px',
            height: self.options.height + 'px'
        });

    self.loaded = [];
    self.queue = [];

    self.$frameElement = Ox.$('<div>')
        .addClass('OxFrame')
        .appendTo(that);

    self.$frame = Ox.$('<img>')
        .attr({src: self.options.getFrame(self.options.position)})
        .css(getFrameCSS())
        .appendTo(self.$frameElement);

    if (self.options.timeline) {
        self.$timeline = $('<img>')
            .addClass('OxTimeline')
            .attr({src: self.options.timeline})
            .css({width: self.options.width + 'px'})
            .appendTo(that);
    }

    self.$interface = Ox.Element({
            tooltip: function(event) {
                // e.offsetX does not work in Firefox
                var position = getPosition(event.clientX - that.offset().left),
                    tooltip = Ox.isFunction(self.options.videoTooltip)
                        ? self.options.videoTooltip() : self.options.videoTooltip;
                self.$frame.attr({src: getClosestFrame(position)});
                self.timeout && clearTimeout(self.timeout);
                self.timeout = setTimeout(function() {
                    self.$frame.attr({src: self.options.getFrame(position)});
                }, 250);
                return '<div style="text-align: center">'
                    + (tooltip ? tooltip + '<br>' : '')
                    + '<span class="OxLight">' + Ox.formatDuration(position, 2) + '</span>'
                    + '</div>';
            }        
        })
        .addClass('OxInterface')
        .on({
            click: click,
            mouseenter: startLoading,
            mouseleave: function() {
                stopLoading();
                self.$frame.attr({src: self.options.getFrame(self.options.position)});
            }
        })
        .bindEvent({
            touchend: touchend,
            touchmove: touchmove,
            touchstart: startLoading
        })
        .appendTo(that);

    function click(e) {
        that.triggerEvent('click', {
            // e.offsetX does not work in Firefox
            position: getPosition(e.clientX - that.offset().left)
        });
    }

    function getClosestFrame(position) {
        return self.loaded.length == 0
            ? self.options.getFrame(self.options.position)
            : self.loaded.sort(function(a, b) {
                return Math.abs(a.position - position) - Math.abs(b.position - position);
            })[0].frame;
    }

    function getFrameCSS() {
        var css = {},
            elementWidth = self.options.width,
            elementHeight = self.options.height - (self.options.timeline ? 16 : 0),
            elementRatio = elementWidth / elementHeight,
            frameRatio = self.options.frameRatio,
            frameIsWider = frameRatio > elementRatio;
        if (self.options.scaleToFill) {
            css.width = frameIsWider ? elementHeight * frameRatio : elementWidth;
            css.height = frameIsWider ? elementHeight : elementWidth / frameRatio;
            css.marginLeft = frameIsWider ? (elementWidth - css.width) / 2 : 0;
            css.marginTop = frameIsWider ? 0 : (elementHeight - css.height) / 2;
        } else {
            css.width = frameIsWider ? elementWidth : elementHeight * frameRatio;
            css.height = frameIsWider ? elementWidth / frameRatio : elementHeight;
            css.marginLeft = frameIsWider ? 0 : (elementWidth - css.width) / 2;
            css.marginTop = frameIsWider ? (elementHeight - css.height) / 2 : 0;
        }
        return Ox.map(css, function(value) {
            return Math.round(value) + 'px';
        });
    }

    function getPosition(x) {
        return Math.round(
            self.options.duration * x / self.options.width * self.options.fps
        ) / self.options.fps;
    }

    function startLoading() {
        var last,
            steps = [Math.round(self.options.width / 2)];
        while ((last = steps[steps.length - 1]) > 1) {
            steps.push(Math.round(last / 2));
        }
        steps.forEach(function(step) {
            Ox.loop(0, self.options.width, step, function(x) {
                var position = getPosition(x),
                    frame = self.options.getFrame(position);
                if (!self.loaded.some(function(image) {
                    return image.frame == frame;
                }) && !self.queue.some(function(image) {
                    return image.frame == frame;
                })) {
                    self.queue.push({frame: frame, position: position});
                }
            });
        });
        self.queue.length && loadFrame();
        function loadFrame() {
            var image = self.queue.shift();
            $('<img>')
                .load(function() {
                    self.loaded.push(image);
                    self.queue.length && loadFrame();
                })
                .attr({src: image.frame})
        }
    }

    function stopLoading() {
        self.queue = [];
        self.timeout && clearTimeout(self.timeout);
    }

    function touchend(e) {
        var position = getPosition(e.clientX - that.offset().left);
        stopLoading();
        self.$frame.attr({src: getClosestFrame(position)});
        that.triggerEvent('click', {
            position: position
        });
    }
    function touchmove(e) {
        var position = getPosition(e.clientX - that.offset().left);
        self.$frame.attr({src: getClosestFrame(position)});
    }

    return that;

};
