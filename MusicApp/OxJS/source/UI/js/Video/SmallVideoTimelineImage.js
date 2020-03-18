'use strict';

/*@
Ox.SmallVideoTimelineImage <f> Small Video Timeline Image
    options <o> Options
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.Element> Small Video Timeline Image
        loaded <!> subtitle, result and selection overlays are loaded
@*/
Ox.SmallVideoTimelineImage = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({
            duration: 0,
            imageURL: '',
            invertHighlight: false,
            'in': 0,
            mode: 'player',
            out: 0,
            results: [],
            showInToOut: false,
            state: 'default',
            subtitles: [],
            type: '',
            width: 256
        })
        .options(options || {})
        .update({
            imageURL: function() {
                self.$timeline.attr({src: self.options.imageURL});
            },
            'in': function() {
                self.$selection.attr({
                    src: getImageURL('selection')
                });
            },
            out: function() {
                self.$selection.attr({
                    src: getImageURL('selection')
                });
            },
            results: function() {
                self.$results.attr({
                    src: getImageURL('results')
                });
            },
            selection: function() {
                self.$selection.attr({
                    src: getImageURL('selection')
                });
            },
            subtitles: function() {
                self.$subtitles.attr({
                    src: getImageURL('subtitles')
                });
            },
            state: function() {
                self.$selection.attr({
                    src: getImageURL('selection')
                });
            },
            width: function() {
                var width = self.options.width;
                that.css({width: width + 'px'});
                self.$results
                    .attr({src: getImageURL('results')})
                    .css({width: width + 'px'});
                self.$selection
                    .attr({src: getImageURL('selection')})
                    .css({width: width + 'px'});
                self.$subtitles.css({width: width + 'px'});
                self.$timeline.css({width: width + 'px'});
            }
        })
        .css({
            position: 'absolute',
            width: self.options.width + 'px'
        });

    if (self.options.showInToOut) {
        self.pixelsPerSecond = (
            screen.width < 1024 ? 1024 : screen.width
        ) / self.options.duration;
    }
    self.images = Ox.isString(self.options.imageURL) ? 1
        : Math.ceil(self.options.duration / 3600);
    self.imageWidth = Ox.isString(self.options.imageURL) ? 1920
        : self.options.showInToOut ? (
            self.pixelsPerSecond <= 1
            ? Math.round(self.options.duration)
            : Math.round(self.options.duration * 25)
        )
        : Math.round(self.options.duration);
    self.height = self.options.mode == 'editor' ? 24 : 16;
    self.imageHeight = self.options.mode == 'editor' ? 18 : 16;
    self.imageTop = self.options.mode == 'editor' ? 3 : 0;
    self.timelineTop = self.options.mode == 'editor' ? 4 : 0;
    self.themeData = Ox.Theme.getThemeData();

    that.css({height: self.height + 'px'});

    if (Ox.isString(self.options.imageURL)) {
        self.$timeline = $('<img>')
            .attr({
                src: self.options.imageURL
            })
            .css({
                position: 'absolute',
                top: self.timelineTop + 'px',
                width: self.options.width + 'px',
                height: '16px'
            })
            .appendTo(that);
    } else if (self.options.showInToOut) {
        self.$timeline = getClipTimeline()
            .css({
                position: 'absolute',
                top: self.timelineTop + 'px',
                width: self.options.width + 'px',
                height: '16px'
            })
            .appendTo(that);
    } else {
        Ox.loop(self.images, function(i) {
            $('<img>')
                .attr({
                    src: self.options.imageURL(self.options.type, i)
                })
                .css({
                    position: 'absolute',
                    left: (i * 3600) + 'px',
                    top: self.timelineTop + 'px',
                    width: (i == self.images - 1 ? self.imageWidth % 3600 || 3600 : 3600) + 'px',
                    height: '16px'
                })
                .appendTo(that);
        });
    }

    self.$subtitles = $('<img>');
    self.$results = $('<img>');
    self.$selection = $('<img>');

    setTimeout(function() {
        self.$subtitles
            .attr({
                src: getImageURL('subtitles')
            })
            .css({
                position: 'absolute',
                top: self.imageTop + 'px',
                width: self.options.width + 'px',
                height: self.imageHeight + 'px'
            })
            .appendTo(that);

        self.$results
            .attr({
                src: getImageURL('results')
            })
            .css({
                position: 'absolute',
                top: self.imageTop + 'px',
                width: self.options.width + 'px',
                height: self.imageHeight + 'px'
            })
            .appendTo(that);

        self.$selection
            .attr({
                src: getImageURL('selection')
            })
            .css({
                position: 'absolute',
                top: self.imageTop + 'px',
                width: self.options.width + 'px',
                height: self.imageHeight + 'px'
            })
            .appendTo(that);
        that.triggerEvent('loaded');
    });

    function getClipTimeline() {
        var $canvas, context, image,
            firstTile, lastTile, tileHeight, tileOffset, tileWidth;
        if (self.pixelsPerSecond <= 1) {
            firstTile = Math.floor(self.options['in'] / 3600);
            lastTile = Math.floor(self.options.out / 3600);
            tileHeight = 16;
            tileOffset = -Math.round(self.options['in'] % 3600);
            tileWidth = 3600;
        } else {
            firstTile = Math.floor(self.options['in'] / 60);
            lastTile = Math.floor(self.options.out / 60);
            tileHeight = 64;
            tileOffset = -Math.round(self.options['in'] % 60 * 25);
            tileWidth = 1500;
        }
        $canvas = $('<canvas>').attr({
            width: self.imageWidth,
            height: tileHeight
        });
        context = $canvas[0].getContext('2d');
        Ox.loop(firstTile, lastTile + 1, function(tileIndex) {
            var $image = $('<img>')
                .one({
                    load: function() {
                        context.drawImage(
                            $image[0],
                            tileOffset + (tileIndex - firstTile) * tileWidth,
                            0
                        );
                    }
                })
                .attr({
                    src: self.options.imageURL(tileHeight, tileIndex)
                });
        });
        return $canvas;
    }

    function getImageURL(image, callback) {
        var width = image == 'results' || image == 'selection'
                ? self.options.width : self.imageWidth,
            height = self.imageHeight,
            canvas = $('<canvas>').attr({
                width: width,
                height: height
            })[0],
            context = canvas.getContext('2d'),
            imageData = context.createImageData(width, height),
            data = imageData.data;
        if (image == 'results') {
            var top = 0,
                bottom = height;
            self.options.results.forEach(function(result) {
                var left = Math.round(
                        result['in'] / self.options.duration * width
                    ),
                    right = Math.round(
                        result.out / self.options.duration * width
                    ) + 1,
                    rgb = self.themeData.videoTimelineResultGradient;
                Ox.loop(left, right, function(x) {
                    Ox.loop(top, bottom, function(y) {
                        var alpha = self.options.mode == 'editor'
                                && (y == top || y == bottom - 1) ? 255 : 128,
                            color = rgb[[2, 3, 6].indexOf(x % 4 + y % 4) > -1 ? 0 : 1],
                            index = x * 4 + y * 4 * width;
                        data[index] = color[0];
                        data[index + 1] = color[1];
                        data[index + 2] = color[2];
                        data[index + 3] = alpha;
                    });
                });
            });
        } else if (
            image == 'selection'
            && self.options.out > self.options['in']
            && !self.options.showInToOut
        ) {
            var left = Math.round(
                    self.options['in'] / self.options.duration * width
                ),
                right = Math.round(
                    self.options.out / self.options.duration * width
                ) + 1,
                spans = self.options.invertHighlight
                    ? [{left: 0, right: left}, {left: right, right: width}]
                    : [{left: left, right: right}],
                top = 0,
                bottom = height,
                rgb = self.themeData[
                    self.options.state == 'editable' ? 'videoTimelineEditableGradient'
                    : self.options.state == 'editing' ? 'videoTimelineEditingGradient'
                    : self.options.state == 'selected' ? 'videoTimelineSelectedGradient'
                    : 'videoTimelineDefaultGradient'
                ];
            spans.forEach(function(span) {
                Ox.loop(span.left, span.right, function(x) {
                    Ox.loop(top, bottom, function(y) {
                        var alpha = self.options.mode == 'editor'
                                && (y == top || y == bottom - 1) ? 255 : 128,
                            color = rgb[[2, 3, 6].indexOf(x % 4 + y % 4) > -1 ? 0 : 1],
                            index = x * 4 + y * 4 * width;
                        data[index] = color[0];
                        data[index + 1] = color[1];
                        data[index + 2] = color[2];
                        data[index + 3] = alpha;
                    });
                });
            });
        } else if (image == 'subtitles') {
            var bottom = self.options.mode == 'editor' ? 15 : 14,
                offset = self.options.showInToOut ? (
                    self.pixelsPerSecond <= 1
                    ? -self.options['in']
                    : -self.options['in'] * 25
                ) : 0,
                subtitles = self.options.showInToOut
                    ? self.options.subtitles.filter(function(subtitle) {
                        return (
                            subtitle['in'] >= self.options['in']
                            && subtitle['in'] <= self.options.out
                        ) || (
                            subtitle.out >= self.options['in']
                            && subtitle.out <= self.options.out
                        ) || (
                            subtitle['in'] < self.options['in']
                            && subtitle.out > self.options.out
                        )
                    })
                    : self.options.subtitles;
            subtitles.forEach(function(subtitle) {
                var left = Math.round(
                        subtitle['in'] / self.options.duration * self.imageWidth
                    ) + offset,
                    right = Math.round(
                        subtitle.out / self.options.duration * self.imageWidth
                    ) + offset + 1,
                    top = bottom - subtitle.text.split('\n').length - 2;
                Ox.loop(left, right, function(x) {
                    Ox.loop(top, bottom, function(y) {
                        var alpha = 128,
                            color = (y == top || y == bottom - 1) ? [0, 0, 0] : [255, 255, 255],
                            index = x * 4 + y * 4 * width;
                        data[index] = color[0];
                        data[index + 1] = color[1];
                        data[index + 2] = color[2];
                        data[index + 3] = alpha;
                    });
                });
            });
        }
        context.putImageData(imageData, 0, 0);
        return canvas.toDataURL();
    }

    return that;

};
