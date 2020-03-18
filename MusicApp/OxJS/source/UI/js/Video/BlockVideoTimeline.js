'use strict';

/*@
Ox.BlockVideoTimeline <f> Block Video Timeline
    options <o> Options
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.Element> Block Video Timeline
        edit <!> edit
        select <!> select
        position <!> position
@*/
Ox.BlockVideoTimeline = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({
            duration: 0,
            find: '',
            getImageURL: null,
            'in': 0,
            out: 0,
            position: 0,
            results: [],
            showPointMarkers: false,
            state: 'default',
            subtitles: [],
            type: '',
            width: 0
        })
        .options(options || {})
        .update({
            'in': function() {
                self.options.showPointMarkers && setPoint('in');
            },
            out: function() {
                self.options.showPointMarkers && setPoint('out');
            },
            position: setPositionMarker,
            results: setResults,
            subtitles: setSubtitles,
            state: setState,
            type: setType,
            width: setWidth
        })
        .addClass('OxBlockVideoTimeline')
        .css({
            position: 'absolute'
        })
        .on({
            mousedown: mousedown,
            mouseleave: mouseleave,
            mousemove: mousemove
        })
        .bindEvent({
            doubleclick: doubleclick,
            drag: function(data) {
                mousedown(data);
            },
            touchmove: mousedown,
            touchstart: mousedown
        });

    self.$images = [];
    self.$interfaces = [];
    self.$lines = [];
    self.$tooltip = Ox.Tooltip({
            animate: false
        })
        .css({
            textAlign: 'center'
        });
    self.height = 16;
    self.lines = getLines();
    self.margin = 8;

    setCSS();

    self.$image = getImage();

    Ox.loop(self.lines, function(i) {
        addLine(i);
    });

    self.$positionMarker = Ox.$('<img>')
        .attr({
            src: Ox.UI.getImageURL('markerPosition')
        })
        .addClass('OxMarkerPosition')
        .appendTo(that);
    setPositionMarker();

    if (self.options.showPointMarkers) {
        self.$pointMarker = {};
        ['in', 'out'].forEach(function(point) {
            var titlecase = Ox.toTitleCase(point);
            self.$pointMarker[point] = Ox.$('<img>')
                .addClass('OxMarkerPoint' + titlecase)
                .attr({
                    src: Ox.UI.getImageURL('marker' + titlecase)
                })
                .appendTo(that);
            setPointMarker(point);
        });
    }

    function addLine(i) {
        self.$lines[i] = Ox.$('<div>')
            .css({
                position: 'absolute',
                left: self.margin / 2 + 'px',
                top: i * (self.height + self.margin) + 'px',
                width: self.options.width + 'px',
                height: '24px',
                overflow: 'hidden'
            })
            .appendTo(that);
        self.$images[i] = self.$image.clone()
            .css({
                position: 'absolute',
                marginLeft: -i * self.options.width + 'px'
            })
            .appendTo(self.$lines[i]);
        self.$interfaces[i] = Ox.$('<div>')
            // OxTarget and OxSpecialTarget are needed for InfoList
            .addClass('OxInterface OxTarget OxSpecialTarget')
            .css({
                top: '2px',
                width:  Math.round(self.options.duration) + 'px',
                height: '20px',
                marginLeft: -i * self.options.width + 'px'
                //background: 'rgba(255, 0, 0, 0.1)',
            })
            .appendTo(self.$lines[i]);
    }

    function doubleclick(e) {
        var position;
        if ($(e.target).is('.OxInterface')) {
            position = getPosition(e);
            if (
                self.options.state == 'selected'
                && position >= self.options['in']
                && position <= self.options.out
            ) {
                that.triggerEvent('edit');
            } else if (self.options.state != 'editing') {
                that.triggerEvent('select');
            }
        }
    }

    function getImage() {
        return Ox.SmallVideoTimelineImage({
            duration: self.options.duration,
            editing: self.options.editing,
            imageURL: self.options.getImageURL,
            'in': self.options['in'],
            mode: 'editor',
            out: self.options.out,
            results: self.options.results,
            state: self.options.state,
            subtitles: Ox.clone(self.options.subtitles, true),
            type: self.options.type,
            width: Math.round(self.options.duration)
        }).bindEvent({
            loaded: updateTimelines
        });
    }

    function getLines() {
        return Math.ceil(self.options.duration / self.options.width);
    }

    function getPosition(e) {
        // FIXME: this might still be broken in opera according to
        // http://acko.net/blog/mouse-handling-and-absolute-positions-in-javascript
        return e.offsetX ? e.offsetX
            : e.clientX - $(e.target).offset().left;
    }

    function getSubtitle(position) {
        var subtitle = '';
        Ox.forEach(self.options.subtitles, function(v) {
            if (v['in'] <= position && v.out > position) {
                subtitle = v;
                return false; // break
            }
        });
        return subtitle;
    }

    function getTooltip(e) {
        
    }

    function mousedown(e) {
        if ($(e.target).is('.OxInterface')) {
            self.options.position = getPosition(e);
            setPositionMarker();
            // fixme: check if this pattern is better
            // than the one used for list selection
            if (!self.triggered) {
                that.triggerEvent('position', {
                    position: self.options.position
                });
                self.triggered = true;
                setTimeout(function() {
                    self.triggered = false;
                }, 250);
            }
        }
    }

    function mouseleave() {
        self.$tooltip.hide();
    }

    function mousemove(e) {
        var position, subtitle;
        if ($(e.target).is('.OxInterface')) {
            position = getPosition(e);
            subtitle = getSubtitle(position);
            self.$tooltip.options({
                    title: subtitle
                        ? '<span class=\'OxBright\'>' + Ox.highlight(
                                subtitle.text, self.options.find, 'OxHighlight', true
                            ).replace(/\n/g, ' ') + '</span><br/>'
                            + Ox.formatDuration(subtitle['in'], 3) + ' - '
                            + Ox.formatDuration(subtitle['out'], 3)
                        : Ox.formatDuration(position)
                })
                .show(e.clientX, e.clientY);
        } else {
            self.$tooltip.hide();
        }
    }

    function setCSS() {
        that.css({
            width: (self.options.width + self.margin) + 'px',
            height: ((self.height + self.margin) * self.lines) + 4 + 'px'
            // fixme: the + 4 represent the margin-bottom in the video editor
            // is there a better way to get a proper margin-bottom?
        });
    }

    function setPoint(point) {
        setPointMarker(point);
        self.$image.options(point, self.options[point]);
        updateTimelines();
    }

    function setPointMarker(point) {
        var position = Math.round(self.options[point]);
        self.$pointMarker[point].css({
            left: (position % self.options.width) + 'px',
            top: (Math.floor(position / self.options.width) *
                (self.height + self.margin) + 15) + 'px'
        });
    }

    function setPositionMarker() {
        var position = Math.round(self.options.position);
        self.$positionMarker.css({
            left: (position % self.options.width) - 1 + 'px',
            top: (Math.floor(position / self.options.width) *
                (self.height + self.margin) + 2) + 'px'
        });
    }

    function setResults() {
        self.$image.options({results: self.options.results});
        updateTimelines();
    }

    function setState() {
        self.$image.options({state: self.options.state});
        updateTimelines();        
    }

    function setSubtitles() {
        self.$image.options({subtitles: Ox.clone(self.options.subtitles, true)});
        updateTimelines();
    }

    function setType() {
        self.$image = getImage();
        self.$images.forEach(function($image, i) {
            self.$images[i].replaceWith(
                self.$images[i] = self.$image.clone()
                    .css({
                        position: 'absolute',
                        marginLeft: -i * self.options.width + 'px'
                    })
            );
        });
    }

    function setWidth() {
        self.lines = getLines();
        setCSS();
        Ox.loop(self.lines, function(i) {
            if (self.$lines[i]) {
                self.$lines[i].css({
                    width: self.options.width + 'px'
                });
                self.$images[i].css({
                    marginLeft: (-i * self.options.width) + 'px'
                });
                self.$interfaces[i].css({
                    marginLeft: (-i * self.options.width) + 'px'
                });
            } else {
                addLine(i);
            }
        });
        while (self.$lines.length > self.lines) {
            self.$lines[self.$lines.length - 1].remove();
            self.$lines.pop();
            self.$images.pop();
        }
        setPositionMarker();
        if (self.options.showPointMarkers) {
            setPointMarker('in');
            setPointMarker('out');
        }
    }

    function updateTimelines() {
        self.$lines.forEach(function($line, i) {
            $($line.children()[0]).replaceWith(
                self.$images[i] = self.$image.clone().css({
                    position: 'absolute',
                    marginLeft: (-i * self.options.width) + 'px'
                })
            );
        });
    }

    return that;

};
