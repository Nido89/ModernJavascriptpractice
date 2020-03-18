'use strict';

/*@
Ox.getVideoFormat <f> Get supported video format
    (formats) -> <a> List of supported formats
    format <s> First supported format form list
@*/
Ox.getVideoFormat = function(formats) {
    var aliases = {
            mp4: 'h264',
            m4v: 'h264',
            ogv: 'ogg'
        },
        tests = {
            h264: 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
            ogg: 'video/ogg; codecs="theora, vorbis"',
            webm: 'video/webm; codecs="vp8, vorbis"'
        },
        userAgent = navigator.userAgent.toLowerCase(),
        video = document.createElement('video'),
        videoFormat;
    Ox.forEach(formats, function(format) {
        var alias = aliases[format] || format;
        if (video.canPlayType && video.canPlayType(tests[alias]).replace('no', '')) {
            // disable WebM on Safari/Perian, seeking does not work
            if (!(
                alias == 'webm' && /safari/.test(userAgent)
                && !/chrome/.test(userAgent) && !/linux/.test(userAgent)
            )) {
                videoFormat = format;
                return false; // break
            }
        }
    });
    return videoFormat;
};

/*@
Ox.getVideoInfo <f>
    url <s> video url
    callback <f> gets called with object containing duration, width, height
@*/
Ox.getVideoInfo = Ox.queue(function(url, callback) {
    // append video element to $body to work around a
    // bug in Chrome where loadedmetadata is not fired
    // reliably if video element is not in the DOM.
    Ox.Log('VIDEO', 'getVideoInfo', url);
    var video = document.createElement('video');
    video.addEventListener('loadedmetadata', function(event) {
        Ox.Log('VIDEO', 'getVideoInfo done', url);
        var info = {
            duration: this.duration,
            widht: this.videoWidth,
            height: this.videoHeight,
        };
        this.src = '';
        Ox.$(video).remove();
        video = null;
        callback(info);
    });
    video.preload = 'metadata';
    video.src = url;
    video.style.display = 'none';
    Ox.$body.append(video);
}, 4);
