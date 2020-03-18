'use strict';

/*@
Ox.AudioElement <f> AudioElement Object
@*/

Ox.AudioElement = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({
            autoplay: false,
            preload: 'none',
            src: ''
        })
        .options(options || {})
        .update({
            src: function() {
                self.audio.src = self.options.src;
            }
        });

    self.loadedMetadata = false;
    self.paused = true;
    self.$audio = $('<audio>')
        .attr({src: self.options.src})
        .on({
            ended: function() {
                that.triggerEvent('ended');
            },
            loadedmetadata: function() {
                that.triggerEvent('loadedmetadata', {
                    duration: self.audio.duration
                });
            },
            seeked: function() {
                that.triggerEvent('seeked');
            },
            seeking: function() {
                that.triggerEvent('seeking');
            }
        })
        .appendTo(that);
    self.audio = self.$audio[0];

    function getset(key, value) {
        var ret;
        if (Ox.isUndefined(value)) {
            ret = self.audio[key];
        } else {
            self.audio[key] = value;
            ret = that;
        }
        return ret;
    }

    /*@
    currentTime <f> get/set currentTime
    @*/
    that.currentTime = function() {
        var ret;
        self.ended = false;
        if (arguments.length == 0) {
            ret = self.audio.currentTime;
        } else {
            self.audio.currentTime = arguments[0];
            ret = that;
        }
        return ret;
    };

    /*@
    pause <f> pause
    @*/
    that.pause = function() {
        self.paused = true;
        self.audio.pause();
        return that;
    };

    /*@
    play <f> play
    @*/
    that.play = function() {
        if (self.ended) {
            that.currentTime(0);
            self.ended = false;
        }
        self.paused = false;
        self.audio.play();
        return that;
    };

    /*@
    src <f> get/set source
    @*/
    that.src = function() {
        var ret;
        if (arguments.length == 0) {
            ret = self.audio.src;
        } else {
            self.options.src = arguments[0];
            self.audio.src = self.options.src;
            ret = that;
        }
        return ret;
    };

    /*@
    volume <f> get/set volume
    @*/
    that.volume = function(value) {
        return getset('volume', arguments[0]);
    };

    return that;

};