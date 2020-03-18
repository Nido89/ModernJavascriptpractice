'use strict';

Ox.VideoEditPanel = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({
            annotationsCalendarSize: 256,
            annotationsMapSize: 256,
            annotationsRange: 'all',
            annotationsSort: 'position',
            clipRatio: 16/9,
            clips: [],
            clipSize: 256,
            clipTooltip: 'clips',
            clipView: 'list',
            clickLink: null,
            controlsTooltips: {},
            duration: 0,
            editable: false,
            enableSubtitles: false,
            formatTitle: function() {
                return Ox.last(arguments);
            },
            fps: 25,
            fullscreen: false,
            getClipImageURL: null,
            getLargeTimelineURL: null,
            height: 0,
            'in': 0,
            loop: false,
            layers: [],
            muted: false,
            out: 0,
            paused: true,
            playbackRate: 1,
            playInToOut: false,
            position: 0,
            resolution: 0,
            scaleToFill: false,
            selected: [],
            showAnnotationsCalendar: false,
            showAnnotationsMap: false,
            showClips: false,
            showLayers: {},
            showTimeline: false,
            showUsers: false,
            smallTimelineURL: '',
            sort: [],
            sortOptions: [],
            subtitles: [],
            subtitlesOffset: 0,
            timeline: '',
            timelineTooltip: 'timeline',
            type: 'static',
            video: [],
            volume: 1,
            width: 0
        })
        .options(options || {})
        .update({
            clips: function() {
                self.$clipPanel.options({
                    clips: Ox.clone(self.options.clips),
                    sort: Ox.clone(self.options.sort)
                });
            },
            clipSize: function() {
                self.$mainPanel.resizeElement(1, self.options.clipSize);
                resizeClips({size: self.options.clipSize});
            },
            clipView: function() {
                self.$clipPanel.options({
                    view: self.options.clipView
                });
            },
            duration: function() {
                self.$timeline && self.$timeline.replaceWith(
                    self.$timeline = getTimeline()
                );
            },
            fullscreen: function() {
                self.$video.options({fullscreen: self.options.fullscreen});
            },
            height: function() {
                self.$video.options({height: getPlayerHeight()});
                self.$clipPanel.options({height: self.options.height});
            },
            'in': function() {
                setPoint('in', self.options['in']);
            },
            out: function() {
                setPoint('out', self.options.out);
            },
            paused: function() {
                self.$video.options({paused: self.options.paused});
            },
            playbackRate: function() {
                self.$video.options({playbackRate: self.options.playbackRate});
            },
            position: function() {
                self.$video.options({position: self.options.position});
                self.$timeline.options({position: self.options.position});
                self.$clipPanel.options({position: self.options.position});
            },
            selected: function() {
                self.$clipPanel.options({selected: self.options.selected});
            },
            showClips: function() {
                self.$mainPanel.toggleElement(1);
            },
            showLayers: function() {
                self.$clipPanel.options({
                    showLayers: self.options.showLayers
                });
            },
            showTimeline: function() {
                self.$videoPanel.toggleElement(2);
            },
            smallTimelineURL: function() {
                self.$video.options({timeline: self.options.smallTimelineURL});
            },
            subtitles: function() {
                self.$video.options({subtitles: self.options.subtitles});
                self.$timeline.options({
                    subtitles: self.options.enableSubtitles ? self.options.subtitles : []
                });
            },
            timeline: function() {
                self.$timeline.options({type: self.options.timeline});
            },
            video: function() {
                self.chapters = getChapters();
                self.cuts = getCuts();
                self.$video.options({
                    chapters: self.chapters,
                    video: self.options.video
                });
                self.$timeline.options({
                    cuts: self.cuts
                });
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
        .bindEvent({
            //resize: resizeElement,
            key_0: toggleMuted,
            key_backslash: function() {
                if (self.options.view != 'annotations') {
                    self.$clipPanel.selectClip();
                }
            },
            key_closebracket: function() {
                movePositionTo('chapter', 1);
            },
            key_comma: function() {
                movePositionTo('cut', -1);
            },
            key_control_c: function() {
                // FIXME: this looks wrong, should copy getSelectedClips
                that.triggerEvent('copy', [{
                    annotation: self.options.selected,
                    'in': self.options['in'],
                    out: self.options.out
                }]);
            },
            key_control_v: function() {
                that.triggerEvent('paste');
            },
            key_dot: function() {
                movePositionTo('cut', 1);
            },
            key_equal: function() {
                self.$video.changeVolume(0.1);
            },
            key_i: function() {
                setPoint('in', self.options.position, true);
            },
            key_left: function() {
                movePositionBy(-0.04);
            },
            key_minus: function() {
                self.$video.changeVolume(-0.1);
            },
            key_o: function() {
                setPoint('out', self.options.position, true);
            },
            key_openbracket: function() {
                movePositionTo('chapter', -1);
            },
            key_right: function() {
                movePositionBy(0.04);
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
            key_slash: function() {
                // TODO: selectCut
            },
            key_shift_right: function() {
                movePositionBy(1);
            },
            key_space: togglePaused
        });

    self.chapters = getChapters();
    self.cuts = getCuts();
    self.fullscreen = false;
    self.listSizes = [
        144 + Ox.UI.SCROLLBAR_SIZE,
        280 + Ox.UI.SCROLLBAR_SIZE,
        416 + Ox.UI.SCROLLBAR_SIZE
    ],

    self.$menubar = Ox.Bar({size: 24});

    self.$player = Ox.Element().css({overflowX: 'hidden'});

    self.$video = Ox.VideoPlayer({
            chapters: self.chapters,
            controlsBottom: [
                'play', 'playInToOut', 'volume', 'scale', 'timeline',
                'previous', 'next', 'loop', 'position', 'settings'
            ],
            controlsTooltips: self.options.controlsTooltips,
            controlsTop: ['fullscreen', 'chapterTitle', 'open'],
            cuts: self.cuts,
            enableKeyboard: true,
            enableMouse: true,
            enablePosition: true,
            enableSubtitles: self.options.enableSubtitles,
            enableTimeline: true,
            externalControls: true,
            height: getPlayerHeight(),
            'in': self.options['in'],
            loop: self.options.loop,
            muted: self.options.muted,
            out: self.options.out,
            playbackRate: self.options.playbackRate,
            paused: self.options.paused,
            position: self.options.position,
            resolution: self.options.resolution,
            scaleToFill: self.options.scaleToFill,
            showMilliseconds: 3,
            subtitles: self.options.subtitles,
            subtitlesOffset: self.options.subtitlesOffset,
            timeline: self.options.smallTimelineURL,
            video: self.options.video,
            volume: self.options.volume,
            width: getPlayerWidth()
        })
        .bindEvent({
            durationchange: function(data) {
                self.options.duration = data.duration;
                self.$timeline && self.$timeline.replaceWith(
                    self.$timeline = getTimeline()
                );
                setPosition(self.$video.options('position'), true);
                self.$clipPanel.options({duration: self.options.duration});
            },
            fullscreen: function(data) {
                self.options.fullscreen = data.fullscreen;
            },
            loop: function(data) {
                that.triggerEvent('loop', data);
            },
            key_control_v: function() {
                that.triggerEvent('paste');
            },
            muted: function(data) {
                that.triggerEvent('muted', data);
            },
            open: function(data) {
                var clip = Ox.last(self.options.clips.filter(function(clip) {
                    return clip.position <= self.options.position;
                }));
                that.triggerEvent('openlink', {
                    annotation: clip.annotation,
                    'in': clip['in'],
                    item: clip.item,
                    out: clip.out,
                    position: clip['in'] + self.options.position - clip['position'],
                });
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
            subtitles: function(data) {
                self.$timeline.options({
                    subtitles: data.subtitles ? self.options.subtitles : []
                });
                that.triggerEvent('subtitles', data);
            },
            subtitlestrack: function(data) {
                var enableSubtitles = !!data.track;
                if (enableSubtitles != self.options.enableSubtitles) {
                    self.options.enableSubtitles = enableSubtitles;
                    that.triggerEvent('subtitles', {subtitles: enableSubtitles});
                }
                self.$timeline.options({
                    subtitles: enableSubtitles ? self.options.subtitles : []
                });
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

    self.$timeline = getTimeline()
        .appendTo(self.$controls);

    self.$videoPanel = Ox.SplitPanel({
            elements: [
                {
                    element: self.$menubar,
                    size: 24
                },
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

    self.$clipPanel = Ox.ClipPanel({
            annotationsCalendarSize: self.options.annotationsCalendarSize,
            annotationsMapSize: self.options.annotationsMapSize,
            annotationsRange: self.options.annotationsRange,
            annotationsSort: self.options.annotationsSort,
            clipRatio: self.options.clipRatio,
            clips: Ox.clone(self.options.clips),
            clickLink: self.options.clickLink,
            duration: self.options.duration,
            editable: self.options.editable,
            formatTitle: self.options.formatTitle,
            getClipImageURL: self.options.getClipImageURL,
            'in': self.options['in'],
            layers: Ox.clone(self.options.layers),
            out: self.options.out,
            position: self.options.position,
            selected: self.options.selected,
            showAnnotationsCalendar: self.options.showAnnotationsCalendar,
            showAnnotationsMap: self.options.showAnnotationsMap,
            showLayers: self.options.showLayers,
            showUsers: self.options.showUsers,
            sort: Ox.clone(self.options.sort),
            sortOptions: self.options.sortOptions,
            view: self.options.clipView,
            width: self.options.clipSize
        })
        .bindEvent({
            copy: function(data) {
                that.triggerEvent('copy', data);
            },
            copyadd: function(data) {
                that.triggerEvent('copyadd', data);
            },
            cut: function(data) {
                that.triggerEvent('cut', data);
            },
            cutadd: function(data) {
                that.triggerEvent('cutadd', data);
            },
            'delete': function(data) {
                that.triggerEvent('delete', data);
            },
            edit: function(data) {
                that.triggerEvent('edit', data);
            },
            join: function(data) {
                that.triggerEvent('join', data);
            },
            move: function(data) {
                that.triggerEvent('move', data);
            },
            open: function(data) {
                setPosition(getClipById(data.ids[0])['position']);
                that.triggerEvent('open', data);
            },
            paste: function() {
                that.triggerEvent('paste');
            },
            resize: resizeClips,
            resizeend: resizeendClips,
            select: function(data) {
                self.options.selected = data.ids;
                that.triggerEvent('select', data);
            },
            selectannotation: function(data) {
                that.triggerEvent('selectannotation', data);
            },
            sort: function(data) {
                self.options.sort = data;
                that.triggerEvent('sort', data);
            },
            split: function(data) {
                that.triggerEvent('split', data);
            },
            toggle: toggleClips,
            view: function(data) {
                that.triggerEvent('view', data);
            }
        });

    that.setElement(
        self.$mainPanel = Ox.SplitPanel({
            elements: [
                {
                    element: self.$videoPanel
                },
                {
                    collapsed: !self.options.showClips,
                    collapsible: true,
                    element: self.$clipPanel,
                    resizable: true,
                    resize: self.listSizes,
                    size: self.options.clipSize,
                    tooltip: self.options.clipTooltip
                }
            ],
            orientation: 'horizontal'
        })
    );

    function dragTimeline(data) {
        self.options.position = data.position;
        self.$video.options({position: self.options.position});
        self.$clipPanel.options({position: self.options.position});
    }

    function dragendTimeline(data) {
        dragTimeline(data);
        that.triggerEvent('position', {position: self.options.position});
    }

    function getChapters() {
        return self.options.clips.map(function(clip) {
            return {
                position: clip.position,
                title: self.options.formatTitle(clip)
            };
        });
    }

    function getClipById(id) {
        return Ox.getObjectById(self.options.clips, id);
    }

    function getClipsInSelection() {
        // FIXME: there should be a library function (intersect?) for this
        var clips = self.options.clips.filter(function(clip) {
            var endPosition = clip.position + clip.duration;
            return (
                clip.position >= self.options['in']
                && endPosition < self.options.out
            ) || (
                clip.position <= self.options['in']
                && endPosition > self.options['in']
            ) || (
                clip.position < self.options.out
                && endPosition >= self.options.out
            )
        });
        return clips.map(function(clip, index) {
            var dereference = false,
                endPosition = clip.position + clip.duration,
                inPoint = clip['in'],
                outPoint = clip.out;
            if (index == 0 && clip.position < self.options['in']) {
                dereference = true;
                inPoint = Ox.round(clip['in'] + self.options['in'] - clip.position, 3);
            }
            if (index == clips.length - 1 && endPosition > self.options.out) {
                dereference = true;
                outPoint = Ox.round(clip.out + self.options.out - endPosition, 3);
            }
            return clip.annotation && !dereference ? clip.annotation
                : clip.item + '/' + inPoint + '-' + outPoint;
        });
    }

    function getCuts() {
        var cuts = [];
        self.options.clips.forEach(function(clip, i) {
            if (i > 0) {
                cuts.push(clip.position);
            }
            clip.cuts.forEach(function(cut) {
                cuts.push(clip.position + cut - clip['in']);
            });
        });
        return cuts;
    }

    // fixme: why not goToNextPosition()?
    function getNextPosition(type, direction) {
        // type can be 'chapter' or 'cut'
        var positions;
        if (type == 'chapter') {
            positions = self.chapters.map(function(chapter) {
                return chapter.position;
            });
        } else if (type == 'cut') {
            positions = [0].concat(self.cuts, self.options.duration);
        }
        return Ox.nextValue(positions, self.options.position, direction);
    }

    function getPlayerHeight() {
        return self.options.height - 24 - 32
            - self.options.showTimeline * 80 - 1;
    }

    function getPlayerWidth() {
        return self.options.width
            - (self.options.showClips && !self.fullscreen)
            * self.options.clipSize - 1;
    }

    function getTimeline() {
        return Ox.LargeVideoTimeline({
                chapters: self.chapters,
                cuts: self.cuts,
                duration: self.options.duration,
                getImageURL: self.options.getLargeTimelineURL,
                'in': self.options['in'],
                out: self.options.out,
                position: self.options.position,
                subtitles: self.options.enableSubtitles ? self.options.subtitles : [],
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
                positioning: dragTimeline,
            });
    }

    function getTimelineWidth() {
        return self.options.width
            - (self.options.showClips && !self.fullscreen)
            * self.options.clipSize - 16 - 1;
    }

    function goToPoint(point) {
        setPosition(self.options[point]);
    }

    function movePositionBy(sec) {
        setPosition(Ox.limit(self.options.position + sec, 0, self.options.duration));
    }

    function movePositionTo(type, direction) {
        setPosition(getNextPosition(type, direction));
    }

    function resizeClips(data) {
        // called on clips resize
        self.options.clipSize = data.size;
        self.$video.options({
            width: getPlayerWidth()
        });
        self.$timeline.options({
            width: getTimelineWidth()
        });
        self.$clipPanel.options({width: data.size});
    }

    function resizeendClips(data) {
        that.triggerEvent('clipSize', data);
    }

    function setPoint(point, position, triggerEvent) {
        self.options[point] = position;
        self.$video.options(point, position);
        self.$timeline.options(point, position);
        self.$clipPanel.options(point, position);
        if (self.options['in'] > self.options.out) {
            setPoint(point == 'in' ? 'out' : 'in', position);
        }
        if (triggerEvent) {
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
        self.$clipPanel.options({position: self.options.position});
        if ((!playing || minute != previousMinute) && !dragging) {
            that.triggerEvent('position', {
                position: !playing ? self.options.position : minute * 60
            });
        }
    }

    function toggleClips(data) {
        self.options.showClips = !data.collapsed;
        self.$video.options({
            width: getPlayerWidth()
        });
        self.$timeline.options({
            width: getTimelineWidth()
        });
        that.triggerEvent('toggleclips', {
            showClips: self.options.showClips
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

    function toggleMuted() {
        self.$video.toggleMuted();
    }

    function togglePaused() {
        self.$video.togglePaused();
        self.$video.options('paused') && that.triggerEvent('position', {
            position: self.$video.options('position')
        });
    }

    that.getPasteIndex = function() {
        return self.$clipPanel.getPasteIndex();
    };

    that.getSelectedClips = function() {
        return self.options.selected.length ? self.options.selected.map(function(id) {
            var clip = getClipById(id);
            return (
                clip.annotation || clip.item + '/' + clip['in'] + '-' + clip.out
            ) + '/' + id;
        }) : getClipsInSelection();
    };

    that.invertSelection = function() {
        self.$clipPanel.invertSelection();
    };

    that.selectAll = function() {
        self.$clipPanel.selectAll();
    };

    that.updateClip = function(id, data) {
        self.options.clips[Ox.getIndexById(self.options.clips, id)] = data;
        self.$clipPanel.updateItem(id, data);
    };

    return that;

};
