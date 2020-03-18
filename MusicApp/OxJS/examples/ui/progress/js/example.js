/*
In this example, we use multiple instances of Ox.Progressbar, each with a
different set of options.
*/

Ox.load('UI', function() {

    var labelWidth = 192,
        progressWidth = 384,
        $labels = [
            Ox.Label({
                    title: 'Indeterminate progress bar',
                    width: labelWidth
                })
                .attr({id: 'label0'})
                .appendTo(Ox.$body),
            Ox.Label({
                    title: 'Progress bar with pause button',
                    width: labelWidth
                })
                .attr({id: 'label1'})
                .appendTo(Ox.$body),
            Ox.Label({
                    title: 'The status of the bar above',
                    width: labelWidth
                })
                .attr({id: 'label2'})
                .appendTo(Ox.$body),
            Ox.Label({
                    title: 'Progress bar with complete UI',
                    width: labelWidth
                })
                .attr({id: 'label3'})
                .appendTo(Ox.$body),

        ],
        $progress = [
            Ox.Progressbar({
                    progress: -1,
                    width: progressWidth
                })
                .attr({id: 'progress0'})
                .appendTo(Ox.$body),
            Ox.Progressbar({
                    showPauseButton: true,
                    width: progressWidth
                })
                .attr({id: 'progress1'})
                .bindEvent({
                    pause: function() {
                        paused = true;
                        $progress[0].options({paused: true});
                        $progress[2].options({paused: true});
                        setStatus();
                    },
                    resume: function() {
                        paused = false;
                        $progress[0].options({paused: false});
                        $progress[2].options({paused: false});
                    }
                })
                .appendTo(Ox.$body),
            Ox.Progressbar({
                    showCancelButton: true,
                    showPauseButton: true,
                    showPercent: true,
                    showRestartButton: true,
                    showTime: true,
                    showTooltips: true,
                    width: progressWidth
                })
                .attr({id: 'progress2'})
                .bindEvent({
                    cancel: function() {
                        cancelled = true;
                        $progress[0].options({cancelled: true});
                        $progress[1].options({cancelled: true});
                        setStatus();
                    },
                    complete: function() {
                        $progress[0].options({progress: 1});
                        setStatus();
                    },
                    pause: function() {
                        paused = true;
                        $progress[0].options({paused: true});
                        $progress[1].options({paused: true});
                        setStatus();
                    },
                    restart: function() {
                        cancelled = false;
                        paused = false;
                        progress = 0;
                        $progress[0].options({
                            cancelled: false,
                            paused: false
                        });
                        $progress[1].options({
                            cancelled: false,
                            paused: false,
                            progress: 0
                        });
                    },
                    resume: function() {
                        paused = false;
                        $progress[0].options({paused: false});
                        $progress[1].options({paused: false});
                    }
                })
                .appendTo(Ox.$body)
        ],
        $status = Ox.Label({
                width: progressWidth
            })
            .attr({id: 'status'})
            .appendTo(Ox.$body),
        $percent = Ox.$('<div>')
            .appendTo($status),
        $remaining = Ox.$('<div>')
            .appendTo($status),
        cancelled = false,
        paused = false,
        progress = 0,
        i = 0,
        interval = setInterval(function() {
            if (!cancelled && !paused) {
                if (i > 20 && Math.random() < 1/3) {
                    progress += 0.01;
                    $progress[1].options({progress: progress});
                    $progress[2].options({progress: progress});
                    setStatus();
                }
                if (progress >= 1) {
                    clearInterval(interval);
                }
                i++;
            }
        }, 50);

    setStatus();

    function setStatus() {
        var status = $progress[1].status();
        $percent.html(
            Math.round($progress[1].options('progress') * 100) + '%'
        );
        $remaining.html(
            cancelled ? 'Cancelled'
            : paused ? 'Paused'
            : status.remaining == 0 ? 'Complete'
            : 'Remaining: ' + (
                status.remaining == Infinity ? 'unknown'
                : Ox.formatDuration(status.remaining, 'long')
            )
        );
    }

});
