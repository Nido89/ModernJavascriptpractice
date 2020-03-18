'use strict';

/*@
Ox.Progressbar <f> Progress Bar
    options <o|{}> Options object
        cancelled <b|false> If true, progress bar is cancelled
        paused <b|false> If true, progress bar is paused
        progress <n|0> Progress, float between 0 and 1, or -1 for indeterminate
        showCancelButton <b|false> If true, show cancel button
        showPauseButton <b|false> If true, show pause button
        showPercent <b|false> If true, show progress in percent
        showRestartButton <b|false> If true, show restart button
        showTime <b|false> If true, show remaining time
        showTooltips <b|false> If true, buttons have tooltips
        width <n|256> Width in px
    self <o|{}> Shared private variable
    ([options[, self]]) -> <o:Ox.Element> Progress Bar
        cancel <!> cancelled
        complete <!> completed
        pause <!> paused
        restart <!> restart
        resume <!> resumed
@*/

Ox.Progressbar = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({
            cancelled: false,
            paused: false,
            progress: 0,
            style: 'default',
            showCancelButton: false,
            showPauseButton: false,
            showPercent: false,
            showRestartButton: false,
            showTime: false,
            showTooltips: false,
            width: 256
        })
        .options(options || {})
        .update({
            cancelled: toggleCancelled,
            paused: togglePaused,
            progress: function() {
                self.indeterminate = self.options.progress == -1;
                if (self.options.progress != -1) {
                    self.options.progress = Ox.limit(self.options.progress, 0, 1);
                }
                !self.options.paused && !self.options.cancelled && setProgress(true);
            }
        })
        .addClass('OxProgressbar' + (
            self.options.style != 'default'
            ? ' Ox' + Ox.toTitleCase(self.options.style)
            : ''
        ))
        .css({width: self.options.width - 2 + 'px'});

    self.indeterminate = self.options.progress == -1;

    self.trackWidth = self.options.width
        - self.options.showPercent * 36
        - self.options.showTime * 60
        - self.options.showPauseButton * 16
        - self.options.showCancelButton * 16;

    self.$track = $('<div>')
        .addClass('OxTrack')
        .css({
            width: self.trackWidth - 2 + 'px'
        })
        .appendTo(that);

    self.$progress = $('<div>')
        .addClass('OxProgress')
        .appendTo(self.$track);

    if (self.options.showPercent) {
        self.$percent = $('<div>')
            .addClass('OxText')
            .css({width: '36px'})
            .appendTo(that);
    }

    if (self.options.showTime) {
        self.$time = $('<div>')
            .addClass('OxText')
            .css({width: '60px'})
            .appendTo(that);
    }

    if (self.options.showPauseButton) {
        self.$pauseButton = Ox.Button({
                style: 'symbol',
                tooltip: self.options.showTooltips ? [Ox._('Pause'), Ox._('Resume')] : '',
                type: 'image',
                value: !self.options.paused ? 'pause' : 'redo',
                values: ['pause', 'redo']
            })
            .bindEvent({
                click: togglePaused
            })
            .appendTo(that);
    }

    if (self.options.showCancelButton) {
        self.$cancelButton = Ox.Button(Ox.extend({
                style: 'symbol',
                type: 'image'
            }, self.options.showRestartButton ? {
                tooltip: self.options.showTooltips ? [Ox._('Cancel'), Ox._('Restart')] : '',
                value: 'close',
                values: ['close', 'redo']
            } : {
                title: 'close',
                tooltip: self.options.showTooltips ? Ox._('Cancel') : ''
            }))
            .bindEvent({
                click: toggleCancelled
            })
            .appendTo(that);
    }

    setProgress();

    !self.options.paused && resume();

    function cancel() {
        self.options.cancelled = true;
        if (self.options.paused) {
            self.options.paused = false;
            self.$pauseButton && self.$pauseButton.toggle();
        }
        stop();
        that.triggerEvent('cancel');
    }

    function complete() {
        self.complete = true;
        stop();
        self.paused = false;
        that.triggerEvent('complete');
    }

    function pause() {
        self.pauseTime = +new Date();
        self.$progress.removeClass('OxAnimate');
        ($.browser.mozilla || $.browser.opera) && clearInterval(self.interval);
        self.$time && self.$time.html(
            self.options.cancelled ? Ox._('Cancelled') : Ox._('Paused')
        );
    }

    function restart() {
        self.options.cancelled = false;
        if (!self.indeterminate) {
            self.options.progress = 0;
        }
        delete self.startTime;
        self.$pauseButton && self.$pauseButton.options({disabled: false});
        setProgress();
        resume();
        that.triggerEvent('restart');
    }

    function resume() {
        self.startTime = !self.startTime
            ? +new Date()
            : self.startTime + +new Date() - self.pauseTime;
        self.$progress.addClass('OxAnimate');
        if ($.browser.mozilla || $.browser.opera) {
            self.offset = 0;
            self.interval = setInterval(function() {
                self.$progress.css({backgroundPosition: --self.offset + 'px 0, 0 0'})
            }, 1000 / 32);
        }
        self.$time && self.$time.html(
            self.options.progress ? Ox.formatDuration(that.status().remaining) : Ox._('unknown')
        );
    }

    function setProgress(animate) {
        self.$percent && self.$percent.html(
            Math.floor(self.options.progress * 100) + '%'
        );
        self.$time && self.$time.html(
            self.options.progress ? Ox.formatDuration(that.status().remaining) : Ox._('unknown')
        );
        self.$progress.stop().animate({
            width: Math.round(14 + Math.abs(self.options.progress) * (self.trackWidth - 16)) + 'px'
        }, animate ? 250 : 0, function() {
            self.options.progress == 1 && complete();
        });
    }

    function stop() {
        pause();
        self.$time && self.$time.html(
            self.options.cancelled ? Ox._('Cancelled') : Ox._('Complete')
        );
        if (self.$pauseButton && (self.options.cancelled || self.complete)) {
            self.$pauseButton.options({disabled: true});
        }
        if (self.$cancelButton && (self.complete || !self.options.showRestartButton)) {
            self.$cancelButton.options({disabled: true});
        }
    }

    function toggleCancelled(e) {
        if (e) {
            self.options.cancelled = !self.options.cancelled;
        } else if (self.$cancelButton) {
            self.$cancelButton.toggle();
        }
        self.options.cancelled ? cancel() : restart();
        that.triggerEvent(self.options.cancelled ? 'cancel' : 'restart');
    }

    function togglePaused(e) {
        if (e) {
            self.options.paused = !self.options.paused;
        } else if (self.$pauseButton) {
            self.$pauseButton.toggle();
        }
        self.options.paused ? pause() : resume();
        that.triggerEvent(self.options.paused ? 'pause' : 'resume');
    }

    /*@
    that.status <f> Returns time elapsed / remaining
        () -> <o> status
    @*/
    that.status = function() {
        var elapsed = +new Date() - self.startTime,
            remaining = elapsed / self.options.progress * (1 - self.options.progress);
        return {
            elapsed: Math.floor(elapsed / 1000),
            remaining: self.options.progress
                ? Math.ceil(remaining / 1000)
                : Infinity
        };
    };

    return that;

};
