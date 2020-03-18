'use strict';

/*@
Ox.VideoTimelinePlayer <f> Video Timeline Player
    options <o> Options
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.SplitPanel> Video Timeline Player
        censored <!> censored
        follow <!> follow
        muted <!> muted
        playing <!> playing
        position <!> position
        timeline <!> timeline
        volume <!> volume
@*/
Ox.VideoTimelinePlayer = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({
            audioTrack: '',
            censored: [],
            censoredIcon: '',
            censoredTooltip: '',
            cuts: [],
            duration: 0,
            find: '',
            followPlayer: false,
            getFrameURL: null,
            getLargeTimelineURL: null,
            height: 0,
            'in': 0,
            matches: [],
            muted: false,
            out: 0,
            paused: false,
            position: 0,
            showMilliseconds: false,
            smallTimelineURL: '',
            subtitles: [],
            timeline: '',
            timelines: [],
            video: '',
            videoRatio: 1,
            volume: 1,
            width: 0
        })
        .options(options || {})
        .update({
            height: setHeight,
            paused: function() {
                self.options.paused = !self.options.paused;
                togglePaused();
            },
            position: setPosition,
            timeline: function() {
                self.$menuButton.checkItem('timelines_' + self.options.timeline);
                updateTimeline();
            },
            volume: function() {
                self.$video.options({
                    volume: self.options.volume
                });
            },
            width: setWidth
        });

    self.fps = 25;
    self.frame = self.options.position * self.fps;
    self.frames = self.options.duration * self.fps;
    self.tileWidth = 1500;
    self.tileHeight = 64;
    self.margin = 8;
    self.contentWidth = self.options.width - 2 * self.margin;
    self.contentHeight = self.options.height - 32;
    self.positionWidth = 48
        + !!self.options.showMilliseconds * 2
        + self.options.showMilliseconds * 6;
    self.tiles = Math.ceil(self.frames / self.tileWidth);
    self.videoWidth = Math.round(self.tileHeight * self.options.videoRatio);
    self.lines = getLines(); // may update self.contentWidth
    self.videoLines = getVideoLines();

    if (Ox.isObject(self.options.video[0])) {
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

    self.$menubar = Ox.Bar({size: 16});

    self.$menuButton = Ox.MenuButton({
            items: [].concat(
                self.audioTracks.length > 1 ? [
                    {id: 'audioTracks', title: Ox._('Audio'), items: [
                        {group: 'audioTrack', min: 1, max: 1, items: self.audioTracks}
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
                    {
                        id: 'followPlayer',
                        title: 'Follow Player While Playing',
                        checked: self.options.followPlayer
                    }
                ]
            ),
            style: 'square',
            title: 'set',
            tooltip: Ox._('Options'),
            type: 'image'
        })
        .css({float: 'left'})
        .bindEvent({
            change: function(data) {
                var id = data.id;
                if (id == 'audioTrack') {
                    self.options.audioTrack = data.checked[0].id;
                    self.$video.options({audioTrack: self.options.audioTrack});
                } else if (id == 'timeline') {
                    self.options.timeline = data.checked[0].id;
                    updateTimeline();
                    that.triggerEvent('timeline', {
                        timeline: self.options.timeline
                    });
                } else if (id == 'followPlayer') {
                    self.options.followPlayer = data.checked;
                    if (!self.options.paused && self.options.followPlayer) {
                        self.scrollTimeout && clearTimeout(self.scrollTimeout);
                        scrollToPosition();
                    }
                    that.triggerEvent('follow', {
                        follow: self.options.followPlayer
                    });
                }
            }
        })
        .appendTo(self.$menubar);

    self.$scrollButton = Ox.Button({
            style: 'symbol',
            title: 'arrowDown',
            tooltip: Ox._('Scroll to Player'),
            type: 'image'
        })
        .css({float: 'right'})
        .hide()
        .bindEvent({
            click: function() {
                self.scrollTimeout && clearTimeout(self.scrollTimeout);
                scrollToPosition();
            }
        })
        .appendTo(self.$menubar);

    self.$timelinePlayer = Ox.Element()
        .addClass('OxMedia')
        .css({overflowX: 'hidden', overflowY: 'auto'})
        .on({
            mousedown: mousedown,
            mouseleave: mouseleave,
            mousemove: mousemove,
            scroll: scroll
        })
        .bindEvent({
            mousedown: function() {
                this.gainFocus();
            },
            key_0: toggleMuted,
            key_down: function() {
                self.options.position += self.contentWidth / self.fps;
                setPosition();
            },
            key_equal: function() {
                changeVolume(0.1);
            },
            key_enter: function() {
                scrollToPosition();
            },
            key_left: function() {
                self.options.position -= self.videoWidth / self.fps;
                setPosition();
            },
            key_minus: function() {
                changeVolume(-0.1);
            },
            key_right: function() {
                self.options.position += self.videoWidth / self.fps;
                setPosition();
            },
            key_shift_left: function() {
                self.options.position -= 1 / self.fps;
                setPosition();
            },
            key_shift_right: function() {
                self.options.position += 1 / self.fps;
                setPosition();
            },
            key_space: function() {
                togglePaused()
            },
            key_up: function() {
                self.options.position -= self.contentWidth / self.fps;
                setPosition();
            },
            touchend: function (e) {
                mousedown(e);
                mouseleave();
            },
            touchmove: mousedown,
            touchstart: mousedown
        });

    self.$playerbar = Ox.Bar({size: 16});

    self.$playButton = Ox.Button({
            style: 'symbol',
            title: 'play',
            tooltip: Ox._('Play'),
            type: 'image'
        })
        .css({
            float: 'left'
        })
        .bindEvent({
            click: function() {
                togglePaused();
            }
        })
        .appendTo(self.$playerbar);

    self.$muteButton = Ox.Button({
            style: 'symbol',
            title: self.options.muted ? 'unmute' : 'mute',
            tooltip: self.options.muted ? Ox._('Unmute') : Ox._('Mute'),
            type: 'image'
        })
        .css({float: 'left'})
        .bindEvent({
            click: toggleMuted
        })
        .appendTo(self.$playerbar);

    self.$smallTimeline = getSmallTimeline().appendTo(self.$playerbar);

    self.$position = Ox.Element()
        .addClass('OxPosition')
        .css({
            width: self.positionWidth - 4 + 'px'
        })
        .html(formatPosition())
        .on({
            click: function() {
                if (!self.options.paused) {
                    self.playOnSubmit = true;
                    togglePaused();
                }
                self.$position.hide();
                self.$positionInput
                    .value(formatPosition())
                    .show()
                    .focusInput(false);
            }
        })
        .appendTo(self.$playerbar);

    self.$positionInput = Ox.Input({
            value: formatPosition(),
            width: self.positionWidth
        })
        .addClass('OxPositionInput')
        .bindEvent({
            blur: submitPositionInput,
            submit: submitPositionInput
        })
        .appendTo(self.$playerbar);

    self.$positionInput.children('input').css({
            width: (self.positionWidth - 6) + 'px',
            fontSize: '9px'
        });

    self.$panel = Ox.SplitPanel({
            elements: [
                {
                    element: self.$menubar,
                    size: 16
                },
                {
                    element: self.$timelinePlayer
                },
                {
                    element: self.$playerbar,
                    size: 16
                }
            ],
            orientation: 'vertical'
        })
        .addClass('OxVideoTimelinePlayer');

    that.setElement(self.$panel);

    self.$lines = [];
    self.$timelines = [];

    self.$timeline = renderTimeline();
    //setSubtitles();
    Ox.loop(self.lines, function(i) {
        addLine(i);
    });
    Ox.last(self.$lines).css({
        height: self.tileHeight + 1.5 * self.margin + 'px'
    });        

    self.$frameBox = $('<div>')
        .addClass('OxVideoBox')
        .css({
            position: 'absolute',
            right: 0,
            top: self.margin / 2 - 1 + 'px',
            width: self.videoWidth + 'px',
            height: self.tileHeight + 'px'
        })
        .appendTo(self.$timelines[self.videoLines[1]][0]);

    self.$frame = Ox.VideoPlayer({
            audioTrack: self.options.audioTrack,
            censored: self.options.censored,
            censoredIcon: self.options.censoredIcon,
            censoredTooltip: self.options.censoredTooltip,
            duration: self.options.duration,
            height: self.tileHeight,
            position: self.options.position,
            scaleToFill: true,
            type: 'in',
            video: self.options.getFrameURL,
            width: self.videoWidth
        })
        .bindEvent({
            censored: function() {
                that.triggerEvent('censored');
            }
        })
        .appendTo(self.$frameBox);

    $('<div>')
        .addClass('OxFrameInterface')
        .css({
            position: 'absolute',
            left: 0,
            top: 0,
            width: self.videoWidth + 'px',
            height: self.tileHeight + 'px'
        })
        .appendTo(self.$frameBox);

    self.$videoBox = $('<div>')
        .addClass('OxVideoBox')
        .css({
            position: 'absolute',
            right: 0,
            top: self.margin / 2 - 1 + 'px',
            width: self.videoWidth + 'px',
            height: self.tileHeight + 'px',
            zIndex: 5
        })
        .appendTo(self.$timelines[self.videoLines[0]][0]);

    self.$video = Ox.VideoPlayer({
            audioTrack: self.options.audioTrack,
            censored: self.options.censored,
            censoredIcon: self.options.censoredIcon,
            censoredTooltip: self.options.censoredTooltip,
            duration: self.options.duration,
            height: self.tileHeight,
            muted: self.options.muted,
            paused: self.options.paused,
            position: self.options.position,
            scaleToFill: true,
            video: self.options.video,
            width: self.videoWidth
        })
        .bindEvent({
            censored: function() {
                that.triggerEvent('censored');
            },
            ended: function() {
                togglePaused(true);
            },
            playing: function(data) {
                self.options.position = data.position;
                setPosition(true);
            }
        })
        .appendTo(self.$videoBox);

    $('<div>')
        .addClass('OxFrameInterface OxVideoInterface')
        .css({
            position: 'absolute',
            left: 0,
            top: 0,
            width: self.videoWidth + 'px',
            height: self.tileHeight + 'px'
        })
        .appendTo(self.$videoBox);

    self.$tooltip = Ox.Tooltip({
            animate: false
        })
        .css({
            textAlign: 'center'
        });

    setTimeout(function() {
        scrollToPosition();
    });

    function addLine(i) {
        self.$lines[i] = $('<div>')
            .css({
                position: 'absolute',
                left: self.margin + 'px',
                top: self.margin / 2 + i * (self.tileHeight + self.margin) + 'px',
                width: self.contentWidth + 'px',
                height: self.tileHeight + self.margin + 'px',
                overflowX: 'hidden'
            })
            .appendTo(self.$timelinePlayer);
        self.$timelines[i] = [
            self.$timeline.clone(true)
                .css({
                    width: self.frame + self.videoWidth + 'px',
                    marginLeft: -i * self.contentWidth + 'px'
                }),
            self.$timeline.clone(true)
                .css({
                    marginLeft: -i * self.contentWidth + self.videoWidth - 1 + 'px'
                })
        ];
        self.$lines[i]
            .append(self.$timelines[i][1])
            .append(self.$timelines[i][0]);
    }

    function changeVolume(num) {
        self.options.volume = Ox.limit(self.options.volume + num, 0, 1);
        setVolume();
    }

    function formatPosition(position) {
        position = Ox.isUndefined(position) ? self.options.position : position;
        return Ox.formatDuration(position, self.options.showMilliseconds);
    }

    function getLines(scrollbarIsVisible) {
        // Returns the number of lines
        var lines;
        if (scrollbarIsVisible) {
            self.contentWidth -= Ox.UI.SCROLLBAR_SIZE;
        }
        lines = Math.ceil(
            (self.frames - 1 + self.videoWidth) / self.contentWidth
        );
        return !scrollbarIsVisible && lines * (
                self.tileHeight + self.margin
            ) + self.margin > self.contentHeight ? getLines(true) : lines;
    }

    function getPosition(e) {
        return (
            e.offsetX ? e.offsetX
            : e.clientX - $(e.target).offset().left
        ) / self.fps;
    }

    function getPositionScrollTop() {
        // Returns the target scrolltop if the player is not fully visible,
        // otherwise returns null
        var scrollTop = self.$timelinePlayer.scrollTop(),
            videoTop = [
                self.margin + Ox.min(self.videoLines) * (self.tileHeight + self.margin),
                self.margin + Ox.max(self.videoLines) * (self.tileHeight + self.margin)
            ],
            offset = self.contentHeight - self.tileHeight - self.margin;
        return videoTop[0] < scrollTop + self.margin ? videoTop[0] - self.margin
            : videoTop[1] > scrollTop + offset ? videoTop[1] - offset
            : null;
    }

    function getSmallTimeline() {
        var $timeline = Ox.SmallVideoTimeline({
                duration: self.options.duration,
                imageURL: self.options.smallTimelineURL,
                mode: 'player',
                paused: self.options.paused,
                position: self.options.position,
                showMilliseconds: self.options.showMilliseconds,
                width: getSmallTimelineWidth()
            })
            .css({float: 'left'})
            .css({background: '-moz-linear-gradient(top, rgba(0, 0, 0, 0.5), rgba(64, 64, 64, 0.5))'})
            .css({background: '-o-linear-gradient(top, rgba(0, 0, 0, 0.5), rgba(64, 64, 64, 0.5))'})
            .css({background: '-webkit-linear-gradient(top, rgba(0, 0, 0, 0.5), rgba(64, 64, 64, 0.5))'})
            .bindEvent({
                position: function(data) {
                    self.options.position = data.position;
                    setPosition();
                    that.triggerEvent('position', {
                        position: self.options.position
                    });
                }
            });
        $timeline.children().css({marginLeft: '32px'});
        $timeline.find('.OxInterface').css({marginLeft: '32px'});
        return $timeline;
    }

    function getSmallTimelineWidth() {
        return self.options.width - 32 - self.positionWidth;
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

    function getVideoLine() {
        self.videoLine = Math.floor(getVideoFrame() / self.contentWidth);
    }

    function getVideoLines() {
        // Returns the lines the video is at, as an array of two line numbers.
        // If the video fits in one line, they're both the same, otherwise, the
        // line that has most of the video (and thus the player) comes first.
        var videoFrame = getVideoFrame(),
            videoLeft = videoFrame % self.contentWidth,
            lines = [];
        lines[0] = Math.floor(videoFrame / self.contentWidth);
        lines[1] = lines[0] + (
            videoLeft + self.videoWidth > self.contentWidth ? 1 : 0
        )
        if (videoLeft + Math.floor(self.videoWidth / 2) > self.contentWidth) {
            lines.reverse();
        }
        return lines;
    }

    function getVideoFrame() {
        return Math.floor(self.options.position * self.fps);
    }

    function mousedown(e) {
        var $target = $(e.target),
            isTimeline = $target.is('.OxTimelineInterface'),
            isVideo = $target.is('.OxFrameInterface');
        if (isTimeline) {
            self.options.position = getPosition(e);
            setPosition();
            if (!self.triggered) {
                that.triggerEvent('position', {
                    position: self.options.position
                });
                self.triggered = true;
                setTimeout(function() {
                    self.triggered = false;
                }, 250);
            }
        } else if (isVideo) {
            togglePaused();
        }
    }

    function mouseleave() {
        self.$tooltip.hide();
    }

    function mousemove(e) {
        var $target = $(e.target),
            isTimeline = $target.is('.OxTimelineInterface'),
            isVideo = $target.is('.OxFrameInterface'),
            position, subtitle;
        if (isTimeline || isVideo) {
            position = isTimeline ? getPosition(e) : self.options.position;
            subtitle = getSubtitle(position);
            self.$tooltip.options({
                    title: (
                        subtitle
                            ? '<span class=\'OxBright\'>' + Ox.highlight(
                                subtitle.text, self.options.find, 'OxHighlight'
                            ).replace(/\n/g, '<br/>') + '</span><br/>'
                            : ''
                        ) + Ox.formatDuration(position, 3)
                })
                .show(e.clientX, e.clientY);
        } else {
            self.$tooltip.hide();
        }
    }

    function renderTimeline() {
        var $timeline = $('<div>')
            .css({
                position: 'absolute',
                width: self.frames + 'px',
                height: self.tileHeight + self.margin + 'px',
                overflow: 'hidden'
            });
        Ox.loop(self.tiles, function(i) {
            $('<img>')
                .attr({
                    src: self.options.getLargeTimelineURL(self.options.timeline, i)
                })
                .css({
                    position: 'absolute',
                    left: i * self.tileWidth + 'px',
                    top: self.margin / 2 + 'px'
                })
                .data({index: i})
                .appendTo($timeline);
        });
        $('<div>')
            .addClass('OxTimelineInterface')
            .css({
                position: 'absolute',
                left: 0,
                top: self.margin / 2 + 'px',
                width: self.frames + 'px',
                height: self.tileHeight + 'px'
            })
            .appendTo($timeline);            
        return $timeline;
    }

    function scroll() {
        updateScrollButton();
        if (!self.options.paused && self.options.followPlayer) {
            self.scrollTimeout && clearTimeout(self.scrollTimeout);
            self.scrollTimeout = setTimeout(function() {
                scrollToPosition();
                self.scrollTimeout = 0;
            }, 2500);
        }
    }

    function scrollToPosition() {
        var positionScrollTop = getPositionScrollTop();
        positionScrollTop && self.$timelinePlayer.stop().animate({
            scrollTop: positionScrollTop
        }, 250, function() {
            self.$scrollButton.hide();
        });
    }

    function setHeight() {
        self.contentHeight = self.options.height - 32;
        if (!self.options.paused && self.options.followPlayer) {
            self.scrollTimeout && clearTimeout(self.scrollTimeout);
            scrollToPosition();
        }
    }

    function setPosition(fromVideo) {
        var isPlaying = !self.options.paused,
            max, min, videoLines, videoLines_;
        self.options.position = Ox.limit(self.options.position, 0, self.options.duration);
        self.frame = Math.floor(self.options.position * self.fps);
        videoLines = getVideoLines();
        // current and previous video lines
        videoLines_ = Ox.flatten([self.videoLines, videoLines]);
        min = Ox.min(videoLines_);
        max = Ox.max(videoLines_);
        Ox.loop(min, max + 1, function(i) {
            self.$timelines[i][0].css({
                width: self.frame + self.videoWidth + 'px'
            });
        });
        if (videoLines[1] != self.videoLines[1]) {
            // move frame to new line
            self.$frameBox.detach().appendTo(self.$timelines[videoLines[1]][0]);
        }
        if (videoLines[0] != self.videoLines[0]) {
            // move video to new line
            isPlaying && self.$video.togglePaused();
            self.$videoBox.detach().appendTo(self.$timelines[videoLines[0]][0]);
            isPlaying && self.$video.togglePaused();
        }
        if (videoLines[0] != videoLines[1]) {
            // if the player spans two lines, update the frame
            // (but only once per second if the video is playing)
            self.$frame.options({
                position: self.paused
                    ? self.options.position
                    : Math.floor(self.options.position)
            });
        }
        if (
            fromVideo && !self.scrollTimeout
            && videoLines[1] != self.videoLines[1]
            && videoLines[1] > videoLines[0]
        ) {
            // if the video is moving, the user has not scrolled away
            // and the video has reached a line break, then either
            // follow the video or update the scroll button
            self.videoLines = videoLines;
            self.options.followPlayer ? scrollToPosition() : updateScrollButton();
        } else {
            self.videoLines = videoLines;
        }
        if (!fromVideo) {
            self.$video.options({position: self.options.position});
            self.$frame.options({position: self.options.position});           
            scrollToPosition();
        }
        self.$smallTimeline.options({position: self.options.position});
        self.$position.html(formatPosition());
        that.triggerEvent(fromVideo ? 'playing' : 'position', {
            position: self.options.position
        });
    }

    function setSubtitles() {
        self.$timeline.find('.OxSubtitle').remove();
        self.$subtitles = [];
        self.options.subtitles.forEach(function(subtitle, i) {
            var found = self.options.find
                && subtitle.text.toLowerCase().indexOf(self.options.find.toLowerCase()) > -1;
            self.$subtitles[i] = $('<div>')
                .addClass('OxSubtitle' + (found ? ' OxHighlight' : ''))
                .css({
                    position: 'absolute',
                    left: (subtitle['in'] * self.fps) + 'px',
                    width: (((subtitle.out - subtitle['in']) * self.fps) - 2) + 'px'
                })
                .html(Ox.highlight(
                    subtitle.text, self.options.find, 'OxHighlight'
                ))
                .appendTo(self.$timeline);
        });
    }

    function setTimeline() {
        self.$timelinePlayer.empty();
    }

    function setVolume() {
        self.$video.options({volume: self.options.volume});
        that.triggerEvent('volume', {
            volume: self.options.volume
        });
    }

    function setWidth() {
        self.contentWidth = self.options.width - 2 * self.margin;
        self.lines = getLines();
        Ox.loop(self.lines, function(i) {
            if (self.$lines[i]) {
                self.$lines[i].css({
                    width: self.contentWidth + 'px'
                });
                self.$timelines[i][0].css({
                    marginLeft: -i * self.contentWidth + 'px'
                });
                self.$timelines[i][1].css({
                    marginLeft: -i * self.contentWidth + self.videoWidth - 1 + 'px'
                });
            } else {
                addLine(i);
            }
        });
        while (self.$lines.length > self.lines) {
            self.$lines[self.$lines.length - 1].remove();
            self.$lines.pop();
            self.$timelines.pop();
        }
        Ox.last(self.$lines).css({
            height: self.tileHeight + 1.5 * self.margin + 'px'
        });
        if (!self.options.paused && self.options.followPlayer) {
            self.scrollTimeout && clearTimeout(self.scrollTimeout);
            scrollToPosition();
        }
        self.$smallTimeline.options({width: getSmallTimelineWidth()})
    }

    function submitPositionInput() {
        self.$positionInput.hide();
        self.$position.html('').show();
        self.options.position = Ox.parseDuration(self.$positionInput.value());
        setPosition();
        if (self.playOnSubmit) {
            togglePaused();
            self.playOnSubmit = false;
        }
        that.triggerEvent('position', {
            position: self.options.position
        });
    }

    function toggleMuted() {
        self.options.muted = !self.options.muted;
        self.$video.options({muted: self.options.muted});
        self.$muteButton.options({
            title: self.options.muted ? 'unmute' : 'mute',
            tooltip: self.options.muted ? Ox._('Unmute') : Ox._('Mute')
        });
        that.triggerEvent('muted', {
            muted: self.options.muted
        });
    }

    function togglePaused(fromVideo) {
        self.options.paused = !self.options.paused;
        if (!self.options.paused && self.options.followPlayer) {
            self.scrollTimeout && clearTimeout(self.scrollTimeout);
            scrollToPosition();
        }
        !fromVideo && self.$video.options({
            paused: self.options.paused
        });
        self.$playButton.options({
            title: self.options.paused ? 'play' : 'pause'
        });
    }

    function updateScrollButton() {
        var scrollTop = self.$timelinePlayer.scrollTop(),
            positionScrollTop = getPositionScrollTop();
        if (positionScrollTop === null) {
            self.$scrollButton.hide();
        } else {
            self.$scrollButton.options({
                title: positionScrollTop < scrollTop ? 'arrowUp' : 'arrowDown'
            }).show();
        }
    }

    function updateTimeline() {
        self.$timelinePlayer.find('img').each(function() {
            var $this = $(this);
            $this.data('index') && $this.attr({
                src: self.options.getLargeTimelineURL(
                    self.options.timeline, $this.data('index')
                )
            });
        });
    }

    /*@
    togglePaused <f> toggle paused 
        () -> <o>  toggle paused
    @*/
    that.togglePaused = function() {
        togglePaused();
        return that;
    };

    return that;

};
