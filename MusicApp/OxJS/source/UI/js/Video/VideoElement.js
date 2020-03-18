'use strict';

/*@
Ox.VideoElement <f> VideoElement Object
    options <o> Options object
        autoplay <b|false> autoplay
        items <a|[]> array of objects with src,in,out,duration
        loop <b|false> loop playback
        playbackRate <n|1> playback rate
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.Element> VideoElement Object
        loadedmetadata <!> loadedmetadata
        itemchange <!> itemchange
        seeked <!> seeked
        seeking <!> seeking
        sizechange <!> sizechange
        ended <!> ended
@*/

(function() {
    var queue = [],
        queueSize = 100,
        restrictedElements = [],
        requiresUserGesture = mediaPlaybackRequiresUserGesture(),
        unblock = [];

Ox.VideoElement = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({
            autoplay: false,
            loop: false,
            playbackRate: 1,
            items: []
        })
        .options(options || {})
        .update({
            items: function() {
                self.loadedMetadata = false;
                loadItems(function() {
                    self.loadedMetadata = true;
                    var update = true;
                    if (self.currentItem >= self.numberOfItems) {
                        self.currentItem = 0;
                    }
                    if (!self.numberOfItems) {
                        self.video.src = '';
                        that.triggerEvent('durationchange', {
                            duration: that.duration()
                        });
                    } else {
                        if (self.currentItemId != self.items[self.currentItem].id) {
                            // check if current item is in new items
                            self.items.some(function(item, i) {
                                if (item.id == self.currentItemId) {
                                    self.currentItem = i;
                                    loadNextVideo();
                                    update = false;
                                    return true;
                                }
                            });
                            if (update) {
                                self.currentItem = 0;
                                self.currentItemId = self.items[self.currentItem].id;
                            }
                        }
                        if (!update) {
                            that.triggerEvent('seeked');
                            that.triggerEvent('durationchange', {
                                duration: that.duration()
                            });
                        } else {
                            setCurrentVideo(function() {
                                that.triggerEvent('seeked');
                                that.triggerEvent('durationchange', {
                                    duration: that.duration()
                                });
                            });
                        }
                    }
                });
            },
            playbackRate: function() {
                self.video.playbackRate = self.options.playbackRate;
            }
        })
        .css({width: '100%', height: '100%'});

    Ox.Log('Video', 'VIDEO ELEMENT OPTIONS', self.options);

    self.currentItem = 0;
    self.currentTime = 0;
    self.currentVideo = 0;
    self.items = [];
    self.loadedMetadata = false;
    self.paused = true;
    self.seeking = false;
    self.loading = true;
    self.buffering = true;
    self.$videos = [getVideo(), getVideo()];
    self.$video = self.$videos[self.currentVideo];
    self.video = self.$video[0];
    self.volume = 1;
    self.$brightness = $('<div>').css({
            width: '100%',
            height: '100%',
            background: 'rgb(0, 0, 0)',
            opacity: 0
        })
        .appendTo(that);
    self.timeupdate = setInterval(function() {
        if (!self.paused
            && !self.loading
            && self.loadedMetadata
            && self.items[self.currentItem]
            && self.items[self.currentItem].out
            && self.video.currentTime >= self.items[self.currentItem].out) {
            setCurrentItem(self.currentItem + 1);
        }
    }, 30);

    // mobile browsers only allow playing media elements after user interaction
    if (restrictedElements.length > 0) {
        unblock.push(setSource);
        setTimeout(function() {
            that.triggerEvent('requiresusergesture');
        })
    } else {
        setSource();
    }

    function getCurrentTime() {
        var item = self.items[self.currentItem];
        return self.seeking || self.loading
            ? self.currentTime
            : item ? item.position + self.video.currentTime - item['in'] : 0;
    }

    function getset(key, value) {
        var ret;
        if (Ox.isUndefined(value)) {
            ret = self.video[key];
        } else {
            self.video[key] = value;
            ret = that;
        }
        return ret;
    }

    function getVideo() {
        return getVideoElement()
            .css({position: 'absolute'})
            .on({
                ended: function() {
                    if (self.video == this) {
                        setCurrentItem(self.currentItem + 1);
                    }
                },
                loadedmetadata: function() {
                    // metadata loaded in loadItems
                },
                progress: function() {
                    // stop buffering if buffered to end point
                    if (self.video == this && self.buffering) {
                        var item = self.items[self.currentItem];
                        Ox.range(self.video.buffered.length).forEach(function(i) {
                            if (self.video.buffered.start(i) <= item['in']
                                && self.video.buffered.end(i) >= item.out) {
                                self.video.preload = 'none';
                                self.buffering = false;
                            }
                        });
                    }
                },
                seeking: function() {
                    //seeking event triggered in setCurrentTime
                },
                stop: function() {
                    if (self.video == this) {
                        self.video.pause();
                        that.triggerEvent('ended');
                    }
                }
            })
            .attr({
                preload: 'auto'
            })
            .hide()
            .appendTo(that);
    }

    function getVideoElement() {
        var video;
        if (requiresUserGesture) {
            if (queue.length) {
                video = queue.pop();
            } else {
                video = document.createElement('video');
                restrictedElements.push(video);
            }
        } else {
            video = document.createElement('video');
        }
        return $(video);
    };

    function getVolume() {
        var volume = 1;
        if (self.items[self.currentItem] && Ox.isNumber(self.items[self.currentItem].volume)) {
            volume = self.items[self.currentItem].volume;
        }
        return self.volume * volume;
    }


    function isReady($video, callback) {
        if ($video[0].seeking && !self.paused && !self.seeking) {
            that.triggerEvent('seeking');
            Ox.Log('Video', 'isReady', 'seeking');
            $video.one('seeked', function(event) {
                Ox.Log('Video', 'isReady', 'seeked');
                that.triggerEvent('seeked');
                callback($video[0]);
            });
        } else if ($video[0].readyState) {
            callback($video[0]);
        } else {
            that.triggerEvent('seeking');
            $video.one('loadedmetadata', function(event) {
                callback($video[0]);
            });
            $video.one('seeked', function(event) {
                that.triggerEvent('seeked');
            });
        }
    }

    function loadItems(callback) {
        var currentTime = 0,
            items = self.options.items.map(function(item) {
                return Ox.isObject(item) ? Ox.clone(item, true) : {src: item};
            });
        Ox.serialForEach(items,
            function(item) {
                var callback = Ox.last(arguments);
                item['in'] = item['in'] || 0;
                item.position = currentTime;
                if (item.out) {
                    item.duration = item.out - item['in'];
                }
                if (item.duration) {
                    if (!item.out) {
                        item.out = item.duration;
                    }
                    currentTime += item.duration;
                    item.id = getId(item);
                    callback()
                } else {
                    Ox.getVideoInfo(item.src, function(info) {
                        item.duration = info.duration;
                        if (!item.out) {
                            item.out = item.duration;
                        }
                        currentTime += item.duration;
                        item.id = getId(item);
                        callback();
                    });
                }
            },
            function() {
                self.items = items;
                self.numberOfItems = self.items.length;
                callback && callback();
            }
        );
        function getId(item) {
            return item.id || item.src + '/' + item['in'] + '-' + item.out;
        }
    }

    function loadNextVideo() {
        if (self.numberOfItems <= 1) {
            return;
        }
        var item = self.items[self.currentItem],
            nextItem = Ox.mod(self.currentItem + 1, self.numberOfItems),
            next = self.items[nextItem],
            $nextVideo = self.$videos[Ox.mod(self.currentVideo + 1, self.$videos.length)],
            nextVideo = $nextVideo[0];
        $nextVideo.one('loadedmetadata', function() {
            if (self.video != nextVideo) {
                nextVideo.currentTime = next['in'] || 0;
            }
        });
        nextVideo.src = next.src;
        nextVideo.preload = 'auto';
    }

    function setCurrentItem(item) {
        Ox.Log('Video', 'sCI', item, self.numberOfItems);
        var interval;
        if (item >= self.numberOfItems || item < 0) {
            if (self.options.loop) {
                item = Ox.mod(item, self.numberOfItems);
            } else {
                self.seeking = false;
                self.ended = true;
                self.paused = true;
                self.video && self.video.pause();
                that.triggerEvent('ended');
                return;
            }
        }
        self.video && self.video.pause();
        self.currentItem = item;
        self.currentItemId = self.items[self.currentItem].id;
        setCurrentVideo(function() {
            if (!self.loadedMetadata) {
                self.loadedMetadata = true;
                that.triggerEvent('loadedmetadata');
            }
            Ox.Log('Video', 'sCI', 'trigger itemchange',
                self.items[self.currentItem]['in'], self.video.currentTime, self.video.seeking);
            that.triggerEvent('sizechange');
            that.triggerEvent('itemchange', {
                item: self.currentItem
            });
        });
    }

    function setCurrentVideo(callback) {
        var css = {},
            muted = false,
            item = self.items[self.currentItem],
            next;
        Ox.Log('Video', 'sCV', item);
        ['left', 'top', 'width', 'height'].forEach(function(key) {
            css[key] = self.$videos[self.currentVideo].css(key);
        });
        self.currentTime = item.position;
        self.loading = true;
        if (self.video) {
            self.$videos[self.currentVideo].hide();
            self.video.pause();
            muted = self.video.muted;
        }
        self.currentVideo = Ox.mod(self.currentVideo + 1, self.$videos.length);
        self.$video = self.$videos[self.currentVideo];
        self.video = self.$video[0];
        self.video.muted = true; // avoid sound glitch during load
        if (self.$video.attr('src') != item.src) {
            self.loadedMetadata && Ox.Log('Video', 'caching next item failed, reset src');
            self.video.src = item.src;
            self.video.preload = 'auto';
        }
        self.video.volume = getVolume();
        self.video.playbackRate = self.options.playbackRate;
        self.$video.css(css);
        self.buffering = true;
        Ox.Log('Video', 'sCV', self.video.src, item['in'],
            self.video.currentTime, self.video.seeking);
        isReady(self.$video, function(video) {
            var in_ = item['in'] || 0;

            function ready() {
                Ox.Log('Video', 'sCV', 'ready');
                self.seeking = false;
                self.loading = false;
                self.video.muted = muted;
                !self.paused && self.video.play();
                self.$video.show();
                callback && callback();
                loadNextVideo();
            }
            if (video.currentTime == in_) {
                Ox.Log('Video', 'sCV', 'already at position');
                ready();
            } else {
                self.$video.one('seeked', function() {
                    Ox.Log('Video', 'sCV', 'seeked callback');
                    ready();
                });
                if (!self.seeking) {
                    Ox.Log('Video', 'sCV set in', video.src, in_, video.currentTime, video.seeking);
                    self.seeking = true;
                    video.currentTime = in_;
                    if (self.paused) {
                        var promise = self.video.play();
                        if (promise !== undefined) {
                            promise.then(function() {
                                self.video.pause();
                                self.video.muted = muted;
                            }).catch(function() {
                                self.video.pause();
                                self.video.muted = muted;
                            });
                        } else {
                            self.video.pause();
                            self.video.muted = muted;
                        }
                    }
                }
            }
        });
    }

    function setCurrentItemTime(currentTime) {
        Ox.Log('Video', 'sCIT', currentTime, self.video.currentTime,
            'delta', currentTime - self.video.currentTime);
        isReady(self.$video, function(video) {
            if (self.video == video) {
                if(self.video.seeking) {
                    self.$video.one('seeked', function() {
                        that.triggerEvent('seeked');
                        self.seeking = false;
                    });
                } else if (self.seeking) {
                    that.triggerEvent('seeked');
                    self.seeking = false;
                }
                video.currentTime = currentTime;
            }
        });
    }

    function setCurrentTime(time) {
        Ox.Log('Video', 'sCT', time);
        var currentTime, currentItem;
        self.items.forEach(function(item, i) {
            if (time >= item.position
                && time < item.position + item.duration) {
                currentItem = i;
                currentTime = time - item.position + item['in'];
                return false;
            }
        });
        if (self.items.length) {
            // Set to end of items if time > duration
            if (Ox.isUndefined(currentItem) && Ox.isUndefined(currentTime)) {
                currentItem = self.items.length - 1;
                currentTime = self.items[currentItem].duration + self.items[currentItem]['in'];
            }
            Ox.Log('Video', 'sCT', time, '=>', currentItem, currentTime);
            if (currentItem != self.currentItem) {
                setCurrentItem(currentItem);
            }
            self.seeking = true;
            self.currentTime = time;
            that.triggerEvent('seeking');
            setCurrentItemTime(currentTime);
        } else {
            self.currentTime = 0;
        }
    }

    function setSource() {
        Ox.Log('Video', 'self.loadedMetadata', self.loadedMetadata);
        self.loadedMetadata = false;
        loadItems(function() {
            setCurrentItem(0);
            self.options.autoplay && setTimeout(function() {
                that.play();
            });
        });
    }


    /*@
    animate <f> animate
    @*/
    that.animate = function() {
        self.$video.animate.apply(self.$video, arguments);
        return that;
    };

    /*@
    brightness <f> get/set brightness
    @*/
    that.brightness = function() {
        var ret;
        if (arguments.length == 0) {
            ret = 1 - parseFloat(self.$brightness.css('opacity'));
        } else {
            self.$brightness.css({opacity: 1 - arguments[0]});
            ret = that;
        }
        return ret;
    };

    /*@
    buffered <f> buffered
    @*/
    that.buffered = function() {
        return self.video.buffered;
    };

    /*@
    currentTime <f> get/set currentTime
    @*/
    that.currentTime = function() {
        var ret;
        if (arguments.length == 0) {
            ret = getCurrentTime();
        } else {
            self.ended = false;
            setCurrentTime(arguments[0]);
            ret = that;
        }
        return ret;
    };

    /*@
    css <f> css
    @*/
    that.css = function() {
        self.$video.css.apply(self.$video, arguments);
        return that;
    };

    /*@
    duration <f> duration
    @*/
    that.duration = function() {
        return self.items ? Ox.sum(self.items.map(function(item) {
            return item.duration;
        })) : NaN;
    };

    /*@
    muted <f> get/set muted
    @*/
    that.muted = function() {
        return getset('muted', arguments[0]);
    };

    /*@
    pause <f> pause
    @*/
    that.pause = function() {
        self.paused = true;
        self.video.pause();
        return that;
    };

    /*@
    play <f> play
    @*/
    that.play = function() {
        if (self.ended) {
            that.currentTime(0);
        }
        isReady(self.$video, function(video) {
            self.ended = false;
            self.paused = false;
            self.seeking = false;
            video.play();
        });
        return that;
    };

    that.removeElement = function() {
        self.currentTime = getCurrentTime();
        self.loading = true;
        clearInterval(self.timeupdate);
        //Chrome does not properly release resources, reset manually
        //http://code.google.com/p/chromium/issues/detail?id=31014
        self.$videos.forEach(function($video) {
            $video.attr({src: ''});
        });
        return Ox.Element.prototype.removeElement.apply(that, arguments);
    };

    /*@
    videoHeight <f> get videoHeight
    @*/
    that.videoHeight = function() {
        return self.video.videoHeight;
    };

    /*@
    videoWidth <f> get videoWidth
    @*/
    that.videoWidth = function() {
        return self.video.videoWidth;
    };

    /*@
    volume <f> get/set volume
    @*/
    that.volume = function(value) {
        if (Ox.isUndefined(value)) {
            value = self.volume
        } else {
            self.volume = value;
            self.video.volume = getVolume();
        }
        return value;
    };

    return that;

};

// mobile browsers only allow playing media elements after user interaction

    function mediaPlaybackRequiresUserGesture() {
        // test if play() is ignored when not called from an input event handler
        var video = document.createElement('video');
        video.play();
        return video.paused;
    }


    function removeBehaviorsRestrictions() {
        //Ox.Log('Video', 'remove restrictions on video', self.$video);
        if (restrictedElements.length > 0) {
            var rElements = restrictedElements;
            restrictedElements = [];
            rElements.forEach(function(video) {
                video.load();
            });
            setTimeout(function() {
                var u = unblock;
                unblock = [];
                u.forEach(function(callback) { callback(); });
            }, 1000);
        }
        while (queue.length < queueSize) {
            var video = document.createElement('video');
            video.load();
            queue.push(video);
        }
    }

    if (requiresUserGesture) {
        window.addEventListener('keydown', removeBehaviorsRestrictions);
        window.addEventListener('mousedown', removeBehaviorsRestrictions);
        window.addEventListener('touchstart', removeBehaviorsRestrictions);
    }
})();
