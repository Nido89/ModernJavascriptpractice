'use strict';

/*@
Ox.LargeVideoTimeline <f> LargeTimeline Object
    options <o> Options object
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.Element> LargeTimeline Object
        position <!> position
@*/

Ox.LargeVideoTimeline = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
            .defaults({
                chapters: [],
                cuts: [],
                disabled: false,
                duration: 0,
                find: '',
                getImageURL: null,
                'in': 0,
                matches: [],
                out: 0,
                position: 0,
                showInToOut: false,
                subtitles: [],
                type: '',
                width: 0
            })
            .options(options || {})
            .update({
                find: setSubtitles,
                'in': function() {
                    setPointMarker('in');
                },
                out: function() {
                    setPointMarker('out');
                },
                position: setPosition,
                subtitles: setSubtitles,
                type: setType,
                width: setWidth
            })
            .addClass('OxLargeVideoTimeline OxMedia')
            .on({
                mouseleave: mouseleave,
                mousemove: mousemove
            });

    if (!self.options.disabled) {
        that.bindEvent({
            anyclick: click,
            dragstart: dragstart,
            drag: drag,
            dragend: dragend,
            touchstart: dragstart,
            touchmove: drag,
            touchend: dragend
        });
    }

    self.$cuts = [];
    self.$pointMarker = {};
    self.$tiles = {};
    self.$tooltip = Ox.Tooltip({animate: false});
    self.center = Math.floor(self.options.width / 2);
    self.fps = 25;
    self.height = 64;
    self.isAsync = self.options.getImageURL.length == 3;
    self.tileWidth = 1500;
    self.tiles = self.options.duration * self.fps / self.tileWidth;

    self.$timeline = $('<div>')
        .css({left: self.center + 'px'})
        .appendTo(that);

    setTimeout(setSubtitles);

    if (self.options.showInToOut) {
        if (self.options['in']) {
            $('<div>')
                .addClass('OxOverlay')
                .css({
                    left: 0,
                    width: self.options['in'] * self.fps + 'px',
                })
                .appendTo(self.$timeline);
        }
        if (self.options.out) {
            $('<div>')
                .addClass('OxOverlay')
                .css({
                    left: self.options.out * self.fps + 'px',
                    width: (self.options.duration - self.options.out) * self.fps + 'px',
                })
                .appendTo(self.$timeline);
        }
    }

    setTimeout(function() {
        var $cut = $('<img>')
                .addClass('OxCut')
                .attr({src: Ox.UI.getImageURL('markerCut')}),
            $chapter = $('<img>')
                .addClass('OxChapter')
                .attr({src: Ox.UI.getImageURL('markerChapter')}),
            chapters = self.options.chapters.slice(1).map(function(chapter) {
                return chapter.position;
            });
        Ox.unique(chapters.concat(self.options.cuts)).forEach(function(v, i) {
            self.$cuts[i] = (Ox.contains(chapters, v) ? $chapter : $cut)
                .clone()
                .css({left: (v * self.fps) + 'px'})
                .appendTo(self.$timeline);
        });
    });

    self.$markerPosition = $('<img>')
        .addClass('OxMarkerPosition')
        .attr({src: Ox.UI.getImageURL('markerPosition')})
        .appendTo(that);

    setMarker();

    ['in', 'out'].forEach(function(point) {
        var titlecase = Ox.toTitleCase(point);
        self.$pointMarker[point] = $('<img>')
            .addClass('OxMarkerPoint' + titlecase)
            .attr({src: Ox.UI.getImageURL('marker' + titlecase)})
            .appendTo(self.$timeline);
        setPointMarker(point);
    });

    setWidth();
    setPosition();

    function click(data) {
        self.options.position = Ox.round(Ox.limit(
            getPosition(data), 0, self.options.duration
        ), 3);
        setPosition();
        that.triggerEvent('position', {position: self.options.position});
    }

    function dragstart(data) {
        Ox.$body.addClass('OxDragging');
        self.drag = {x: data.clientX};
    }

    function drag(data) {
        self.options.position = Ox.round(Ox.limit(
            self.options.position + (self.drag.x - data.clientX) / self.fps,
            0, self.options.duration
        ), 3);
        self.drag.x = data.clientX;
        setPosition();
        that.triggerEvent('positioning', {position: self.options.position});
    }

    function dragend() {
        Ox.$body.removeClass('OxDragging');
        that.triggerEvent('position', {position: self.options.position});
    }

    function getImageURL(i, callback) {
        if (!self.isAsync) {
            callback(self.options.getImageURL(self.options.type, i));
        } else {
            self.options.getImageURL(self.options.type, i, callback);
        }
    }

    function getPosition(e) {
        return self.options.position + (
            e.clientX - that.offset().left - self.center - 1
        ) / self.fps;
    }

    function mouseleave(e) {
        self.clientX = 0;
        self.clientY = 0;
        self.$tooltip.hide();
    }

    function mousemove(e) {
        self.clientX = e.clientX;
        self.clientY = e.clientY;
        updateTooltip();
    }

    function setMarker() {
        self.$markerPosition.css({left: self.center + 'px'});
    }

    function setPointMarker(point) {
        self.$pointMarker[point].css({
            left: (self.options[point] * self.fps) + 'px'
        });
    }

    function setPosition() {
        self.tile = Math.floor(self.options.position * self.fps / self.tileWidth);
        self.$timeline.css({
            marginLeft: (-self.options.position * self.fps) + 'px'
        });
        Ox.loop(
            Math.max(self.tile - 1, 0),
            Math.min(self.tile + 2, self.tiles),
            function(i) {
                if (!self.$tiles[i]) {
                    if (self.isAsync) {
                        self.$tiles[i] = true;
                    }
                    getImageURL(i, function(url) {
                        self.$tiles[i] = $('<img>')
                            .attr({src: url})
                            .css({left: (i * self.tileWidth) + 'px'})
                            .appendTo(self.$timeline);
                    });
                }
            }
        );
        if (self.clientX && self.clientY) {
            updateTooltip();
        }
    }

    function setSubtitles() {
        that.find('.OxSubtitle').remove();
        self.$subtitles = [];
        self.options.subtitles.forEach(function(subtitle, i) {
            var found = self.options.find
                && subtitle.text.toLowerCase().indexOf(self.options.find.toLowerCase()) > -1;
            self.$subtitles[i] = $('<div>')
                .addClass('OxSubtitle' + (found ? ' OxHighlight' : ''))
                .css({
                    left: Math.round(subtitle['in'] * self.fps) + 'px',
                    width: Math.round(((subtitle.out - subtitle['in']) * self.fps) - 2) + 'px'
                })
                .html(Ox.highlight(
                    subtitle.text, self.options.find, 'OxHighlight', true
                ))
                .appendTo(self.$timeline);
        });
    }

    function setType() {
        Ox.forEach(self.$tiles, function($tile, i) {
            getImageURL(i, function(url) {
                $tile.attr({src: url});
            });
        });
    }

    function setWidth() {
        self.center = Math.floor(self.options.width / 2);
        that.css({
            width: self.options.width + 'px'
        });
        self.$timeline.css({
            left: self.center + 'px'
        });
        setMarker();
    }

    function triggerPositionEvent() {
        that.triggerEvent('position', {position: self.options.position});
    }

    function updateTooltip() {
        var position = getPosition(self);
        if (position >= 0 && position <= self.options.duration) {
            self.$tooltip
                .options({
                    title: Ox.formatDuration(position, 3)
                })
                .show(self.clientX, self.clientY);
        } else {
            self.$tooltip.hide();
        }
    }

    return that;

};
