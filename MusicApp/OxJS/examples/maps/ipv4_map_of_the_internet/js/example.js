/*
The code below implements a map widget to navigate a zoomable globe made of
tiled images &mdash; similar to Google Maps. The catch is that the map doesn't
show the surface of the Earth, but the Internet &mdash; instead of geographical
or political boundaries, it maps the country-wise allocation of the IPv4 address
space.

Inline comments, below, are minimal &mdash; but the maps has its own "About"
section that has more information on how it was done.
*/

'use strict';

/*
Load the UI module.
*/
Ox.load('UI', function() {

    /*
    Create a new Ox.UI widget.
    */
    Ox.IPv4Map = function(options, self) {

        self = self || {};
        var that = Ox.Element({}, self)
            .defaults({
                bookmarks: [{id: 'google.com', title: 'Google'}],
                ip: '127.0.0.1',
                lookupURL: '',
                tilesURL: '',
                zoom: 0
            })
            .options(options || {})
            .attr({id: 'map'})
            .bindEvent({
                /*
                Keyboard events trigger in case the element has focus.
                */
                key_a: function() {
                    self.$panel.selectTab('about');
                    self.$about.trigger('click');
                },
                key_comma: function() { toggleOverlay('xkcd'); },
                key_control_a: function() {
                    $('.marker').addClass('selected');
                },
                key_control_shift_a: function() {
                    $('.marker').removeClass('selected');
                },
                key_c: function() {
                    self.$panel.selectTab('controls');
                    self.$about.trigger('click');
                },
                key_delete: function() {
                    $('.marker.selected').remove();
                },
                key_dot: function() { toggleOverlay('projection'); },
                key_down: function() { panBy([0, 0.5]); },
                key_enter: function() { find(self.$find.options('value')); },
                key_equal: function() { zoomBy(1); },
                key_f: function() {
                    setTimeout(function() {
                        self.$find.focusInput();
                    });
                },
                key_i: function() { self.$about.trigger('click'); },
                key_left: function() { panBy([-0.5, 0]); },
                key_m: function() { self.$toggle.trigger('click'); },
                key_minus: function() { zoomBy(-1); },
                key_right: function() { panBy([0.5, 0]); },
                key_shift_down: function() { panBy([0, 1]); },
                key_shift_enter: function() { find(''); },
                key_shift_equal: function() { zoomBy(2); },
                key_shift_left: function() { panBy([-1, 0]); },
                key_shift_minus: function() { zoomBy(-2); },
                key_shift_right: function() { panBy([1, 0]); },
                key_shift_up: function() { panBy([0, -1]); },
                key_slash: function() { toggleOverlay('milliondollarhomepage'); },
                key_up: function() { panBy([0, -0.5]); },
                mousedown: function(e) {
                    !$(e.target).is('.OxInput') && that.gainFocus();
                }
            })
            .gainFocus();

        Ox.loop(self.maxZoom + 1, function(z) {
            that.bindEvent('key_' + z, function() {
                zoomTo(z);
            });
        });

        Ox.$window.on({
            hashchange: onHashchange,
            resize: onResize
        });

        self.hashchange = true;
        self.mapCenter = [
            Math.floor(window.innerWidth / 2),
            Math.floor(window.innerHeight / 2)
        ];
        self.maxZoom = 8;
        self.path = 'U';
        self.projection = {
            U: [[0, 2, 3, 1], 'DUUC'],
            D: [[0, 1, 3, 2], 'UDDA'],
            C: [[3, 2, 0, 1], 'ACCU'],
            A: [[3, 1, 0, 2], 'CAAD']
        };
        self.tileAreaInIPs = Math.pow(4, 16 - self.options.zoom);
        self.tileSize = 256;
        self.tileSizeInXY = Math.pow(2, 16 - self.options.zoom);
        self.xy = getXYByIP(self.options.ip);
        self.mapSize = Math.pow(2, self.options.zoom) * self.tileSize;

        /*
        Tiles layer with a dynamic tooltip that reacts to mousewheel, drag and
        click events.
        */
        self.$tiles = Ox.Element({
                tooltip: function(e) {
                    return $(e.target).is('.tile')
                        ? getIPByMouseXY(e)
                        : '';
                }
            })
            .attr({id: 'tiles'})
            .css({
                position: 'absolute',
                width: self.mapSize + 'px',
                height: self.mapSize + 'px'
            })
            .on({
                mousewheel: onMousewheel
            })
            .bindEvent({
                doubleclick: onDoubleclick,
                dragstart: function(e) {
                    onDragstart(e, false);
                },
                drag: onDrag,
                singleclick: onSingleclick,
            })
            .appendTo(that);

        /*
        About button that opens a dialog.
        */
        self.$about = Ox.Button({
                selectable: false,
                title: 'IPv4 Map of the Internet',
                width: 256
            })
            .addClass('interface')
            .attr({id: 'about'})
            .bindEvent({
                click: function() {
                    if (!self.text) {
                        Ox.get('html/about.html', function(data) {
                            self.text = data;
                            self.$text.html(data);
                            self.$dialog.open();
                        });
                    } else {
                        self.$dialog.open();
                    }
                }
            })
            .appendTo(that);

        /*
        The tabbed panel inside the about dialog.
        */
        self.$panel = Ox.TabPanel({
                content: {
                    about: Ox.Element()
                        .css({padding: '16px', overflowY: 'auto'})
                        .append(
                            self.$text = $('<div>')
                                .css({
                                    position: 'absolute',
                                    width: '256px',
                                    textAlign: 'justify'
                                })
                        )
                        .append(
                            self.$images = $('<div>')
                                .css({
                                    position: 'absolute',
                                    left: '288px',
                                    width: '256px'
                                })
                        ),
                    controls: self.$controlsPanel = Ox.Element()
                        .css({padding: '16px', overflowY: 'auto'})
                },
                tabs: [
                    {id: 'about', title: 'About', selected: true},
                    {id: 'controls', title: 'Mouse & Keyboard Controls'}
                ]
            });

        /*
        The images in the "About" section.
        */
        [
            'png/xkcd.png', 'png/projection.png', 'png/flags.png', 'png/map.png'
        ].forEach(function(image) {
            $('<a>')
                .attr({href: image, target: '_blank'})
                .append(
                    $('<img>')
                        .attr({src: image})
                        .css({width: '256px', marginBottom: '16px'})
                )
                .appendTo(self.$images);
        });

        /*
        The contents of the "Mouse & Keyboard Controls" panel.
        */
        Ox.forEach({
            'Mouse': {
                'Click': 'Pan to position / Select marker',
                'shift Click': 'Add marker to selection',
                'command Click': 'Add/remove marker to/from selection',
                'Doubleclick': 'Zoom to position',
                'Drag': 'Pan',
                'Wheel': 'Zoom to position'
            },
            'Keyboard': {
                'arrow_left arrow_right arrow_up arrow_down':
                    'Pan by half the window size',
                'shift+arrow_left shift+arrow_right shift+arrow_up shift+arrow_down':
                    'Pan by the full window size',
                '0 1 2 3 4 5 6 7 8': 'Set zoom level',
                '- =': 'Zoom by one level',
                'shift+- shift+=': 'Zoom by two levels',
                'A': 'About',
                'C': 'Mouse & Keyboard Controls',
                'F': 'Find',
                'M': 'Toggle overview map',
                ', . /': 'Toggle map overlay',
                'return': 'Pan to selected marker',
                'shift+return': 'Pan to "Me" marker',
                'control+A': 'Select all markers',
                'shift+control+A': 'Deselect all markers',
                'delete': 'Clear selected markers',
                'control+delete': 'Clear all markers'
            }
        }, function(keys, section) {
            self.$controlsPanel.append(
                $('<div>').addClass('textTitle').html(section)
            );
            Ox.forEach(keys, function(value, key) {
                self.$controlsPanel
                    .append(
                        $('<div>').addClass('textKey').html(
                            key.split(' ').map(function(key) {
                                return key.split('+').map(function(key) {
                                    return Ox.SYMBOLS[key] || key;
                                }).join('')
                            }).join(' ')
                        )
                    )
                    .append(
                        $('<div>').addClass('textValue').html(value)
                    );
            });
        });

        /*
        The dialog itself.
        */
        self.$dialog = Ox.Dialog({
                buttons: [
                    Ox.Button({
                        id: 'close',
                        title: 'Close'
                    })
                    .bindEvent({
                        click: function() {
                            self.$dialog.close();
                        }
                    })
                ],
                closeButton: true,
                content: self.$panel,
                keys: {enter: 'close', escape: 'close'},
                fixedSize: true,
                height: 288,
                title: 'IPv4 Map of the Internet',
                width: 560 + Ox.UI.SCROLLBAR_SIZE
            });

        /*
        Find element to search for host names or IP addresses, with a menu to
        select pre-defined bookmarks.
        */
        self.$findElement = Ox.FormElementGroup({
                elements: [
                    Ox.MenuButton({
                            items: [{id: '', title: 'Me'}, {}].concat(
                                self.options.bookmarks,
                                [{}, {id: 'clear', title: 'Clear Markers'}]
                            ),
                            overlap: 'right',
                            selectable: false,
                            title: 'map',
                            type: 'image'
                        })
                        .addClass('OxOverlapRight')
                        .bindEvent({
                            click: function(data) {
                                if (data.id == 'clear') {
                                    self.$tiles.$element.find('.marker').remove();
                                } else {
                                    self.$find.options({value: data.id});
                                    find(data.id);
                                }
                                that.gainFocus();
                            }
                        }),
                    self.$find = Ox.Input({
                            clear: true,
                            placeholder: 'Find host name or IP address',
                            width: 240
                        })
                        .bindEvent({
                            submit: function(data) {
                                find(data.value);
                            }
                        })
                ]
            })
            .addClass('interface')
            .attr({id: 'find'})
            .appendTo(that);

        /*
        Zoom control. 0 is the lowest zoom level, 8 is the highest.
        */
        self.$zoom = Ox.Range({
                arrows: true,
                min: 0,
                max: 8,
                size: 256,
                thumbSize: 32,
                thumbValue: true,
                value: self.options.zoom
            })
            .addClass('interface')
            .attr({id: 'zoom'})
            .bindEvent({
                change: function(data) {
                    zoomTo(data.value);
                }
            })
            .appendTo(that);

        /*
        Button that toggles the overview map.
        */
        self.$toggle = Ox.Button({
                title: 'Show Overview Map',
                width: 256
            })
            .addClass('interface')
            .attr({id: 'toggle'})
            .bindEvent({
                click: toggleWorld
            })
            .appendTo(that);

        /*
        The overview map itself, showing the entire internet.
        */
        self.$world = Ox.Element({
                tooltip: function(e) {
                    return getWorldIP(e);
                }
            })
            .attr({id: 'world'})
            .addClass('interface')
            .bindEvent({
                dragstart: function(e) {
                    onDragstart(e, true);
                },
                drag: onDrag,
                singleclick: function(e) {
                    setIP(getWorldIP(e));
                    panTo(self.xy);
                }
            })
            .append(
                $('<img>').attr({
                    src: self.options.tilesURL + '0/0.0.0.0-255.255.255.255.png'
                })
            )
            .hide()
            .appendTo(that);

        /*
        The position marker on overview map.
        */
        self.$point = Ox.Element()
            .addClass('marker')
            .appendTo(self.$world);

        /*
        Off-screen regions on overview map.
        */
        self.$regions = Ox.Element()
            .attr({id: 'regions'})
            .appendTo(self.$world);

        /*
        The regions of the overview map, 'center' being the visible area.
        */
        [
            'center', 'left', 'right', 'top', 'bottom'
        ].forEach(function(region) {
            self['$' + region] = Ox.Element()
                .addClass('region')
                .attr({id: region})
                .appendTo(self.$regions);
        });
        [
            'topleft', 'topright', 'bottomleft', 'bottomright', 'square'
        ].forEach(function(region) {
            self['$' + region] = Ox.Element()
                .addClass('region ui')
                .appendTo(self.$regions);
        });

        renderMap();
        renderMarker({host: 'Me', ip: self.options.ip});
        document.location.hash && onHashchange();

        /*
        Looks up a given host name or IP address and then, if there is a result,
        pans to its position and adds a marker.
        */
        function find(value) {
            var isHost, query = '';
            value = value.toLowerCase().replace(/\s/g, '');
            isHost = !isIP(value);
            if (value) {
                if (
                    isHost && value != 'localhost'
                    && value.indexOf('.') == -1
                ) {
                    value += '.com';
                }
                query = '&' + (isHost ? 'host' : 'ip') + '='
                    + encodeURIComponent(value);
            }
            self.$find.options({value: value});
            getJSONP(self.options.lookupURL + query, function(data) {
                if (isHost && !isIP(data.ip)) {
                    self.$find.addClass('OxError');
                } else {
                    data.host = value ? data.host : 'Me';
                    setHash(data.host);
                    setIP(data.ip);
                    panTo(self.xy, function() {
                        setHash(data.host);
                    });
                    renderMarker(data);
                }
            });
        };

        /*
        Returns an IP address for a given mouse event.
        */
        function getIPByMouseXY(e) {
            return getIPByXY(getXYByMouseXY(e));
        }

        /*
        Translates an given integer into an IP address.
        */
        function getIPByN(n) {
            return Ox.range(4).map(function(i) {
                return (Math.floor(n / Math.pow(256, 3 - i)) % 256).toString();
            }).join('.');
        }

        /*
        Returns an IP address for given XY coordinates and zoom level.
        */
        function getIPByXY(xy, zoom) {
            var n = 0, path = self.path,
                z = zoom === void 0 ? self.options.zoom : zoom;
            Ox.loop(8 + z, function(i) {
                var p2 = Math.pow(2, 7 + z - i),
                    p4 = Math.pow(4, 7 + z - i), 
                    xy_ = xy.map(function(v) {
                        return Math.floor(v / p2);
                    }),
                    q = self.projection[path][0].indexOf(xy_[0] + xy_[1] * 2);
                n += q * p4;
                xy = xy.map(function(v, i) {
                    return v - xy_[i] * p2;
                });
                path = self.projection[path][1][q];
            });
            return getIPByN(n * Math.pow(4, 8 - z));
        }

        /*
        Cached getJSONP method.
        */
        var getJSONP = Ox.cache(Ox.getJSONP, {async: true});

        /*
        Returns the marker that recieved a given click event, or null.
        */
        function getMarker(e) {
            var $target = $(e.target);
            return $target.is('.marker')
                ? ($target.is('img') ? $target.parent() : $target)
                : null;
        }

        /*
        Translates a given IP adress into an integer.
        */
        function getNByIP(ip) {
            return ip.split('.').reduce(function(prev, curr, i) {
                return prev + parseInt(curr) * Math.pow(256, 3 - i);
            }, 0);
        }

        /*
        Returns overlay image CSS, taking into account that xkcd.png has a white
        border.
        */
        function getOverlayCSS(image) {
            var src = $('#overlay').attr('src');
            image = image || (src && src.slice(4, -4));
            return image == 'xkcd' ? {
                width: 24 * Math.pow(2, self.options.zoom)
                    + self.mapSize + 'px',
                height: 24 * Math.pow(2, self.options.zoom)
                    + self.mapSize + 'px',
                margin: -12 * Math.pow(2, self.options.zoom) + 'px',
            } : {
                width: self.mapSize + 'px',
                height: self.mapSize + 'px'
            };
        }        

        /*
        Returns the IP address on the overview map for a given mouse event.
        */
        function getWorldIP(e) {
            var parts = getIPByXY([
                (e.clientX - window.innerWidth + 272),
                (e.clientY - window.innerHeight + 304)
            ], 0).split('.');
            return [parts[0], parts[1], 0, 0].join('.');
        }

        /*
        Returns XY coordinates for a given IP address.
        */
        function getXYByIP(ip) {
            var path = self.path, x = 0, y = 0, z = self.options.zoom,
                n = Math.floor(getNByIP(ip) / Math.pow(4, 8 - z));
            Ox.loop(8 + z, function(i) {
                var p2 = Math.pow(2, 7 + z - i),
                    p4 = Math.pow(4, 7 + z - i),
                    q = Math.floor(n / p4),
                    xy = self.projection[path][0][q];
                x += xy % 2 * p2;
                y += Math.floor(xy / 2) * p2;
                n -= q * p4;
                path = self.projection[path][1][q];
            });
            return [x, y];
        }

        /*
        Returns XY coordinates for a given mouse event.
        */
        function getXYByMouseXY(e) {
            var mouseXY = [e.clientX, e.clientY];
            return self.xy.map(function(v, i) {
                return v - self.mapCenter[i] + mouseXY[i];
            });
        }

        /*
        Tests if a given string is an IP address.
        */
        function isIP(str) {
            var parts = str.split('.');
            return parts.length == 4 && Ox.every(parts, function(v) {
                var n = parseInt(v);
                return n == v && n >= 0 && n < 256;
            });
        }

        /*
        Handles doubleclick events by delegating to the mousewheel handler.
        */
        function onDoubleclick(e) {
            onMousewheel(e, 0, 0, e.shiftKey ? - 1 : 1);
        }

        /*
        Handles drag events for both the main map and the overview map.
        */
        function onDrag(e) {
            var delta = [e.clientDX, e.clientDY];
            setXY(self.dragstartXY.map(function(v, i) {
                return Ox.limit(v - delta[i] * self.dragfactor, 0, self.mapSize - 1);
            }));
            renderMap();
        }

        /*
        Handles dragstart events for both the main map and the overview map.
        */
        function onDragstart(e, isWorld) {
            self.dragstartXY = self.xy;
            self.dragfactor = isWorld ? -Math.pow(2, self.options.zoom) : 1
        }

        /*
        Handles hashchange events.
        */
        function onHashchange() {
            var parts;
            if (self.hashchange) {
                parts = document.location.hash.substr(1).split(',');
                if (parts[1] != self.options.zoom) {
                    zoomTo(parts[1]);
                }
                self.$find.options({value: parts[0]});
                find(parts[0]);
            }
        }

        /*
        Handles mousewheel events (zooms in or out, but maintains the position
        that the mouse is pointing at).
        */
        function onMousewheel(e, delta, deltaX, deltaY) {
            var $marker = getMarker(e),
                deltaZ = 0,
                mouseXY = getXYByMouseXY(e);
            if (!self.zooming && Math.abs(deltaY) > Math.abs(deltaX)) {
                if (deltaY < 0 && self.options.zoom > 0) {
                    deltaZ = -1;
                } else if (deltaY > 0 && self.options.zoom < self.maxZoom) {
                    deltaZ = 1;
                }
                if (deltaZ) {
                    if ($marker) {
                        setIP($marker.attr('id'));
                    } else {
                        setXY(self.xy.map(function(xy, i) {
                            return Ox.limit(
                                deltaZ == -1
                                    ? 2 * xy - mouseXY[i]
                                    : (xy + mouseXY[i]) / 2,
                                0, self.mapSize - 1
                            );
                        }));
                    }
                    zoomBy(deltaZ);
                    self.zooming = true;
                    setTimeout(function() {
                        self.zooming = false;
                    }, 50);
                }
            }
        }

        /*
        Handles window resize events.
        */
        function onResize() {
            self.mapCenter = [
                Math.floor(window.innerWidth / 2),
                Math.floor(window.innerHeight / 2)
            ];
            if (window.innerHeight < 352) {
                if (self.$world.is(':visible')) {
                    self.worldWasVisible = true;
                    self.$toggle.trigger('click');
                }
                self.$toggle.options({disabled: true});
            } else {
                self.$toggle.options({disabled: false});
                if (self.worldWasVisible) {
                    self.worldWasVisible = false;
                    self.$toggle.trigger('click');
                }
            }
            renderMap();
        }

        /*
        Handles singleclick events. Clicking on a marker selects it, but holding
        the Meta key toggles its selected state instead, and holding shift adds
        it to the current selection. Clicking on the map and holding shift adds
        a marker at that place.
        */
        function onSingleclick(e) {
            var $marker = getMarker(e), ip;
            if ($marker) {
                if (e.metaKey) {
                    $marker.toggleClass('selected');
                } else {
                    !e.shiftKey && $('.marker').removeClass('selected');
                    $marker.detach().addClass('selected').appendTo(self.$tiles);
                }
            } else {
                $('.marker.selected').removeClass('selected');
                ip = getIPByMouseXY(e);
                panTo(getXYByMouseXY(e), function() {
                    e.shiftKey && find(ip);
                });
            }
        }

        /*
        Pans the map by XY.
        */
        function panBy(xy) {
            panTo(xy.map(function(v, i) {
                return Ox.limit(self.xy[i] + v * window[
                    i == 0 ? 'innerWidth' : 'innerHeight'
                ], 0, self.mapSize - 1);
            }));
        }

        /*
        Pans the map to XY.
        */
        function panTo(xy, callback) {
            if (!self.panning) {
                self.panning = true;
                setXY(xy);
                self.$tiles.animate({
                    left: self.mapCenter[0] - self.xy[0] + 'px',
                    top: self.mapCenter[1] - self.xy[1] + 'px'
                }, 250, function() {
                    self.panning = false;
                    renderMap();
                    callback && callback();
                });
                updateWorld(true);
            }
        }

        /*
        Renders the tiles of the map.
        */
        function renderMap() {
            var halfWidth, halfHeight;
            //if (isIP(document.location.hash.substr(1).split(',')[0])) {
                setHash(self.options.ip);
            //}
            self.$tiles.css({
                left: self.mapCenter[0] - self.xy[0] + 'px',
                top: self.mapCenter[1] - self.xy[1] + 'px'
            });
            self.widthTiles = Math.floor(
                window.innerWidth / self.tileSize / 2
            ) * 2 + 3;
            self.heightTiles = Math.floor(
                window.innerHeight / self.tileSize / 2
            ) * 2 + 3;
            halfWidth = self.widthTiles / 2,
            halfHeight = self.heightTiles / 2;
            Ox.loop(-Math.floor(halfHeight), Math.ceil(halfHeight), function(dy) {
                Ox.loop(-Math.floor(halfWidth), Math.ceil(halfWidth), function(dx) {
                    var xy = [
                        self.xy[0] + dx * self.tileSize,
                        self.xy[1] + dy * self.tileSize
                    ];
                    if (
                        xy[0] >= 0 && xy[0] < self.mapSize
                        && xy[1] >= 0 && xy[1] < self.mapSize
                    ) {
                        renderTile(getIPByXY(xy));
                    }
                });
            });
            updateWorld();
            $('.OxTooltip').remove();
        }

        /*
        Renders a map marker with the given properties.
        */
        function renderMarker(data) {
            var $icon, $marker = self.$tiles.find('div[id="' + data.ip + '"]'),
                src, timeout;
            if (!$marker.length) {
                src = data.host == 'Me'
                    ? Ox.UI.getImageURL('symbolUser')
                    : 'http://' + data.host + '/favicon.ico';
                timeout = setTimeout(function() {
                    $icon = $('<img>')
                        .addClass('marker')
                        .attr({src: 'png/favicon.png'})
                        .css({opacity: 0})
                        .appendTo($marker)
                        .animate({opacity: 1}, 250);
                }, 1000);
                $('.marker').removeClass('selected');
                $marker = Ox.Element({
                        tooltip: function() {
                            var host = data.host, ip = $marker.attr('id');
                            return '<b>' + (host || 'Me') + '</b>'
                                + (ip != host ? '<br>' + ip : '');
                        }
                    })
                    .attr({id: data.ip || self.options.ip})
                    .addClass('marker')
                    .css({
                        left: self.xy[0] + 'px',
                        top: self.xy[1] + 'px',
                        opacity: 0
                    })
                    .data({host: data.host || data.ip})
                    .appendTo(self.$tiles)
                    .animate({opacity: 1}, 250);
                $marker.$tooltip.css({textAlign: 'center'});
                $('<img>')
                    .on({
                        load: function() {
                            var $this = $(this);
                            clearTimeout(timeout);
                            if ($icon) {
                                $icon.stop().animate({
                                    opacity: 0
                                }, 125, callback);
                            } else {
                                callback();
                            }
                            function callback() {
                                $marker.empty().append($this.animate({
                                    opacity: 1
                                }, $icon ? 125 : 250));
                            }
                        }
                    })
                    .addClass('marker')
                    .attr({src: src})
                    .css({opacity: 0});
            }
            $marker.addClass('selected');
        }

        /*
        Renders a tile at a given IP address.
        */
        function renderTile(ip) {
            var n = getNByIP(ip),
                firstN = Math.floor(n / self.tileAreaInIPs) * self.tileAreaInIPs,
                lastN = firstN + self.tileAreaInIPs - 1,
                firstIP = getIPByN(firstN),
                lastIP = getIPByN(lastN),
                src = self.options.tilesURL + firstIP.split('.')[0] + '/'
                    + firstIP + '-' + lastIP + '.png',
                xy = getXYByIP(firstIP).map(function(v) {
                    return Math.floor(v / 256) * 256;
                });
            if (!self.$tiles.$element.find('img[src="' + src + '"]').length) {
                $('<img>')
                    .addClass('tile')
                    .attr({src: src})
                    .css({
                        left: xy[0] + 'px',
                        top: xy[1] + 'px',
                    })
                    .appendTo(self.$tiles);
            }
        }

        /*
        Sets the hash to a given value, or to the current IP address.
        */
        function setHash(value) {
            /*
            Temporarily disable the hashchange handler
            */
            self.hashchange = false;
            document.location.hash = [
                value || self.options.ip, self.options.zoom
            ].join(',');
            setTimeout(function() {
                self.hashchange = true;
            });
        }

        /*
        Updates XY when setting the IP address.
        */
        function setIP(ip) {
            self.options.ip = ip;
            self.xy = getXYByIP(ip);
        }

        /*
        Updates the IP address when setting XY.
        */
        function setXY(xy) {
            self.xy = xy;
            self.options.ip = getIPByXY(xy);
        }

        /*
        Toggles the overlay image.
        */
        function toggleOverlay(image) {
            var $overlay = $('#overlay'), src = 'png/' + image + '.png';
            $overlay.stop().animate({opacity: 0}, 250, function() {
                $overlay.remove();
            });
            if (!$('#overlay[src="' + src + '"]').length) {
                $('<img>')
                    .attr({id: 'overlay', src: src})
                    .css(getOverlayCSS(image))
                    .appendTo(self.$tiles)
                    .animate({opacity: 0.5}, 250);
            }
        }

        /*
        Toggles the overview map.
        */
        function toggleWorld() {
            var action = self.$toggle.options('title').substr(0, 4);
            self.$toggle.options({
                title: (action == 'Show' ? 'Hide' : 'Show') + ' Overview Map'
            });
            action == 'Show' && self.$world.show();
            self.$world.animate({
                opacity: action == 'Show' ? 1 : 0
            }, 250, function() {
                action == 'Hide' && self.$world.hide();
            });
        }

        /*
        Updates the overview map.
        */
        function updateWorld(animate) {
            var ms = animate ? 250 : 0,
                p = Math.pow(2, self.options.zoom),
                width = Math.round(window.innerWidth / p),
                height = Math.round(window.innerHeight / p),
                left = Math.floor(256 + self.xy[0] / p - width / 2),
                top = Math.floor(256 + self.xy[1] / p - height / 2);
            self.$point.animate({
                left: Math.round(self.xy[0] / p) + 'px',
                top: Math.round(self.xy[1] / p) + 'px'
            }, ms);
            self.$regions.animate({
                left: left - 512 + 'px',
                top: top - 512 + 'px',
                width: width + 512 + 'px',
                height: height + 512 + 'px'
            }, ms);
            self.$center.css({
                width: width + 'px',
                height: height + 'px'
            });
            self.$top.css({
                width: width + 'px'
            });
            self.$bottom.css({
                width: width + 'px'
            });
            var uiwidth = 256 / p + 'px',
                uiheight = 16 / p + 'px',
                uiradius = 8 / p + 'px',
                uimargin = 256 + 16 / p + 'px',
                uibottom = 256 + 48 / p + 'px';
            ['top', 'bottom'].forEach(function(topbottom) {
                ['left', 'right'].forEach(function(leftright) {
                    var $element = self['$' + topbottom + leftright];
                    $element.css(topbottom, uimargin);
                    $element.css(leftright, uimargin);
                    $element.css({
                        width: uiwidth,
                        height: uiheight,
                        borderRadius: uiradius
                    });
                });
            })
            self.$square.css({
                right: uimargin,
                bottom: uibottom,
                width: uiwidth,
                height: uiwidth
            });
        }

        /*
        Zooms the map by Z zoom levels.
        */
        function zoomBy(z) {
            zoomTo(self.options.zoom + z);
        }

        /*
        Zooms the map to zoom level Z.
        */
        function zoomTo(z) {
            if (z >= 0 && z <= self.maxZoom) {
                self.options.zoom = z;
                self.mapSize = Math.pow(2, self.options.zoom) * self.tileSize;
                self.tileSizeInXY = Math.pow(2, 16 - self.options.zoom);
                self.tileAreaInIPs = Math.pow(4, 16 - self.options.zoom);
                self.xy = getXYByIP(self.options.ip);
                self.$zoom.options({value: self.options.zoom});
                self.$tiles.$element.find('.tile').remove();
                self.$tiles.$element.find('div.marker').each(function() {
                    var $marker = $(this), xy = getXYByIP($marker.attr('id'));
                    $marker.css({
                        left: xy[0] + 'px',
                        top: xy[1] + 'px'
                    });
                });
                self.$tiles.css({
                    width: self.mapSize + 'px',
                    height: self.mapSize + 'px'
                });
                renderMap();
                $('#overlay').css(getOverlayCSS());
            }
        }

        return that;

    };

    var URL = 'https://0x2620.org/html/ipv4map/',
        lookupURL = URL + 'php/ipv4map.php?callback={callback}',
        tilesURL = URL + 'png/tiles/';

    Ox.getJSON('json/bookmarks.json', function(bookmarks) {
        Ox.getJSONP(lookupURL, function(data) {
            Ox.IPv4Map({
                bookmarks: bookmarks,
                ip: data.ip.indexOf(':') == -1 ? data.ip : '127.0.0.1',
                lookupURL: lookupURL,
                tilesURL: tilesURL,
                zoom: 4
            }).appendTo(Ox.$body);    
        });
    });

});

