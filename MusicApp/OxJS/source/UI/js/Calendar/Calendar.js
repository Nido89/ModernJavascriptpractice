'use strict';

/*@
Ox.Calendar <f> Basic calendar object
    ([options[, self]]) -> <o:Ox.Element> Calendar object
        select <!> select
    options <o> Options object
        date    <d|new Date()> UTC Date on which the calendar is centered
        events  <[o]|[]> Event objects to be displayed
            alternativeNames <[s]> Array of alternative names
            end              <s> End of the event (UTC Date, as string)
            id               <s> Id of the event
            name             <s> Name of the event
            start            <s> Start of the event (UTC Date, as string)
            type             <s> Type of the event (like "person")
        height  <n|256> Height in px
        range   <[n]|[1000, 3000]> Start and end year of the calendar
        selected <s|''> Id of the selected event
        width   <n|256> Width in px
        zoom    <n|8> Initial zoom level
    self    <o> Shared private variable
@*/

// Fixme: switch to UTC
// Fixme: create a variable-resolution event type (with end that is _inclusive_)

Ox.Calendar = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({
            date: new Date(),
            events: [],
            height: 256,
            range: [1000, 3000],
            selected: '',
            showControls: false,
            showToolbar: false,
            showTypes: ['date', 'place', 'person', 'other'],
            showZoombar: false,
            width: 256,
            zoom: 8,
            zoomOnlyWhenFocused: false
        })
        .options(options || {})
        .update({
            date: function() {
                // ...
            },
            events: function() {
                self.options.events.forEach(function(event) {
                    event = getEventData(event);
                });
                self.$lines = [];
                getLines();
                renderCalendar();
                if (self.options.selected) {
                    selectEvent(
                        getSelectedEvent() ? self.options.selected : ''
                    );
                }
            },
            height: function() {
                that.css({height: self.options.height + 'px'});
            },
            selected: function() {
                var selected = self.options.selected;
                // deselect would not work if self.options.selected was already empty
                self.options.selected = 'FIXME: THIS IS A VERY UGLY HACK';
                selectEvent(selected);
            },
            width: function() {
                that.css({width: self.options.width + 'px'});
                self.options.showZoombar && self.$zoomInput.options({size: self.options.width});
                renderOverlay();
                //getLines();
            },
            zoom: function() {
                // ...
            }
        })
        .addClass('OxCalendar')
        /*
        .css({
            width: self.options.width + 'px',
            height: self.options.height + 'px'
        })
        */
        .bindEvent({
            key_0: function() {
                panToSelected();
            },
            key_down: function() {
                scrollBy(1);
            },
            key_equal: function() {
                zoomBy(1);
            },
            key_escape: function() {
                selectEvent('');
            },
            key_left: function() {
                panBy(-self.$content.width() / 2 * getSecondsPerPixel() * 1000);
            },
            key_minus: function() {
                zoomBy(-1);
            },
            key_right: function() {
                panBy(self.$content.width() / 2 * getSecondsPerPixel() * 1000);
            },
            key_shift_0: function() {
                zoomToSelected();
            },
            key_shift_down: function() {
                scrollTo(1000000, true);
            },
            key_shift_up: function() {
                scrollTo(0, true);
            },
            key_up: function() {
                scrollBy(-1);
            },
            mousedown: function(e) {
                !$(e.target).is('.OxInput') && that.gainFocus();
            }
        });

    self.options.events.forEach(function(event) {
        event = getEventData(event);
    });

    self.maxZoom = 32;
    self.minLabelWidth = 80;

    /*
    We need to iterate over irregular intervals, like months or years.
    The idea is to put this logic into a data structure, the units.
    Just like the 0-th second is 1970-01-01 00:00:00, the 0th month
    is 1970-01, or the 0-th century is the 20th century.
    A month unit, for example, has the following properties:
    - seconds: average number of seconds (used to compute width at zoom)
    - date: returns the start date of the index-th month
    - name: returns a string representation of the index-th month
    - value: returns the month index for a given date
    */
    self.units = [
        {
            id: 'millennium',
            seconds: 365242.5 * 86400,
            date: function(i) {
                return Ox.parseDate((i + 1) * 1000, true);
            },
            name: function(i) {
                return i > -2
                    ? Ox._('{0} Millennium', [Ox.formatOrdinal(i + 2)])
                    : Ox._('{0} Millennium BC', [Ox.formatOrdinal(-i - 1)])
            },
            value: function(date) {
                return Math.floor(date.getUTCFullYear() / 1000) - 1;
            }
        },
        {
            id: 'century',
            seconds: 36524.25 * 86400,
            date: function(i) {
                return Ox.parseDate((i + 19) * 100, true);
            },
            name: function(i) {
                return i > -20
                    ? Ox._('{0} Century', [Ox.formatOrdinal(i + 20)])
                    : Ox._('{0} Century BC', [Ox.formatOrdinal(-i - 19)])
            },
            value: function(date) {
                return Math.floor(date.getUTCFullYear() / 100) - 19;
            }
        },
        {
            id: 'decade',
            seconds: 3652.425 * 86400,
            date: function(i) {
                return Ox.parseDate((i + 197) * 10, true);
            },
            name: function(i) {
                return i > -198
                    ? (i + 197) + '0s'
                    : (-i - 198) + '0s BC';
            },
            value: function(date) {
                return Math.floor(date.getUTCFullYear() / 10) - 197;
            }
        },
        {
            id: 'year',
            seconds: 365.2425 * 86400,
            date: function(i) {
                return Ox.parseDate(i + 1970, true);
            },
            name: function(i) {
                return Ox.formatDate(Ox.parseDate(i + 1970, true), '%x', true);
            },
            value: function(date) {
                return date.getUTCFullYear() - 1970;
            }
        },
        {
            id: 'month',
            seconds: 365.2425 / 12 * 86400,
            date: function(i) {
                return Ox.parseDate(
                    (Math.floor(i / 12) + 1970) + '-' + (Ox.mod(i, 12) + 1), true
                );
            },
            name: function(i) {
                return Ox.formatDate(Ox.parseDate(
                    (Math.floor(i / 12 + 1970)) + '-' + (Ox.mod(i, 12) + 1), true
                ), '%b %x', true);
            },
            value: function(date) {
                return (date.getUTCFullYear() - 1970) * 12 + date.getUTCMonth();
            }
        },
        {
            id: 'week',
            seconds: 7 * 86400,
            date: function(i) {
                return new Date((i * 7 - 3) * 86400000);
            },
            name: function(i) {
                return Ox.formatDate(new Date((i * 7 - 3) * 86400000), '%a, %b %e', true);
            },
            value: function(date) {
                return Math.floor((date / 86400000 + 4) / 7);
            }
        },
        {
            id: 'day',
            seconds: 86400,
            date: function(i) {
                return new Date(i * 86400000);
            },
            name: function(i) {
                return Ox.formatDate(new Date(i * 86400000), '%b %e, %x', true);
            },
            value: function(date) {
                return Math.floor(date / 86400000);
            }
        },
        {
            id: 'six_hours',
            seconds: 21600,
            date: function(i) {
                return new Date(i * 21600000);
            },
            name: function(i) {
                return Ox.formatDate(new Date(i * 21600000), '%b %e, %H:00', true);
            },
            value: function(date) {
                return Math.floor(date / 21600000);
            }
        },
        {
            id: 'hour',
            seconds: 3600,
            date: function(i) {
                return new Date(i * 3600000);
            },
            name: function(i) {
                return Ox.formatDate(new Date(i * 3600000), '%b %e, %H:00', true);
            },
            value: function(date) {
                return Math.floor(date / 3600000);
            }
        },
        {
            id: 'five_minutes',
            seconds: 300,
            date: function(i) {
                return new Date(i * 300000);
            },
            name: function(i) {
                return Ox.formatDate(new Date(i * 300000), '%b %e, %H:%M', true);
            },
            value: function(date) {
                return Math.floor(date / 300000);
            }
        },
        {
            id: 'minute',
            seconds: 60,
            date: function(i) {
                return new Date(i * 60000);
            },
            name: function(i) {
                return Ox.formatDate(new Date(i * 60000), '%b %e, %H:%M', true);
            },
            value: function(date) {
                return Math.floor(date / 60000);
            }
        },
        {
            id: 'five_seconds',
            seconds: 5,
            date: function(i) {
                return new Date(i * 5000);
            },
            name: function(i) {
                return Ox.formatDate(new Date(i * 5000), '%H:%M:%S', true);
            },
            value: function(date) {
                return Math.floor(date / 5000);
            }
        },
        {
            id: 'second',
            seconds: 1,
            date: function(i) {
                return new Date(i * 1000);
            },
            name: function(i) {
                return Ox.formatDate(new Date(i * 1000), '%H:%M:%S', true);
            },
            value: function(date) {
                return Math.floor(date / 1000);
            }
        }
    ];

    if (self.options.showToolbar) {

        self.$toolbar = Ox.Bar({
                size: 24
            })
            .appendTo(that);

        self.$menu = Ox.Select({
                items: [
                    {id: 'date', title: Ox._('Show Dates')},
                    {id: 'place', title: Ox._('Show Places')},
                    {id: 'person', title: Ox._('Show People')},
                    {id: 'other', title: Ox._('Show Other')}
                ],
                max: -1,
                min: 1,
                title: 'set',
                type: 'image',
                value: self.options.showTypes
            })
            .css({float: 'left', margin: '4px'})
            .bindEvent({
                change: function(data) {
                    self.options.showTypes = data.value;
                    getLines();
                    renderCalendar();
                }
            })
            .appendTo(self.$toolbar);

        self.$dateInput = Ox.Input({
                clear: true,
                //placeholder: 'Date',
                value: Ox.formatDate(self.options.date, '%Y-%m-%d %H:%M:%S', true),
                width: 160
            })
            .css({float: 'right', margin: '4px'})
            .bindEvent({
                change: function(data) {
                    panTo(Ox.parseDate(data.value, true))
                }
            })
            .appendTo(self.$toolbar);

    }

    self.$scalebar = Ox.Element()
        .addClass('OxTimeline')
        .css({
            posision: 'absolute',
            top: (self.options.showToolbar * 24) + 'px'
        })
        .bindEvent({
            dragstart: dragstart,
            drag: drag,
            dragpause: dragpause,
            dragend: dragend,
            singleclick: singleclick
        })
        .appendTo(that);

    self.$container = Ox.Element()
        .addClass('OxCalendarContainer')
        .css({
            top: (self.options.showToolbar * 24) + 16 + 'px',
            bottom: (self.options.showZoombar * 16) + 16 + 'px'
        })
        .on({
            mouseleave: mouseleave,
            mousemove: mousemove,
            mousewheel: mousewheel
        })
        .bindEvent({
            doubleclick: doubleclick,
            dragstart: dragstart,
            drag: drag,
            dragpause: dragpause,
            dragend: dragend,
            singleclick: singleclick
        })
        .appendTo(that);

    self.$content = Ox.Element()
        .addClass('OxCalendarContent')
        .appendTo(self.$container);

    self.$background = Ox.Element()
        .addClass('OxBackground')
        .appendTo(self.$content);

    self.$scrollbar = Ox.Element()
        .addClass('OxTimeline')
        .css({
            posision: 'absolute',
            bottom: (self.options.showZoombar * 16) + 'px'
        })
        .appendTo(that);

    if (self.options.showZoombar) {

        self.$zoombar = Ox.Element()
            .css({
                position: 'absolute',
                bottom: 0,
                height: '16px'
            })
            .appendTo(that);

        self.$zoomInput = Ox.Range({
                arrows: true,
                changeOnDrag: true,
                max: self.maxZoom,
                min: 0,
                size: self.options.width,
                thumbSize: 32,
                thumbValue: true,
                value: self.options.zoom
            })
            .bindEvent({
                change: changeZoom
            })
            .appendTo(self.$zoombar);

    }

    self.$controls = {
        center: Ox.Button({
                title: 'center',
                type: 'image'
            })
            .addClass('OxCalendarControl OxCalendarButtonCenter')
            .css({bottom: 40 + (self.options.showZoombar * 16) + 'px'})
            .bindEvent({
                singleclick: function() {
                    // ... FIXME: implement
                },
                doubleclick: function() {
                    // ... FIXME: implement
                }
            })
            .appendTo(that),
        down: Ox.Button({
                title: 'down',
                type: 'image'
            })
            .addClass('OxCalendarControl OxCalendarButtonDown')
            .css({bottom: 20 + (self.options.showZoombar * 16) + 'px'})
            .bindEvent({
                singleclick: function() {
                    scrollBy(1);
                },
                doubleclick: function() {
                    scrollTo(1000000, true);
                }
            })
            .appendTo(that),
        left: Ox.Button({
                title: 'left',
                type: 'image'
            })
            .addClass('OxCalendarControl OxCalendarButtonLeft')
            .css({bottom: 40 + (self.options.showZoombar * 16) + 'px'})
            .bindEvent({
                singleclick: function() {
                    panBy(-self.$content.width() / 2 * getSecondsPerPixel() * 1000);
                },
                doubleclick: function() {
                    // fixme: should pan to rightmost event
                    panBy(-self.$content.width() * getSecondsPerPixel() * 1000);
                }
            })
            .appendTo(that),
        right: Ox.Button({
                title: 'right',
                type: 'image'
            })
            .addClass('OxCalendarControl OxCalendarButtonRight')
            .css({bottom: 40 + (self.options.showZoombar * 16) + 'px'})
            .bindEvent({
                singleclick: function() {
                    panBy(self.$content.width() / 2 * getSecondsPerPixel() * 1000);
                },
                doubleclick: function() {
                    // fixme: should pan to rightmost event
                    panBy(self.$content.width() * getSecondsPerPixel() * 1000);
                }
            })
            .appendTo(that),
        up: Ox.Button({
                title: 'up',
                type: 'image'
            })
            .css({bottom: 60 + (self.options.showZoombar * 16) + 'px'})
            .addClass('OxCalendarControl OxCalendarButtonUp')
            .bindEvent({
                singleclick: function() {
                    scrollBy(-1);
                },
                doubleclick: function() {
                    scrollTo(0, true)
                }
            })
            .appendTo(that)
    };
    !self.options.showControls && Ox.forEach(self.$controls, function($control) {
        $control.css({opacity: 0}).hide();
    });

    self.$eventControls = {
        name: Ox.Label({
                textAlign: 'center',
                tooltip: Ox._('Click to pan, doubleclick to zoom')
            })
            .addClass('OxEventControl OxEventName')
            .css({bottom: 20 + (self.options.showZoombar * 16) + 'px'})
            .bindEvent({
                singleclick: function() {
                    panToSelected();
                },
                doubleclick: function() {
                    zoomToSelected();
                }
            })
            .appendTo(that),
        deselectButton: Ox.Button({
                title: 'close',
                tooltip: Ox._('Deselect'),
                type: 'image'
            })
            .addClass('OxEventControl OxEventDeselectButton')
            .css({bottom: 20 + (self.options.showZoombar * 16) + 'px'})
            .bindEvent({
                click: function() {
                    selectEvent('');
                }
            })
            .appendTo(that)
    };
    Ox.forEach(self.$eventControls, function($eventControl) {
        $eventControl.css({opacity: 0}).hide();
    });

    self.$tooltip = Ox.Tooltip({
            animate: false
        })
        .css({
            textAlign: 'center'
        });

    self.$lines = [];
    getLines();
    renderCalendar();

    function changeDate() {
        
    }

    function changeZoom(data) {
        self.options.zoom = data.value;
        renderCalendar();
    }

    function doubleclick(data) {
        var $target = $(data.target),
            id = $target.data('id');
        if ($target.is('.OxLine > .OxEvent')) {
            selectEvent(id, $target);
            zoomToSelected();
        } else {
            if (self.options.zoom < self.maxZoom) {
                self.options.date = new Date(
                    (+self.options.date + +getMouseDate(data)) / 2
                );
                self.options.zoom++;
            }
            renderCalendar();
        }
    }

    function dragstart(data) {
        //if ($(e.target).is(':not(.OxLine > .OxEvent)')) {
            Ox.$body.addClass('OxDragging');
            self.drag = {
                top: self.$container[0].scrollTop,
                x: data.clientX
            };
        //}
    }

    function drag(data) {
        if (self.drag) {
            ///*
            var marginLeft = data.clientX - self.drag.x,
                scrollbarFactor = getScrollbarFactor();
            self.$scalebar.css({
                marginLeft: marginLeft + 'px'
            });
            self.$content.css({
                marginLeft: marginLeft + 'px'
            });
            self.$scrollbar.css({
                marginLeft: Math.round(marginLeft / scrollbarFactor) + 'px'
            });
            scrollTo(self.drag.top - data.clientDY);
            // fixme: after dragging too far in one direction,
            // dragging in the opposite direction should work immediately
        }
    }

    function dragpause(data) {
        if (self.drag) {
            dragafter(data);
            self.drag.x = data.clientX;
        }
    }

    function dragend(data) {
        if (self.drag) {
            Ox.$body.removeClass('OxDragging');
            dragafter(data);
            self.drag = null;
        }
    }

    function dragafter(data) {
        self.$scalebar.css({marginLeft: 0});
        self.$content.css({marginLeft: 0});
        self.$scrollbar.css({marginLeft: 0});
        self.options.date = new Date(
            +self.options.date
            - (data.clientX - self.drag.x) * getSecondsPerPixel() * 1000
        );
        renderCalendar();
    }

    function dragstartScrollbar(data) {
        Ox.$body.addClass('OxDragging');
        self.drag = {x: data.clientX};
    }

    function dragScrollbar(data) {
        var marginLeft = data.clientX - self.drag.x,
            scrollbarFactor = getScrollbarFactor();
        self.$scalebar.css({
            marginLeft: (marginLeft * scrollbarFactor) + 'px'
        });
        self.$content.css({
            marginLeft: (marginLeft * scrollbarFactor) + 'px'
        });
        self.$scrollbar.css({
            marginLeft: marginLeft + 'px'
        });
    }

    function dragpauseScrollbar(data) {
        dragafterScrollbar(data);
        self.drag = {x: data.clientX};
    }

    function dragendScrollbar(data) {
        Ox.$body.removeClass('OxDragging');
        dragafterScrollbar(data);
        self.drag = null;
    }

    function dragafterScrollbar(data) {
        // fixme: duplicated
        self.$scalebar.css({marginLeft: 0});
        self.$content.css({marginLeft: 0});
        self.$scrollbar.css({marginLeft: 0});
        self.options.date = new Date(
            +self.options.date
            + (self.drag.x - data.clientX) * getSecondsPerPixel() * 1000
            * getScrollbarFactor()
        );
        renderCalendar();
    }

    function getBackgroundElements(zoom) {
        // fixme: duplicated (or at least similar to getTimelineElements)
        var $elements = [],
            units = getUnits(zoom),
            n, value, width;
        [1, 0].forEach(function(u) {
            var unit = units[u],
                value = unit.value(self.options.date),
                width = Math.round(unit.seconds * getPixelsPerSecond(zoom)),
                n = Math.ceil(self.options.width * 1.5/* * 16*/ / width);
            Ox.loop(-n, n + 1, function(i) {
                if (u == 0 || Ox.mod(value + i, 2)) {
                    $elements.push(
                        Ox.Element()
                            .addClass(
                                u == 0 ? 'line' : ''
                            )
                            .css({
                                left: getPosition(unit.date(value + i), zoom) + 'px',
                                width: (u == 0 ? 1 : width) + 'px',
                                height: self.contentHeight + 'px'
                            })
                    );
                }
            });
        });
        return $elements;
    }

    function getCalendarEvent(zoom) {
        var ms = self.options.width * getSecondsPerPixel(zoom) * 1000;
        return {
            startTime: new Date(+self.options.date - ms / 2),
            endTime: new Date(+self.options.date + ms / 2)
        };
    }

    function getEventById(id) {
        var event = null;
        Ox.forEach(self.options.events, function(v) {
            if (v.id == id) {
                event = v;
                return false; // break
            }
        });
        return event;
    }

    function getEventCenter(event) {
        return new Date(+event.startTime + getEventDuration(event) / 2);
    }

    function getEventData(event) {
        if (!event.end) {
            event.end = Ox.formatDate(new Date(), '%Y-%m-%d');
            event.current = true;
        }
        event.id = Ox.isUndefined(event.id) ? Ox.uid() : event.id;
        event.startTime = Ox.parseDate(event.start, true);
        event.endTime = Ox.parseDate(event.end, true);
        event.durationTime = event.endTime - event.startTime;
        event.rangeText = Ox.formatDateRange(event.start, event.end, true);
        event.durationText = Ox.formatDateRangeDuration(event.start, event.end, true);
        if (event.current) {
            event.rangeText = event.rangeText.split(' - ').shift() + ' - today';
        }
        return event;
    }

    function getEventDuration(event) {
        return event.endTime - event.startTime;
    }

    function getEventElement(event, zoom) {
        var left = Math.max(getPosition(event.startTime, zoom), -10000),
            paddingLeft = (event.type && left < 0 ? -left : 0),
            width = Ox.limit(getPosition(event.endTime, zoom) - left, 1, 20000) - paddingLeft;
        // selected element may be past the left edge of the screen
        if (width < 0) {
            paddingLeft = 0;
            width = getPosition(event.endTime, zoom) - left;
        }
        return Ox.Element()
            .addClass(
                'OxEvent'
                + (event.type ? ' Ox' + Ox.toTitleCase(event.type) : '' )
                + (event.current ? ' OxCurrent' : '')
                + (event.id == self.options.selected ? ' OxSelected' : '')
            )
            .css({
                left: left + 'px',
                width: width + 'px',
                paddingLeft: paddingLeft + 'px'
            })
            .data({
                id: event.id
            })
            .html('&nbsp;' + event.name + '&nbsp;')
    }

    function getEventElementById(id) {
        var $element;
        $('.OxLine > .OxEvent').each(function() {
            var $this = $(this);
            if ($this.data('id') == id) {
                $element = $this;
                return false; // break
            }
        });
        return $element;
    }

    function getEventLine(id) {
        var line = -1;
        Ox.forEach(self.lineEvents, function(events, line_) {
            if (Ox.getIndexById(events, id) > -1) {
                line = line_;
                return false; // break
            }
        });
        return line;
    }

    function getLines() {
        self.lineEvents = [];
        self.$content.find('.OxLine').remove();
        self.options.events.filter(function(event) {
            // filter out events with types not shown
            return self.options.showTypes.indexOf(event.type) > -1;
        }).sort(function(a, b) {
            // sort events (dates first, people last, longer before shorter,
            // earlier before later, otherwise alphabetically by name)
            if (a.type == 'date' && b.type != 'date') {
                return -1;
            } else if (a.type != 'date' && b.type == 'date') {
                return 1;
            } else if (a.type == 'person' && b.type != 'person') {
                return 1;
            } else if (a.type != 'person' && b.type == 'person') {
                return -1;
            } else if (a.durationTime != b.durationTime) {
                return b.durationTime - a.durationTime;
            } else if (+a.startTime != +b.startTime) {
                return a.startTime - b.startTime;
            } else {
                return a.name < b.name ? -1 : 1;
            }
        }).forEach(function(event, i) {
            var line = self.lineEvents.length;
            // traverse lines
            Ox.forEach(self.lineEvents, function(events, line_) {
                var fits = true;
                // traverse events in line
                Ox.forEach(events, function(event_) {
                    // if overlaps, check next line
                    if (overlaps(event, event_)) {
                        fits = false;
                        return false; // break
                    }
                });
                if (fits) {
                    line = line_;
                    return false; // break
                }
            });
            if (line == self.lineEvents.length) {
                self.lineEvents[line] = [];
                self.$lines[line] = Ox.Element()
                    .addClass('OxLine')
                    .css({
                        top: (line * 16) + 'px'
                    })
                    .appendTo(self.$content);
            }
            self.lineEvents[line].push(event);
        });
    }

    function getMouseDate(e) {
        return new Date(+self.options.date + (
            e.clientX - that.offset().left - self.options.width / 2 - 1
        ) * getSecondsPerPixel() * 1000);
    }

    function getOverlayWidths() {
        var width = Math.round(self.options.width / getScrollbarFactor());
        return [
            Math.floor((self.options.width - width) / 2),
            width,
            Math.ceil((self.options.width - width) / 2),
        ];
    }

    function getPixelsPerSecond(zoom) {
        return Math.pow(2, (
            !Ox.isUndefined(zoom) ? zoom : self.options.zoom
        ) - (self.maxZoom - 4));
    }

    function getPosition(date, zoom) {
        return Math.round(
            self.options.width / 2
            + (date - self.options.date) / 1000 * getPixelsPerSecond(zoom)
        );
    }

    function getScrollbarFactor() {
        return Math.pow(2, Math.min(self.options.zoom, 4));
    }

    function getSecondsPerPixel(zoom) {
        return 1 / getPixelsPerSecond(zoom);
    }

    function getSelectedEvent() {
        var event = null;
        if (self.options.selected !== '') {
            event = getEventById(self.options.selected);
        }
        return event;
    }

    function getSelectedEventElement() {
        var $element = null;
        if (self.options.selected !== '') {
            $element = getEventElementById(self.options.selected);
        }
        return $element;
    }

    function getTimelineElements(zoom) {
        var $elements = [],
            unit = getUnits(zoom)[0],
            value = unit.value(self.options.date),
            width = unit.seconds * getPixelsPerSecond(zoom),
            n = Math.ceil(self.options.width * 1.5/* * 16*/ / width);
        Ox.loop(-n, n + 1, function(i) {
            $elements.push(
                getEventElement({
                        name: unit.name(value + i),
                        startTime: unit.date(value + i),
                        endTime: unit.date(value + i + 1)
                    }, zoom)
                    .addClass(Ox.mod(value + i, 2) == 0 ? 'even' : 'odd')
            );
        });
        return $elements;
    }

    function getUnits(zoom) {
        // returns array of 2 units
        // units[0] for timeline
        // units[1] for background
        var pixelsPerSecond = getPixelsPerSecond(zoom),
            units;
        self.units.reverse();
        Ox.forEach(self.units, function(v, i) {
            var width = Math.round(v.seconds * pixelsPerSecond);
            if (width >= self.minLabelWidth) {
                units = [self.units[i], self.units[i - 1]];
                return false; // break
            }
        });
        self.units.reverse();
        return units;
    }

    function mouseleave() {
        self.$tooltip.hide();
    }

    function mousemove(e) {
        var $target = $(e.target),
            event, title;
        if ($target.is('.OxLine > .OxEvent')) {
            event = getEventById($target.data('id'));
            title = '<span class="OxBright">' + event.name + '</span><br/>'
                + (event.rangeText != event.name ? event.rangeText + '<br>' : '')
                + event.durationText;
        } else {
            title = Ox.formatDate(getMouseDate(e), '%a, %b %e, %x, %H:%M:%S', true);
        }
        self.$tooltip.options({
                title: title
            })
            .show(e.clientX, e.clientY);
    }

    function mousewheel(e, delta, deltaX, deltaY) {
        //Ox.Log('Calendar', 'mousewheel', delta, deltaX, deltaY);
        var deltaZ = 0;
        if (
            (!self.options.zoomOnlyWhenFocused || that.hasFocus())
            && !self.mousewheel
            && Math.abs(deltaY) > Math.abs(deltaX)
        ) {
            if (deltaY < 0 && self.options.zoom > 0) {
                deltaZ = -1;
            } else if (deltaY > 0 && self.options.zoom < self.maxZoom) {
                deltaZ = 1;
            }
            if (deltaZ) {
                self.options.date = deltaZ == -1
                    ? new Date(2 * +self.options.date - +getMouseDate(e))
                    : new Date((+self.options.date + +getMouseDate(e)) / 2);
                zoomBy(deltaZ);
            }
            self.mousewheel = true;
            setTimeout(function() {
                self.mousewheel = false;
            }, 250);
        }
        that.hasFocus() && e.preventDefault();
    }

    function overlaps(eventA, eventB) {
        return (
            eventA.startTime >= eventB.startTime
            && eventA.startTime < eventB.endTime
        ) || (
            eventB.startTime >= eventA.startTime
            && eventB.startTime < eventA.endTime
        );
    }

    function panBy(ms) {
        panTo(new Date(+self.options.date + ms));
    }

    function panTo(date, line) {
        var delta = Math.round(
                (date - self.options.date) / 1000 * getPixelsPerSecond()
            ),
            // 250 ms for half the width of the visible area
            ms = 250 * Math.min(
                Math.abs(delta) / (self.$content.width() / 2), 1
            );
        self.$scalebar.stop().animate({
            marginLeft: -delta + 'px'
        }, ms);
        self.$content.stop().animate({
            marginLeft: -delta + 'px'
        }, ms, function() {
            self.$scalebar.stop().css({marginLeft: 0});
            self.$content.css({marginLeft: 0});
            self.$scrollbar.stop().css({marginLeft: 0});
            self.options.date = date;
            renderCalendar();
        });
        self.$scrollbar.stop().animate({
            marginLeft: -delta / getScrollbarFactor() + 'px'
        }, ms);
        if (!Ox.isUndefined(line)) {
            scrollTo(line * 16 + 8 - self.$container.height() / 2, true);
        }
    }

    function panToSelected() {
        // fixme: '0' should zoom to selected if selected is already centered
        // (both horizontally and vertically, the latter is a bit more work)
        var event = getSelectedEvent();
        self.options.selected !== '' && panTo(
            getEventCenter(event),
            getEventLine(event.id)
        );
    }

    function renderBackground() {
        getBackgroundElements(self.options.zoom).forEach(function($element) {
            $element.appendTo(self.$background);
        });
    }

    function renderCalendar() {
        self.contentHeight = Math.max(
            self.lineEvents.length * 16,
            self.options.height - 32
                - self.options.showZoombar * 16
                - self.options.showToolbar * 24
        );
        self.$content.css({height: self.contentHeight + 'px'});
        that.find('.OxBackground').empty();
        that.find('.OxEvent').remove();
        renderBackground();
        renderTimelines();
        renderOverlay();
        renderEvents();
        self.options.showToolbar && self.$dateInput.value(
            Ox.formatDate(self.options.date, '%Y-%m-%d %H:%M:%S', true)
        );
    }

    function renderEvents() {
        var calendarEvent = getCalendarEvent(),
            height;
            //types = ['date', 'place', 'person', 'other'];
        self.lineEvents.forEach(function(events, line) {
            events.forEach(function(event) {
                // append if selected or visible
                if (
                    event.id == self.options.selected
                    || overlaps(event, calendarEvent)
                ) {
                    getEventElement(event).appendTo(self.$lines[line]);
                }
            });
        });
    }

    function renderOverlay() {
        var widths = getOverlayWidths();
        that.find('.OxOverlay').remove();
        Ox.Element()
            .addClass('OxOverlay')
            .css({
                bottom: (self.options.showZoombar * 16) + 'px'
            })
            .append(
                $('<div>').css({
                    width: widths[0] + 'px'
                })
            )
            .append(
                $('<div>').css({
                    left:  widths[0] + 'px',
                    width: widths[1] + 'px'
                })
            )
            .append(
                $('<div>').css({
                    left: (widths[0] + widths[1]) + 'px',
                    width: widths[2] + 'px'
                })
            )
            .bindEvent({
                dragstart: dragstartScrollbar,
                drag: dragScrollbar,
                dragpause: dragpauseScrollbar,
                dragend: dragendScrollbar
            })
            .appendTo(that);
    }

    function renderTimelines() {
        Ox.Log('Calendar', self.options.zoom, Math.max(self.options.zoom - 4, 0))
        getTimelineElements(self.options.zoom).forEach(function($element) {
            $element.appendTo(self.$scalebar.$element);
        });
        getTimelineElements(Math.max(self.options.zoom - 4, 0)).forEach(function($element) {
            $element.appendTo(self.$scrollbar.$element);
        });
    }

    function scrollBy(delta) {
        scrollTo(
            self.$container[0].scrollTop
            + delta * Math.round(self.$container.height() / 2), true
        );
    }

    function scrollTo(top, animate) {
        var containerHeight = self.$container.height(),
            scrollTop = self.$container[0].scrollTop,
            min = 0,
            max = self.contentHeight - containerHeight,
            top = Ox.limit(top, min, max),
            delta = top - scrollTop,
            ms = 250 * Math.min(Math.abs(delta) / (containerHeight / 2), 1);
        if (animate) {
            self.$container.stop().animate({
                scrollTop: top
            }, ms);
        } else {
            self.$container[0].scrollTop = top;
        }
    }

    function selectEvent(id, $element) {
        var event;
        self.$content.find('.OxSelected').removeClass('OxSelected');
        if (id) {
            self.options.selected = id;
            $element = $element || getEventElementById(id);
            $element && $element.addClass('OxSelected');
            panToSelected();
            event = Ox.getObjectById(self.options.events, id);
            setEventControls(event);
            that.triggerEvent('select', event);
        } else {
            if (self.options.selected !== '') {
                self.options.selected = '';
                setEventControls(null);
                that.triggerEvent('select', {id: ''});
            }
        }
    }

    function setEventControls(event) {
        var $eventControls = that.find('.OxEventControl'),
            isVisible = self.$eventControls.name.is(':visible');
        if (event) {
            self.$eventControls.name.options({title: event.name});
            !isVisible && $eventControls.show().animate({opacity: 1}, 250);
        } else {
            isVisible && $eventControls.animate({opacity: 0}, 250, function() {
                $eventControls.hide();
            });
        }
    }

    function singleclick(data) {
        var $target = $(data.target),
            id = $target.data('id');
        if ($target.is('.OxLine > .OxEvent')) {
            if (id == self.options.selected) {
                if (data.metaKey) {
                    selectEvent('');
                } else {
                    panToSelected();
                }
            } else {
                selectEvent(id, $target);
            }
        } else {
            selectEvent('');
            panTo(getMouseDate(data));
        }
    }

    function toggleControls() {
        // ...
    }

    function zoomBy(delta) {
        zoomTo(self.options.zoom + delta);
    }

    function zoomTo(zoom) {
        self.options.zoom = Ox.limit(zoom, 0, self.maxZoom);
        self.options.showZoombar && self.$zoomInput.value(self.options.zoom);
        renderCalendar();
    }

    function zoomToSelected() {
        if (self.options.selected !== '') {
            var event = getSelectedEvent(),
                eventDuration = getEventDuration(event),
                zoom = getZoom();
            zoom != self.options.zoom && zoomTo(zoom);
            panToSelected();
        }
        function getZoom() {
            var zoom;
            Ox.loop(self.maxZoom, 0, function(z) {
                var calendarDuration = getEventDuration(getCalendarEvent(z));
                if (calendarDuration > eventDuration) {
                    zoom = z;
                    return false; // break
                }
            });
            return zoom;
        }
    }

    /*@
    addEvent <f> addEvent
        (event) -> <o> object
    @*/
    that.addEvent = function(event) {
        event = getEventData(event);
        self.options.events.push(event);
        getLines();
        renderCalendar();
        selectEvent(event.id);
        return that;
    };

    /*@
    editEvent <f> Edit event data
        (id, key, value) -> <o> Calendar object
        {id, {key: value, ...}} -> <o> Calendar object
    @*/
    that.editEvent = function() {
        var args = Ox.slice(arguments),
            id = args.shift(),
            data = Ox.makeObject(args),
            event = Ox.getObjectById(self.options.events, id),
            $element = getEventElementById(id);
        Ox.forEach(data, function(value, key) {
            if ($element) {
                Ox.Log('Calendar', 'ELEMENT', $element, id)
                if (key == 'name') {
                    $element && $element.html('&nbsp;' + value + '&nbsp;');
                } else if (key == 'type') {
                    $element.removeClass('Ox' + Ox.toTitleCase(event[key]))
                        .addClass('Ox' + Ox.toTitleCase(value))
                } else if (key == 'end') {
                    $element[
                        value === '' ? 'addClass' : 'removeClass'
                    ]('OxCurrent');
                }
            }
            event[key] = value;
            event = getEventData(event);
            if ($element) {
                getLines();
                renderCalendar();
                panToSelected();
                setEventControls(event);
            }
        });
        return that;
    };

    /*@
    getBounds <f> get bounds
        () -> <o> object
    @*/
    that.getBounds = function() {
        return getCalendarEvent();
    };

    /*@
    panToEvent <f> pan to event
        () -> <o> object
    @*/
    that.panToEvent = function() {
        panToSelected();
        return that;
    };

    /*@
    removeEvent <f> remvoe Event
        () -> <o> object
    @*/
    that.removeEvent = function() {
        Ox.Log('Calendar', 'REMOVE ... SELF.OPTIONS', self.options)
        var index = Ox.getIndexById(self.options.events, self.options.selected);
        self.options.events.splice(index, 1);
        self.options.selected = '';
        getLines();
        renderCalendar();
        setEventControls('');
        return that;
    };

    /*@
    resizeCalendar <f> resize
        () -> <o> object
    @*/
    that.resizeCalendar = function() {
        self.options.width = that.width();
        self.options.height = that.height();
        self.options.showZoombar && self.$zoomInput.options({size: self.options.width});
        renderCalendar();
        return that;
    };

    /*@
    zoomToEvent <f> zoom to event
        () -> <o> object
    @*/
    that.zoomToEvent = function() {
        zoomToSelected();
        return that;
    };

    return that;

};
