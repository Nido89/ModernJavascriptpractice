'use strict';

/*@
Ox.VideoPlayerPanel <f> VideoPlayerPanel Object
    options <o> Options object
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.SplitPanel> VideoPlayerPanel Object
        annotationsrange <!> annotationsrange
        annotationssize <!> annotationssize
        annotationssort <!> annotationssort
        audioTrack <s|''> Two-letter ISO 639-1 language code or track name
        censored <!> censored
        downloadvideo <!> downloadvideo
        find <!> find
        info <!> info
        key_* <!> key_*
        muted <!> muted
        paused <!> paused
        position <!> position
        resizecalendar <!> resizecalendar
        resolution <!> resolution
        scaleToFill <!> scale
        selected <!> select
        subtitles <!> subtitles
        toggleannotations <!> toggleannotations
        togglecalendar <!> togglecalendar
        togglelayer <!> togglelayer
        togglemap <!> togglemap
        toggletimeline <!> toggletimeline
        volume <!> volume
@*/

Ox.VideoPlayerPanel = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({
            annotationsCalendarSize: 256,
            annotationsMapSize: 256,
            annotationsRange: 'all',
            annotationsSize: 256,
            annotationsSort: 'position',
            annotationsTooltip: 'annotations',
            audioTrack: '',
            censored: [],
            censoredIcon: '',
            censoredTooltip: '',
            clickLink: null,
            cuts: [],
            duration: 0,
            enableDownload: false,
            enableSubtitles: false,
            find: '',
            fps: 25,
            fullscreen: false,
            getLargeTimelineURL: null,
            height: 0,
            'in': 0,
            itemName: {singular: 'video', plural: 'videos'},
            layers: [],
            loop: false,
            muted: false,
            out: 0,
            paused: true,
            playInToOut: false,
            position: 0,
            poster: '',
            resolution: 0,
            scaleToFill: false,
            selected: '',
            showAnnotations: false,
            showAnnotationsCalendar: false,
            showAnnotationsMap: false,
            showLayers: {},
            showTimeline: false,
            showUsers: false,
            smallTimelineURL: '',
            subtitles: [],
            subtitlesDefaultTrack: 'English',
            subtitlesLayer: null,
            subtitlesOffset: 0,
            subtitlesTrack: 'English',
            timeline: '',
            timelineTooltip: 'timeline',
            video: '',
            volume: 1,
            width: 0
        })
        .options(options || {})
        .update({
            fullscreen: function() {
                self.$video.options({fullscreen: self.options.fullscreen});
            },
            height: function() {
                self.$video.options({height: getPlayerHeight()});
            },
            'in': function() {
                setPoint('in', self.options['in']);
            },
            loop: function() {
                self.$video.options({loop: self.options.loop});
            },
            out: function() {
                setPoint('out', self.options.out);
            },
            paused: function() {
                self.$video.options({paused: self.options.paused});
            },
            position: function() {
                self.$video.options({position: self.options.position});
                self.$timeline.options({position: self.options.position});
                self.$annotationPanel.options({position: self.options.position});
            },
            selected: function() {
                self.$annotationPanel.options({selected: self.options.selected});
            },
            showAnnotations: function() {
                self.$mainPanel.toggleElement(1);
            },
            showTimeline: function() {
                self.$videoPanel.toggleElement(1);
            },
            timeline: function() {
                self.$timeline.options({type: self.options.timeline});
            },
            volume: function() {
                self.$video.options({
                    volume: self.options.volume
                });
            },
            width: function() {
                self.$video.options({width: getPlayerWidth()});
                self.$timeline.options({width: getTimelineWidth()});
            }
        })
        .css({
            height: self.options.height + 'px',
            width: self.options.width + 'px'
        })
        .bindEvent({
            resize: resizeElement,
            key_0: toggleMuted,
            key_comma: function() {
                movePositionTo('cut', -1);
            },
            key_control_c: function() {
                that.triggerEvent('copy', [{
                    annotation: self.options.selected,
                    'in': self.options['in'],
                    out: self.options.out
                }]);
            },
            key_control_shift_c: function() {
                that.triggerEvent('copyadd', [{
                    annotation: self.options.selected,
                    'in': self.options['in'],
                    out: self.options.out
                }]);
            },
            key_dot: function() {
                movePositionTo('cut', 1);
            },
            key_equal: function() {
                self.$video.changeVolume(0.1);
            },
            key_i: function() {
                self.$annotationPanel.options({selected: ''});
                setPoint('in', self.options.position, false, true);
            },
            key_l: toggleLoop,
            key_left: function() {
                movePositionBy(-1 / self.options.fps);
            },
            key_minus: function() {
                self.$video.changeVolume(-0.1);
            },
            key_o: function() {
                self.$annotationPanel.options({selected: ''});
                setPoint('out', self.options.position, false, true);
            },
            key_p: playInToOut,
            key_right: function() {
                movePositionBy(1 / self.options.fps);
            },
            key_shift_down: function() {
                movePositionBy(self.options.duration);
            },
            key_shift_i: function() {
                goToPoint('in');
            },
            key_shift_left: function() {
                movePositionBy(-1);
            },
            key_shift_o: function() {
                goToPoint('out');
            },
            key_shift_right: function() {
                movePositionBy(1);
            },
            key_shift_up: function() {
                movePositionBy(-self.options.position);
            },
            key_slash: selectCut,
            key_space: togglePaused
        });

    self.options.subtitles = options.subtitles !== void 0
         ? self.options.subtitles : parseSubtitles();

    self.fullscreen = false;
    self.results = [];

    self.$player = Ox.Element().css({overflow: 'hidden'});

    self.$video = Ox.VideoPlayer({
            annotations: getAnnotations(),
            audioTrack: self.options.audioTrack,
            censored: self.options.censored,
            censoredIcon: self.options.censoredIcon,
            censoredTooltip: self.options.censoredTooltip,
            controlsTop: ['fullscreen', 'title', 'find'],
            controlsBottom: [
                'play', 'playInToOut', 'volume', 'scale',
                'timeline', 'loop', 'position', 'settings'
            ],
            enableDownload: self.options.enableDownload,
            enableFind: true,
            enableKeyboard: true,
            enableMouse: true,
            enablePosition: true,
            enableSubtitles: self.options.enableSubtitles,
            enableTimeline: true,
            find: self.options.find,
            fullscreen: self.options.fullscreen,
            height: getPlayerHeight(),
            'in': self.options['in'],
            loop: self.options.loop,
            muted: self.options.muted,
            out: self.options.out,
            paused: self.options.paused,
            position: self.options.position,
            resolution: self.options.resolution,
            scaleToFill: self.options.scaleToFill,
            subtitles: Ox.clone(self.options.subtitles, true),
            subtitlesDefaultTrack: self.options.subtitlesDefaultTrack,
            subtitlesOffset: self.options.subtitlesOffset,
            subtitlesTrack: self.options.subtitlesTrack,
            timeline: self.options.smallTimelineURL,
            video: self.options.video,
            volume: self.options.volume,
            width: getPlayerWidth()
        })
        .bindEvent({
            censored: function() {
                that.triggerEvent('censored');
            },
            download: function(data) {
                that.triggerEvent('downloadvideo', data);
            },
            find: function(data) {
                self.$timeline.options({find: data.find});
                self.$annotationPanel.options({highlight: data.find});
                that.triggerEvent('find', data);
            },
            fullscreen: function(data) {
                self.options.fullscreen = data.fullscreen;
            },
            loop: function(data) {
                that.triggerEvent('loop', data);
            },
            muted: function(data) {
                that.triggerEvent('muted', data);
            },
            paused: function(data) {
                self.options.paused = data.paused;
                that.triggerEvent('paused', data);
            },
            playing: function(data) {
                setPosition(data.position, true);
            },
            position: function(data) {
                setPosition(data.position);
            },
            positioning: function(data) {
                setPosition(data.position, false, true);
            },
            resolution: function(data) {
                that.triggerEvent('resolution', data);
            },
            scale: function(data) {
                that.triggerEvent('scale', data);
            },
            select: selectAnnotation,
            subtitles: function(data) {
                self.options.enableSubtitles = data.subtitles;
                self.$timeline.options({subtitles: getSubtitles()});
                that.triggerEvent('subtitles', data);
            },
            subtitlestrack: function(data) {
                var enableSubtitles = !!data.track;
                if (enableSubtitles != self.options.enableSubtitles) {
                    self.options.enableSubtitles = enableSubtitles;
                    that.triggerEvent('subtitles', {subtitles: enableSubtitles});
                }
                self.options.subtitlesTrack = data.track;
                self.$timeline.options({subtitles: getSubtitles()});
            },
            volume: function(data) {
                that.triggerEvent('volume', data);
            }
        })
        .appendTo(self.$player);

    self.$controls = Ox.Element()
        .addClass('OxMedia')
        .bindEvent({
            toggle: toggleControls
        });

    self.$timeline = Ox.LargeVideoTimeline({
            cuts: self.options.cuts,
            duration: self.options.duration,
            find: self.options.find,
            getImageURL: self.options.getLargeTimelineURL,
            'in': self.options['in'],
            out: self.options.out,
            position: self.options.position,
            subtitles: getSubtitles(),
            videoId: self.options.videoId, // fixme: not in defaults
            type: self.options.timeline,
            width: getTimelineWidth()
        })
        .css({left: '4px', top: '4px'})
        .bindEvent({
            key_left: function() {
                self.options.paused && movePositionBy(-1 / self.options.fps);
            },
            key_right: function() {
                self.options.paused && movePositionBy(1 / self.options.fps);
            },
            key_space: togglePaused,
            mousedown: that.gainFocus,
            position: dragendTimeline,
            positioning: dragTimeline
        })
        .appendTo(self.$controls);

    self.$videoPanel = Ox.SplitPanel({
            elements: [
                {
                    element: self.$player
                },
                {
                    collapsed: !self.options.showTimeline,
                    collapsible: true,
                    element: self.$controls,
                    size: 80,
                    tooltip: self.options.timelineTooltip
                }
            ],
            orientation: 'vertical'
        });

    self.$annotationPanel = Ox.AnnotationPanel({
            calendarSize: self.options.annotationsCalendarSize,
            clickLink: self.options.clickLink,
            editable: false,
            highlight: self.options.find,
            'in': self.options['in'],
            itemName: self.options.itemName,
            layers: self.options.layers,
            mapSize: self.options.annotationsMapSize,
            out: self.options.out,
            position: self.options.position,
            range: self.options.annotationsRange,
            selected: self.options.selected,
            showCalendar: self.options.showAnnotationsCalendar,
            showLayers: Ox.clone(self.options.showLayers),
            showMap: self.options.showAnnotationsMap,
            showUsers: self.options.showUsers,
            sort: self.options.annotationsSort,
            width: self.options.annotationsSize
        })
        .bindEvent({
            annotationsrange: function(data) {
                self.options.annotationsRange = data.range;
                that.triggerEvent('annotationsrange', data);
            },
            annotationssort: function(data) {
                self.options.annotationsSort = data.sort;
                that.triggerEvent('annotationssort', data);
            },
            info: function(data) {
                that.triggerEvent('info', data);
            },
            open: function() {
                setPosition(self.options['in']);
            },
            resize: resizeAnnotations,
            resizeend: resizeendAnnotations,
            resizecalendar: function(data) {
                that.triggerEvent('resizecalendar', data);
            },
            resizemap: function(data) {
                that.triggerEvent('resizemap', data);
            },
            select: selectAnnotation,
            toggle: toggleAnnotations,
            togglecalendar: function(data) {
                self.options.showAnnotationsCalendar = !data.collapsed;
                that.triggerEvent('togglecalendar', data);
            },
            togglelayer: function(data) {
                that.triggerEvent('togglelayer', {
                    collapsed: data.collapsed,
                    layer: data.layer
                });
            },
            togglemap: function(data) {
                self.options.showAnnotationsMap = !data.collapsed;
                that.triggerEvent('togglemap', data);
            }
        });

    [
        '0', 'b', 'backslash', 'closebracket', 'comma', 'dot', 'equal', 'f',
        'g', 'i', 'minus', 'n', 'o', 'openbracket', 'p', 'shift_0', 'shift_g',
        'shift_i', 'shift_o', 'slash', 'space'
    ].forEach(function(key) {
        key = 'key_' + key;
        // FIXME: video player and timeline, too
        self.$annotationPanel.bindEvent(key, function() {
            that.triggerEvent(key);
        });
    });    

    that.setElement(
        self.$mainPanel = Ox.SplitPanel({
            elements: [
                {
                    element: self.$videoPanel
                },
                {
                    collapsed: !self.options.showAnnotations,
                    collapsible: true,
                    element: self.$annotationPanel,
                    resizable: true,
                    resize: [192, 256, 320, 384],
                    size: self.options.annotationsSize,
                    tooltip: self.options.annotationsTooltip
                }
            ],
            orientation: 'horizontal'
        })
    );

    function dragTimeline(data) {
        self.options.position = data.position;
        self.$video.options({position: self.options.position});
        self.$annotationPanel.options({position: self.options.position});
    }

    function dragendTimeline(data) {
        dragTimeline(data);
        that.triggerEvent('position', {position: self.options.position});
    }

    function getAnnotations() {
        return Ox.flatten(self.options.layers.map(function(layer) {
            return layer.items.map(function(item) {
                return {id: item.id, 'in': item['in'], out: item.out, text: item.value};
            });
        })).sort(sortAnnotations);
    }

    // fixme: why not goToNextPosition()?
    function getNextPosition(type, direction) {
        // type can only be 'cut'
        var positions;
        if (type == 'cut') {
            positions = [0].concat(self.options.cuts, self.options.duration);
        }
        return Ox.nextValue(positions, self.options.position, direction);
    }

    function getPlayerHeight() {
        return self.options.height
            - self.options.showTimeline * 80 - 1;
    }

    function getPlayerWidth() {
        return self.options.width
            - (self.options.showAnnotations && !self.fullscreen)
            * self.options.annotationsSize - 1;
    }

    function getSubtitles() {
        return self.options.enableSubtitles
            ? self.options.subtitles.filter(function(v) {
                return Ox.contains(v.tracks, self.options.subtitlesTrack);
            })
            : [];
    }

    function getTimelineWidth() {
        return self.options.width
            - (self.options.showAnnotations && !self.fullscreen)
            * self.options.annotationsSize - 16 - 1;
    }

    function goToPoint(point) {
        setPosition(self.options[point]);
    }

    function playInToOut() {
        self.$video.playInToOut();
    }

    function movePositionBy(sec) {
        setPosition(Ox.limit(self.options.position + sec, 0, self.options.duration));
    }

    function movePositionTo(type, direction) {
        setPosition(getNextPosition(type, direction));
    }

    function parseSubtitles() {
        return self.options.subtitlesLayer ? self.options.layers.filter(function(layer) {
            return layer.id == self.options.subtitlesLayer;
        })[0].items.map(function(subtitle) {
            return {
                id: subtitle.id,
                'in': subtitle['in'],
                out: subtitle.out,
                text: subtitle.value.replace(/\n/g, ' ').replace(/<br\/?>/g, '\n'),
                tracks: subtitle.languages || [self.options.subtitlesDefaultTrack]
            };
        }) : [];
    }

    function resizeAnnotations(data) {
        // called on annotations resize
        self.options.annotationsSize = data.size;
        self.$video.options({
            width: getPlayerWidth()
        });
        self.$timeline.options({
            width: getTimelineWidth()
        });
        self.$annotationPanel.options({width: data.size});
    }

    function resizeendAnnotations(data) {
        that.triggerEvent('annotationssize', data.size);
    }

    function resizeElement(data) {
        // called on browser toggle
        self.options.height = data.size;
        self.$video.options({
            height: getPlayerHeight()
        });
    }

    /*
    function resizePanel(data) {
        // called on annotations toggle <-- FIXME: NOT TRUE
        self.$video.options({
            width: getPlayerWidth()
        });
        self.$timeline.options({
            width: getTimelineWidth()
        });
    }
    */

    function selectAnnotation(data) {
        self.options.selected = data.id;
        if (self.options.selected) {
            setPosition(data['in']);
            setPoint('in', data['in'], true);
            setPoint('out', data.out, true);
        }
        self.$annotationPanel.options({selected: self.options.selected});
        that.triggerEvent('select', {id: self.options.selected});
    }

    function selectCut() {
        var points = {
            'in': Ox.last(self.options.cuts),
            out: self.options.duration
        };
        Ox.forEach(self.options.cuts, function(cut, i) {
            if (cut > self.options.position) {
                points = {
                    'in': i == 0 ? 0 : self.options.cuts[i - 1],
                    out: cut - 1 / self.options.fps
                };
                return false; // break
            } 
        });
        setPoint('in', points['in']);
        setPoint('out', points.out);
    }

    function setPoint(point, position, keepSelected, triggerEvent) {
        self.options[point] = position;
        if (self.options.selected && !keepSelected) {
            selectAnnotation({id: ''});
        }
        self.$video.options(point, position);
        self.$timeline.options(point, position);
        self.$annotationPanel.options(point, position);
        if (self.options['in'] > self.options.out) {
            setPoint(point == 'in' ? 'out' : 'in', position, keepSelected);
        } else if (triggerEvent) {
            that.triggerEvent('points', {
                'in': self.options['in'],
                out: self.options.out,
                position: self.options.position
            });
        }
    }

    function setPosition(position, playing, dragging) {
        var minute = Math.floor(position / 60),
            previousMinute = Math.floor(self.options.position / 60);
        self.options.position = position;
        !playing && self.$video.options({position: self.options.position});
        self.$timeline.options({position: self.options.position});
        self.$annotationPanel.options({position: self.options.position});
        if ((!playing || minute != previousMinute) && !dragging) {
            that.triggerEvent('position', {
                position: !playing ? self.options.position : minute * 60
            });
        }
    }

    function sortAnnotations(a, b) {
        var ret = 0;
        if (a['in'] < b['in']) {
            ret = -1;
        } else if (a['in'] > b['in']) {
            ret = 1;
        } else if (a.out < b.out) {
            ret = -1;
        } else if (a.out > b.out) {
            ret = 1;
        } else if (a.value < b.value) {
            ret = -1;
        } else if (a.value > b.value) {
            ret = 1;
        }
        return ret;
    }

    function toggleAnnotations(data) {
        self.options.showAnnotations = !data.collapsed;
        self.$video.options({
            width: getPlayerWidth()
        });
        self.$timeline.options({
            width: getTimelineWidth()
        });
        that.triggerEvent('toggleannotations', {
            showAnnotations: self.options.showAnnotations
        });
    }

    function toggleControls(data) {
        self.options.showTimeline = !data.collapsed;
        self.$video.options({
            height: getPlayerHeight()
        });
        that.triggerEvent('toggletimeline', {
            showTimeline: self.options.showTimeline
        });
    }

    function toggleLoop() {
        self.$video.toggleLoop();
    }

    function toggleMuted() {
        self.$video.toggleMuted();
    }

    function togglePaused() {
        self.$video.togglePaused();
        self.$video.options('paused') && that.triggerEvent('position', {
            position: self.$video.options('position')
        });
    }

    // fixme: can these be removed?

    /*@
    toggleAnnotations <f> toggle annotations
        () -> <o> toggle visibility of annotations
    @*/
    that.toggleAnnotations = function() {
        self.$mainPanel.toggleElement(1);
    };

    /*@
    toggleTimeline <f> toggle timeline
        () -> <o> toggle visibility of timeline
    @*/
    that.toggleTimeline = function() {
        self.$videoPanel.toggleElement(1);
    };

    return that;

}
