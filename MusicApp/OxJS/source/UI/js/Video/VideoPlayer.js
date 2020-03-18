'use strict';

/*@
Ox.VideoPlayer <f> Generic Video Player
    options <o> Options
        annotations <[]> Array of annotations
            id <s> Optional id
            in <n> In point (sec)
            out <n> Out point (sec)
            text <s> Text
            tracks <[s]> Track names, like "English" or "Director's Commentary"
        audioTrack <s|''> Two-letter ISO 639-1 language code or track name
        censored <a|[]> Array of censored ranges
        censoredIcon <s|''> 'Censored' icon
        censoredTooltip <s|''> Tooltip for 'censored' icon
        chapters <[o]|[]> List of chapter objects with position and title
        controlsBottom <[s]|[]> Bottom controls, from left to right
            Can be 'close', fullscreen', 'scale', 'title', 'chapterTitle',
            'find', 'open', 'play', 'playInToOut', 'previous', 'next', 'loop',
            'mute', 'volume', 'size', 'timeline', 'position', 'settings', and
            'space[int]'. A 'space16' control, for example, is empty space that
            is 16px wide, and a 'space' control is empty space that separates
            left-aligned from right-aligned controls.
        controlsTooltips <o|{}> Tooltip text per control id
        controlsTop <[s]|[]> Top controls, from left to right
        duration <n|-1> Duration (sec)
        enableDownload <b|false> If true, enable download
        enableFind <b|false> If true, enable find
        enableFullscreen <b|false> If true, enable fullscreen
        enableKeyboard <b|false> If true, enable keyboard controls
        enableMouse <b|false> If true, click toggles paused and drag changes position
        enablePosition <b|false> If true, enable position control
        enableSubtitles <b|false> If true, enable subtitles
        externalControls <b|false> If true, controls are outside the video
        enableTimeline <b|false> If true, show timeline
        find <s|''> Query string
        focus <s|'click'> focus on 'click', 'load' or 'mouseenter'
        format <s|''> video format (like 'webm')
        fps <n|25> Frames per second
        fullscreen <b|false> If true, video is in fullscreen
        height <n|144> Height in px (excluding external controls)
        in <n> In point (sec)
        invertHighlight <b|false> If true, invert selection highlight on timeline
        logo <s|''> Logo image URL
        logoLink <s|''> Logo link URL
        logoTitle <s|''> Text for Logo tooltip // fixme: shouldn't this be logoTooltip then?s
        loop <b|false> If true, video loops
        muted <b|false> If true, video is muted
        paused <b|false> If true, video is paused
        playbackRate: <n|1> playback rate
        playInToOut <b|false> If true, video plays only from in to out
        position <n|0> Initial position (sec)
        poster <s|''> Poster URL
        posterFrame <n|-1> Position of poster frame (sec)
        out <n> Out point (sec)
        resolution <n|0> resolution
        rewind <b|false> If true, video will rewind when ended
        scaleToFill <b|false> If true, scale to fill (otherwise, scale to fit)
        showControlsOnLoad <b|false> If true, show controls on load
        showFind <b|false> If true, show find input
        showHours <b|false> If true, don't show hours for videos shorter than one hour
        showIcon <b|false> If true, show play icon
        showIconOnLoad <b|false> If true, show icon on load
        showLargeTimeline <b|false> If true, show large timeline
        showMilliseconds <n|0> Number of decimals to show
        showMarkers <b|false> If true, show in/out/poster markers
        showProgress <|false> If true, show buffering progress
        sizeIsLarge <b|false> If true, initial state of the size control is large
        subtitles <s|[o]|[]> URL or SRT or array of subtitles
            id <s> Optional id
            in <n> In point (sec)
            out <n> Out point (sec)
            text <s> Text
            tracks <[s]> Track names, like "English" or "Director's Commentary"
        subtitlesOffset <n|0> bottom offset for subtitles in % of video height
        subtitlesDefaultTrack <s|'English'> Track name
        subtitlesTrack <s|'English'> Track name
        timeline <s> Timeline image URL
        timelineType <s|''> Current timeline type id
        timelineTypes <[o]|[]> Array of timeline type objects (id and title)
        title <s|''> Video title
        type <s|'play'> 'play', 'in' or 'out'
        video <s|[s]|[o]|''> Video URL
            String or array of strings ([part1, part2, ...]) or array of objects
            ({duration, index, resolution, src, track})
        volume <n|1> Volume (0-1)
        width <n|256> Width in px
    self <o> shared private variable
    ([options[, self]]) -> <o:Ox.Element> Video Player
        censored <!> censored
        close <!> close
        download <!> download
        ended <!> ended
        find <!> find
        fullscreen <!> fullscreen
        gotopoint <!> gotopoint
        loadedmetadata <!> loadedmetadata
        muted <!> muted
        open <!> open
        paused <!> paused
        playing <!> playing
        position <!> position
        positioning <!> positioning
        resolution <!> resolution
        scale <!> scale
        select <!> select
        setpoint <!> setpoint
        size <!> size
        subtitles <!> subtitles
        timeline <!> timeline
        volume <!> volume
        zap <!> zap
@*/

Ox.VideoPlayer = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({
            annotations: [],
            audioTrack: '',
            brightness: 1,
            censored: [],
            censoredIcon: '',
            censoredTooltip: '',
            controlsBottom: [],
            controlsTooltips: {},
            controlsTop: [],
            duration: 0,
            enableDownload: false,
            enableFind: false,
            enableFullscreen: false,
            enableKeyboard: false,
            enableMouse: false,
            enablePosition: false,
            enableSubtitles: false,
            enableTimeline: false,
            externalControls: false,
            find: '',
            focus: 'click',
            format: '',
            fps: 25,
            fullscreen: false,
            height: 144,
            'in': 0,
            logo: '',
            logoLink: '',
            logoTitle: '',
            loop: false,
            muted: false,
            paused: false,
            playbackRate: 1,
            playInToOut: false,
            position: 0,
            poster: '',
            posterFrame: -1,
            out: 0,
            resolution: 0,
            rewind: false,
            scaleToFill: false,
            showControlsOnLoad: false,
            showFind: false,
            showHours: false,
            showIcon: false,
            showIconOnLoad: false,
            showLargeTimeline: false,
            showMarkers: false,
            showMilliseconds: 0,
            showProgress: false,
            sizeIsLarge: false,
            subtitles: [],
            subtitlesDefaultTrack: 'English',
            subtitlesOffset: 0,
            subtitlesTrack: 'English',
            timeline: '',
            timelineType: '',
            timelineTypes: [],
            title: '',
            type: 'play',
            video: '',
            volume: 1,
            width: 256
        })
        .options(options || {})
        .update({
            audioTrack: setAudioTrack,
            enableSubtitles: setSubtitlesTrack,
            find: setSubtitleText,
            fullscreen: function() {
                self.options.fullscreen = !self.options.fullscreen;
                toggleFullscreen();
            },
            height: function() {
                setSizes();
            },
            'in': function() {
                self.options.paused && setMarkers();
                self.$timeline && self.$timeline.options('in', self.options['in']);
            },
            out: function() {
                self.options.paused && setMarkers();
                self.$timeline && self.$timeline.options({out: self.options.out});
            },
            muted: function() {
                self.options.muted = !self.options.muted;
                toggleMuted();
            },
            paused: function() {
                self.options.paused = !self.options.paused;
                togglePaused();
            },
            playbackRate: function() {
                self.$video.options({
                    playbackRate: self.options.playbackRate
                });
            },
            position: function() {
                setPosition(self.options.position);
            },
            posterFrame: function() {
                self.options.paused && setMarkers();
            },
            resolution: setResolution,
            scaleToFill: function() {
                self.options.scaleToFill = !self.options.scaleToFill;
                toggleScale();
            },
            sizeIsLarge: function() {
                self.$sizeButton.toggle();
            },
            subtitles: function() {
                loadSubtitles();
                self.$settings && self.$settings.replaceWith(self.$settings = renderSettings());
            },
            subtitlesTrack: setSubtitlesTrack,
            timeline: function() {
                self.$timeline.options({imageURL: self.options.timeline});
            },
            video: function() {
                setVideo();
                self.$video.options({
                    items: self.video
                });
            },
            volume: function() {
                setVolume(self.options.volume);
            },
            width: function() {
                setSizes();
            }
        })
        .addClass('OxVideoPlayer');

    Ox.$window.on({
        resize: function() {
            self.options.fullscreen && setSizes();
        }
    });

    Ox.Fullscreen.bind('change', function() {
        //FIXME: is change fired before window size is updated to fullscreen?
        setTimeout(function() {
            setSizes(self.options.fullscreen);
        }, 250);
    });

    if (Ox.isEmpty(self.options.annotations)) {
        self.options.annotations = self.options.subtitles;
    }

    if (Ox.isObject(self.options.video[0]) && 'index' in self.options.video[0]) {
        self.options.video = Ox.sortBy(self.options.video, 'index');
    }

    setVideo();

    if (self.options.playInToOut) {
        self['in'] = self.options['in'];
        self.out = self.options.out;
        self.options.duration = self.out - self['in'];
    } else {
        self['in'] = 0;
        self.out = self.options.duration || 86399; // fixme: ugly
    }
    self.options.position = Ox.limit(self.options.position, self['in'], self.out);
    if (!self.options.paused) {
        self.options.showIconOnLoad = false;
    }

    self.hasVolumeControl = self.options.controlsTop.indexOf('volume') > -1
        || self.options.controlsBottom.indexOf('volume') > -1;
    self.millisecondsPerFrame = 1000 / self.options.fps;
    self.secondsPerFrame = 1 / self.options.fps;
    self.barHeight = 16;
    self.width = self.options.fullscreen ? window.innerWidth : self.options.width;
    self.height = self.options.fullscreen ? window.innerHeight : self.options.height;
    self.videoWidth = self.options.width;
    self.videoHeight = self.options.height;
    self.results = [];

    loadSubtitles();

    /* 
    ----------------------------------------------------------------------------
    Keyboard
    ----------------------------------------------------------------------------
    */

    if (self.options.enableKeyboard) {
        that.bindEvent({
            key_0: toggleMuted,
            key_1: toggleScale,
            key_down: function() {
                goToNext('chapter', 1);
            },
            key_equal: function() {
                changeVolume(0.1);
            },
            key_escape: hideControlMenus,
            key_f: focusFind,
            key_g: function() {
                goToNext('result', 1);
            },
            key_l: toggleLoop,
            key_left: function() {
                setPosition(self.options.position - self.secondsPerFrame);
                that.triggerEvent('position', {
                    position: self.options.position
                });
            },
            key_minus: function() {
                changeVolume(-0.1);
            },
            key_p: playInToOut,
            key_right: function() {
                setPosition(self.options.position + self.secondsPerFrame);
                that.triggerEvent('position', {
                    position: self.options.position
                });
            },
            key_shift_f: function() {
                self.options.enableFullscreen && toggleFullscreen();
            },
            key_shift_g: function() {
                goToNext('result', -1);
            },
            key_shift_left: function() {
                setPosition(self.options.position - 1);
                that.triggerEvent('position', {
                    position: self.options.position
                });
            },
            key_shift_right: function() {
                setPosition(self.options.position + 1);
                that.triggerEvent('position', {
                    position: self.options.position
                });
            },
            key_space: togglePaused,
            key_up: function() {
                goToNext('chapter', -1);
            }
        });
        if (self.options.focus == 'mouseenter') {
            that.on({
                mouseenter: function() {
                    if (!self.inputHasFocus) {
                        that.gainFocus();
                    }
                },
                mouseleave: function() {
                    that.loseFocus();
                }
            });
        } else {
            that.on({
                click: function() {
                    if (!Ox.Focus.focusedElementIsInput()) {
                        that.gainFocus();
                    }
                }
            });
        }
    }

    /* 
    ----------------------------------------------------------------------------
    Mouse
    ----------------------------------------------------------------------------
    */

    if ((
        !self.options.externalControls && (
            self.options.controlsTop.length
            || self.options.controlsBottom.length
        )
    )) {
        that.on({
            mouseenter: function() {
                showControls();
                self.mouseHasLeft = false;
            },
            mouseleave: function() {
                hideControls();
                self.mouseHasLeft = true;
            }
        });
    }

    /* 
    ----------------------------------------------------------------------------
    Video
    ----------------------------------------------------------------------------
    */

    self.$videoContainer = Ox.Element()
        .addClass('OxVideoContainer')
        .css({
            top: self.options.externalControls
                && self.options.controlsTop.length
                ? '16px' : 0
        })
        .appendTo(that)

    if (self.options.type == 'play') {

        self.options.enableMouse && self.$videoContainer.bindEvent({
            anyclick: function(e) {
                var $target = $(e.target);
                if (!$target.is('.OxLogo') && !$target.is('.OxCensoredIcon')) {
                    togglePaused();
                }
            },
            dragstart: dragstart,
            drag: drag,
            dragend: dragend
        });

        self.$video = Ox.VideoElement({
                items: self.video,
                loop: self.options.loop,
                playbackRate: self.options.playbackRate
            })
            .bindEvent(Ox.extend({
                durationchange: durationchange,
                ended: ended,
                itemchange: itemchange,
                loadedmetadata: loadedmetadata,
                requiresusergesture: requiresusergesture,
                seeked: seeked,
                seeking: seeking,
                sizechange: sizechange
            }, self.options.progress ? {
                progress: progress
            } : {}))
            .appendTo(self.$videoContainer);

        self.$video.$element.css({position: 'absolute'});
        // avoid showing first frame
        self.$video.hide();

    } else {

        self.options.enableMouse && self.$videoContainer.on({
            click: function(e) {
                if (!$(e.target).is('.OxLogo')) {
                    goToPoint();
                }
            }
        });

        self.$video = $('<div>')
            .appendTo(self.$videoContainer);
        self.$image = $('<img>')
            .attr({
                src: Ox.UI.PATH + 'png/transparent.png'
            })
            .css({
                position: 'absolute',
                width: '100%',
                height: '100%'
            })
            .appendTo(self.$video)
        self.$brightness = $('<div>')
            .css({
                position: 'absolute',
                width: '100%',
                height: '100%',
                background: 'rgb(0, 0, 0)',
                opacity: 1 - self.options.brightness
            })
            .appendTo(self.$video);

    }

    /* 
    ----------------------------------------------------------------------------
    Poster
    ----------------------------------------------------------------------------
    */

    if (self.options.poster) {
        self.$poster = $('<img>')
            .addClass('OxPoster')
            .attr({
                src: self.options.poster
            })
            .hide()
            .one({
                load: function() {
                    self.$poster
                        .css(getVideoCSS(
                            self.$poster[0].width,
                            self.$poster[0].height
                        ))
                        .show();
                    self.posterIsVisible = true;
                }
            })
            .appendTo(self.$videoContainer);
    }

    /* 
    ----------------------------------------------------------------------------
    Logo
    ----------------------------------------------------------------------------
    */

    if (self.options.logo) {
        self.$logo = $('<img>')
            .addClass('OxLogo')
            .attr({
                src: self.options.logo
            })
            .css({
                cursor: self.options.logoLink ? 'pointer' : 'default'
            })
            .appendTo(self.$videoContainer);
        if (self.options.logoTitle) {
            self.$logoTooltip = Ox.Tooltip({
                title: self.options.logoTitle
            });
        }
    }

    /* 
    ----------------------------------------------------------------------------
    Icons
    ----------------------------------------------------------------------------
    */

    self.$loadingIcon = Ox.LoadingIcon({video: true})
        .hide()
        .appendTo(self.$videoContainer);
    if (!Ox.isEmpty(
        Ox.isObject(self.options.video[0])
        ? getVideo()
        : self.options.video
    )) {
        showLoadingIcon();
    }

    if (self.options.showIcon || self.options.showIconOnLoad) {
        self.$playIcon = $('<img>')
            .addClass('OxPlayIcon OxVideo')
            .attr({
                src: Ox.UI.getImageURL('symbol' + (
                    self.options.paused ? 'Play' : 'Pause'
                ), 'videoIcon')
            })
            .appendTo(self.$videoContainer);
        if (self.options.showIcon) {
            self.$playIcon.addClass('OxInterface');
        }
        if (self.options.showIconOnLoad) {
            self.iconIsVisible = true;
        }
    }

    if (self.options.censored.length) {
        self.$copyrightIcon = Ox.Element({
                element: '<img>',
                tooltip: self.options.censoredTooltip
            })
            .addClass('OxCensoredIcon OxVideo')
            .attr({
                src: Ox.UI.getImageURL(
                    'symbol' + self.options.censoredIcon, 'videoIcon'
                )
            })
            .hide()
            .bindEvent({
                singleclick: function() {
                    that.triggerEvent('censored');
                }
            })
            .appendTo(self.$videoContainer);
    }

    /* 
    ----------------------------------------------------------------------------
    Markers
    ----------------------------------------------------------------------------
    */

    if (self.options.showMarkers) {

        self.$posterMarker = {};
        ['left', 'center', 'right'].forEach(function(position) {
            var titleCase = Ox.toTitleCase(position);
            self.$posterMarker[position] = $('<div>')
                .addClass('OxPosterMarker OxPosterMarker' + titleCase)
                .appendTo(self.$videoContainer);
        });

        self.$pointMarker = {};
        ['in', 'out'].forEach(function(point) {
            self.$pointMarker[point] = {};
            ['top', 'bottom'].forEach(function(edge) {
                var titleCase = Ox.toTitleCase(point) + Ox.toTitleCase(edge);
                self.$pointMarker[point][edge] = $('<img>')
                    .addClass('OxPointMarker OxPointMarker' + titleCase)
                    .attr({
                        src: Ox.UI.getImageURL('marker' + titleCase)
                    })
                    .appendTo(self.$videoContainer);
            });
        });

    }

    /* 
    ----------------------------------------------------------------------------
    Subtitles
    ----------------------------------------------------------------------------
    */

    if (self.options.subtitles.length || true) { // FIXME
        self.$subtitle = $('<div>')
            .addClass('OxSubtitle')
            .appendTo(self.$videoContainer);
    }

    /* 
    ----------------------------------------------------------------------------
    Controls
    ----------------------------------------------------------------------------
    */

    ['top', 'bottom'].forEach(function(edge) {

        var titleCase = Ox.toTitleCase(edge);

        if (self.options['controls' + titleCase].length) {

            self['$controls' + titleCase] = Ox.Bar({
                size: self.barHeight
            })
            .addClass('OxControls' + (
                self.options.externalControls ? '' : ' OxOnScreen'
            ))
            .css({
                opacity: self.options.externalControls ? 1 : 0
            })
            .css(edge, 0)
            .appendTo(that);

            self.options['controls' + titleCase].forEach(function(control) {

                if (control == 'chapterTitle') {

                    self.$chapterTitle = $('<div>')
                        .addClass('OxTitle')
                        .html(getChapterTitle())
                        .appendTo(self['$controls' + titleCase].$element);

                } else if (control == 'close') {

                    self.$closeButton = Ox.Button({
                        style: 'video',
                        title: 'close',
                        tooltip: Ox._('Close'),
                        type: 'image'
                    })
                    .bindEvent({
                        click: function() {
                            that.triggerEvent('close');
                        }
                    })
                    .appendTo(self['$controls' + titleCase]);

                } else if (control == 'find') {

                    self.$findButton = Ox.Button({
                        style: 'video',
                        title: 'find',
                        tooltip: Ox._('Find'),
                        type: 'image'
                    })
                    .bindEvent({
                        click: toggleFind
                    })
                    .appendTo(self['$controls' + titleCase]);

                } else if (control == 'fullscreen') {

                    self.$fullscreenButton = Ox.Button({
                        style: 'video',
                        tooltip: [
                            Ox._('Enter Fullscreen'), Ox._('Exit Fullscreen')
                        ],
                        type: 'image',
                        value: self.options.fullscreen ? 'shrink' : 'grow',
                        values: ['grow', 'shrink']
                    })
                    .bindEvent({
                        click: function() {
                            toggleFullscreen('button');
                        }
                    })
                    .appendTo(self['$controls' + titleCase]);

                } else if (control == 'goto') {

                    self.$setButton = Ox.Button({
                        style: 'video',
                        title: 'goTo' + Ox.toTitleCase(self.options.type),
                        tooltip: Ox._(
                            'Go to ' + Ox.toTitleCase(self.options.type)
                            + ' Point'
                        ),
                        type: 'image'
                    })
                    .bindEvent({
                        click: goToPoint
                    })
                    .appendTo(self['$controls' + titleCase]);

                } else if (control == 'loop') {

                    self.$loopButton = Ox.Button({
                        style: 'video',
                        tooltip: [Ox._('Don\'t Loop'), Ox._('Loop')],
                        type: 'image',
                        value: self.options.loop ? 'RepeatAll' : 'RepeatNone',
                        values: ['RepeatAll', 'RepeatNone'] 
                    })
                    .bindEvent({
                        click: function() {
                            toggleLoop('button');
                        }
                    })
                    .appendTo(self['$controls' + titleCase]);

                } else if (control == 'mute') {

                    self.$muteButton = Ox.Button({
                        style: 'video',
                        tooltip: [Ox._('Mute'), Ox._('Unmute')],
                        type: 'image',
                        value: self.options.muted ? 'unmute' : 'mute',
                        values: ['mute', 'unmute']
                    })
                    .bindEvent({
                        click: function() {
                            toggleMuted('button');
                        }
                    })
                    .appendTo(self['$controls' + titleCase]);

                } else if (control == 'next') {

                    self.$nextChapterButton = Ox.Button({
                        style: 'video',
                        title: 'playNext',
                        tooltip: Ox._('Next'),
                        type: 'image'
                    })
                    .bindEvent({
                        click: function() {
                            goToNext('chapter', 1);
                        }
                    })
                    .appendTo(self['$controls' + titleCase]);

                } else if (control == 'open') {

                    self.$openButton = Ox.Button({
                        style: 'video',
                        title: 'arrowRight',
                        tooltip: self.options.controlsTooltips.open || '',
                        type: 'image'
                    })
                    .bindEvent({
                        click: function() {
                            that.triggerEvent('open');
                        }
                    })
                    .appendTo(self['$controls' + titleCase]);

                } else if (control == 'play') {

                    self.$playButton = Ox.Button({
                        style: 'video',
                        // FIXME: this is retarded, fix Ox.Button
                        tooltip: [Ox._('Play'), Ox._('Pause')],
                        type: 'image',
                        value: self.options.paused ? 'play' : 'pause',
                        values: ['play', 'pause']
                    })
                    .bindEvent({
                        click: function() {
                            togglePaused('button');
                        }
                    })
                    .appendTo(self['$controls' + titleCase]);

                } else if (control == 'playInToOut') {

                    self.$playInToOutButton = Ox.Button({
                        style: 'video',
                        title: 'playInToOut',
                        tooltip: Ox._('Play In to Out'),
                        type: 'image'
                    })
                    .bindEvent({
                        click: playInToOut
                    })
                    .appendTo(self['$controls' + titleCase]);

                } else if (control == 'position') {

                    self.positionWidth = getPositionWidth();

                    self.$position = Ox.Element({
                            tooltip: Ox._(
                                self.options.type == 'play' ? 'Position'
                                : self.options.type == 'in' ? 'In Point'
                                : 'Out Point'
                            )
                        })
                        .addClass('OxPosition')
                        .css({
                            width: self.positionWidth - 4 + 'px'
                        })
                        .html(formatPosition())
                        .on({
                            click: function() {
                                if (self.options.enablePosition) {
                                    if (self.options.type == 'play') {
                                        if (!self.options.paused) {
                                            self.playOnSubmit = true;
                                            togglePaused();
                                        } else if (self.playOnLoad) {
                                            // if clicked during resolution switch,
                                            // don't play on load
                                            self.playOnLoad = false;
                                            self.playOnSubmit = true;
                                        }
                                    }
                                    self.$position.hide();
                                    self.$positionInput
                                        .value(formatPosition())
                                        .show()
                                        .focusInput(false);
                                }
                            }
                        })
                        .appendTo(self['$controls' + titleCase]);

                    self.$positionInput = Ox.Input({
                            value: formatPosition(),
                            width: self.positionWidth
                        })
                        .addClass('OxPositionInput')
                        .bindEvent({
                            focus: function() {
                                self.inputHasFocus = true;
                            },
                            blur: function() {
                                self.inputHasFocus = false;
                                submitPositionInput();
                            },
                            submit: function() {
                                self.inputHasFocus = false;
                                submitPositionInput();
                            }
                        })
                        .appendTo(self['$controls' + titleCase].$element);

                    self.$positionInput.children('input').css({
                            width: (self.positionWidth - 6) + 'px',
                            fontSize: '9px'
                        });

                } else if (control == 'previous') {

                    self.$previousChapterButton = Ox.Button({
                        style: 'video',
                        title: 'playPrevious',
                        tooltip: Ox._('Previous'),
                        type: 'image'
                    })
                    .bindEvent({
                        click: function() {
                            goToNext('chapter', -1);
                        }
                    })
                    .appendTo(self['$controls' + titleCase]);

                } else if (control == 'scale') {

                    self.$scaleButton = Ox.Button({
                        style: 'video',
                        tooltip: [Ox._('Scale to Fill'), Ox._('Scale to Fit')],
                        type: 'image',
                        value: self.options.scaleToFill ? 'fit' : 'fill',
                        values: ['fill', 'fit']
                    })
                    .bindEvent('change', function() {
                        toggleScale('button');
                    })
                    .appendTo(self['$controls' + titleCase]);

                } else if (control == 'set') {

                    self.$setButton = Ox.Button({
                        style: 'video',
                        title: 'set' + Ox.toTitleCase(self.options.type),
                        tooltip: Ox._(
                            'Set ' + Ox.toTitleCase(self.options.type)
                            + ' Point'
                        ),
                        type: 'image'
                    })
                    .bindEvent({
                        click: setPoint
                    })
                    .appendTo(self['$controls' + titleCase]);

                } else if (control == 'settings') {

                    self.$settingsButton = Ox.Button({
                        style: 'video',
                        title: 'set',
                        tooltip: Ox._('Settings'),
                        type: 'image'
                    })
                    .bindEvent({
                        click: function() {
                            self.$settings.toggle();
                        }
                    })
                    .appendTo(self['$controls' + titleCase]);

                    self.$settings = renderSettings().appendTo(that);

                } else if (control == 'size') {

                    self.$sizeButton = Ox.Button({
                        style: 'video',
                        tooltip: [Ox._('Larger'), Ox._('Smaller')],
                        type: 'image',
                        value: self.options.sizeIsLarge ? 'shrink' : 'grow',
                        values: ['grow', 'shrink']
                    })
                    .bindEvent('change', toggleSize)
                    .appendTo(self['$controls' + titleCase]);

                } else if (control == 'space') {

                    self['$space' + titleCase] = $('<div>')
                        .html('&nbsp;') // fixme: ??
                        .appendTo(self['$controls' + titleCase].$element);

                } else if (Ox.startsWith(control, 'space')) {

                    $('<div>')
                        .css({
                            width: parseInt(control.substr(5)) + 'px',
                            height: '16px'
                        })
                        .appendTo(self['$controls' + titleCase].$element);

                } else if (control == 'timeline') {

                    /*
                    if (self.options.showProgress) {
                        self.$progress = $('<img>')
                            .attr({
                                src: getProgressImageURL()
                            })
                            .css({
                                float: 'left',
                                height: self.barHeight + 'px',
                            })
                            .appendTo(self.$timelineImages.$element);
                    }
                    */

                    if (self.options.duration) {
                        self.$timeline = getTimeline()
                    } else {
                        self.$timeline = Ox.Element()
                            .html('&nbsp;');
                    }
                    self.$timeline.appendTo(self['$controls' + titleCase]);

                } else if (control == 'title') {

                    self.$title = $('<div>')
                        .addClass('OxTitle')
                        .html(self.options.title)
                        .appendTo(self['$controls' + titleCase].$element);

                } else if (control == 'volume') {

                    self.$volumeButton = Ox.Button({
                        style: 'video',
                        title: getVolumeImage(),
                        tooltip: Ox._('Volume'),
                        type: 'image'
                    })
                    .bindEvent({
                        click: toggleVolume
                    })
                    .appendTo(self['$controls' + titleCase]);

                } else if (control == 'zapHome') {
                    
                    self.$zapHomeButton = Ox.Button({
                        style: 'video',
                        title: 'up',
                        tooltip: Ox._('Home Channel'),
                        type: 'image'
                    })
                    .bindEvent({
                        click: function() {
                            that.triggerEvent('zap', {direction: 0});
                        }
                    })
                    .appendTo(self['$controls' + titleCase]);

                } else if (control == 'zapNext') {

                    self.$zapNextButton = Ox.Button({
                        style: 'video',
                        title: 'right',
                        tooltip: Ox._('Next Channel'),
                        type: 'image'
                    })
                    .bindEvent({
                        click: function() {
                            that.triggerEvent('zap', {direction: 1});
                        }
                    })
                    .appendTo(self['$controls' + titleCase]);
                    
                } else if (control == 'zapPrevious') {

                    self.$zapPreviousButton = Ox.Button({
                        style: 'video',
                        title: 'left',
                        tooltip: Ox._('Previous Channel'),
                        type: 'image'
                    })
                    .bindEvent({
                        click: function() {
                            that.triggerEvent('zap', {direction: -1});
                        }
                    })
                    .appendTo(self['$controls' + titleCase]);
                    
                }

            });

        }

    });

    /* 
    ----------------------------------------------------------------------------
    Find
    ----------------------------------------------------------------------------
    */

    if (self.options.enableFind) {

        self.$find = $('<div>')
            .addClass('OxControls OxFind')
            .css({
                top: self.options.controlsTop.length ? '16px' : 0
            })
            .appendTo(that);

        self.$results = Ox.Element({
                tooltip: Ox._('Results')
            })
            .addClass('OxResults')
            .html('0')
            .appendTo(self.$find);

        self.$previousResultButton = Ox.Button({
                disabled: true,
                style: 'symbol',
                title: 'arrowLeft',
                tooltip: Ox._('Previous'),
                type: 'image'
            })
            .bindEvent({
                click: function() {
                    goToNext('result', -1);
                }
            })
            .appendTo(self.$find);

        self.$nextResultButton = Ox.Button({
                disabled: true,
                style: 'symbol',
                title: 'arrowRight',
                tooltip: Ox._('Next'),
                type: 'image'
            })
            .bindEvent({
                click: function() {
                    goToNext('result', 1);
                }
            })
            .appendTo(self.$find);

        self.$findInput = Ox.Input({
                changeOnKeypress: true,
                value: self.options.find
            })
            .bindEvent({
                blur: function() {
                    self.inputHasFocus = false;
                },
                focus: function() {
                    self.inputHasFocus = true;
                },
                change: function(data) {
                    submitFindInput(data.value, false);
                },
                submit: function(data) {
                    self.inputHasFocus = false;
                    submitFindInput(data.value, true);
                }
            })
            .appendTo(self.$find);

        self.$clearButton = Ox.Button({
                disabled: !self.options.find,
                style: 'symbol',
                title: 'delete',
                tooltip: Ox._('Clear'),
                type: 'image'
            })
            .bindEvent({
                click: function() {
                    self.options.find = '';
                    self.results = [];
                    self.$results.html('0');
                    self.$findInput.clearInput();
                    self.subtitle && setSubtitleText();
                    self.$timeline && self.$timeline.options({
                        find: self.options.find,
                        results: self.results
                    });
                    //setTimeout(self.$findInput.focusInput, 10);
                }
            })
            .appendTo(self.$find);

        self.$hideFindButton = Ox.Button({
                style: 'symbol',
                title: 'close',
                tooltip: Ox._('Hide'),
                type: 'image'
            })
            .bindEvent({
                click: toggleFind
            })
            .appendTo(self.$find);
      
    }

    /* 
    ----------------------------------------------------------------------------
    Volume
    ----------------------------------------------------------------------------
    */

    if (self.hasVolumeControl) {

        self.$volume = $('<div>')
            .addClass('OxControls OxVolume')
            .css({
                bottom: self.options.controlsBottom.length ? '16px' : 0
            })
            .appendTo(that);

        self.$hideVolumeButton = Ox.Button({
                style: 'symbol',
                title: 'close',
                tooltip: Ox._('Hide'),
                type: 'image'
            })
            .bindEvent({
                click: toggleVolume
            })
            .appendTo(self.$volume);

        self.$muteButton = Ox.Button({
                style: 'symbol',
                tooltip: [Ox._('Mute'), Ox._('Unmute')],
                type: 'image',
                value: self.options.muted ? 'unmute' : 'mute',
                values: ['mute', 'unmute']
            })
            .bindEvent({
                click: function() {
                    toggleMuted('button');
                }
            })
            .appendTo(self.$volume);

        self.$volumeInput = Ox.Range({
                changeOnDrag: true,
                max: 1,
                min: 0,
                step: 0.001,
                value: self.options.muted ? 0 : self.options.volume
            })
            .bindEvent({
                change: function(data) {
                    setVolume(data.value);
                }
            })
            .appendTo(self.$volume);

        self.$volumeValue = $('<div>')
            .addClass('OxVolumeValue')
            .html(self.options.muted ? 0 : Math.round(self.options.volume * 100))
            .appendTo(self.$volume);

    }

    self.options.type != 'play' && setPosition(self.options.position);

    self.results = [];

    setSizes(false, function() {
        self.options.fullscreen && enterFullscreen();
    });

    function censor() {
        if (self.options.type == 'play') {
            self.$video
                .brightness(self.censored ? 0.05 : self.options.brightness)
                .volume(self.censored ? 0.01 : self.options.volume);
        } else {
            self.$brightness.css({
                opacity: 1 - (self.censored ? 0.05 : self.options.brightness)
            });
        }
        self.$copyrightIcon[self.censored ? 'show' : 'hide']();
    }

    function changeVolume(num) {
        self.hasVolumeControl && showVolume();
        self.options.volume = Ox.limit(self.options.volume + num, 0, 1);
        setVolume(self.options.volume);
        self.$volumeInput && self.$volumeInput.value(self.options.volume);
    }

    function clearInterfaceTimeout() {
        clearTimeout(self.interfaceTimeout);
        self.interfaceTimeout = 0;
    }

    function dragstart() {
        Ox.$body.addClass('OxDragging');
        self.drag = {
            position: self.options.position,
            paused: self.options.paused
        }
        !self.options.paused && togglePaused();
    }

    function drag(e) {
        setPosition(self.drag.position - e.clientDX / 25);
        that.triggerEvent('positioning', {
            position: self.options.position
        });
    }

    function dragend() {
        Ox.$body.removeClass('OxDragging');
        !self.drag.paused && togglePaused();
        that.triggerEvent('position', {
            position: self.options.position
        });
    }
    
    function durationchange() {
        self.videoWidth = self.$video.videoWidth();
        self.videoHeight = self.$video.videoHeight();
        self.videoCSS = getVideoCSS();
        self.posterMarkerCSS = getPosterMarkerCSS();
        self.$video.css(self.videoCSS);
        self.$poster && self.$poster.css(self.videoCSS);
        self.$posterMarker && Ox.forEach(
            self.$posterMarker,
            function(marker, position) {
                marker.css(self.posterMarkerCSS[position]);
            }
        );
        self.out = self.options.playInToOut && self.out < self.$video.duration()
            ? self.out : self.$video.duration();
        self.options.duration = self.out - self['in'];
        self.$timeline && self.$timeline.replaceWith(
            self.$timeline = getTimeline()
        );
        if(self.loadedMetadata) {
            setPosition(self.$video.currentTime());
        } else {
            self.loadedMetadata = true;
            setPosition(self.options.position);
            if (self.options.paused && self.playOnLoad) {
                self.playOnLoad = false;
                togglePaused('button');
            }
        }
        self.$subtitle && self.$subtitle.animate({
            bottom: getCSS('subtitle').bottom
        }, 250);
        that.triggerEvent('durationchange', {
            duration: self.options.duration
        });
    }

    function ended() {
        !self.options.paused && togglePaused();
        if (self.options.poster) {
            self.$poster.animate({
                opacity: 1
            }, 250);
            self.posterIsVisible = true;
        }
        if (self.options.showIconOnLoad) {
            self.$playIcon.animate({
                opacity: 1
            }, 250);
            self.iconIsVisible = true;
        }
        self.options.rewind && setTimeout(rewind, 250);
        that.triggerEvent('ended');
    }

    function enterFullscreen() {
        that.on({
            mousemove: function() {
                showControls();
                hideControls();
            }
        });
        showControls();
        hideControls();
        that.find('.OxControls').on({
            mouseenter: function() {
                self.mouseIsInControls = true;
            },
            mouseleave: function() {
                self.mouseIsInControls = false;
            }
        });
        that.gainFocus();
    }

    function find(query) {
        var results = [];
        if (query.length) {
            query = query.toLowerCase();
            results = Ox.filter(self.options.annotations, function(annotation) {
                return Ox.decodeHTMLEntities(Ox.stripTags(
                    annotation.text.toLowerCase()
                )).indexOf(query) > -1;
            }).map(function(annotation) {
                return {
                    id: annotation.id,
                    'in': annotation['in'],
                    out: annotation.out
                };
            })
            results = Ox.filter(self.options.annotations, function(annotation) {
                return Ox.decodeHTMLEntities(Ox.stripTags(
                    annotation.text.toLowerCase()
                )).indexOf(query) > -1;
            }).map(function(annotation) {
                return {
                    id: annotation.id,
                    'in': annotation['in'],
                    out: annotation.out
                };
            });
        }
        return results;
    }

    function focusFind() {
        !self.interfaceIsVisible && showControls();
        // need timeout so the "f" doesn't appear in the input field
        setTimeout(function() {
            if (self.$find.is(':hidden')) {
                toggleFind();
            } else {
                self.$findInput.focusInput(true);
            }
        }, 0);
    }

    function formatPosition(position) {
        position = Ox.isUndefined(position) ? self.options.position : position;
        return Ox.formatDuration(position, self.options.showMilliseconds);
    }

    function getCensored() {
        var censored = false;
        Ox.forEach(self.options.censored, function(v) {
            if (
                v['in'] < self.options.position
                && v.out > self.options.position
            ) {
                censored = true;
                return false; // break
            }
        });
        return censored;        
    }

    function getChapterTitle() {
        var chapterTitle = '';
        self.options.chapters && Ox.forEach(self.options.chapters, function(v, i) {
            if (
                v.position <= self.options.position && (
                    i == self.options.chapters.length - 1
                    || self.options.chapters[i + 1].position > self.options.position
                )
            ) {
                chapterTitle = v.title;
                return false; // break
            }
        });
        return chapterTitle;
    }

    function getCSS(element) {
        var css;
        if (element == 'copyrightIcon') {
            css = {
                width: self.iconSize + 'px',
                height: self.iconSize + 'px'
            };
        } else if (element == 'controlsTop' || element == 'controlsBottom') {
            css = {
                width: self.width + 'px'
            };
        } else if (element == 'find') {
            css = {
                width: Math.min(216, self.width) + 'px' // 128 + 4 * 16 + 24
            };
        } else if (element == 'loadingIcon') {
            css = {
                width: self.iconSize + 'px',
                height: self.iconSize + 'px'
            };
        } else if (element == 'logo') {
            var logoHeight = Math.round(self.height / 10),
                logoMargin = Math.round(self.height / 20);
            css = {
                left: logoMargin + 'px',
                top: logoMargin + (self.controlsTopAreVisible ? 16 : 0) + 'px',
                height: logoHeight + 'px'
            };
        } else if (element == 'player') {
            var height = self.options.fullscreen ? window.innerHeight : self.height;
            if (self.options.externalControls) {
                height += (
                    !!self.options.controlsTop.length +
                    !!self.options.controlsBottom.length
                ) * self.barHeight;
            }
            css = Ox.extend({
                width: self.width + 'px',
                height: height + 'px'
            }, self.options.fullscreen ? {
                left: 0,
                top: 0
            } : {}, self.exitFullscreen ? {
                left: self.absoluteOffset.left,
                top: self.absoluteOffset.top
            } : {});
        } else if (element == 'playIcon') {
            var playIconPadding = Math.round(self.iconSize * 1/8),
                playIconSize = self.iconSize - 2 * playIconPadding - 4;
            css = {
                width: playIconSize + 'px',
                height: playIconSize + 'px',
                padding: playIconPadding + 'px',
                borderRadius: Math.round(self.iconSize / 2) + 'px'
            };
        } else if (element == 'progress') {
            css = {
                width: self.timelineImageWidth + 'px',
                marginLeft: -self.timelineImageWidth + 'px'
            };
        } else if (element == 'subtitle') {
            var offset = 0,
                videoCSS;
            if (self.options.subtitlesOffset) {
                videoCSS = getVideoCSS();
                offset = Math.floor((
                    self.options.subtitlesOffset / 100
                ) * videoCSS.height) + videoCSS.top;
                offset = Math.max(offset, 0);
            }
            css = {
                bottom: (
                    Math.floor(self.height / 16)
                    + offset
                    + (!!self.controlsBottomAreVisible * 16)
                ) + 'px',
                width: self.width + 'px',
                fontSize: Math.floor(self.height / 20) + 'px',
                WebkitTextStroke: (self.height / 1000) + 'px rgb(0, 0, 0)'
            };
        } else if (element == 'spaceBottom' || element == 'timeline') {
            css = {
                width: self.timelineWidth + 'px'
            };
        } else if (element == 'spaceTop' || element == 'title') {
            css = {
                width: getTitleWidth() + 'px'
            };
        } else if (element == 'videoContainer') {
            css = {
                width: self.width + 'px',
                height: self.height + 'px'
            };
        } else if (element == 'volume') {
            css = {
                width: Math.min(184, self.width)
            };
        }
        return css;
    }

    function getPosition(e) {
        // fixme: no offsetX in firefox???
        if ($.browser.mozilla) {
            return Ox.limit(
                (e.layerX - 48 - self.barHeight / 2) / self.timelineImageWidth * self.$video.duration(),
                0, self.$video.duration()
            );
        } else {
            return Ox.limit(
                (e.offsetX - self.barHeight / 2) / self.timelineImageWidth * self.$video.duration(),
                0, self.$video.duration()
            );
        }
    } 

    function getPositionWidth() {
        return 48 + !!self.options.showMilliseconds * 2
            + self.options.showMilliseconds * 6;
    }

    function getPosterMarkerCSS() {
        self.videoCSS = getVideoCSS();
        var left = Math.floor((self.videoCSS.width - self.videoCSS.height) / 2),
            right = Math.ceil((self.videoCSS.width - self.videoCSS.height) / 2);
        return {
            center: {
                left: self.videoCSS.left + left + 'px',
                top: self.videoCSS.top + 'px',
                width: (self.videoCSS.height - 2) + 'px',
                height: (self.videoCSS.height - 2) + 'px'
            },
            left: {
                left: self.videoCSS.left + 'px',
                top: self.videoCSS.top + 'px',
                width: left + 'px',
                height: self.videoCSS.height + 'px'
            },
            right: {
                left: self.videoCSS.left + left + self.videoCSS.height + 'px',
                top: self.videoCSS.top + 'px',
                width: right + 'px',
                height: self.videoCSS.height + 'px'
            }
        };
    }

    function getProgressImageURL() {
        if (!self.timelineImageWidth) return;
        var width = self.timelineImageWidth,
            height = self.barHeight,
            canvas = $('<canvas>')
                .attr({
                    width: width,
                    height: height
                })[0],
            context = canvas.getContext('2d'),
            imageData, data;
        context.fillStyle = 'rgba(255, 0, 0, 0.5)';
        context.fillRect(0, 0, width, height);
        imageData = context.getImageData(0, 0, width, height),
        data = imageData.data;
        self.buffered.forEach(function(range) {
            var left = Math.round(range[0] * width / self.$video.duration()),
                right = Math.round(range[1] * width / self.$video.duration());
            Ox.loop(left, right, function(x) {
                Ox.loop(height, function(y) {
                    index = x * 4 + y * 4 * width;
                    data[index + 3] = 0;
                });
            });
        });
        context.putImageData(imageData, 0, 0);
        return canvas.toDataURL();
    }

    function getSubtitle() {
        var subtitle = '';
        if (self.options.enableSubtitles) {
            Ox.forEach(self.options.subtitles, function(v) {
                if (
                    v['in'] <= self.options.position
                    && v.out >= self.options.position
                    && (!v.tracks || Ox.contains(v.tracks, self.options.subtitlesTrack))
                ) {
                    subtitle = v.text;
                    return false; // break
                }
            });
        }
        return subtitle;
    }

    function getSubtitles() {
        return self.options.enableSubtitles
            ? self.options.subtitles.filter(function(v) {
                return !v.tracks || Ox.contains(v.tracks, self.options.subtitlesTrack);
            })
            : [];
    }

    function getTimeline() {
        var $timeline = Ox.SmallVideoTimeline({
                //_offset: getTimelineLeft(),
                disabled: !self.options.enableTimeline,
                duration: self.options.duration,
                find: self.options.find,
                imageURL: self.options.timeline,
                'in': self.options['in'],
                invertHighlight: self.options.invertHighlight,
                mode: 'player',
                out: self.options.out,
                paused: self.options.paused,
                position: self.options.position,
                results: self.results,
                showInToOut: self.options.playInToOut,
                showMilliseconds: self.options.showMilliseconds,
                subtitles: self.options.enableSubtitles ? self.options.subtitles : [],
                width: getTimelineWidth()
            })
            .css({float: 'left'})
            .css({background: '-moz-linear-gradient(top, rgba(0, 0, 0, 0.5), rgba(64, 64, 64, 0.5))'})
            .css({background: '-o-linear-gradient(top, rgba(0, 0, 0, 0.5), rgba(64, 64, 64, 0.5))'})
            .css({background: '-webkit-linear-gradient(top, rgba(0, 0, 0, 0.5), rgba(64, 64, 64, 0.5))'})
            .bindEvent({
                position: function(data) {
                    setPosition(data.position, 'timeline');
                    that.triggerEvent('position', {
                        position: self.options.position
                    });
                }
            });
        $timeline.children().css({
            marginLeft: getTimelineLeft() + 'px'
        });
        $timeline.find('.OxInterface').css({
            marginLeft: getTimelineLeft() + 'px'
        });
        return $timeline;
    }

    function getTimelineLeft() {
        var left = 0;
        Ox.forEach(self.options.controlsBottom, function(control) {
            if (control == 'timeline') {
                return false; // break
            }
            left += control == 'position' ? self.positionWidth : 16
        });
        return left;
    }

    function getTimelineWidth() {
        return (self.options.fullscreen ? window.innerWidth : self.options.width) -
            self.options.controlsBottom.reduce(function(prev, curr) {
                return prev + (
                    curr == 'timeline' || curr == 'space' ? 0
                    : Ox.startsWith(curr, 'space') ? parseInt(curr.substr(5))
                    : curr == 'position' ? getPositionWidth()
                    : 16
                );
            }, 0);
    }

    function getTitleWidth() {
        return (self.options.fullscreen ? window.innerWidth : self.options.width)
            - self.options.controlsTop.reduce(function(prev, curr) {
                return prev + (
                    curr == 'title' || curr == 'chapterTitle' || curr == 'space' ? 0
                    : Ox.startsWith(curr, 'space') ? parseInt(curr.substr(5))
                    : 16
                );
            }, 0);
    }

    function getVideo() {
        return self.options.video.filter(function(video) {
            return (
                !self.options.audioTrack
                || video.track == self.options.audioTrack
            ) && (
                !self.options.resolution
                || video.resolution == self.options.resolution
            );
        });
    }

    function getVideoCSS(videoWidth, videoHeight) {
        // optional arguments allow for this function to be used for poster CSS
        var playerWidth = self.width,
            playerHeight = self.height,
            playerRatio = playerWidth / playerHeight,
            videoWidth = videoWidth || self.videoWidth,
            videoHeight = videoHeight || self.videoHeight,
            videoRatio = videoWidth / videoHeight,
            videoIsWider = videoRatio > playerRatio,
            width, height;
        if (self.options.scaleToFill) {
            width = videoIsWider ? playerHeight * videoRatio : playerWidth;
            height = videoIsWider ? playerHeight : playerWidth / videoRatio;
        } else {
            width = videoIsWider ? playerWidth : playerHeight * videoRatio;
            height = videoIsWider ? playerWidth / videoRatio : playerHeight;
        }
        width = Math.round(width);
        height = Math.round(height);
        return {
            left: Math.floor((playerWidth - width) / 2),
            top: Math.floor((playerHeight - height) / 2),
            width: width,
            height: height
        };
    }

    function getVolumeImage() {
        var symbol;
        if (self.options.muted || self.options.volume == 0) {
            symbol = 'Unmute';
        } else if (self.options.volume < 1/3) {
            symbol = 'VolumeUp';
        } else if (self.options.volume < 2/3) {
            symbol = 'VolumeDown';
        } else {
            symbol = 'Mute';
        }
        return symbol;
    }

    function goToNext(type, direction) {
        // type can be 'chapter' or 'result'
        var position, positions;
        if (type == 'chapter') {
            positions = self.options.chapters.map(function(chapter) {
                return chapter.position;
            });
        } else if (type == 'result') {
            positions = Ox.unique(self.results.map(function(result) {
                return result['in'];
            }));
        }
        position = Ox.nextValue(positions, self.options.position, direction);
        setPosition(position);
        that.triggerEvent('position', {
            position: self.options.position
        });
    }

    function goToPoint() {
        that.triggerEvent('gotopoint');
    }

    function hideControlMenus() {
        ['find', 'settings', 'volume'].forEach(function(element) {
            var $element = self['$' + element];
            $element && $element.is(':visible') && $element.animate({
                opacity: 0
            }, 250, function() {
                $element.hide().css({opacity: 1});
            });
        });
        //self.options.fullscreen && hideControls();
    }

    function hideControls() {
        //Ox.Log('Video', 'hideControls');
        clearTimeout(self.interfaceTimeout);
        self.interfaceTimeout = setTimeout(function() {
            if (
                !self.exitFullscreen
                && !self.inputHasFocus
                && !self.mouseIsInControls
            ) {
                self.interfaceIsVisible = false;
                self.controlsTopAreVisible = false;
                self.controlsBottomAreVisible = false;
                self.$controlsTop && self.$controlsTop.animate({
                    opacity: 0
                }, 250);
                self.$controlsBottom && self.$controlsBottom.animate({
                    opacity: 0
                }, 250);
                hideControlMenus();
                self.$logo && self.$logo.animate({
                    top: getCSS('logo').top,
                    opacity: 0.25
                }, 250, function() {
                    self.options.logoLink && self.$logo.off('click');
                    self.options.logoTitle &&
                        self.$logo.off('mouseenter mouseleave');
                });
                self.$subtitle && self.$subtitle.animate({
                    bottom: getCSS('subtitle').bottom
                }, 250);
            }
        }, self.options.fullscreen ? 2500 : 1000);
    }

    function hideLoadingIcon() {
        self.$loadingIcon.hide().stop();
    }

    function hideMarkers() {
        self.$posterMarker && Ox.forEach(self.$posterMarker, function(marker) {
            marker.hide();
        });
        self.$pointMarker && Ox.forEach(self.$pointMarker, function(markers) {
            Ox.forEach(markers, function(marker) {
                marker.hide();
            });
        });
    }

    function hidePoster() {
        if (self.loadedMetadata && self.posterIsVisible) {
            self.$poster.animate({
                opacity: 0
            }, 250);
            self.posterIsVisible = false;
        }
    }

    function isEqual(a, b) {
        return Math.abs(a - b) < 0.001;
    }

    function itemchange(data) {
        var item = self.$video.options('items')[data.item];
        Ox.Log('Video', 'ITEMCHANGE', item);
    }

    function requiresusergesture() {
        Ox.Log('Video', 'requires user gesture');
        var $playIcon;
        function removeBehaviorsRestrictions() {
            window.removeEventListener('keydown', removeBehaviorsRestrictions);
            window.removeEventListener('mousedown', removeBehaviorsRestrictions);
            window.removeEventListener('touchstart', removeBehaviorsRestrictions);
            $playIcon.remove();
            showLoadingIcon();
            self.options.showIconOnLoad = false;
        }
        window.addEventListener('keydown', removeBehaviorsRestrictions);
        window.addEventListener('mousedown', removeBehaviorsRestrictions);
        window.addEventListener('touchstart', removeBehaviorsRestrictions);
        hideLoadingIcon();
        //FIXME: also load frame at current position?
        $playIcon = $('<img>')
            .addClass('OxPlayIcon OxVideo OxInterface')
            .attr({
                src: Ox.UI.getImageURL('symbolPlay', 'videoIcon')
            })
            .css(getCSS('playIcon'))
            .css({
                opacity: 1
            })
            .appendTo(self.$videoContainer);
    }

    function loadImage() {
        self.$image
            .one({
                load: function() {
                    hideLoadingIcon();
                }
            })
            .attr({
                src: self.options.video(
                    // fixme: this keeps the frame from being beyond the end,
                    // but what should be avoided is setting position to a point
                    // beyond the beginning of the last frame
                    Math.min(
                        self.options.position,
                        Math.floor(self.options.duration * self.options.fps) / self.options.fps
                    ),
                    self.options.width
                )
            });
    }

    function loadedmetadata() {

        Ox.Log('Video', 'LOADEDMETADATA')

        var hadDuration = !!self.options.duration;

        self.loadedMetadata = true;

        self.videoWidth = self.$video.videoWidth();
        self.videoHeight = self.$video.videoHeight();
        self.videoCSS = getVideoCSS();
        self.posterMarkerCSS = getPosterMarkerCSS();
        self.$video.css(self.videoCSS);
        self.$poster && self.$poster.css(self.videoCSS);
        self.$posterMarker && Ox.forEach(
            self.$posterMarker,
            function(marker, position) {
                marker.css(self.posterMarkerCSS[position]);
            }
        );

        self.out = self.options.playInToOut && self.out < self.$video.duration()
            ? self.out : self.$video.duration();
        self.options.duration = self.out - self['in'];
        Ox.Log('Video', '---------------------------------------- POS', self.options.position)
        Ox.Log('Video', '----------------------------------- DURATION', self.options.duration)
        
        //self.options.position = Ox.limit(self.options.position, self['in'], self.out);
        //self.$video.currentTime(self.options.position);

        setPosition(self.options.position);
        self.$video.muted(self.options.muted).volume(self.options.volume);
         
        if (!self.options.paused) {
            self.options.paused = true;
            togglePaused('loadedmetadata');
        } else if (self.options.paused && self.playOnLoad) {
            togglePaused('loadedmetadata');
        }
        self.$playButton && self.$playButton.options({disabled: false});

        if (self.options.showIcon || self.options.showIconOnLoad) {
            self.$playIcon.animate({
                opacity: 1
            }, 250);
        }
        if (self.options.showControlsOnLoad) {
            showControls();
        }
        !hadDuration && self.$timeline && self.$timeline.replaceWith(
            self.$timeline = getTimeline()
        );

        if (self.options.enableKeyboard && self.options.focus == 'load') {
            that.gainFocus();
        }
        self.$subtitle && self.$subtitle.animate({
            bottom: getCSS('subtitle').bottom
        }, 250);
        that.triggerEvent('loadedmetadata');
    }

    function loadedsubtitles() {
        if (!self.subtitlesTracks || Ox.isEmpty(self.subtitlesTracks)) {
            self.subtitlesTracks = [self.options.subtitlesDefaultTrack];
        }
        self.subtitlesTracks.push('None');
        if (self.options.find) {
            submitFindInput(self.options.find);
            if (self.options.duration) {
                // duration was known or video has loaded before subtitles
                self.$timeline && self.$timeline.options({
                    results: self.results,
                    subtitles: self.options.subtitles
                });
            }
        } else {
            // needed on options change
            self.options.enableSubtitles && self.$subtitle && setSubtitle();
        }
    }

    function loadSubtitles() {
        if (self.options.subtitles.length) {
            if (Ox.isArray(self.options.subtitles)) {
                self.subtitlesTracks = Ox.sort(Ox.unique(Ox.flatten(
                    self.options.subtitles.map(function(subtitle) {
                        return subtitle.tracks;
                    })
                ))).filter(function(track) {
                    return !!track;
                });
                loadedsubtitles();
            } else {
                if (self.options.subtitles.indexOf('\n') > -1) {
                    self.options.subtitles = Ox.parseSRT(self.options.subtitles);
                    loadedsubtitles();
                } else {
                    Ox.get(self.options.subtitles, function(data) {
                        self.options.subtitles = Ox.parseSRT(data);
                        loadedsubtitles();
                    });
                    self.options.subtitles = [];
                }
            }
        }
    }

    function playing() {
        self.options.position = self.$video.currentTime();
        if (
            (self.playInToOut && self.options.position >= self.options.out)
            || (self.options.playInToOut && self.options.position >= self.out)
        ) {
            if (self.options.loop) {
                setPosition(self.options['in']);
                self.$video.play();
            } else {
                togglePaused();
                if (self.options.rewind) {
                    setTimeout(rewind, 250);
                } else {
                    setPosition(self.options.out ? self.options.out : self.out/*, 'video'*/);
                }
                that.triggerEvent('ended');
            }
        } else {
            setPosition(self.options.position, 'video');
        }
        that.triggerEvent('playing', {
            position: self.options.position
        });
    }

    function playInToOut() {
        if (self.options.out > self.options['in']) {
            self.playInToOut = true;
            setPosition(self.options['in']);
            self.options.paused && togglePaused();
        }
    }

    function progress() {
        var buffered = self.$video.buffered();
        for (var i = 0; i < buffered.length; i++) {
            self.buffered[i] = [buffered.start(i), buffered.end(i)];
            // fixme: firefox weirdness
            if (self.buffered[i][0] > self.buffered[i][1]) {
                self.buffered[i][0] = 0;
            }
        }
        self.$progress.attr({
            src: getProgressImageURL()
        });
    }

    function renderSettings() {
        return Ox.VideoPlayerMenu({
            items: [{disabled: true, title: Ox._('Resolution')}].concat(
                self.resolutions.map(function(resolution) {
                    return {
                        group: 'resolution',
                        id: resolution,
                        checked: resolution == self.options.resolution,
                        title: resolution + 'p'
                    };
                }),
                self.audioTracks.length > 1
                    ? [{}, {disabled: true, title: Ox._('Audio')}].concat(
                        self.audioTracks.map(function(track) {
                            return {
                                group: 'audioTrack',
                                id: track,
                                checked: track == self.options.audioTrack,
                                title: Ox._(track)
                            };
                        })
                    )
                    : [],
                self.options.subtitles.length
                    ? [{}, {disabled: true, title: Ox._('Subtitles')}].concat(
                        self.subtitlesTracks.map(function(track) {
                            return {
                                group: 'subtitlesTrack',
                                id: track,
                                checked: self.options.enableSubtitles
                                    ? track == self.options.subtitlesTrack
                                    : track == '',
                                title: Ox._(track)
                            };
                        })
                    )
                    : [],
                self.options.timelineTypes.length
                    ? [{}, {disabled: true, title: Ox._('Timeline')}].concat(
                        self.options.timelineTypes.map(function(type) {
                            return {
                                group: 'timeline',
                                id: type.id,
                                checked: type.id == self.options.timelineType,
                                title: type.title
                            };
                        })
                    )
                    : [],
                self.options.enableDownload
                    ? [{}, {id: 'download', title: Ox._('Download')}]
                    : []
            )
        })
        .addClass('OxControls OxSettings')
        .bindEvent({
            click: function(data) {
                var resolution, type;
                if (data.group == 'resolution') {
                    resolution = parseInt(data.id, 10);
                    if (resolution != self.options.resolution) {
                        self.options.resolution = resolution;
                        setResolution();
                    }
                } else if (data.group == 'audioTrack') {
                    self.options.audioTrack = data.id;
                    setAudioTrack();
                } else if (data.group == 'subtitlesTrack') {
                    self.options.subtitlesTrack = data.id == 'None'
                        ? '' : data.id;
                    self.options.enableSubtitles = !!self.options.subtitlesTrack;
                    setSubtitlesTrack();
                } else if (data.group == 'timeline') {
                    type = self.options.timelineTypes[
                        Ox.indexOf(self.options.timelineTypes, function(type) {
                            return type.title == title;
                        })
                    ].id;
                    if (type != self.options.timelineType) {
                        self.options.timelineType = type;
                        setTimelineType();
                    }
                } else if (data.id == 'download') {
                    that.triggerEvent('download');
                }
            }
        });

    }

    function rewind() {
        setPosition(self.options.playInToOut ? self.options['in'] : 0);
    }

    function seeked() {
        Ox.Log('Video', 'seeked')
        clearTimeout(self.seekTimeout);
        self.seekTimeout = 0;
        Ox.Log('Video', 'hide loading icon')
        hideLoadingIcon();
        self.$video.show();
        self.$playIcon && self.$playIcon.show();
        hidePoster();
    }

    function seeking() {
        Ox.Log('Video', 'XX seeking')
        if (!self.seekTimeout) {
            self.seekTimeout = setTimeout(function() {
                self.$playIcon && self.$playIcon.hide();
                Ox.Log('Video', 'XX show')
                showLoadingIcon();
            }, 250);
        }
    }

    function setAudioTrack() {
        updateVideo();
    }

    function setCensored() {
        var censored = getCensored();
        if (censored != self.censored) {
            self.censored = censored;
            censor();
        }
    }

    function setChapterTitle() {
        var chapterTitle = getChapterTitle();
        if (chapterTitle != self.chapterTitle) {
            self.chapterTitle = chapterTitle;
            self.$chapterTitle.html(self.chapterTitle)
        }
    }

    function setMarkers() {
        //Ox.Log('Video', 'SET MARKERS', self.options.position, self.options['in'], self.options.out, self.$pointMarker);
        self.$posterMarker && Ox.forEach(self.$posterMarker, function(marker) {
            isEqual(self.options.position, self.options.posterFrame)
                ? marker.show() : marker.hide();
        });
        self.$pointMarker && Ox.forEach(
            self.$pointMarker,
            function(markers, point) {
                Ox.forEach(markers, function(marker) {
                    // fixme: there's a bug in jquery and/or webkit
                    // on load, show() doesn't work
                    isEqual(self.options.position, self.options[point])
                        ? marker.css({display: 'block'}) : marker.hide();
                });
            }
        );
    }

    function setPoint() {
        that.triggerEvent('setpoint');
    }

    function setPosition(position, from) {
        self.options.position = Ox.limit(position, self['in'], self.out);
        /*
        // disabled
        self.options.position = Math.round(
            position * self.options.fps
        ) / self.options.fps;
        */
        self.options.paused && self.options.showMarkers && setMarkers();
        self.options.censored.length && setCensored();
        self.options.enableSubtitles && self.$subtitle && setSubtitle();
        self.$chapterTitle && setChapterTitle();
        self.$position && self.$position.html(formatPosition());
        if (self.options.type == 'play') {
            if (self.loadedMetadata && from != 'video') {
                self.$video.currentTime(self.options.position);
            }
            if (self.iconIsVisible) {
                self.$playIcon.animate({
                    opacity: 0
                }, 250);
                self.iconIsVisible = false;
            }
            self.$timeline /*&& from != 'timeline'*/ && self.$timeline.options({
                position: self.options.position
            });
        } else {
            //showLoadingIcon();
            loadImage();
        }
    }

    function setResolution() {
        updateVideo();
        that.triggerEvent('resolution', {
            resolution: self.options.resolution
        });
    }

    function setSize($element, css, animate, callback) {
        if ($element) {
            if (animate) {
                $element.animate(css, 250, function() {
                    callback && callback();
                });
            } else {
                $element.css(css);
                callback && callback();
            }
        }
    }

    function setSizes(animate, callback) {
        self.width = self.options.fullscreen
            ? window.innerWidth : self.options.width;
        self.height = self.options.fullscreen
            ? window.innerHeight : self.options.height;
        self.videoCSS = getVideoCSS();
        self.iconSize = Ox.limit(Math.round(self.height / 10), 16, 32);
        if (self.$timeline || self.$spaceBottom) {
            self.timelineWidth = getTimelineWidth();
            if (self.$timeline) {
                self.timelineImageWidth = self.timelineWidth - self.barHeight;
            }
        }
        setSize(that, getCSS('player'), animate, callback);
        setSize(self.$videoContainer, getCSS('videoContainer'), animate);
        setSize(self.$video, self.videoCSS, animate);
        setSize(self.$poster, self.videoCSS, animate);
        setSize(self.$logo, getCSS('logo'), animate);
        setSize(self.$loadingIcon, getCSS('loadingIcon'), animate);
        setSize(self.$playIcon, getCSS('playIcon'), animate);
        setSize(self.$copyrightIcon, getCSS('copyrightIcon'), animate);
        setSize(self.$subtitle, getCSS('subtitle'), animate);
        setSize(self.$controlsTop, getCSS('controlsTop'), animate);
        setSize(self.$title, getCSS('title'), animate);
        setSize(self.$chapterTitle, getCSS('title'), animate);
        setSize(self.$spaceTop, getCSS('spaceTop'), animate);
        setSize(self.$controlsBottom, getCSS('controlsBottom'), animate);
        setSize(self.$timeline, getCSS('timeline'), animate, function() {
            self.$timeline && self.$timeline.options({
                width: self.timelineWidth
            });
        });
        setSize(self.$spaceBottom, getCSS('spaceBottom'), animate);
        setSize(self.$find, getCSS('find'), animate, function() {
            var width = Math.min(128, self.width - 88); // 4 * 16 + 24
            self.$findInput.options({
                width: width
            });
            self.$findInput.children('input').css({
                width: (width - 12) + 'px'
            });            
        });
        setSize(self.$volume, getCSS('volume'), animate, function() {
            self.$volumeInput.options({
                size: Math.min(128, self.width - 56)
            });
        });
        if (self.$posterMarker) {
            self.posterMarkerCSS = getPosterMarkerCSS();
            Ox.forEach(self.$posterMarker, function(marker, position) {
                setSize(marker, self.posterMarkerCSS[position], animate);
            });
        }
    }

    function setSubtitle() {
        var subtitle = getSubtitle();
        if (subtitle != self.subtitle) {
            self.subtitle = subtitle;
            setSubtitleText();
        }
    }

    function setSubtitleText() {
        self.$subtitle.html(
            self.subtitle
            ? Ox.highlight(
                self.subtitle, self.options.find, 'OxHighlight', true
            ).replace(/\n/g, '<br/>')
            : '&nbsp;<br/>&nbsp;'
            // FIXME: weird bug, only in fullscreen, only in chrome
        );
    }

    function setSubtitlesTrack() {
        var enableSubtitles = self.options.enableSubtitles && !!self.options.subtitlesTrack;
        self.options.enableSubtitles = enableSubtitles;
        setSubtitle();
        self.$timeline && self.$timeline.options({
            subtitles: getSubtitles()
        });
        if (enableSubtitles && !!self.options.subtitlesTrack) {
            that.triggerEvent('subtitlestrack', {
                track: self.options.subtitlesTrack
            });
        } else {
            that.triggerEvent('subtitles', {
                subtitles: self.options.enableSubtitles
            });
        }
    }

    function setTimelineType() {
        that.triggerEvent('timeline', {timeline: self.options.timelineType});
    }

    function setVideo() {
        if (Ox.isObject(self.options.video[0])) {
            self.audioTracks = Ox.sort(Ox.unique(
                self.options.video.map(function(video) {
                    return video.track;
                })
            ));
            if (!Ox.contains(self.audioTracks, self.options.audioTrack)) {
                self.options.audioTrack = self.audioTracks[0];
            }
            self.resolutions = Ox.sort(Ox.unique(
                self.options.video.map(function(video) {
                    return video.resolution;
                })
            ));
            if (!Ox.contains(self.resolutions, self.options.resolution)) {
                self.options.resolution = self.resolutions[0];
            }
            self.video = getVideo();
        } else {
            self.video = [{src: self.options.video}];
            self.resolutions = [];
            self.audioTracks = [];
        }
    }

    function setVolume(volume) {
        self.options.volume = volume;
        if (!!self.options.volume == self.options.muted) {
            toggleMuted();
        } else {
            self.$volumeButton && self.$volumeButton.options({
                title: getVolumeImage()
            });
            self.$volumeValue && self.$volumeValue.html(
                self.options.muted ? 0 : Math.round(self.options.volume * 100)
            );
        }
        !self.censored && self.$video.volume(self.options.volume);
        that.triggerEvent('volume', {
            volume: self.options.volume
        });
    }

    function showControls() {
        //Ox.Log('Video', 'showControls');
        clearTimeout(self.interfaceTimeout);
        if (!self.interfaceIsVisible) {
            self.interfaceIsVisible = true;
            if (self.$controlsTop) {
                self.controlsTopAreVisible = true;
            }
            if (self.$controlsBottom) {
                self.controlsBottomAreVisible = true;
            }
            self.$controlsTop && self.$controlsTop.animate({
                opacity: 1
            }, 250);
            self.$controlsBottom && self.$controlsBottom.animate({
                opacity: 1
            }, 250);
            ['find', 'settings', 'volume'].forEach(function(element) {
                var $element = self['$' + element];
                $element && $element.is(':visible') && $element.animate({
                    opacity: 1
                }, 250);
            });
            self.$logo && self.$logo.animate({
                top: getCSS('logo').top,
                opacity: 0.5
            }, 250, function() {
                self.options.logoLink && self.$logo
                    .on({
                        click: function() {
                            document.location.href = self.options.logoLink;
                        }
                    });
                self.options.logoTitle && self.$logo
                    .on({
                        mouseenter: function(e) {
                            self.$logoTooltip.show(e);
                        },
                        mouseleave: self.$logoTooltip.hide
                    });
            });
            self.$subtitle && self.$subtitle.animate({
                bottom: getCSS('subtitle').bottom
            }, 250);
        }
    }

    function showLoadingIcon() {
        self.$loadingIcon.start().show();
    }

    function showVolume() {
        if (self.$volume) {
            !self.interfaceIsVisible && showControls();
            self.$volume.is(':hidden') && toggleVolume();
        }
    }

    function sizechange() {
        self.videoWidth = self.$video.videoWidth();
        self.videoHeight = self.$video.videoHeight();
        self.videoCSS = getVideoCSS();
        self.$video.css(self.videoCSS);
    };

    function submitFindInput(value, hasPressedEnter) {
        self.options.find = value;
        self.results = find(self.options.find);
        if (self.$find) {
            self.$results.html(self.results.length);
            self.$previousResultButton.options({
                disabled: !self.results.length
            });
            self.$nextResultButton.options({
                disabled: !self.results.length
            });
            self.$clearButton.options({
                disabled: !self.options.find
            });
        }
        self.subtitle && setSubtitleText();
        self.$timeline && self.$timeline.options({
            find: self.options.find,
            results: self.results
        });
        if (hasPressedEnter) {
            if (self.results.length) {
                goToNext('result', 1);
                that.gainFocus();
            } else {
                self.$findInput.focusInput(true);
            }
        }
        that.triggerEvent('find', {find: self.options.find});
    }

    function submitPositionInput() {
        self.$positionInput.hide();
        self.$position.html('').show();
        setPosition(Ox.parseDuration(self.$positionInput.value()));
        if (self.playOnSubmit) {
            togglePaused();
            self.$video.play();
            self.playOnSubmit = false;
        }
        if (self.focus == 'mouseenter' && !self.mouseHasLeft) {
            that.gainFocus();
        }
        self.mouseHasLeft && hideControls();
        that.triggerEvent('position', {
            position: self.options.position
        });
        that.triggerEvent('submit');
    }

    function toggleFind() {
        var show = self.$find.is(':hidden');
        !show && self.$findInput.blurInput();
        self.$find.toggle();
        show && self.$findInput.focusInput(false);
    }

    function toggleFullscreen(from) {
        var parentOffset, playOnFullscreen;
        self.options.fullscreen = !self.options.fullscreen;
        if (!self.options.paused) {
            // video won't keep playing accross detach/append
            self.$video.pause();
            playOnFullscreen = true;
        }
        if (self.options.fullscreen) {
            self.$parent = that.parent();
            parentOffset = self.$parent.offset();
            self.absoluteOffset = that.offset();
            self.relativeOffset = {
                left: self.absoluteOffset.left - parentOffset.left,
                top: self.absoluteOffset.top - parentOffset.top
            };
            that.detach()
                .addClass('OxFullscreen')
                .css({
                    left: self.absoluteOffset.left + 'px',
                    top: self.absoluteOffset.top + 'px',
                    zIndex: 1000
                })
                .appendTo(Ox.$body);
            if (self.options.externalControls) {
                self.externalControls = true;
                self.options.externalControls = false;
                self.$videoContainer.css({top: 0});
            }
            setSizes(true, function() {
                playOnFullscreen && self.$video.play();
                enterFullscreen();
            });
        } else {
            // exitFullscreen flag makes the animation end on absolute position
            self.exitFullscreen = true;
            that.off('mousemove');
            that.find('.OxControls')
                .trigger('mouseleave')
                .off('mouseenter mouseleave');
            clearTimeout(self.interfaceTimeout);
            if (self.externalControls) {
                self.options.externalControls = true;
                self.$videoContainer.css({top: '16px'});
            }
            setSizes(true, function() {
                self.exitFullscreen = false;
                that.detach()
                    .removeClass('OxFullscreen')
                    .css({
                        left: self.relativeOffset.left + 'px',
                        top: self.relativeOffset.top + 'px',
                        zIndex: 1
                    })
                    .appendTo(self.$parent);
                playOnFullscreen && self.$video.play();
                self.options.enableKeyboard && that.gainFocus();
                //showControls();
            });
        }
        if (self.$fullscreenButton && from != 'button') {
            self.$fullscreenButton.toggle();
        }
        that.triggerEvent('fullscreen', {
            fullscreen: self.options.fullscreen
        });
    }

    function toggleLoop(from) {
        self.options.loop = !self.options.loop;
        self.$video.options('loop', self.options.loop);
        if (self.$loopButton && from != 'button') {
            self.$loopButton.toggle();
        }
        that.triggerEvent('loop', {
            loop: self.options.loop
        });
    }

    function toggleMuted(from) {
        self.hasVolumeControl && showVolume();
        self.options.muted = !self.options.muted;
        self.$video.muted(self.options.muted);
        if (!self.options.muted && !self.options.volume) {
            self.options.volume = 1;
            self.$video.volume(1);
        }
        if (self.$muteButton && from != 'button') {
            self.$muteButton.toggle();
        }
        self.$volumeButton && self.$volumeButton.options({
            title: getVolumeImage()
        });
        self.$volumeInput && self.$volumeInput.value(
            self.options.muted ? 0 : self.options.volume
        );
        self.$volumeValue && self.$volumeValue.html(
            self.options.muted ? 0 : Math.round(self.options.volume * 100)
        );
        that.triggerEvent('muted', {
            muted: self.options.muted
        });
    }

    function togglePaused(from) {
        self.options.paused = !self.options.paused;
        self.$timeline && self.$timeline.options({
            paused: self.options.paused
        });
        if (!self.loadedMetadata) {
            return;
        }
        if (self.options.paused) {
            self.$video.pause();
            clearInterval(self.playInterval);
            if (self.options.showIcon) {
                togglePlayIcon();
                self.$playIcon.animate({
                    opacity: 1
                }, 250);
            }
            self.playInToOut = false;
        } else {
            hidePoster();
            if (
                self.options.playInToOut
                && self.options.position > self.options.out - self.secondsPerFrame
            ) {
                setPosition(self.options['in']);
            }
            self.$video.play();
            self.playInterval = setInterval(playing, self.millisecondsPerFrame);
            if (self.options.showIcon) {
                self.$playIcon.animate({
                    opacity: 0
                }, 250, togglePlayIcon);
            } else if (self.options.showIconOnLoad) {
                self.$playIcon.animate({
                    opacity: 0
                }, 250);
            }
            self.options.showMarkers && hideMarkers();
        }
        if (self.$playButton && from != 'button') {
            self.$playButton.toggle();
        }
        that.triggerEvent('paused', {
            paused: self.options.paused
        });
        self.options.paused && that.triggerEvent('position', {
            position: self.options.position
        });
    }

    function togglePlayIcon() {
        self.$playIcon.attr({
            src: Ox.UI.getImageURL(
                'symbol' + (self.options.paused ? 'Play' : 'Pause'
            ), 'videoIcon')
        });
    }

    function toggleScale(from) {
        self.options.scaleToFill = !self.options.scaleToFill;
        self.videoCSS = getVideoCSS();
        self.$video.animate(self.videoCSS, 250);
        self.$poster && self.$poster.animate(self.videoCSS, 250);
        self.$subtitle && self.$subtitle.animate({
            bottom: getCSS('subtitle').bottom
        }, 250);
        if (self.$scaleButton && from != 'button') {
            self.$scaleButton.toggle();
        }
        if (self.$posterMarker) {
            self.posterMarkerCSS = getPosterMarkerCSS();
            Ox.forEach(self.$posterMarker, function(marker, position) {
                marker.animate(self.posterMarkerCSS[position], 250);
            });
        }
        that.triggerEvent('scale', {
            scale: self.options.scaleToFill ? 'fill' : 'fit'
        });
    }

    function toggleSize() {
        self.options.sizeIsLarge = !self.options.sizeIsLarge;
        that.triggerEvent('size', {
            size: self.options.sizeIsLarge ? 'large' : 'small'
        });
    }

    function toggleVolume() {
        self.$volume.toggle();
    }

    function updateVideo() {
        if (!self.options.paused) {
            self.playOnLoad = true;
            togglePaused('button');
        }
        self.loadedMetadata = false;
        showLoadingIcon();
        self.video = getVideo();
        self.$video.options({
            items: self.video
        });
        self.$playButton && self.$playButton.options({disabled: true});
    }

    /*@
    changeVolume <f> change volume
        (num) -> <o>  change volume
    @*/
    that.changeVolume = function(num) {
        changeVolume(num);
        return that;
    };

    /*@
    playInToOut <f> play in to out
        () -> <o>  play in to out
    @*/
    that.playInToOut = function() {
        playInToOut();
        return that;
    };

    /*@
    togglePaused <f> toggle loop state
        () -> <o>  toggle loop state
    @*/
    that.toggleLoop = function() {
        toggleLoop();
        return that;
    };

    /*@
    togglePaused <f> toggle paused state
        () -> <o>  toggle paused state
    @*/
    that.togglePaused = function() {
        togglePaused();
        return that;
    };

    /*@
    toggleMuted <f> toggle muted state
        () -> <o>  toggle muted state
    @*/
    that.toggleMuted = function() {
        toggleMuted();
        return that;
    };

    return that;

};
