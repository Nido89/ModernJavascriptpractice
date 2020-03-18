'use strict';

/*@
Ox.AudioPlayer <f> Generic Audio Player
@*/

Ox.AudioPlayer = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({
            audio: [],
            muted: false,
            paused: false,
            position: 0,
            repeat: 0,
            shuffle: false,
            time: 'elapsed',
            track: 0,
            volume: 1,
            width: 512
        })
        .options(options || {})
        .update({
            audio: function() {
                self.options.position = -1;
                self.options.track = -1;
                that.options({
                    paused: true,
                    position: 0,
                    track: 0
                });
            },
            muted: function() {
                self.options.muted = !self.options.muted;
                toggleMuted();
            },
            paused: function() {
                self.options.paused = !self.options.paused;
                togglePaused();
            },
            position: function() {
                setPosition(self.options.position);
            },
            repeat: function() {
                setRepeat(self.options.repeat);
            },
            shuffle: function() {
                self.options.shuffle = !self.options.shuffle;
                toggleShuffle();
            },
            time: function() {
                self.options.time = self.options.time == 'elapsed'
                    ? 'remaining' : 'elapsed';
                toggleTime();
            },
            track: function() {
                setTrack(self.options.track);
            },
            volume: function() {
                setVolume(self.options.volume);
            },
            width: setSizes
        })
        .addClass('OxAudioPlayer')
        .css({width: self.options.width + 'px'})
        .bindEvent({
            key_0: toggleMuted,
            key_equal: function() {
                setVolume(Ox.min(self.options.volume + 0.1, 1));
            },
            key_minus: function() {
                setVolume(Ox.max(self.options.volume - 0.1, 0));
            },
            key_space: togglePaused
        });

    self.tracks = self.options.audio.length;
    self.volume = self.options.muted ? 1 : self.options.volume;

    self.$listButton = Ox.MenuButton({
            items: self.options.audio.slice(
                Math.max(self.options.track - 10, 0),
                Math.min(self.options.track + 11, self.tracks)
            ).map(function(track, index) {
                index += Math.max(self.options.track - 10, 0);
                return {
                    id: index.toString(),
                    title: formatTrack(track),
                    checked: index == self.options.track
                };
            }),
            maxWidth: 256,
            overlap: 'left',
            title: 'select',
            type: 'image'
        })
        .addClass('OxListButton')
        .appendTo(that);

    self.$shuffleButton = Ox.Button(
            Ox.extend({overlap: 'left', type: 'image'}, getButtonOptions('shuffle'))
        )
        .addClass('OxShuffleButton')
        .bindEvent({
            click: toggleShuffle
        })
        .appendTo(that);

    self.$repeatButton = Ox.Button(
            Ox.extend({overlap: 'left', type: 'image'}, getButtonOptions('repeat'))
        )
        .addClass('OxRepeatButton')
        .bindEvent({
            click: function() {
                setRepeat(
                    self.options.repeat == 0 ? -1
                    : self.options.repeat == -1 ? 1
                    : 0
                );
            }
        })
        .appendTo(that);

    self.$trackLabel = Ox.Label({
            textAlign: 'center',
            title: '',
        })
        .addClass('OxTrackLabel')
        .appendTo(that);

    self.$playButtons = Ox.ButtonGroup({
            buttons: [
                {
                    id: 'current',
                    title: 'playPrevious',
                    tooltip: Ox._('Play Current Track')
                },
                Ox.extend({id: 'play'}, getButtonOptions('play')),
                {
                    id: 'next',
                    title: 'playNext',
                    tooltip: Ox._('Play Next Track')
                }
            ],
            overlap: 'right',
            type: 'image',
        })
        .addClass('OxPlayButtons')
        .bindEvent({
            click: function(data) {
                if (data.id == 'current') {
                    setPosition(0);
                } else if (data.id == 'play') {
                    togglePaused();
                } else if (data.id == 'next') {
                    playNext();
                }
            }
        })
        .appendTo(that);

    self.$positionLabel = Ox.Label({
            textAlign: 'center',
            title: '00:00:00',
            tooltip: Ox._('Show Remaining Time'),
            width: 80
        })
        .addClass('OxPositionLabel')
        .bindEvent({
            anyclick: toggleTime
        })
        .appendTo(that);

    self.$positionSlider = Ox.Range({
            changeOnDrag: true,
            max: 1,
            min: 0,
            step: 0.0000001,
        })
        .addClass('OxPositionSlider')
        .bindEvent({
            change: function(data) {
                setPosition(data.value * self.duration);
            }
        })
        .appendTo(that);

    self.$muteButton = Ox.Button({
            overlap: 'right',
            title: 'mute',
            tooltip: Ox._('Mute'),
            type: 'image'
        })
        .addClass('OxMuteButton')
        .bindEvent({
            click: toggleMuted
        })
        .appendTo(that);

    self.$volumeLabel = Ox.Label({
            textAlign: 'center',
            title: '&nbsp;&nbsp;100%',
            width: 46
        })
        .addClass('OxVolumeLabel')
        .bindEvent({
            anyclick: function() {
                setVolume(1);
            }
        })
        .appendTo(that);

    self.$volumeSlider = Ox.Range({
            changeOnDrag: true,
            max: 1,
            min: 0,
            size: 116,
            step: 0.01,
            value: self.options.volume,
        })
        .addClass('OxVolumeSlider')
        .bindEvent({
            change: function(data) {
                setVolume(data.value);
            }
        })
        .appendTo(that);

    self.$audio = Ox.AudioElement({
            src: self.options.audio[self.options.track].file
        })
        .bindEvent({
            ended: function() {
                playNext();
            },
            loadedmetadata: function(data) {
                self.duration = data.duration;
            }
        })
        .appendTo(that);

    setTrack(self.options.track);

    function formatTrack(data) {
        return [
            data.name, data.artist, data.album, data.year
        ].join(' &middot; ');
    }

    function getButtonOptions(id) {
        var options;
        if (id == 'mute') {
            options = self.options.muted || self.options.volume == 0
                ? {title: 'unmute', tooltip: Ox._('Unmute')}
                : self.options.volume < 1/3
                ? {title: 'volumeUp', tooltip: Ox._('Mute')}
                : self.options.volume < 2/3
                ? {title: 'volumeDown', tooltip: Ox._('Mute')}
                : {title: 'mute', tooltip: Ox._('Mute')};
        } else if (id == 'play') {
            options = self.options.paused
                ? {title: 'play', tooltip: Ox._('Play')}
                : {title: 'pause', tooltip: Ox._('Pause')};
        } else if (id == 'repeat') {
            options = self.options.repeat == 0
                ? {title: 'repeatNone', tooltip: Ox._('Repeat All')}
                : self.options.repeat == -1
                ? {title: 'repeatAll', tooltip: Ox._('Repeat One')}
                : {title: 'repeatOne', tooltip: Ox._('Repeat None')};
        } else if (id == 'shuffle') {
            options = self.options.shuffle
                ? {title: 'shuffleAll', tooltip: Ox._('Don\'t Shuffle')}
                : {title: 'shuffleNone', tooltip: Ox._('Shuffle')};
        }
        return options;
    }

    function getNextTrack() {
        return self.options.repeat == 1 ? self.options.track
            : self.options.track < self.tracks - 1 ? self.options.track + 1
            : self.options.repeat == -1 ? 0
            : null;
    }

    function playing() {
        self.options.position = self.$audio.currentTime();
        setPosition(self.options.position, 'audio')
        that.triggerEvent('playing', {position: self.options.position});
    }

    function playNext() {
        var track = getNextTrack();
        if (track === null) {
            // ...
        } else {
            setTrack(track);
        }
    }

    function setPosition(position, from) {
        self.options.position = position;
        if (from != 'audio') {
            self.$audio.currentTime(position);
        }
        self.$positionSlider.options({
            value: position / self.duration
        });
        setTime();
    }

    function setRepeat(repeat) {
        self.options.repeat = repeat;
        self.$repeatButton.options(getButtonOptions('repeat'));
    }

    function setSizes() {
        that.css({width: self.options.width + 'px'});
        self.$trackLabel.options({width: self.options.width - 46});
        self.$positionSlider.options({size: self.options.width - 262});
        self.$positionLabel.css({left: self.options.width - 232 + 'px'});
        self.$volumeLabel.css({left: self.options.width - 46 + 'px'})
    }

    function setTime() {
        self.$positionLabel.options({
            title: Ox.formatDuration(
                self.options.time == 'elapsed'
                ? self.options.position
                : self.options.audio[self.options.track].duration
                - self.options.position
            )
        });
    }

    function setTrack(track) {
        self.options.track = track;
        self.$trackLabel.options({
            title: formatTrack(self.options.audio[track])
        });
        self.$audio.options({src: self.options.audio[self.options.track].file});
        !self.options.paused && self.$audio.play();
        that.triggerEvent('track', {track: self.options.track});
    }

    function setVolume(volume) {
        self.options.volume = volume; 
        if (volume > 0) {
            self.volume = volume;
        }
        self.$audio.volume(volume);
        self.$muteButton.options(getButtonOptions('mute'));
        self.$volumeSlider.options({value: volume});
        self.$volumeLabel.options({
            title: '&nbsp;&nbsp;' + Math.round(volume * 100) + '%'
        });
    }

    function toggleMuted() {
        self.options.muted = !self.options.muted;
        setVolume(self.options.muted ? 0 : self.volume);
    }

    function togglePaused() {
        self.options.paused = !self.options.paused;
        self.$playButtons.buttonOptions('play', getButtonOptions('play'));
        if (self.options.paused) {
            self.$audio.pause();
            clearInterval(self.playInterval);
        } else {
            self.$audio.play();
            self.playInterval = setInterval(playing, 100);
        }
        that.triggerEvent('paused', {paused: self.options.paused});
    }

    function toggleShuffle() {
        self.options.shuffle = !self.options.shuffle;
        self.$shuffleButton.options(getButtonOptions('shuffle'))
    }

    function toggleTime() {
        self.options.time = self.options.time == 'remaining'
            ? 'elapsed' : 'remaining';
        setTime();
    }

    return that;

};
