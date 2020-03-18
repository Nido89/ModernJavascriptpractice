'use strict';

/*@
Ox.SmallVideoTimeline <f> Small video timeline
    options <o> Options
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.Element> Small video timeline
        position <!> position
@*/
Ox.SmallVideoTimeline = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({
            // _offset is a hack for cases where all these position: absolute
            // elements have to go into a float: left
            // FIXME: possibly unused and unneeded
            _offset: 0,
            disabled: false,
            duration: 0,
            find: '',
            imageURL: '',
            'in': 0,
            invertHighlight: false,
            mode: 'player',
            out: 0,
            paused: false,
            results: [],
            showInToOut: false,
            showMilliseconds: 0,
            state: 'default',
            subtitles: [],
            width: 256
        })
        .options(options || {})
        .update({
            duration: function() {
                self.$image.options({duration: self.options.duration});
            },
            imageURL: function() {
                self.$image.options({imageURL: self.options.imageURL});
            },
            'in': function() {
                self.$image.options({'in': self.options['in']});
                self.options.mode == 'editor' && setPointMarker('in');
            },
            out: function() {
                self.$image.options({out: self.options.out});
                self.options.mode == 'editor' && setPointMarker('out');
            },
            paused: function() {
                self.$positionMarker[
                    self.options.paused ? 'addClass' : 'removeClass'
                ]('OxPaused');
            },
            position: function() {
                setPositionMarker();
            },
            results: function() {
                self.$image.options({results: self.options.results});
            },
            state: function() {
                self.$image.options({state: self.options.state});
            },
            subtitles: function() {
                self.$image.options({subtitles: self.options.subtitles});
            },
            width: function() {
                setWidth();
            }
        })
        .addClass('OxSmallVideoTimeline')
        .css(Ox.extend({
            width: self.options.width + 'px'
        }, self.options.mode == 'player' ? {
            background: 'rgb(0, 0, 0)',
            borderRadius: '8px'
        } : {}));

    self.height = self.options.mode == 'player' ? 16 : 24;
    self.imageLeft = self.options.mode == 'player' ? 8 : 4;
    self.imageWidth = self.options.width -
        (self.options.mode == 'player' ? 16 : 8)
    self.imageHeight = self.options.mode == 'player' ? 16 : 18;
    self.interfaceLeft = self.options.mode == 'player' ? 0 : 4;
    self.interfaceTop = self.options.mode == 'player' ? 0 : 2;
    self.interfaceWidth = self.options.mode == 'player' ? self.options.width : self.imageWidth;

    that.css({
        height: self.height + 'px'
    });

    self.$image = getTimelineImage().appendTo(that);

    self.$interface = Ox.Element({
            tooltip: getTooltip
        })
        .addClass('OxInterface')
        .css({
            left: self.interfaceLeft + 'px',
            top: self.interfaceTop + 'px',
            width: self.interfaceWidth + 'px',
            height: '20px'
        })
        .bindEvent({
            drag: function(data) {
                mousedown(data);
            },
            dragend: function(data) {
                self.triggered = false;
                mousedown(data);
            },
            mousedown: mousedown,
            touchend: function(data) {
                self.triggered = false;
                mousedown(data);
            },
            touchmove: mousedown,
            touchstart: mousedown
        })
        .appendTo(that);

    self.$interface.$tooltip.css({
        textAlign: 'center'
    });

    if (self.options.mode == 'player') {
        self.$positionMarker = $('<div>')
            .addClass('OxMarkerPlay' + (self.options.paused ? ' OxPaused' : ''))
            .append($('<div>').append($('<div>')))
            .appendTo(that);
    } else {
        self.$positionMarker = $('<img>')
            .addClass('OxMarkerPosition')
            .attr({
                src: Ox.UI.getImageURL('markerPosition')
            })
            .appendTo(that);
    }
    setPositionMarker();

    if (self.options.mode == 'editor') {
        self.$pointMarker = {};
        ['in', 'out'].forEach(function(point) {
            var titlecase = Ox.toTitleCase(point);
            self.$pointMarker[point] = $('<img>')
                .addClass('OxMarkerPoint' + titlecase)
                .attr({
                    src: Ox.UI.getImageURL('marker' + titlecase)
                })
                .appendTo(that);
            setPointMarker(point);
        });
    }

    function getLeft() {
        return (
            self.options.showInToOut
            ? self.options.position - self.options['in']
            : self.options.position
        ) * self.imageWidth / self.options.duration;
    }

    function getPosition(e) {
        var position = (
                (e.offsetX ? e.offsetX : e.clientX - $(e.target).offset().left)
                - (self.options.mode == 'player' ? 8 : 0)
            ) * self.options.duration / self.imageWidth;
        position = Ox.limit(position, 0, self.options.duration);
        if (self.options.showInToOut) {
            position += self.options['in'];
        }
        return position;
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

    function getTimelineImage() {
        return (self.options.imageURL ? Ox.SmallVideoTimelineImage({
            duration: self.options.duration,
            imageURL: self.options.imageURL,
            'in': self.options['in'],
            invertHighlight: self.options.invertHighlight,
            mode: self.options.mode,
            out: self.options.out,
            results: self.options.results,
            showInToOut: self.options.showInToOut,
            subtitles: self.options.subtitles,
            state: self.options.state,
            type: self.options.type,
            width: self.imageWidth
        }) : Ox.Element()).css({
            position: 'absolute',
            left: self.imageLeft + 'px',
            width: self.imageWidth + 'px'
        });
    }

    function getTooltip(e) {
        var position = getPosition(e),
            subtitle = getSubtitle(position);
        return subtitle
            ? '<span class=\'OxBright\'>' + Ox.highlight(
                    subtitle.text, self.options.find, 'OxHighlight'
                ).replace(/\n/g, '<br/>') + '</span><br/>' + Ox.formatDuration(
                    subtitle['in'], self.options.showMilliseconds
                ) + ' - ' + Ox.formatDuration(
                    subtitle['out'], self.options.showMilliseconds
                )
            : Ox.formatDuration(position, self.options.showMilliseconds);
    }

    function mousedown(e) {
        if (!self.options.disabled && $(e.target).is('.OxInterface')) {
            self.options.position = getPosition(e);
            setPositionMarker();
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

    function setPointMarker(point) {
        self.$pointMarker[point].css({
            left: self.imageLeft + Math.round(getLeft()) + 'px'
        });
    }

    function setPositionMarker() {
        self.$positionMarker.css({
            left: self.interfaceLeft + Math.round(getLeft())
                - (self.options.mode == 'editor' ? 5 : 0)
                + self.options._offset + 'px'
        });
    }

    function setWidth() {
        self.imageWidth = self.options.width -
            (self.options.mode == 'player' ? 16 : 8);
        self.interfaceWidth = self.options.mode == 'player' ?
            self.options.width : self.imageWidth;
        that.css({
            width: self.options.width + 'px'
        });
        self.$image.options({
            width: self.imageWidth
        }).css({
            width: self.imageWidth + 'px'
        });
        self.$interface.css({
            width: self.interfaceWidth + 'px'
        });
        setPositionMarker();
        if (self.options.mode == 'editor') {
            setPointMarker('in');
            setPointMarker('out');
        }
    }

    return that;

};
