'use strict';

/*@
Ox.Map <f> Basic map object
    # DESCRIPTION --------------------------------------------------------------
    `Ox.Map` is a wrapper around the [Google Maps 
    API](http://code.google.com/apis/maps/documentation/javascript/).
    # ARGUMENTS ----------------------------------------------------------------
    options <o|{}> options
        clickable       <b|false> If true, clicking on the map finds a place
        editable        <b|false> If true, places are editable
        find            <s|""> Initial query
        findPlaceholder <s|"Find"> Placeholder text for the find input element
        keys            <a|[]> Additional place properties to be requested
        markerColor     <[n]|f|s|'auto'> Color of place markers ([r, g, b])
        markerSize      <n|f||s|'auto'> Size of place markers in px
        markerTooltip   <f> Format function for place marker tooltips
        maxMarkers      <n|100> Maximum number of markers to be displayed
        places          <[o]|f|null> Array of, or function that returns, place objects
            countryCode     <s> ISO 3166 country code
            east            <n> Longitude of the eastern boundary in degrees
            editable        <b|false> If true, the place is editable
            geoname         <s> Geoname (like "Paris, Île-de-France, France")
            lat             <n> Latitude in degrees
            lng             <n> Longitude in degrees
            name            <s> Name (like "Paris")
            north           <n> Latitude of the northern boundary in degrees
            south           <n> Latitude of the southern boundary in degrees
            type            <s> Type (like "city" or "country")
            west            <n> Longitude of the western boundary in degrees
        selected        <s|""> Id of the selected place
        showControls    <b|false> If true, show controls
        showLabels      <b|false> If true, show labels on the map
        showStatusbar   <b|false> If true, the map has a statusbar
        showToolbar     <b|false> If true, the map has a toolbar
        showZoombar     <b|false> If true, the map has a zoombar
        zoomOnlyWhenFocused <b|false> If true, scroll-zoom only when focused
    self <o|{}> Shared private variable
    # USAGE --------------------------------------------------------------------
    ([options[, self]]) -> <o:Ox.Element> Map object
        # EVENTS ---------------------------------------------------------------
        addplace <!> Fires when a place has been added
            place <o> Place object
        editplace <!> Fires when a place has been edited
            place <o> Place object
        geocode <!> Fires when a google geocode request returns
            latLng <o|u> Query coordinates, or undefined
                lat <n> latitude
                lng <n> longitude
            address <s|u> Query string, or undefined
            results <[o]> Google Maps geocode results
                address_components <[o]> Address components
                    long_name <s> Long name
                    short_name <s> Short name
                    types <[s]> Types (like "country" or "political")
                formatted_address <s> Formatted address
                geometry <o> Geometry
                    bounds <o> Bounds
                        northEast <o> North-east corner
                            lat <n> Latitude
                            lng <n> Longitude
                        southWest <o> South-west corner
                            lat <n> Latitude
                            lng <n> Longitude
                    location <o> Location
                        lat <n> Latitude
                        lng <n> Longitude
                    location_type <s> Location type (like "APPROXIMATE")
                    viewport <o> Viewport
                        northEast <o> North-east corner
                            lat <n> Latitude
                            lng <n> Longitude
                        southWest <o> South-west corner
                            lat <n> Latitude
                            lng <n> Longitude
                types <[s]> Types (like "country" or "political")
        load <!> load
        select <!> Fires when a place has been selected or deselected
            place <o> Place object
        selectplace <!> Deprecated
        togglecontrols <!> togglecontrols
        togglelabels <!> togglelabels
@*/

Ox.Map = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({
            // fixme: isClickable?
            clickable: false,
            editable: false,
            find: '',
            findPlaceholder: 'Find',
            keys: [],
            markerColor: 'auto',
            markerSize: 'auto',
            markerTooltip: function(place) {
                return place.name || '<span class="OxLight">Unnamed</span>';
            },
            maxMarkers: 100,
            places: null,
            selected: '',
            showControls: false,
            showLabels: false,
            showStatusbar: false,
            showToolbar: false,
            showZoombar: false,
            zoomOnlyWhenFocused: false
            // fixme: width, height
        })
        .options(options || {})
        .update({
            find: function() {
                self.$findInput
                    .value(self.options.find)
                    .triggerEvent('submit', {value: self.options.find});
            },
            height: function() {
                that.css({height: self.options.height + 'px'});
                that.resizeMap();
            },
            places: function() {
                if (Ox.isArray(self.options.places)) {
                    self.options.places.forEach(function(place) {
                        if (Ox.isUndefined(place.id)) {
                            place.id = Ox.encodeBase32(Ox.uid());
                        }
                    });
                    if (self.options.selected && !Ox.getObjectById(
                        self.options.places, self.options.selected
                    )) {
                        self.options.selected = '';
                        selectPlace(null);
                    }
                    self.options.places = Ox.api(self.options.places, {
                        geo: true,
                        sort: '-area'
                    });
                }
                self.loaded && getMapBounds(function(mapBounds) {
                    if (mapBounds) {
                        self.map.fitBounds(mapBounds);
                    } else {
                        self.map.setZoom(self.minZoom);
                        self.map.setCenter(new google.maps.LatLng(0, 0));
                    }
                    // fixme: the following is just a guess
                    self.boundsChanged = true;
                    mapChanged();
                    self.options.selected && selectPlace(self.options.selected);
                });
            },
            selected: function() {
                selectPlace(self.options.selected || null);
            },
            type: function() {
                // ...    
            },
            width: function() {
                that.css({width: self.options.width + 'px'});
                that.resizeMap();
            }
        })
        .addClass('OxMap')
        .bindEvent({
            gainfocus: function() {
                self.options.zoomOnlyWhenFocused && self.map.setOptions({scrollwheel: true});
            },
            losefocus: function() {
                self.options.zoomOnlyWhenFocused && self.map.setOptions({scrollwheel: false});
            },
            key_0: function() {
                panToPlace()
            },
            key_c: toggleControls,
            key_down: function() {
                pan(0, 1);
            },
            key_enter: pressEnter,
            key_escape: pressEscape,
            key_equal: function() {
                zoom(1);
            },
            key_l: toggleLabels,
            key_left: function() {
                pan(-1, 0);
            },
            'key_meta': function() {
                self.metaKey = true;
                $(document).one({
                    keyup: function() {
                        self.metaKey = false;
                    }
                });
            },
            key_minus: function() {
                zoom(-1);
            },
            key_right: function() {
                pan(1, 0);
            },
            key_shift: function() {
                self.shiftKey = true;
                $(document).one({
                    keyup: function() {
                        self.shiftKey = false;
                    }
                });
            },
            key_shift_down: function() {
                pan(0, 2);
            },
            key_shift_0: function() {
                zoomToPlace();
            },
            key_shift_equal: function() {
                zoom(2);
            },
            key_shift_left: function() {
                pan(-2, 0);
            },
            key_shift_minus: function() {
                zoom(-2);
            },
            key_shift_right: function() {
                pan(2, 0);
            },
            key_shift_up: function() {
                pan(0, -2);
            },
            key_up: function() {
                pan(0, -1);
            },
            key_z: undo,
            mousedown: function(e) {
                !$(e.target).is('input') && that.gainFocus();
            }
        });

    // HANDLE DEPRECATED OPTIONS
    options && ['statusbar', 'toolbar', 'zoombar'].forEach(function(key) {
        if (options[key]) {
            self.options['show' + Ox.toTitleCase(key)] = options[key];
        }
    });

    //FIXME: duplicated in update
    if (Ox.isArray(self.options.places)) {
        self.options.places.forEach(function(place) {
            if (Ox.isUndefined(place.id)) {
                place.id = Ox.encodeBase32(Ox.uid());
            }
        });
        self.options.places = Ox.api(self.options.places, {
            geo: true,
            sort: '-area'
        });
    }

    self.mapHeight = getMapHeight();
    self.metaKey = false;
    self.minZoom = getMinZoom();
    self.placeKeys = [
        'id', 'name', 'alternativeNames', 'geoname', 'countryCode', 'type',
        'lat', 'lng', 'south', 'west', 'north', 'east', 'area',
        'editable'
    ].concat(self.options.keys);
    self.places = [],
    self.resultPlace = null;
    self.scaleMeters = [
        50000000, 20000000, 10000000,
        5000000, 2000000, 1000000,
        500000, 200000, 100000,
        50000, 20000, 10000,
        5000, 2000, 1000,
        500, 200, 100,
        50, 20, 10
    ];
    self.shiftKey = false,
    self.tileSize = 256;

    if (self.options.showToolbar) {
        self.$toolbar = Ox.Bar({
                size: 24
            })
            .appendTo(that);
        self.$menu = Ox.MenuButton({
                items: [
                    {
                        id: 'toggleLabels',
                        title: self.options.showLabels
                            ? [Ox._('Hide Labels'), Ox._('Show Labels')]
                            : [Ox._('Show Labels'), Ox._('Hide Labels')],
                        keyboard: 'l'
                    },
                    {
                        id: 'toggleControls',
                        title: self.options.showControls
                            ? [Ox._('Hide Controls'), Ox._('Show Controls')]
                            : [Ox._('Show Controls'), Ox._('Hide Controls')],
                        keyboard: 'c'
                    }
                ],
                title: 'set',
                tooltip: Ox._('Map Options'),
                type: 'image'
            })
            .css({float: 'left', margin: '4px'})
            .bindEvent({
                click: function(data) {
                    if (data.id == 'toggleLabels') {
                        toggleLabels();
                    } else if (data.id == 'toggleControls') {
                        toggleControls();
                    }
                }
            })
            .appendTo(self.$toolbar);
        self.$findInput = Ox.Input({
                clear: true,
                placeholder: self.options.findPlaceholder,
                width: 192
            })
            .css({float: 'right', margin: '4px 4px 4px 2px'})
            .bindEvent({
                submit: submitFind
            })
            .appendTo(self.$toolbar);
        self.$loadingIcon = Ox.LoadingIcon({
                size: 16
            })
            .css({float: 'right', margin: '4px 2px 4px 2px'})
            .appendTo(self.$toolbar);
    }

    self.$map = Ox.Element()
        .css({
            left: 0,
            top: self.options.showToolbar * 24 + 'px',
            right: 0,
            bottom: self.options.showZoombar * 16 + self.options.showStatusbar * 24 + 'px'
        })
        .appendTo(that);

    if (self.options.showZoombar) {
        self.$zoombar = Ox.Bar({
                size: 16
            })
            .css({
                bottom: self.options.showStatusbar * 24 + 'px'
            })
            .appendTo(that);
    }

    if (self.options.showStatusbar) {
        self.$statusbar = Ox.Bar({
                size: 24
            })
            .css({
                bottom: 0
            })
            .appendTo(that);
        self.$placeFlag = Ox.$('<img>')
            .addClass('OxFlag')
            .attr({
                src: Ox.PATH + 'Ox.Geo/png/icons/16/NTHH.png'
            })
            .css({float: 'left', margin: '4px 2px 4px 4px'})
            .appendTo(self.$statusbar);
        self.$placeNameInput = Ox.Input({
                placeholder: 'Name',
                width: 96
            })
            //.css({position: 'absolute', left: 4, top: 4})
            .css({float: 'left', margin: '4px 2px 4px 2px'})
            .appendTo(self.$statusbar);
        self.$placeGeonameInput = Ox.Input({
                placeholder: 'Geoname',
                width: 96
            })
            //.css({position: 'absolute', left: 104, top: 4})
            .css({float: 'left', margin: '4px 2px 4px 2px'})
            .appendTo(self.$statusbar);
        self.$placeButton = Ox.Button({
                title: 'New Place',
                width: 96
            })
            .css({float: 'right', margin: '4px 4px 4px 2px'})
            .bindEvent({
                click: clickPlaceButton
            })
            .appendTo(self.$statusbar);
    }

    self.$controls = {
        center: Ox.Button({
                title: 'center',
                type: 'image'
            })
            .addClass('OxMapControl OxMapButtonCenter')
            .bindEvent({
                singleclick: function() {
                    panToPlace();
                },
                doubleclick: function() {
                    zoomToPlace();
                }
            }),
        east: Ox.Button({
                title: 'right',
                type: 'image'
            })
            .addClass('OxMapControl OxMapButtonEast')
            .bindEvent({
                singleclick: function() {
                    pan(1, 0);
                },
                doubleclick: function() {
                    pan(2, 0);
                }
            }),
        north: Ox.Button({
                title: 'up',
                type: 'image'
            })
            .addClass('OxMapControl OxMapButtonNorth')
            .bindEvent({
                singleclick: function() {
                    pan(0, -1);
                },
                doubleclick: function() {
                    pan(0, -2);
                }
            }),
        south: Ox.Button({
                title: 'down',
                type: 'image'
            })
            .addClass('OxMapControl OxMapButtonSouth')
            .bindEvent({
                singleclick: function() {
                    pan(0, 1);
                },
                doubleclick: function() {
                    pan(0, 2);
                }
            }),
        west: Ox.Button({
                title: 'left',
                type: 'image'
            })
            .addClass('OxMapControl OxMapButtonWest')
            .bindEvent({
                singleclick: function() {
                    pan(-1, 0);
                },
                doubleclick: function() {
                    pan(-2, 0);
                }
            }),
        scale: Ox.Label({
                textAlign: 'center'
            })
            .addClass('OxMapControl OxMapScale')
    };
    !self.options.showControls && Ox.forEach(self.$controls, function($control) {
        $control.css({opacity: 0}).hide();
    });

    self.$placeControls = {
        flag: Ox.Element()
            .addClass('OxPlaceControl OxPlaceFlag')
            .bindEvent({
                anyclick: function() {
                    // FIXME: doesn't work for 'Georgia', use Ox.Geo data!
                    var country = this.data('country');
                    country && getPlaceByName(country, function(place) {
                        place && self.map.fitBounds(place.bounds);
                    });
                }
            }),
        name: Ox.Label({
                textAlign: 'center',
                tooltip: Ox._('Click to pan, doubleclick to zoom')
            })
            .addClass('OxPlaceControl OxPlaceName')
            .bindEvent({
                singleclick: function() {
                    panToPlace();
                },
                doubleclick: function() {
                    zoomToPlace();
                }
            }),
        deselectButton: Ox.Button({
                title: 'close',
                tooltip: Ox._('Deselect'),
                type: 'image'
            })
            .addClass('OxPlaceControl OxPlaceDeselectButton')
            .bindEvent({
                click: function() {
                    selectPlace(null);
                }
            })
    }
    Ox.forEach(self.$placeControls, function($placeControl) {
        $placeControl.css({opacity: 0}).hide();
    });

    if (window.google) {
        // timeout needed so that the map is in the DOM
        setTimeout(initMap);
    } else if (window.googleCallback) {
        (function interval() {
            isLoaded() ? initMap() : setTimeout(interval, 100);
        }());
    } else {
        window.googleCallback = function() {
            delete window.googleCallback;
            initMap();
        };
        $.getScript(
            document.location.protocol
            + '//maps.google.com/maps/api/js?callback=googleCallback&sensor=false'
            + (Ox.Map.GoogleApiKey ? '&key=' + Ox.Map.GoogleApiKey : '')
        );
    }

    function addPlaceToMap(place) {
        // via find, click, shift-click, or new place button
        Ox.Log('Map', 'addPlaceToMap', place)
        var exists = false;
        if (!place) {
            var bounds = self.map.getBounds(),
                center = self.map.getCenter(),
                southwest = new google.maps.LatLngBounds(
                    bounds.getSouthWest(), center
                ).getCenter(),
                northeast = new google.maps.LatLngBounds(
                    center, bounds.getNorthEast()
                ).getCenter(),
                place = new Ox.MapPlace({
                    alternativeNames: [],
                    countryCode: '',
                    editable: true,
                    geoname: '',
                    id: '_' + Ox.encodeBase32(Ox.uid()), // fixme: stupid
                    map: that,
                    name: '',
                    type: 'feature',
                    south: southwest.lat(),
                    west: southwest.lng(),
                    north: northeast.lat(),
                    east: northeast.lng()
                });
        }
        Ox.forEach(self.places, function(p, i) {
            if (place.bounds.equals(p.bounds)) {
                place = p;
                exists = true;
                return false; // break
            }
        });
        if (!exists) {
            self.resultPlace && self.resultPlace.remove();
            self.resultPlace = place;
            place.add();
        }
        selectPlace(place.id);
    }

    function addPlaceToPlaces(data) {
        var place = Ox.extend(getSelectedPlace() || {}, data),
            country = Ox.getCountryByGeoname(place.geoname);
        place.countryCode = country ? country.code : '';
        self.options.selected = place.id;
        setPlaceControls(place);
        place.marker.update();
        place.rectangle.update();
        self.places.push(place);
        self.resultPlace = null;
        that.triggerEvent('addplace', place)
    }

    function boundsChanged() {
        setScale();
        self.boundsChanged = true;
    }

    function canContain(outerBounds, innerBounds) {
        // checks if outerBounds _can_ contain innerBounds
        var outerSpan = outerBounds.toSpan(),
            innerSpan = innerBounds.toSpan();
        return outerSpan.lat() > innerSpan.lat() &&
            outerSpan.lng() > innerSpan.lng();
    }

    function centerChanged() {
        var tooltip = $('.OxMapMarkerTooltip');
        tooltip.length && Ox.$elements[$(tooltip[0]).data('oxid')].hide();
        self.center = self.map.getCenter();
        self.centerChanged = true;
    }

    function changeZoom(data) {
        self.map.setZoom(data.value);
    }

    function clickMap(event) {
        var place = getSelectedPlace();
        if (self.options.clickable/* && !editing()*/) {
            getPlaceByLatLng(event.latLng, self.map.getBounds(), function(place) {
                if (place) {
                    addPlaceToMap(place);
                    //selectPlace(place.id);
                } else {
                    selectPlace(null);
                }
            });
        } else {
            pressEscape();
        }
    }

    function clickPlaceButton() {
        var place = getSelectedPlace(),
            title = self.$placeButton.options('title');
        if (title == Ox._('New Place')) {
            addPlaceToMap();
        } else if (title == Ox._('Add Place')) {
            addPlaceToPlaces();
        }
    }

    function constructZoomInput() {
        if (self.options.showZoombar) {
            self.$zoomInput && self.$zoomInput.remove();
            self.$zoomInput = Ox.Range({
                    arrows: true,
                    changeOnDrag: true,
                    max: self.maxZoom,
                    min: self.minZoom,
                    size: that.width(),
                    thumbSize: 32,
                    thumbValue: true,
                    value: self.map.getZoom()
                })
                .bindEvent({
                    change: changeZoom
                })
                .appendTo(self.$zoombar);
        }
    }

    function crossesDateline() {
        var bounds = self.map.getBounds();
        return bounds.getSouthWest().lng() > bounds.getNorthEast().lng();
    }

    function editing() {
        var place = getSelectedPlace();
        return place && place.editing;
    }

    function getElevation(point, callback) {
        // fixme: unused
        if (arguments.length == 1) {
            callback = point;
            point = self.map.getCenter();
        }
        self.elevationService.getElevationForLocations({
            locations: [point]
        }, function(data) {
            callback(data.elevation);
        });
    }

    function getMapBounds(callback) {
        // get initial map bounds
        self.options.places({}, function(result) {
            var area = result.data.area;
            callback(new google.maps.LatLngBounds(
                new google.maps.LatLng(area.south, area.west),
                new google.maps.LatLng(area.north, area.east)
            ));
        });
    }

    function getMapHeight() {
        return self.options.height
            - self.options.showStatusbar * 24
            - self.options.showToolbar * 24
            - self.options.showZoombar * 16;
    }

    function getMapType() {
        return self.options.showLabels ? 'HYBRID' : 'SATELLITE'
    }

    function getMaxZoom(point, callback) {
        if (arguments.length == 1) {
            callback = point;
            point = self.map.getCenter();
        }
        self.maxZoomService.getMaxZoomAtLatLng(point, function(data) {
            callback(data.status == 'OK' ? data.zoom : null);
        });
    }

    function getMetersPerPixel() {
        // m/px = m/deg * deg/px
        var degreesPerPixel = 360 / (self.tileSize * Math.pow(2, self.map.getZoom()));
        return Ox.getMetersPerDegree(self.map.getCenter().lat()) * degreesPerPixel;
    }

    function getMinZoom() {
        return self.mapHeight > 1024 ? 3
            : self.mapHeight > 512 ? 2
            : self.mapHeight > 256 ? 1
            : 0;
        // fixme: there must be a function for this...
        /*
        return Math.ceil(
            Ox.log(self.mapHeight / self.tileSize, 2)
        );
        */
    }

    function getPlaceById(id) {
        return self.resultPlace && self.resultPlace.id == id
            ? self.resultPlace
            : Ox.getObjectById(self.places, id);
    }

    function getPlaceByLatLng(latlng, bounds, callback) {
        // gets the largest place at latlng that would fit in bounds
        var callback = arguments.length == 3 ? callback : bounds,
            bounds = arguments.length == 3 ? bounds : null;
        self.$loadingIcon && self.$loadingIcon.start();
        self.geocoder.geocode({
            latLng: latlng
        }, function(results, status) {
            self.$loadingIcon && self.$loadingIcon.stop();
            if (status == google.maps.GeocoderStatus.OK) {
                if (bounds) {
                    Ox.forEach(results.reverse(), function(result, i) {
                        if (
                            i == results.length - 1 ||
                            canContain(bounds, result.geometry.bounds || result.geometry.viewport)
                        ) {
                            callback(new Ox.MapPlace(parseGeodata(results[i])));
                            return false; // break
                        }
                    });
                } else {
                    callback(new Ox.MapPlace(parseGeodata(results[0])));
                }
            }
            if (
                status == google.maps.GeocoderStatus.OK ||
                status == google.maps.GeocoderStatus.ZERO_RESULTS
            ) {
                triggerGeocodeEvent({
                    latLng: latlng,
                    results: results
                });
            } else {
                Ox.Log('Map', 'geocode failed:', status);
                callback(null);
            }
        });
    }

    function getPlaceByName(name, callback) {
        self.$loadingIcon && self.$loadingIcon.start();
        self.geocoder.geocode({
            address: name
        }, function(results, status) {
            self.$loadingIcon && self.$loadingIcon.stop();
            if (status == google.maps.GeocoderStatus.OK) {
                callback(new Ox.MapPlace(parseGeodata(results[0])));
            }
            if (
                status == google.maps.GeocoderStatus.OK
                && status != google.maps.GeocoderStatus.ZERO_RESULTS
            ) {
                triggerGeocodeEvent({
                    address: name,
                    results: results
                });
            } else {
                Ox.Log('Map', 'geocode failed:', status);
                callback(null);
            }
        });
    }

    function getPositionByName(name) {
        var position = -1;
        Ox.forEach(self.options.places, function(place, i) {
            if (place.name == name) {
                position = i;
                return false; // break
            }
        });
        return position;
    }

    function getSelectedMarker() {
        // needed in case self.options.selected
        // is changed from outside
        var id = null;
        if (self.resultPlace && self.resultPlace.selected) {
            id = self.resultPlace.id;
        } else {
            Ox.forEach(self.places, function(place) {
                if (place.selected) {
                    id = place.id;
                    return false; // break
                }
            });
        }
        return id;
    }

    function getSelectedPlace() {
        return self.options.selected
            ? getPlaceById(self.options.selected)
            : null;
    }

    function initMap() {

        getMapBounds(function(mapBounds) {

            //Ox.Log('Map', 'init', mapBounds.getSouthWest(), mapBounds.getNorthEast(), mapBounds.getCenter())

            self.elevationService = new google.maps.ElevationService();
            self.geocoder = new google.maps.Geocoder();
            self.maxZoomService = new google.maps.MaxZoomService();

            self.center = mapBounds ? mapBounds.getCenter() : new google.maps.LatLng(0, 0);
            self.zoom = self.minZoom;
            that.map = self.map = new google.maps.Map(self.$map[0], {
                center: self.center,
                disableDefaultUI: true,
                disableDoubleClickZoom: true,
                mapTypeId: google.maps.MapTypeId[getMapType()],
                noClear: true,
                scrollwheel: !self.options.zoomOnlyWhenFocused,
                zoom: self.zoom
            });
            google.maps.event.addListener(self.map, 'bounds_changed', boundsChanged);
            google.maps.event.addListener(self.map, 'center_changed', centerChanged);
            google.maps.event.addListener(self.map, 'click', clickMap);
            google.maps.event.addListener(self.map, 'idle', mapChanged);
            google.maps.event.addListener(self.map, 'zoom_changed', zoomChanged);
            google.maps.event.trigger(self.map, 'resize');

            // needed to get mouse x/y coordinates on marker mouseover,
            // see http://code.google.com/p/gmaps-api-issues/issues/detail?id=2342
            that.overlayView = new google.maps.OverlayView();
            that.overlayView.setMap(self.map);
            that.overlayView.draw = function () { 
                if (!this.ready) { 
                    this.ready = true; 
                    google.maps.event.trigger(this, 'ready'); 
                }
            }
            that.overlayView.draw();

            Ox.forEach(self.$controls, function($control) {
                $control.appendTo(self.$map);
            });
            Ox.forEach(self.$placeControls, function($placeControl) {
                $placeControl.appendTo(self.$map);
            });

            if (self.options.find) {
                self.$findInput
                    .value(self.options.find)
                    .triggerEvent('submit', {value: self.options.find});
            } else {
                if (self.options.selected) {
                    selectPlace(self.options.selected, true);
                }
                if (mapBounds) {
                    if (isEmpty(mapBounds)) {
                        self.map.setZoom(self.minZoom);
                    } else {
                        self.map.fitBounds(mapBounds);
                    }
                }
                if (self.map.getZoom() < self.minZoom) {
                    self.map.setZoom(self.minZoom);
                }
            }
            updateFormElements();

            self.loaded = true;
            that.triggerEvent('load');

        });

    }

    function isEmpty(bounds) {
        // Google's bounds.isEmpty() is not reliable
        var southWest = bounds.getSouthWest(),
            northEast = bounds.getNorthEast();
        return southWest.lat() == northEast.lat()
            && southWest.lng() == northEast.lng();
    }

    function isLoaded() {
        return window.google && window.google.maps && window.google.maps.LatLng;
    }

    function mapChanged() {
        // This is the handler that actually adds the places to the map.
        // Gets called after panning or zooming, and when the map is idle.
        if (self.boundsChanged) {
            var bounds = self.map.getBounds(),
                southWest = bounds.getSouthWest(),
                northEast = bounds.getNorthEast(),
                south = southWest.lat(),
                west = southWest.lng(),
                north = northEast.lat(),
                east = northEast.lng();
            self.options.places({
                keys: self.placeKeys,
                query: {
                    conditions: [].concat([
                        {key: 'lat', value: [south, north], operator: '='}
                    ], spansGlobe() ? [
                        {key: 'lng', value: [-180, 180], operator: '='}
                    ] : crossesDateline() ? [
                        {key: 'lng', value: [east, west], operator: '!='}
                    ] : [
                        {key: 'lng', value: [west, east], operator: '='}
                    ]),
                    operator: '&'
                },
                range: [0, self.options.maxMarkers],
                sort: [{key: 'area', operator: '-'}]
            }, function(result) {
                var ids = self.options.selected ? [self.options.selected] : [],
                    previousIds = self.places.map(function(place) {
                        return place.id;
                    });
                // add new places
                result.data.items.forEach(function(item, i) {
                    var place = getPlaceById(item.id);
                    if (!place) {
                        place = new Ox.MapPlace(Ox.extend({
                            map: that
                        }, item)).add();
                        self.places.push(place);
                    } else if (!place.visible) {
                        place.add();
                    }
                    item.id != self.options.selected && ids.push(item.id);
                });
                // remove old places
                previousIds.forEach(function(id) {
                    var place = getPlaceById(id);
                    if (place && ids.indexOf(id) == -1) {
                        place.remove();
                    }
                });
                // update places array
                self.places = self.places.filter(function(place) {
                    return place.visible;
                });
            });
            self.boundsChanged = false;
        }
        if (self.centerChanged) {
            getMaxZoom(function(zoom) {
                if (zoom && zoom != self.maxZoom) {
                    self.maxZoom = zoom;
                    if (self.map.getZoom() > zoom) {
                        self.map.setZoom(zoom);
                    }
                    constructZoomInput();
                }
            });
            self.centerChanged = false;
        }
        if (self.zoomChanged) {
            self.zoomChanged = false;
        }
    }

    function pan(x, y) {
        self.map.panBy(x * self.$map.width() / 2, y * self.$map.height() / 2);
    };

    function panToPlace() {
        var place;
        if (!self.loaded) {
            setTimeout(function() {
                panToPlace();
            }, 100);
        } else {
            place = getSelectedPlace();
            place && self.map.panTo(place.center);
        }
    }

    function parseGeodata(data) {
        var bounds = data.geometry.bounds || data.geometry.viewport,
            northEast = bounds.getNorthEast(),
            southWest = bounds.getSouthWest(),
            place = {
                alternativeNames: [],
                components: data.address_components,
                countryCode: getCountryCode(data.address_components),
                east: northEast.lng(),
                editable: self.options.editable,
                fullGeoname: getFullGeoname(data.address_components),
                id: '_' + Ox.encodeBase32(Ox.uid()),
                map: that,
                north: northEast.lat(),
                south: southWest.lat(),
                type: getType(data.address_components[0].types),
                west: southWest.lng()
            };
        place.geoname = data.formatted_address || place.fullGeoname;
        place.name = (place.geoname || place.fullGeoname).split(', ')[0];
        if (Math.abs(place.west) == 180 && Math.abs(place.east) == 180) {
            place.west = -179.99999999;
            place.east = 179.99999999;
        }
        place.south = Ox.limit(place.south, Ox.MIN_LATITUDE, Ox.MAX_LATITUDE - 0.00000001);
        place.north = Ox.limit(place.north, Ox.MIN_LATITUDE + 0.00000001, Ox.MAX_LATITUDE);
        function getCountryCode(components) {
            var countryCode = '';
            Ox.forEach(components, function(component) {
                if (component.types.indexOf('country') > -1) {
                    countryCode = component.short_name;
                    return false; // break
                }
            });
            return countryCode;
        }
        function getFullGeoname(components) {
            var country = false;
            return components.map(function(component, i) {
                var name = component.long_name;
                if (i && components[i - 1].types.indexOf('country') > -1) {
                    country = true;
                }
                return !country && (
                    i == 0 || name != components[i - 1].long_name
                ) ? name : null;
            }).join(', ');
        }
        function getType(types) {
            // see https://developers.google.com/maps/documentation/javascript/geocoding#GeocodingAddressTypes
            var strings = {
                    'country': ['country'],
                    'region': ['administrative_area', 'colloquial_area'],
                    'city': ['locality'],
                    'borough': ['neighborhood', 'postal_code', 'sublocality'],
                    'street': [
                        'intersection', 'route',
                        'street_address', 'street_number'
                    ],
                    'building': [
                        'airport', 'floor', 'premise', 'room', 'subpremise'
                    ],
                    'feature': ['natural_feature', 'park']
                },
                type;
            function find(type) {
                var ret;
                Ox.forEach(types, function(v) {
                    ret = Ox.startsWith(v, type);
                    if (ret) {
                        return false; // break
                    }
                });
                return ret;
            }            
            Ox.forEach(strings, function(values, key) {
                Ox.forEach(values, function(value) {
                    if (find(value)) {
                        type = key;
                        return false; // break
                    }
                });
                if (type) {
                    return false; // break
                }
            });
            return type || 'feature';
        }
        return place;
    }

    function pressEnter() {
        var place = getSelectedPlace();
        if (place) {
            if (place.editing) {
                place.submit();
            } else {
                place.edit();
            }
        } else if (self.resultPlace) {
            selectPlace(self.resultPlace.id)
        }
    }

    function pressEscape() {
        var place = getSelectedPlace();
        if (place) {
            if (place.editing) {
                place.cancel();
            } else {
                selectPlace(null);
            }
        } else if (self.resultPlace) {
            self.resultPlace.remove();
            self.resultPlace = null;
        }
    }

    // fixme: removePlacefromMap?
    function removePlace() {
        var place = getSelectedPlace();
        place.id = '_' + place.id;
        self.options.selected = place.id;
        self.places.splice(Ox.getIndexById(self.places, place.id), 1);
        self.resultPlace && self.resultPlace.remove();
        self.resultPlace = place;
        place.marker.update();
        place.rectangle.update();
    }

    function reset() {
        self.map.getZoom() == self.zoom
            ? self.map.panTo(self.center)
            : self.map.fitBounds(self.bounds);
    }

    function selectPlace(id, zoom) {
        // id can be null (deselect)
        var place, selected;
        if (!self.loaded) {
            setTimeout(function() {
                selectPlace(id, zoom);
            }, 100);
        } else {
            selected = getSelectedMarker();
            Ox.Log('Map', 'Ox.Map selectPlace()', id, selected);
            if (id != selected) {
                place = getPlaceById(selected);
                place && place.deselect();
                if (id !== null) {
                    place = getPlaceById(id);
                    if (place) {
                        select();
                    } else {
                        // async && place doesn't exist yet
                        self.options.places({
                            keys: self.placeKeys,
                            query: {
                                conditions: [
                                    {key: 'id', value: id, operator: '=='}
                                ],
                                operator: '&'
                            }
                        }, function(result) {
                            if (result.data.items.length) {
                                place = new Ox.MapPlace(Ox.extend({
                                    map: that
                                }, result.data.items[0])).add();
                                self.places.push(place);
                                select();
                                if (zoom) {
                                    zoomToPlace();
                                } else {
                                    panToPlace();
                                }
                            }
                        });
                    }
                } else {
                    place = null;
                    select();
                }
            }
        }
        function select() {
            place && place.select();
            self.options.selected = id;
            setPlaceControls(place);
            setStatus();
            that.triggerEvent('selectplace', place); // FIXME: deprecated, remove
            that.triggerEvent('select', place);
        }
    };

    function setPlaceControls(place) {
        var $placeControls = that.find('.OxPlaceControl'),
            country,
            isVisible = self.$placeControls.name.is(':visible');
        if (place) {
            country = place.geoname.indexOf(', ') > -1
                ? place.geoname.split(', ').pop()
                : '';
            self.$placeControls.flag.options({
                    tooltip: country ? 'Zoom to ' + country : ''
                })
                .data({country: country})
                .empty()
                .append(
                    Ox.$('<img>').attr({
                        src: Ox.getFlagByGeoname(place.geoname, 16)
                    })
                )
                .show();
            self.$placeControls.name.options({
                title: place.name ||'<span class="OxLight">Unnamed</span>'
            });
            !isVisible && $placeControls.show().animate({opacity: 1}, 250);
        } else {
            isVisible && $placeControls.animate({opacity: 0}, 250, function() {
                $placeControls.hide();
            });
        }
    }

    function setScale() {
        var metersPerPixel = getMetersPerPixel();
        Ox.forEach(self.scaleMeters, function(meters) {
            var mapWidth = self.options.width || that.width(),
                scaleWidth = Math.round(meters / metersPerPixel);
            if (scaleWidth <= mapWidth / 2 - 4) {
                self.$controls.scale
                    .options({
                        title: '\u2190 ' + (
                            meters > 1000 ? Ox.formatNumber(meters / 1000) + ' k' : meters + ' '
                        ) + 'm \u2192'
                    })
                    .css({
                        width: (scaleWidth - 16) + 'px'
                    });
                return false; // break
            }
        });
    }

    function setStatus() {
        //Ox.Log('Map', 'setStatus()', self.options.selected)
        var code, country, disabled, place, title;
        if (self.options.showStatusbar) {
            place = getSelectedPlace();
            country = place ? Ox.getCountryByGeoname(place.geoname) : '';
            code = country ? country.code : 'NTHH';
            disabled = place && !place.editable;
            if (place) {
                title = place.id[0] == '_' ? Ox._('Add Place') : Ox._('Remove Place');
            } else {
                title = Ox._('New Place');
            }
            self.$placeFlag.attr({
                src: Ox.PATH + 'Ox.Geo/png/icons/16/' + code + '.png'
            });
            self.$placeNameInput.options({
                disabled: disabled,
                value: place ? place.name : ''
            });
            self.$placeGeonameInput.options({
                disabled: disabled,
                value: place ? place.geoname : ''
            });
            self.$placeButton.options({
                disabled: disabled,
                title: title
            });
        }
        //Ox.Log('Map', 'STATUS DONE');
    }

    function spansGlobe() {
        // fixme: or self.options.width ??
        return self.$map.width() > self.tileSize * Math.pow(2, self.map.getZoom());
    };

    function submitFind(data) {
        self.options.find = data.value;
        if (data.value === '') {
            if (self.options.selected && self.options.selected[0] == '_') {
                selectPlace(null);
            }
        } else {
            that.findPlace(data.value, function(place) {
                setStatus(place);
            });
        }
        that.triggerEvent('find', {value: data.value});
    }

    function toggleControls() {
        var $controls = that.find('.OxMapControl');
        self.options.showControls = !self.options.showControls;
        if (self.options.showControls) {
            $controls.show().animate({opacity: 1}, 250);
        } else {
            $controls.animate({opacity: 0}, 250, function() {
                $controls.hide();
            });
        }
        that.triggerEvent('togglecontrols', {
            visible: self.options.showControls
        });
    }

    function toggleLabels() {
        self.options.showLabels = !self.options.showLabels;
        self.map.setMapTypeId(google.maps.MapTypeId[getMapType()]);
        that.triggerEvent('togglelabels', {
            visible: self.options.showLabels
        });
    }

    function triggerGeocodeEvent(data) {
        // someone may want to cache google geocode data, so we fire an event.
        // google puts functions like lat or lng on the objects' prototypes,
        // so we create properly named properties, for json encoding
        if (data.latLng) {
            data.latLng = {
                lat: data.latLng.lat(),
                lng: data.latLng.lng()
            }
        }
        data.results.forEach(function(result) {
            ['bounds', 'viewport'].forEach(function(key) {
                if (result.geometry[key]) {
                    result.geometry[key] = {
                        northEast: {
                            lat: result.geometry[key].getNorthEast().lat(),
                            lng: result.geometry[key].getNorthEast().lng()
                        },
                        southWest: {
                            lat: result.geometry[key].getSouthWest().lat(),
                            lng: result.geometry[key].getSouthWest().lng()
                        }
                    }
                }
            });
            if (result.geometry.location) {
                result.geometry.location = {
                    lat: result.geometry.location.lat(),
                    lng: result.geometry.location.lng()
                }
            }
        });
        that.triggerEvent('geocode', data);
    }

    function undo() {
        Ox.Log('Map', 'Map undo')
        var place = getSelectedPlace();
        place.editing && place.undo();
    }

    function updateFormElements() {
        var width = that.width();
        if (self.options.showZoombar) {
            getMaxZoom(function(zoom) {
                self.maxZoom = zoom;
                constructZoomInput();
            });
        }
        if (self.options.showStatusbar) {
            self.$placeNameInput.options({
                width: Math.floor((width - 132) / 2)
            });
            self.$placeGeonameInput.options({
                width: Math.ceil((width - 132) / 2)
            });
        }
    }

    function zoom(z) {
        if (!self.loaded) {
            setTimeout(function() {
                zoom(z);
            }, 100);
        } else {
            self.map.setZoom(self.map.getZoom() + z);
        }
    }

    function zoomChanged() {
        var zoom = self.map.getZoom();
        if (zoom < self.minZoom) {
            self.map.setZoom(self.minZoom);
        } else if (self.maxZoom && zoom > self.maxZoom) {
            self.map.setZoom(self.maxZoom);
        } else {
            self.zoomChanged = true;
            self.$zoomInput && self.$zoomInput.value(zoom);
            that.triggerEvent('zoom', {
                value: zoom
            });
        }
    }

    function zoomToPlace() {
        var place;
        if (!self.loaded) {
            setTimeout(function() {
                zoomToPlace();
            }, 100);
        } else {
            place = getSelectedPlace();
            place && self.map.fitBounds(place.bounds);
        }
    }

    /*@
    addPlace <f> addPlace
        (data) -> <u> add place to places  
    @*/
    that.addPlace = function(data) {
        addPlaceToPlaces(data);
    };

    /*@
    getCenter <f> Returns the map center
        () -> <o> Map center
            lat <n> Latitude
            lng <n> Longitude
    @*/
    that.getCenter = function() {
        var center = self.map.getCenter();
        return {lat: center.lat(), lng: center.lng()};
    };

    /*@
    getKey <f> getKey
        () -> <o>  get key
    @*/
    that.getKey = function() {
        return self.shiftKey ? 'shift'
            : self.metaKey ? 'meta'
            : null;
    };

    /*@
    getSelectedPlace <f> getSelectedPlace
        () -> <o>  get selected place
    @*/
    that.getSelectedPlace = function() {
        return getSelectedPlace();
    }

    /*@
    editPlace <f> editPlace
        () -> <o>  edit selected place
    @*/
    that.editPlace = function() {
        getSelectedPlace().edit();
        return that;
    };

    /*@
    findPlace <f> findPlace
        (name, callback) -> <o>  find place and pass to callback
    @*/
    that.findPlace = function(name, callback) {
        getPlaceByName(name, function(place) {
            if (place) {
                addPlaceToMap(place);
                self.map.fitBounds(place.bounds);
            } else {
                name && self.$findInput.addClass('OxError');
            }
            callback(place);
        });
        return that;
    };

    /*@
    newPlace <f> newPlace
        (place) -> <o>  add place to map
    @*/
    that.newPlace = function(place) {
        addPlaceToMap(place);
        return that;
    };

    /*@
    panToPlace <f> panToPlace
        () -> <o>  pan to place
    @*/
    that.panToPlace = function() {
        panToPlace();
        return that;
    };

    /*@
    removePlace <f> removePlace
        () -> <o>  remove selected place from places
    @*/
    that.removePlace = function() {
        // fixme: removePlaceFromPlaces() ?
        removePlace();
        return that;
    };

    /*@
    resizeMap <f> resizeMap
        () -> <o> resize map
    @*/
    that.resizeMap = function() {
        // keep center on resize has been commented out
        // var center = self.map.getCenter();
        self.options.height = that.height();
        self.options.width = that.width();
        // check if map has initialized
        if (self.map) {
            self.mapHeight = getMapHeight();
            self.minZoom = getMinZoom();
            if (self.minZoom > self.map.getZoom()) {
                self.map.setZoom(self.minZoom);
            }
            self.$map.css({
                height: self.mapHeight + 'px',
                width: self.options.width + 'px'
            });
            self.options.$zoomInput && self.$zoomInput.options({
                size: self.options.width
            });
            updateFormElements();
            Ox.Log('Map', 'triggering google maps resize event, height', self.options.height)
            google.maps.event.trigger(self.map, 'resize');
            // self.map.setCenter(center);
        }
        return that;
    }

    /*@
    setCenter <f> Set map center
        (center) -> <o> Map
        center <o> Map center
            lat <n> Latitude
            lng <n> Longitude
    @*/
    that.setCenter = function(center) {
        self.map.setCenter(new google.maps.LatLng(center.lat, center.lng));
        return that;
    };

    /*@
    value <f> value
        (id, key, value) -> <o>  set id, key to value
    @*/
    that.value = function(id, key, value) {
        // fixme: should be like the corresponding List/TableList/etc value function
        Ox.Log('Map', 'Map.value', id, key, value);
        getPlaceById(id).options(key, value);
        if (id == self.options.selected) {
            if (key == 'name') {
                self.$placeControls.name.options({title: value});
            } else if (key == 'geoname') {
                self.$placeControls.flag.empty().append(
                    Ox.$('<img>').attr({
                        src: Ox.getFlagByGeoname(value, 16)
                    })
                );
            }
        }
        return that;
    }

    /*@
    zoomToPlace <f> zoomToPlace
        () -> <o>  zoom to selected place
    @*/
    that.zoomToPlace = function() {
        zoomToPlace();
        return that;
    };

    /*@
    zoom <f> zoom 
        (value) -> <o>  zoom to value
    @*/
    that.zoom = function(value) {
        zoom(value);
        return that;
    };

    return that;

};
