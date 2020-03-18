'use strict';

/*@
Ox.VideoTimelinePanel <f> Video timeline panel
    options <o> Options
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.SplitPanel> Video timeline panel
        annoationssize <!> annoationssize
        annotationsrange <!> annotationsrange
        annotationssort <!> annotationssort
        audioTrack <s|''> Two-letter ISO 639-1 language code or track name
        censored <!> censored
        follow <!> follow
        info <!> info
        muted <!> muted
        paused <!> paused
        position <!> position
        resizecalendar <!> resizecalendar
        resizemap <!> resizemap
        select <!> select
        timeline <!> timeline
        toggleannotations <!> toggleannotations
        togglecalendar <!> togglecalendar
        togglelayer <!> togglelayer
        togglemap <!> togglemap
        volume <!> volume
@*/

Ox.VideoTimelinePanel = function(options, self) {

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
                followPlayer: false,
                getFrameURL: null,
                getLargeTimelineURL: null,
                height: 0,
                'in': 0,
                itemName: {singular: 'video', plural: 'videos'},
                layers: [],
                loop: false, // fixme: used?
                muted: false,
                out: 0,
                paused: true,
                playbackRate: 1,
                position: 0,
                resolution: 0,
                selected: '',
                showAnnotations: false,
                showAnnotationsCalendar: false,
                showAnnotationsMap: false,
                showLayers: {},
                showUsers: false,
                smallTimelineURL: '',
                subtitles: [],
                timeline: '',
                timelines: [],
                video: '',
                volume: 1,
                width: 0
            })
            .options(options || {})
            .update({
                height: function() {
                    self.$player.options({height: self.options.height});
                },
                paused: function() {
                    self.$player.options({paused: self.options.paused});
                },
                playbackRate: function() {
                    self.$player.options({playbackRate: self.options.playbackRate});
                },
                position: function() {
                    setPosition(self.options.position);
                },
                showAnnotations: function() {
                    self.$panel.toggleElement(1);
                },
                timeline: function() {
                    self.$player.options({timeline: self.options.timeline});
                },
                width: function() {
                    self.$player.options({width: getPlayerWidth()});
                }
            })
            .css({
                height: self.options.height + 'px',
                width: self.options.width + 'px'
            })
            .bindEvent({
                resize: resizeElement,
                key_0: toggleMuted,
                key_equal: function() {
                    self.$video.changeVolume(0.1);
                },
                key_minus: function() {
                    self.$video.changeVolume(-0.1);
                },
                key_space: togglePaused
            });

    self.$player = Ox.VideoTimelinePlayer({
            audioTrack: self.options.audioTrack,
            censored: self.options.censored,
            censoredIcon: self.options.censoredIcon,
            censoredTooltip: self.options.censoredTooltip,
            cuts: self.options.cuts,
            duration: self.options.duration,
            followPlayer: self.options.followPlayer,
            getFrameURL: self.options.getFrameURL,
            getLargeTimelineURL: self.options.getLargeTimelineURL,
            height: self.options.height,
            muted: self.options.muted,
            paused: self.options.paused,
            playbackRate: self.options.playbackRate,
            position: self.options.position,
            resolution: self.options.resolution,
            smallTimelineURL: self.options.smallTimelineURL,
            subtitles: self.options.subtitles,
            timeline: self.options.timeline,
            timelines: self.options.timelines,
            video: self.options.video,
            videoRatio: self.options.videoRatio,
            volume: self.options.volume,
            width: getPlayerWidth()
        })
        .bindEvent({
            censored: function() {
                that.triggerEvent('censored');
            },
            follow: function(data) {
                that.triggerEvent('follow', data);
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
            timeline: function(data) {
                that.triggerEvent('timeline', data);
            },
            volume: function(data) {
                that.triggerEvent('volume', data);
            }
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

    that.setElement(
        self.$panel = Ox.SplitPanel({
            elements: [
                {
                    element: self.$player
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

    function getPlayerWidth() {
        return self.options.width -
            self.options.showAnnotations * self.options.annotationsSize - 1;
    }

    function resizeAnnotations(data) {
        // called on annotations resize
        self.options.annotationsSize = data.size;
        self.$player.options({
            width: getPlayerWidth()
        });
        self.$annotationPanel.options({width: data.size});
    }

    function resizeendAnnotations(data) {
        that.triggerEvent('annotationssize', data.size);
    }

    function resizeElement(data) {
        // called on browser toggle
        self.options.height = data.size;
        self.$player.options({
            height: self.options.height
        });
    }

    function selectAnnotation(data) {
        self.options.selected = data.id;
        if (self.options.selected) {
            setPosition(data['in']);
        }
        self.$annotationPanel.options({selected: self.options.selected});
        that.triggerEvent('select', {id: self.options.selected});
    }

    function setPosition(position, playing) {
        var minute = Math.floor(position / 60),
            previousMinute = Math.floor(self.options.position / 60);
        self.options.position = position;
        !playing && self.$player.options({position: self.options.position});
        self.$annotationPanel.options({position: self.options.position});
        if (!playing || minute != previousMinute) {
            that.triggerEvent('position', {
                position: !playing ? self.options.position : minute * 60
            });
        }
    }

    function toggleAnnotations(data) {
        self.options.showAnnotations = !data.collapsed;
        self.$player.options({
            width: getPlayerWidth()
        });
        that.triggerEvent('toggleannotations', {
            showAnnotations: self.options.showAnnotations
        });
    }

    function toggleMuted() {
        self.$player.toggleMuted();
    }

    function togglePaused() {
        self.$player.togglePaused();
        self.$player.options('paused') && that.triggerEvent('position', {
            position: self.$player.options('position')
        });
    }

    /*@
    toggleAnnotations <f> toggle annotations
        () -> <o>  toggle annotations
    @*/
    that.toggleAnnotations = function() {
        self.$panel.toggleElement(1);
    };

    return that;

};
