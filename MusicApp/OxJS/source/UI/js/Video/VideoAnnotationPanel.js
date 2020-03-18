'use strict';

/*@
Ox.VideoAnnotationPanel <f> VideoAnnotationPanel Object
    options <o> Options object
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.SplitPanel> VideoAnnotationPanel Object
        addannotation <!> addannotation
        annotationsrange <!> annotationsrange
        annotationssize <!> annotationssize
        annotationssort <!> annotationssort
        audioTrack <s|''> Two-letter ISO 639-1 language code or track name
        censored <!> censored
        define <!> define
        downloadselection <!> downloadselection
        downloadframe <!> downloadframe
        downloadvideo <!> downloadvideo
        editannotation <!> editannotation
        embedselection <!> embedselection
        findannotations <!> findannotations
        find <!> find
        findLayer <s|*> limit find to layer
        importannotations <!> importannotations
        info <!> info
        key_* <!> key_*
        muted <!> muted
        paused <!> paused
        points <!> points
        position <!> position
        posterframe <!> posterframe
        removeannotation <!> removeannotation
        resizecalendar <!> resizecalendar
        resizemap <!> resizemap
        resolution <!> resolution
        select <!> select
        subtitles <!> subtitles
        timeline <!> timeline
        toggleannotations <!> toggleannotations
        togglecalendar <!> togglecalendar
        togglelayer <!> togglelayer
        togglemap <!> togglemap
        volume <!> volume
@*/

Ox.VideoAnnotationPanel = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
            .defaults({
                annotationsCalendarSize: 256,
                annotationsHighlight: 'none',
                annotationsMapSize: 256,
                annotationsRange: 'all',
                annotationsSeparator: ';',
                annotationsSize: 256,
                annotationsSort: 'position',
                annotationsTooltip: Ox._('annotations'),
                audioTrack: '',
                autocomplete: null,
                censored: [],
                censoredIcon: '',
                censoredTooltip: '',
                clickLink: null,
                cuts: [],
                duration: 0,
                enableDownload: false,
                enableImport: false,
                enableExport: false,
                enableSetPosterFrame: false,
                enableSubtitles: false,
                find: '',
                findLayer: '*',
                fps: 25,
                getFrameURL: null,
                getLargeTimelineURL: null,
                getSmallTimelineURL: null,
                'in': 0,
                itemName: {singular: 'video', plural: 'videos'},
                height: 0,
                layers: [],
                loop: false,
                muted: false,
                out: 0,
                paused: true,
                playbackRate: 1,
                position: 0,
                posterFrame: 0,
                resolution: 0,
                selected: '',
                selectResult: false,
                showAnnotations: false,
                showAnnotationsCalendar: false,
                showAnnotationsMap: false,
                showLargeTimeline: true,
                showLayers: {},
                showUsers: false,
                subtitles: [],
                subtitlesDefaultTrack: 'en',
                subtitlesLayer: null,
                subtitlesOffset: 0,
                subtitlesTrack: 'en',
                timeline: '',
                timelines: [],
                videoRatio: 16/9,
                videoSize: 'small',
                video: '',
                volume: 1,
                width: 0
            })
            .options(options || {})
            .update({
                height: setSizes,
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
                    self.$player[0].options({
                        paused: self.options.paused
                    });
                },
                playbackRate: function() {
                    self.$player[0].options({
                        playbackRate: self.options.playbackRate
                    });
                },
                position: function() {
                    setPosition(self.options.position);
                },
                selected: function() {
                    selectAnnotation(
                        self.options.selected
                            ? Ox.getObjectById(self.annotations, self.options.selected)
                            : {id: ''}
                    );
                },
                showAnnotations: function() {
                    self.$mainPanel.toggleElement(1);
                },
                showLayers: function() {
                    self.$annotationPanel.options({
                        showLayers: Ox.clone(self.options.showLayers)
                    });
                },
                timeline: function() {
                    self.$menuButton.checkItem('timelines_' + self.options.timeline);
                    updateTimelines();
                },
                volume: function() {
                    self.$player[0].options({
                        volume: self.options.volume
                    });
                },
                width: setSizes
            })
            .bindEvent({
                key_0: toggleMuted,
                key_alt_left: function() {
                },
                key_alt_right: function() {
                },
                key_alt_shift_left: function() {
                },
                key_alt_shift_right: function() {
                },
                key_b: function() {
                    self.annotations.length && selectAnnotation(
                        getNextAnnotation('annotation', -1)
                    );
                },
                key_backslash: function() {
                    self.annotations.length && selectAnnotation();
                },
                key_closebracket: function() {
                    self.annotations.length && movePositionTo('annotation', 1);
                },
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
                key_delete: function() {
                    self.$annotationPanel.removeItem(true);
                },
                key_dot: function() {
                    movePositionTo('cut', 1);
                },
                key_down: function() {
                    movePositionBy(self.sizes.timeline[0].width);
                },
                key_enter: function() {
                    if (self.editing) {
                        blurAnnotation();
                    } else if (isEditable()) {
                        editAnnotation();
                    }
                },
                key_equal: function() {
                    self.$player[0].changeVolume(0.1);
                },
                key_escape: function() {
                    if (self.editing) {
                        blurAnnotation();
                    } else if (self.options.selected) {
                        selectAnnotation({id: ''});
                    }
                },
                key_f: function() {
                    setTimeout(function() {
                        self.$findInput.focusInput(true);
                    });
                },
                key_g: function() {
                    self.results.length && selectAnnotation(
                        getNextAnnotation('result', 1)
                    );
                },
                key_h: showKeyboardShortcuts,
                key_i: function() {
                    setPoint('in', self.options.position);
                },
                key_k: function togglePlaybackRate() {
                    that.options({playbackRate: self.options.playbackRate == 1 ? 2 : 1});
                },
                key_l: toggleLoop,
                key_left: function() {
                    movePositionBy(-1 / self.options.fps);
                },
                key_minus: function() {
                    self.$player[0].changeVolume(-0.1);
                },
                key_n: function() {
                    self.annotations.length && selectAnnotation(
                        getNextAnnotation('annotation', 1)
                    );
                },
                key_o: function() {
                    setPoint('out', self.options.position);
                },
                key_openbracket: function() {
                    self.annotations.length && movePositionTo('annotation', -1);
                },
                key_p: playInToOut,
                key_right: function() {
                    movePositionBy(1 / self.options.fps);
                },
                key_shift_0: function() {
                    movePositionBy(-self.options.position);
                },
                key_shift_down: function() {
                    movePositionBy(self.options.duration);
                },
                key_shift_enter: function() {
                    if (self.editing) {
                        blurAnnotation();
                    } else if (isEditable()) {
                        editAnnotation();
                    }
                },
                key_shift_equal: function() {
                    self.options.videoSize == 'small' && toggleSize();
                },
                key_shift_g: function() {
                    self.results.length && selectAnnotation(
                        getNextAnnotation('result', -1)
                    );
                },
                key_shift_i: function() {
                    goToPoint('in');
                },
                key_shift_left: function() {
                    movePositionBy(-1);
                },
                key_shift_minus: function() {
                    self.options.videoSize == 'large' && toggleSize();
                },
                key_shift_o: function() {
                    goToPoint('out');
                },
                key_shift_p: function() {
                    setPosition(self.options.posterFrame);
                },
                key_shift_right: function() {
                    movePositionBy(1);
                },
                key_shift_up: function() {
                    movePositionBy(-self.options.position);
                },
                key_slash: selectCut,
                key_space: togglePaused,
                key_up: function() {
                    movePositionBy(-self.sizes.timeline[0].width);
                }
            });

    self.options.subtitles = options.subtitles !== void 0
         ? self.options.subtitles : parseSubtitles();
    self.subtitlesTracks = Ox.sort(Ox.unique(Ox.flatten(
        self.options.subtitles.map(function(subtitle) {
            return subtitle.tracks;
        })
    ))).map(function(track) {
        return {
            id: track,
            title: Ox._(track),
            checked: self.options.enableSubtitles
                && track == self.options.subtitlesTrack
        };
    }).concat([{
        id: '',
        title: Ox._('None'),
        checked: !self.options.enableSubtitles
    }]);

    if (Ox.isObject(self.options.video[0])) {
        self.resolutions = Ox.sort(Ox.unique(
            self.options.video.map(function(video) {
                return video.resolution;
            })
        )).map(function(resolution) {
            return {
                id: resolution + '',
                title: resolution + 'p',
                checked: self.options.resolution == resolution
            };
        });
        self.audioTracks = Ox.sort(Ox.unique(
            self.options.video.map(function(video) {
                return video.track;
            })
        )).map(function(track) {
            return {
                id: track,
                title: Ox._(track),
                checked: self.options.audioTrack == track
            };
        });
    }

    self.options.layers.forEach(function(layer, i) {
        that.bindEvent('key_' + (i + 1), function() {
            layer.editable
                ? addAnnotation(layer.id)
                : that.triggerEvent('info', {layer: layer.id});
        });
    });

    self.$player = [];
    self.$timeline = [];
    self.annotations = getAnnotations();
    self.controlsHeight = 16;
    self.editing = false;
    self.margin = 8;
    self.positions = getPositions();
    self.results = [];
    self.words = getWords();

    self.$editor = Ox.Element()
        .addClass('OxVideoAnnotationPanel OxMedia')
        .on({
            mousedown: function(e) {
                var $target = $(e.target);
                if (!$target.is('.OxPosition') && !$target.is('input')) {
                    that.gainFocus();
                }
                // ignore mousedown inside a focused input element
                if ($target.is('.OxKeyboardFocus')) {
                    return;
                }
                // the following is needed to determine
                // how to handle annotation input blur
                if (self.editing) {
                    self.focused = true;
                    setTimeout(function() {
                        // annotation folder will gain focus on blur
                        // so we need to get focus back
                        that.gainFocus();
                        self.focused = false;
                    }, 25);
                }
            }
        });

    self.sizes = getSizes();

    ['play', 'in', 'out'].forEach(function(type, i) {
        self.$player[i] = Ox.VideoPlayer({
                censored: self.options.censored,
                censoredIcon: self.options.censoredIcon,
                censoredTooltip: self.options.censoredTooltip,
                controlsBottom: type == 'play' ?
                    ['play', 'playInToOut', 'volume', 'size', 'space', 'position'] :
                    ['goto', 'set', 'space', 'position'],
                duration: self.options.duration,
                enableMouse: true,
                enablePosition: true,
                enableSubtitles: self.options.enableSubtitles,
                externalControls: true,
                find: getSubtitlesFind(),
                height: self.sizes.player[i].height,
                id: 'player' + Ox.toTitleCase(type),
                'in': self.options['in'],
                loop: self.options.loop,
                muted: self.options.muted,
                out: self.options.out,
                paused: self.options.paused,
                playbackRate: self.options.playbackRate,
                position: type == 'play' ? self.options.position : self.options[type],
                posterFrame: self.options.posterFrame,
                resolution: self.options.resolution,
                showMarkers: true,
                showMilliseconds: 3,
                sizeIsLarge: self.options.videoSize == 'large',
                subtitles: Ox.clone(self.options.subtitles, true),
                subtitlesDefaultTrack: self.options.subtitlesDefaultTrack,
                subtitlesOffset: self.options.subtitlesOffset,
                subtitlesTrack: self.options.subtitlesTrack,
                type: type,
                video: type == 'play' ? self.options.video : self.options.getFrameURL,
                volume: self.options.volume,
                width: self.sizes.player[i].width
            })
            .css({
                left: self.sizes.player[i].left + 'px',
                top: self.sizes.player[i].top + 'px'
            })
            .bindEvent(
                Ox.extend({
                    censored: function() {
                        that.triggerEvent('censored');
                    }
                }, type == 'play' ? {
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
                    size: function() {
                        toggleSize();
                    },
                    submit: function() {
                        that.gainFocus();
                    },
                    subtitles: function(data) {
                        that.triggerEvent('subtitles', data);
                    },
                    volume: function(data) {
                        that.triggerEvent('volume', data);
                    }
                } : {
                    gotopoint: function() {
                        goToPoint(type);
                    },
                    position: function(data) {
                        setPoint(type, data.position);
                    },
                    setpoint: function() {
                        setPoint(type, self.options.position);
                    }
                })
            )
            .appendTo(self.$editor);
    });

    self.$timeline[0] = Ox.LargeVideoTimeline({
            cuts: self.options.cuts,
            duration: self.options.duration,
            find: getSubtitlesFind(),
            getImageURL: self.options.getLargeTimelineURL,
            id: 'timelineLarge',
            'in': self.options['in'],
            //matches: self.options.matches,
            out: self.options.out,
            position: self.options.position,
            subtitles: getSubtitles(),
            type: self.options.timeline,
            width: self.sizes.timeline[0].width
        })
        .css({
            left: self.sizes.timeline[0].left + 'px',
            top: self.sizes.timeline[0].top + 'px'
        })
        .bindEvent({
            position: function(data) {
                setPosition(data.position);
            },
            positioning: function(data) {
                setPosition(data.position, false, true);
            }
        })
        .appendTo(self.$editor);

    self.$timeline[1] = Ox.BlockVideoTimeline({
            cuts: self.options.cuts,
            duration: self.options.duration,
            find: getSubtitlesFind(),
            getImageURL: self.options.getSmallTimelineURL,
            id: 'timelineSmall',
            'in': self.options['in'],
            out: self.options.out,
            position: self.options.position,
            results: find(self.options.find),
            showPointMarkers: true,
            state: self.options.selected ? 'selected' : 'default',
            subtitles: getSubtitles(),
            type: self.options.timeline,
            videoId: self.options.videoId,
            width: self.sizes.timeline[1].width
        })
        .css({
            left: self.sizes.timeline[1].left + 'px',
            top: self.sizes.timeline[1].top + 'px'
        })
        .bindEvent({
            edit: function() {
                if (isEditable() && !self.editing) {
                    editAnnotation();
                }
            },
            position: function(data) {
                setPosition(data.position);
            },
            select: function() {
                selectAnnotation(void 0, true);
            }
        })
        .appendTo(self.$editor);

    self.$menubar = Ox.Bar({
            size: 16
        })
        .addClass('OxVideoPlayer')
        .bindEvent({
            doubleclick: function(e) {
                if ($(e.target).is('.OxBar')) {
                    self.$editor.animate({scrollTop: 0}, 250);
                }
            }
        });

    self.$keyboardShortcuts = $('<div>').css({margin: '16px'});
    [
        {key: Ox.SYMBOLS.space, action: Ox._('Play/Pause')},
        {key: 'P', action: Ox._('Play In to Out')},
        {key: 'K', action: Ox._('Toggle Playback Speed')},
        {key: 'L', action: Ox._('Loop')},
        {key: '0', action: Ox._('Mute/Unmute')},
        {key: '-', action: Ox._('Turn Volume Down')},
        {key: '+', action: Ox._('Turn Volume Up')},
        {key: Ox.SYMBOLS.shift + '-', action: Ox._('Small Player')},
        {key: Ox.SYMBOLS.shift + '+', action: Ox._('Large Player')},
        {key: Ox.SYMBOLS.arrow_left, action: Ox._('Go One Frame Back')},
        {key: Ox.SYMBOLS.arrow_right, action: Ox._('Go One Frame Forward')},
        {key: Ox.SYMBOLS.shift + Ox.SYMBOLS.arrow_left, action: Ox._('Go One Second Back')},
        {key: Ox.SYMBOLS.shift + Ox.SYMBOLS.arrow_right, action: Ox._('Go One Second Forward')},
        {key: Ox.SYMBOLS.arrow_up, action: Ox._('Go One Line Up')},
        {key: Ox.SYMBOLS.arrow_down, action: Ox._('Go One Line Down')},
        {key: Ox.SYMBOLS.shift + Ox.SYMBOLS.arrow_up, action: Ox._('Go to First Frame')},
        {key: Ox.SYMBOLS.shift + Ox.SYMBOLS.arrow_down, action: Ox._('Go to Last Frame')},
        {key: 'I', action: Ox._('Set In Point')},
        {key: 'O', action: Ox._('Set Out Point')},
        {key: Ox.SYMBOLS.shift + 'I', action: Ox._('Go to In Point')},
        {key: Ox.SYMBOLS.shift + 'O', action: Ox._('Go to Out Point')},
        {key: '[', action: Ox._('Go to Previous Annotation')},
        {key: ']', action: Ox._('Go to Next Annotation')},
        {key: '\\', action: Ox._('Select Current Annotation')},
        {key: 'B', action: Ox._('Select Previous Annotation')},
        {key: 'N', action: Ox._('Select Next Annotation')},
        {key: '<', action: Ox._('Go to Previous Cut')},
        {key: '>', action: Ox._('Go to Next Cut')},
        {key: '/', action: Ox._('Select Current Cut')},
        {key: 'F', action: Ox._('Find')},
        {key: Ox.SYMBOLS.shift + 'G', action: Ox._('Go to Previous Result')},
        {key: 'G', action: Ox._('Go to Next Result')},
        {key: Ox.SYMBOLS['return'], action: Ox._('Edit/Submit')},
        {key: Ox.SYMBOLS.escape, action: Ox._('Cancel/Deselect')},
        {key: Ox.SYMBOLS.delete, action: Ox._('Delete')}
    ].concat(
        Ox.filter(self.options.layers.slice(0, 9).map(function(layer, i) {
            return layer.editable
                ? {key: i + 1, action: Ox._('Add {0}', [layer.item])}
                : null;
        }))
    ).forEach(function(shortcut) {
        self.$keyboardShortcuts.append(
            $('<div>').css({display: 'table-row'})
                .append(
                    $('<div>').css({
                        display: 'table-cell',
                        height: '16px',
                        paddingRight: '16px',
                        //fontWeight: 'bold',
                        textAlign: 'right'
                    })
                    .html(shortcut.key)
                )
                .append(
                    $('<div>').css({display: 'table-cell'})
                        .html(shortcut.action)
                )
        );
    });

    self.$menuButton = Ox.MenuButton({
            items: [].concat(
                [
                    {id: 'size', title: Ox._('Large Player'), checked: self.options.videoSize == 'large'},
                    {id: 'loop', title: Ox._('Loop'), checked: self.options.loop, keyboard: 'l'},
                    {},
                    {id: 'resolutions', title: Ox._('Resolution'), items: [
                        {group: 'resolution', min: 1, max: 1, items: self.resolutions}
                    ]}
                ],
                self.audioTracks.length > 1 ? [
                    {id: 'audioTracks', title: Ox._('Audio'), items: [
                        {group: 'audioTrack', min: 1, max: 1, items: self.audioTracks}
                    ]}
                ] : [],
                self.options.subtitles.length ? [
                    {id: 'subtitlesTracks', title: Ox._('Subtitles'), items: [
                        {group: 'subtitlesTrack', min: 1, max: 1, items: self.subtitlesTracks}
                    ]}
                ] : [],
                [
                    {id: 'timelines', title: Ox._('Timeline'), items: [
                        {group: 'timeline', min: 1, max: 1, items: Ox.map(
                            self.options.timelines,
                            function(timeline) {
                                return Ox.extend({
                                    checked: timeline.id == self.options.timeline
                                }, timeline);
                            }
                        )}
                    ]},
                    {},
                    {id: 'gotoPosterFrame', title: Ox._('Go to Poster Frame'), keyboard: 'shift p'},
                    {id: 'setPosterFrame', title: Ox._('Set Poster Frame'), disabled: !self.options.enableSetPosterFrame},
                    {},
                    {id: 'downloadVideo', title: Ox._('Download Video...'), disabled: !self.options.enableDownload },
                    {id: 'downloadFrame', title: Ox._('Download Frame...'), disabled: !self.options.enableDownload },
                    {id: 'downloadSelection', title: Ox._('Download Selection...'), disabled: !self.options.enableDownload},
                    {id: 'embedSelection', title: Ox._('Embed Selection...')},
                    {id: 'linkToSelection', title: Ox._('Link to Selection...')},
                    {},
                    {id: 'keyboard', title: Ox._('Keyboard Shortcuts...'), keyboard: 'h'}
                ]
            ),
            style: 'square',
            title: 'set',
            tooltip: Ox._('Options'),
            type: 'image'
        })
        .css({float: 'left'})
        .bindEvent({
            click: function(data) {
                var id = data.id;
                if (id == 'gotoPosterFrame') {
                    setPosition(self.options.posterFrame);
                } else if (id == 'setPosterFrame') {
                    self.options.posterFrame = self.options.position;
                    self.$player.forEach(function($player) {
                        $player.options('posterFrame', self.options.posterFrame);
                    });
                    that.triggerEvent('posterframe', {
                        position: self.options.posterFrame
                    });
                } else if (id == 'downloadVideo') {
                    that.triggerEvent('downloadvideo');
                } else if (id == 'downloadFrame') {
                    that.triggerEvent('downloadframe', {
                        'position': self.options.position
                    });
                } else if (id == 'downloadSelection') {
                    that.triggerEvent('downloadselection', {
                        'in': self.options['in'],
                        out: self.options.out
                    });
                } else if (id == 'embedSelection') {
                    that.triggerEvent('embedselection', {
                        'in': self.options['in'],
                        out: self.options.out
                    });
                } else if (id == 'linkToSelection') {
                    that.triggerEvent('linktoselection', {
                        'in': self.options['in'],
                        out: self.options.out
                    });
                } else if (id == 'keyboard') {
                    showKeyboardShortcuts();
                }
            },
            change: function(data) {
                var enableSubtitles,
                    id = data.id;
                if (id == 'size') {
                    toggleSize();
                } else if (id == 'loop') {
                    toggleLoop();
                } else if (id == 'resolution') {
                    self.options.resolution = parseInt(data.checked[0].id, 10);
                    self.$player[0].options({resolution: self.options.resolution});
                } else if (id == 'audioTrack') {
                    self.options.audioTrack = data.checked[0].id;
                    self.$player[0].options({audioTrack: self.options.audioTrack});
                } else if (id == 'subtitlesTrack') {
                    enableSubtitles = !!data.checked[0].id;
                    if (enableSubtitles != self.options.enableSubtitles) {
                        that.triggerEvent('subtitles', {subtitles: enableSubtitles});
                    }
                    self.options.subtitlesTrack = data.checked[0].id;
                    setSubtitlesTrack(); // will set self.options.enableSubtitles
                } else if (id == 'timeline') {
                    self.options.timeline = data.checked[0].id;
                    updateTimelines();
                    that.triggerEvent('timeline', {
                        timeline: self.options.timeline
                    });
                }
            },
            hide: function() {
                that.gainFocus();
            }
        })
        .appendTo(self.$menubar);

    self.$clearButton = Ox.Button({
            disabled: self.options.find === '',
            style: 'symbol',
            title: 'close',
            tooltip: Ox._('Clear'),
            type: 'image'
        })
        .css({float: 'right'})
        .bindEvent({
            click: function() {
                self.$findInput.clearInput();
                submitFindInput('');
            }
        })
        .appendTo(self.$menubar);

    self.$findInput = Ox.Input({
            autocomplete: self.words.map(function(word) {
                return word.value;
            }),
            autocompleteReplace: false,
            autocompleteSelect: true,
            autocompleteSelectHighlight: true,
            autocompleteSelectMax: 10,
            autocompleteSelectSubmit: true,
            changeOnKeypress: true,
            placeholder: Ox._('Find...'),
            value: self.options.find,
            width: 128
        })
        .css({float: 'right', background: 'transparent'})
        .bindEvent({
            change: function(data) {
                submitFindInput(data.value, false);
            },
            submit: function(data) {
                submitFindInput(data.value, true);
            }
        })
        .appendTo(self.$menubar);

    self.$nextButton = Ox.Button({
            disabled: true,
            style: 'symbol',
            title: 'arrowRight',
            tooltip: Ox._('Next Result'),
            type: 'image'
        })
        .css({float: 'right'})
        .bindEvent({
            click: function() {
                selectAnnotation(getNextAnnotation('result', 1));
            }
        })
        .appendTo(self.$menubar);

    self.$previousButton = Ox.Button({
            disabled: true,
            style: 'symbol',
            title: 'arrowLeft',
            tooltip: Ox._('Previous Result'),
            type: 'image'
        })
        .css({float: 'right'})
        .bindEvent({
            click: function() {
                selectAnnotation(getNextAnnotation('result', -1));
            }
        })
        .appendTo(self.$menubar);

    self.$results = $('<div>')
        .css({float: 'right', width: '36px', padding: '2px 4px 0 0', fontSize: '9px', textAlign: 'right', cursor: 'default', opacity: 0.25})
        .html('0')
        .appendTo(self.$menubar.$element);

    self.$annotationPanel = Ox.AnnotationPanel({
            autocomplete: self.options.autocomplete,
            calendarSize: self.options.annotationsCalendarSize,
            clickLink: self.options.clickLink,
            editable: true,
            enableExport: self.options.enableExport,
            enableImport: self.options.enableImport,
            highlight: self.options.find,
            highlightAnnotations: self.options.annotationsHighlight,
            highlightLayer: self.options.findLayer,
            'in': self.options['in'],
            itemName: self.options.itemName,
            layers: self.options.layers,
            mapSize: self.options.annotationsMapSize,
            out: self.options.out,
            position: self.options.position,
            range: self.options.annotationsRange,
            selected: self.options.selected,
            separator: self.options.annotationsSeparator,
            showCalendar: self.options.showAnnotationsCalendar,
            showFind: true,
            showLayers: Ox.clone(self.options.showLayers),
            showMap: self.options.showAnnotationsMap,
            showUsers: self.options.showUsers,
            sort: self.options.annotationsSort,
            width: self.options.annotationsSize
        })
        .bindEvent({
            add: function(data) {
                addAnnotation(data.layer);
            },
            annotationsrange: function(data) {
                self.options.annotationsRange = data.range;
                that.triggerEvent('annotationsrange', data);
            },
            annotationssort: function(data) {
                self.options.annotationsSort = data.sort;
                that.triggerEvent('annotationssort', data);
            },
            blur: function(data) {
                // Only blur if the video editor did not receive the click,
                // no dialog is open, and no menu was visible
                if (
                    !self.focused
                    && !$('.OxDialogLayer').length
                    && !$('.OxMenuLayer').length
                ) {
                    blurAnnotation();
                }
            },
            change: function(data) {
                if (data.layer == self.options.subtitlesLayer) {
                    updateSubtitles();
                }
                that.triggerEvent('editannotation', data);
            },
            define: function(data) {
                that.triggerEvent('define', data);
            },
            edit: function(data) {
                updateWords('remove');
                self.editing = true;
                setTimelineState();
            },
            exportannotations: function() {
                that.triggerEvent('exportannotations');
            },
            find: function(data) {
                self.$findInput.options({value: data.value});
                submitFindInput(data.value, true);
            },
            findannotations: function(data) {
                that.triggerEvent('findannotations', data);
            },
            focus: that.gainFocus,
            highlightannotations: function(data) {
                self.options.annotationsHighlight = data;
                that.triggerEvent('annotationshighlight', data);
            },
            highlightlayer: function(data) {
                self.options.findLayer = data;
                submitFindInput(self.$findInput.value(), false);
                that.triggerEvent('findlayer', data);
            },
            importannotations: function() {
                that.triggerEvent('importannotations');
            },
            info: function(data) {
                that.triggerEvent('info', data);
            },
            open: function() {
                setPosition(self.options['in']);
            },
            remove: removeAnnotation,
            resize: resizeAnnotations,
            resizeend: resizeendAnnotations,
            resizecalendar: function(data) {
                that.triggerEvent('resizecalendar', data);
            },
            resizemap: function(data) {
                that.triggerEvent('resizemap', data);
            },
            select: function(data) {
                selectAnnotation(data, true);
            },
            showentityinfo: function(data) {
                that.triggerEvent('showentityinfo', data);
            },
            submit: submitAnnotation,
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
        '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
        'b', 'backslash', 'closebracket', 'comma', 'dot',
        'equal', 'f', 'g', 'h', 'i', 'minus', 'n', 'o',
        'openbracket', 'p', 'shift_0', 'shift_equal',
        'shift_g', 'shift_i', 'shift_minus', 'shift_o',
        'slash', 'space'
    ].forEach(function(key) {
        key = 'key.' + key;
        self.$annotationPanel.bindEvent(key, function() {
            that.triggerEvent(key);
        });
    });

    that.setElement(
        self.$mainPanel = Ox.SplitPanel({
            elements: [
                {
                    element: Ox.SplitPanel({
                        elements: [
                            {
                                element: self.$menubar,
                                size: 16
                            },
                            {
                                element: self.$editor
                            }
                        ],
                        orientation: 'vertical'
                    })
                },
                {
                    collapsed: !self.options.showAnnotations,
                    collapsible: true,
                    element: self.$annotationPanel,
                    resizable: true,
                    resize: [192, 256, 320, 384, 448, 512],
                    size: self.options.annotationsSize,
                    tooltip: self.options.annotationsTooltip
                }
            ],
            orientation: 'horizontal'
        })
    );

    // we need a timeout so that a chained bindEvent
    // actually catches the event
    self.options.find && self.options.selectResult && setTimeout(function() {
        // only submit if no annotation is selected
        submitFindInput(self.options.find, !self.options.selected);
    });

    function addAnnotation(layer) {
        if (self.editing) {
            self.editing = false;
            setTimelineState();
            self.$annotationPanel.blurItem();
        }
        that.triggerEvent('addannotation', {
            'in': self.options['in'],
            layer: layer,
            out: self.options.out,
            value: ''
        });
    }

    function blurAnnotation() {
        updateWords('add');
        self.editing = false;
        setTimelineState();
        if (
            self.options.annotationsRange == 'position' && (
                self.options.position < self.options['in']
                || self.options.position > self.options.out
            )
        ) {
            setPosition(self.options['in']);
        }
        // setPosition causes a folder redraw
        // so blur once that's done
        setTimeout(self.$annotationPanel.blurItem);
    }

    function editAnnotation() {
        updateWords('remove');
        self.editing = true;
        setTimelineState();
        self.$annotationPanel.editItem();
    }

    function find(query) {
        var results = [];
        if (query.length) {
            query = query.toLowerCase();
            results = self.annotations.filter(function(annotation) {
                return Ox.contains(['*', annotation.layer], self.options.findLayer)
                    && Ox.decodeHTMLEntities(Ox.stripTags(
                        annotation.value.toLowerCase()
                    )).indexOf(query) > -1;
            });
        }
        return results;
    }

    function getAnnotation() {
        // Get annotation at current position
        var annotations = self.annotations.filter(function(annotation) {
            return annotation['in'] <= self.options.position
                && annotation.out >= self.options.position
        }).sort(function(a, b) {
            var aValue = self.options.position - a['in'],
                bValue = self.options.position - b['in'],
                ret = 0;
            if (aValue < bValue) {
                ret = -1;
            } else if (aValue > bValue) {
                ret = 1;
            } else if (a.duration < b.duration) {
                ret = -1
            } else if (a.duration > b.duration) {
                ret = 1;
            } else if (a.value < b.value) {
                ret = -1
            } else if (a.value > b.value) {
                ret = 1;
            }
            return ret;
        });
        return annotations.length ? annotations[0] : {id: ''};
    }

    function getAnnotations() {
        return Ox.flatten(self.options.layers.map(function(layer) {
            return layer.items.map(function(item) {
                return Ox.extend({layer: layer.id}, item)
            });
        })).sort(sortAnnotations);
    }

    function getAnnotationValue(annotationId) {
        var found = false, value;
        Ox.forEach(self.options.layers, function(layer, i) {
            Ox.forEach(layer.items, function(item) {
                if (item.id == annotationId) {
                    value = item.value;
                    found = true;
                    return false; // break
                }
            });
            if (found) {
                return false; // break
            }
        });
        return value;
    }

    function getNextAnnotation(type, direction) {
        // type can be 'annotation' or 'result'
        var annotation,
            annotations = type == 'annotation' ? self.annotations : self.results,
            index,
            position;
        if (self.options.selected) {
            index = Ox.getIndexById(annotations, self.options.selected);
            if (index > -1 && self.options.position == annotations[index]['in']) {
                annotation = annotations[Ox.mod(index + direction, annotations.length)];
            }
        }
        if (!annotation) {
            position = getNextPosition(type, direction);
            annotations = annotations.filter(function(annotation) {
                return annotation['in'] == position;
            });
            annotation = annotations[direction == 1 ? 0 : annotations.length - 1];
        }
        return annotation;
    }

    // fixme: why not goToNextPosition()?
    function getNextPosition(type, direction) {
        // type can be 'annotation', 'cut' or 'result'
        var positions;
        if (type == 'annotation') {
            positions = self.positions;
        } else if (type == 'cut') {
            positions = [0].concat(self.options.cuts, self.options.duration);
        } else if (type == 'result') {
            positions = Ox.unique(self.results.map(function(result) {
                return result['in'];
            }));
        }
        return Ox.nextValue(positions, self.options.position, direction);
    }

    function getPositions() {
        return Ox.unique(self.annotations.map(function(annotation) {
            return annotation['in'];
        }));
    }

    function getSelectedLayer() {
        var selectedLayer;
        Ox.forEach(self.options.layers, function(layer) {
            Ox.forEach(layer.items, function(item) {
                if (item.id == self.options.selected) {
                    selectedLayer = layer.id;
                    return false;
                }
            });
            if (selectedLayer) {
                return false;
            }
        });
        return selectedLayer;
    }

    function getSizes(scrollbarIsVisible) {
        var scrollbarWidth = Ox.UI.SCROLLBAR_SIZE,
            contentWidth = self.options.width
                - (self.options.showAnnotations * self.options.annotationsSize) - 1
                - (scrollbarIsVisible ? scrollbarWidth : 0),
            height,
            lines,
            size = {
                player: [],
                timeline: []
            },
            width, widths;
        function getHeight() {
            return size.player[0].height + self.controlsHeight
                + size.timeline[0].height + lines * 16
                + (lines + 3) * self.margin;
        }
        if (self.options.videoSize == 'small') {
            width = 0;
            widths = Ox.splitInt(contentWidth - 4 * self.margin, 3);
            [1, 0, 2].forEach(function(v, i) {
                size.player[v] = {
                    left: (i + 0.5) * self.margin + width,
                    top: self.margin / 2,
                    width: widths[i],
                    height: Math.round(widths[1] / self.options.videoRatio)
                };
                width += widths[i];
            });
        } else {
            size.player[0] = {
                left: self.margin / 2,
                top: self.margin / 2,
                width: Math.round((contentWidth - 3 * self.margin + (self.controlsHeight + self.margin) / 2 * self.options.videoRatio) * 2/3)
            };
            size.player[0].height = Math.round(size.player[0].width / self.options.videoRatio);
            size.player[1] = {
                left: size.player[0].left + size.player[0].width + self.margin,
                top: size.player[0].top,
                width: contentWidth - 3 * self.margin - size.player[0].width
            };
            size.player[1].height = Math.ceil(size.player[1].width / self.options.videoRatio);
            size.player[2] = {
                left: size.player[1].left,
                top: size.player[0].top + size.player[1].height + self.controlsHeight + self.margin,
                width: size.player[1].width,
                height: size.player[0].height - size.player[1].height - self.controlsHeight - self.margin
            };
        }
        size.timeline[0] = {
            left: self.margin / 2,
            top: size.player[0].height + self.controlsHeight + 1.5 * self.margin,
            width: contentWidth - 2 * self.margin,
            height: 64
        };
        size.timeline[1] = {
            left: size.timeline[0].left,
            top: size.timeline[0].top + size.timeline[0].height + self.margin,
            width: size.timeline[0].width
        };
        lines = Math.ceil(self.options.duration / size.timeline[1].width);
        height = getHeight();
        self.$editor.css({
            overflowY: (scrollbarIsVisible && height <= self.options.height - 16) ? 'scroll' : 'auto'
        });
        return (!scrollbarIsVisible && height > self.options.height - 16) ? getSizes(true) : size;
    }

    function getSubtitles() {
        return self.options.enableSubtitles
            ? self.options.subtitles.filter(function(v) {
                return Ox.contains(v.tracks, self.options.subtitlesTrack);
            })
            : [];
    }

    function getSubtitlesFind() {
        return Ox.contains(
            [self.options.subtitlesLayer, '*'], self.options.findLayer
        ) ? self.options.find : '';
    }

    function getWords() {
        var words = [];
        Ox.forEach(Ox.count(Ox.words(
            self.annotations.map(function(annotation) {
                return Ox.decodeHTMLEntities(
                    Ox.stripTags(annotation.value.toLowerCase())
                );
            }).join(' ')
        )), function(count, value) {
            words.push({count: count, value: value});
        })
        return words.sort(function(a, b) {
            return b.count - a.count;
        });
    }

    function goToPoint(point) {
        setPosition(self.options[point]);
    }

    function isEditable() {
        var annotation = Ox.getObjectById(self.annotations, self.options.selected);
        return annotation && annotation.editable;
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

    function playInToOut() {
        self.$player[0].playInToOut();
    }

    function removeAnnotation(data) {
        var layer = Ox.getObjectById(self.options.layers, data.layer),
            index = Ox.getIndexById(layer.items, data.id);
        // deselect event will have fired before
        self.options.selected = data.id;
        updateWords('remove');
        self.options.selected = '';
        layer.items.splice(index, 1);
        self.annotations = getAnnotations();
        self.positions = getPositions();
        self.options.find && submitFindInput(self.options.find);
        self.editing = false;
        if (data.layer == self.options.subtitlesLayer) {
            updateSubtitles();
        }
        setTimelineState();
        self.$annotationPanel.removeItem();
        that.triggerEvent('removeannotation', data);
    }

    function resizeAnnotations(data) {
        self.options.annotationsSize = data.size;
        setSizes();
        self.$annotationPanel.options({width: data.size});
    }

    function resizeendAnnotations(data) {
        that.triggerEvent('annotationssize', {size: data.size});
    }

    function selectAnnotation(data, stayAtPosition) {
        if (Ox.isUndefined(data)) {
            // doubleclick on small timeline
            data = getAnnotation();
        } else if (!data.id && Ox.$elements[that.oxid]) {
            // focus only if in the dom
            that.gainFocus();
        }
        // FIXME
        // self.editing = false;
        if (data.id) {
            if (!stayAtPosition || (
                    self.options.annotationsRange != 'position' && (
                        self.options.position < data['in']
                        || self.options.position > data.out
                    )
                )
            ) {
                setPosition(data['in']);
                // if annotationsRange is 'position',
                // this may cause a deselect
            }
            if (!self.editing) {
                setPoint('in', data['in'], true);
                setPoint('out', data.out, true);
            }
        }
        if (!self.editing) {
            self.options.selected = data.id;
            self.$annotationPanel.options({selected: self.options.selected});
            setTimelineState();
            that.triggerEvent('select', {id: self.options.selected});
        }
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

    function setPoint(point, position, keepSelected) {
        self.options[point] = position;
        if (self.options.selected && !self.editing && !keepSelected) {
            selectAnnotation({id: ''});
        }
        self.$player.forEach(function($player) {
            $player.options(point, self.options[point]);
        });
        self.$player[point == 'in' ? 1 : 2].options({
            position: self.options[point]
        });
        self.$timeline.forEach(function($timeline) {
            $timeline.options(point, self.options[point]);
        });
        if (self.options['in'] > self.options.out) {
            setPoint(point == 'in' ? 'out' : 'in', position, keepSelected);
        } else {
            self.$annotationPanel.options({
                'in': self.options['in'],
                out: self.options.out
            });
            that.triggerEvent('points', {
                'in': self.options['in'],
                out: self.options.out,
                position: self.options.position
            });
            if (self.editing && self.options.selected.length && self.options.selected[0] != '_') {
                that.triggerEvent('editannotation', {
                    id: self.options.selected,
                    'in': self.options['in'],
                    out: self.options.out,
                    value: $('.OxEditableElement input:visible').val()
                });
            }
        }
    }

    function setPosition(position, playing, dragging) {
        var minute = Math.floor(position / 60),
            previousMinute = Math.floor(self.options.position / 60);
        self.options.position = position;
        !playing && self.$player[0].options({position: self.options.position});
        self.$timeline.forEach(function($timeline) {
            $timeline.options({position: self.options.position});
        });
        self.$annotationPanel.options({position: self.options.position});
        if ((!playing || minute != previousMinute) && !dragging) {
            that.triggerEvent(playing ? 'playing' : 'position', {
                position: !playing ? self.options.position : minute * 60
            });
        }
    }

    function setSizes() {
        self.sizes = getSizes();
        self.$player.forEach(function($player, i) {
            $player.options({
                height: self.sizes.player[i].height,
                width: self.sizes.player[i].width
            })
            .css({
                left: self.sizes.player[i].left + 'px',
                top: self.sizes.player[i].top + 'px'
            });
        });
        self.$timeline.forEach(function($timeline, i) {
            $timeline.options({
                width: self.sizes.timeline[i].width
            })
            .css({
                left: self.sizes.timeline[i].left + 'px',
                top: self.sizes.timeline[i].top + 'px'
            });
        });
    }

    function setSubtitlesTrack() {
        var enableSubtitles = self.options.subtitlesTrack != '',
            subtitles,
            toggleSubtitles = enableSubtitles != self.options.enableSubtitles;
        self.options.enableSubtitles = enableSubtitles;
        if (toggleSubtitles) {
            self.$player.forEach(function($player) {
                $player.options({
                    enableSubtitles: self.options.enableSubtitles
                });
            });
            that.triggerEvent('subtitles', {
                subtitles: self.options.enableSubtitles
            });
        } else {
            self.$player.forEach(function($player) {
                $player.options({
                    subtitlesTrack: self.options.subtitlesTrack
                });
            });
        }
        self.$timeline.forEach(function($timeline) {
            $timeline.options({subtitles: getSubtitles()});
        });
    }

    function showKeyboardShortcuts() {
        var dialog = Ox.Dialog({
            buttons: [
                Ox.Button({id: 'close', title: Ox._('Close')})
                    .bindEvent({click: function() { dialog.close(); }})
            ],
            content: self.$keyboardShortcuts,
            height: 384,
            keys: {enter: 'close', escape: 'close'},
            title: Ox._('Keyboard Shortcuts'),
            width: 256
        }).open();
    }

    function setTimelineState() {
        self.$timeline[1].options({
            state: self.editing ? 'editing'
                : isEditable() ? 'editable'
                : self.options.selected ? 'selected'
                : 'default'
        });
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

    function submitAnnotation(data) {
        self.annotations = getAnnotations();
        self.positions = getPositions();
        updateWords('add');
        self.options.find && submitFindInput(self.options.find);
        self.editing = false;
        if (data.layer == self.options.subtitlesLayer) {
            updateSubtitles();
        }
        setTimelineState();
        if (
            self.options.annotationsRange == 'position'
            && (
                self.options.position < self.options['in']
                || self.options.position > self.options.out
            )
        ) {
            setPosition(self.options['in']);
        }
        data['in'] = self.options['in'];
        data.out = self.options.out;
        that.triggerEvent('editannotation', data);
    }

    function submitFindInput(value, hasPressedEnter) {
        self.options.find = value;
        self.results = find(self.options.find);
        self.$results
            .css({opacity: self.results.length ? 1 : 0.25})
            .html(self.results.length);
        self.$previousButton.options({
            disabled: !self.results.length
        });
        self.$nextButton.options({
            disabled: !self.results.length
        });
        self.$clearButton.options({
            disabled: !self.options.find
        });

        self.$player.forEach(function($player) {
            $player.options({find: getSubtitlesFind()});
        });
        self.$timeline.forEach(function($timeline) {
            $timeline.options({find: getSubtitlesFind()});
        });
        self.$timeline[1].options({results: self.results});
        if (hasPressedEnter) {
            that.triggerEvent('find', {find: self.options.find});
            if (self.results.length) {
                selectAnnotation(getNextAnnotation('result', 1));
                that.gainFocus();
            } else {
                self.$findInput.focusInput(true);
            }
        }
        self.$annotationPanel.options({
            highlight: self.options.find,
            highlightLayer: self.options.findLayer,
        });
    }

    function toggleAnnotations(data) {
        self.options.showAnnotations = !data.collapsed;
        setSizes();
        that.triggerEvent('toggleannotations', {
            showAnnotations: self.options.showAnnotations
        });
    }

    function toggleLoop() {
        self.options.loop = !self.options.loop;
        self.$menuButton[
            self.options.loop ? 'checkItem' : 'uncheckItem'
        ]('loop');
        self.$player[0].toggleLoop();
    }

    function toggleMuted() {
        self.$player[0].toggleMuted();
    }

    function togglePaused() {
        self.$player[0].togglePaused();
        self.$player[0].options('paused') && that.triggerEvent('position', {
            position: self.$player[0].options('position')
        });
    }

    function toggleSize() {
        self.options.videoSize = self.options.videoSize == 'small'
            ? 'large' : 'small';
        setSizes();
        self.$menuButton[
            self.options.videoSize == 'small' ? 'uncheckItem' : 'checkItem'
        ]('size');
        self.$player[0].options({
            sizeIsLarge: self.options.videoSize == 'large'
        });
        that.triggerEvent('togglesize', {
            size: self.options.videoSize
        });
    }

    function updateSubtitles() {
        // FIXME: missing: re-render subtitles submenu
        self.options.subtitles = parseSubtitles();
        self.$player.forEach(function($player) {
            $player.options({subtitles: Ox.clone(self.options.subtitles, true)});
        });
        if (self.options.enableSubtitles) {
            self.$timeline.forEach(function($timeline) {
                $timeline.options({subtitles: getSubtitles()});
            });
        }
    }

    function updateTimelines() {
        self.$timeline.forEach(function($timeline) {
            $timeline.options({type: self.options.timeline});
        });
    }

    function updateWords(action) {
        // action can be 'add' or 'remove'
        var words = [];
        Ox.forEach(Ox.count(Ox.words(
            getAnnotationValue(self.options.selected) || ''
        )), function(count, value) {
            words.push({count: count, value: value});
        });
        words.forEach(function(word) {
            var index = Ox.indexOf(self.words, function(w) {
                return w.value === word.value;
            });
            if (action == 'add') {
                if (index == -1) {
                    self.words.push({count: 1, value: word.value});
                } else {
                    self.words[index].count++;
                }
            } else if (index > -1) {
                // index is -1 when removing an annotation by editing
                // (which removes the words) and clearing its value
                if (self.words[index].count == 1) {
                    self.words.splice(index, 1);
                } else {
                    self.words[index].count--;
                }
            }
        });
        self.words.sort(function(a, b) {
            return b.count - a.count;
        });
        self.$findInput.options({
            autocomplete: self.words.map(function(word) {
                return word.value;
            })
        });
    }

    /*@
    addAnnotation <f> add annotation
        (layer, item) -> <o> add annotation to layer
        layer <s> layer id
        annotation <o> annotation to add
    @*/
    that.addAnnotation = function(layer, annotation) {
        // called from addannotation callback
        self.$annotationPanel.addItem(layer, annotation);
    };

    that.getCurrentAnnotations = function() {
        return self.$annotationPanel.getCurrentAnnotations();
    };

    /*@
    updateAnnotation <f> updateAnnotation
        (id, annotation) -> <o>  update annotation with id
    @*/
    that.updateAnnotation = function(id, annotation) {
        // called from editannotation callback
        // id might have changed if new annotation was created
        if (annotation.id) {
            self.options.selected = annotation.id;
        }
        if (getSelectedLayer() == self.options.subtitlesLayer) {
            updateSubtitles();
        }
        self.$annotationPanel.updateItem(id, annotation);
        if (id != annotation.id) {
            self.annotations = getAnnotations();
            setTimelineState();
        }
    };

    /*@
    removeAnnotation <f> remove annotation
        (layer, ids) -> <o> remove annotation from layer
        layer <s> layer id
        ids <a> array of item ids to remove
    @*/
    /*
    that.removeAnnotation = function(layer, id) {
        var i = Ox.getIndexById(self.options.layers, layer);
        self.$annotationPanel[i].removeItem(id);
    };
    */

    return that;

};
