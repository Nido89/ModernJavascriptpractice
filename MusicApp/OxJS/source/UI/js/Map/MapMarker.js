'use strict';

/*@
Ox.MapMarker <f> MapMarker
    (options) -> <o> MapMarker object
    options <o> Options object
        color <a|[255, 0, 0]> marker color
        map <o|null> map
        place <o|null> place
        size <n|16> size
@*/

Ox.MapMarker = function(options) {

    options = Ox.extend({
        map: null,
        place: null
    }, options);

    var that = this,
        areaSize = {
            100: 10, // 10 x 10 m
            10000: 12, // 100 x 100 m
            1000000: 14, // 1 x 1 km
            100000000: 16, // 10 x 10 km
            10000000000: 18, // 100 x 100 km
            1000000000000: 20, // 1,000 x 1,000 km
            100000000000000: 22 // 10,000 x 10,000 km
        },
        themeData = Ox.Theme.getThemeData(),
        typeColor = {};

    [
        'country', 'region', 'city', 'borough',
        'street', 'building', 'feature'
    ].forEach(function(type) {
        typeColor[type] = themeData[
            'mapPlace' + Ox.toTitleCase(type) + 'Color'
        ];
    });

    Ox.forEach(options, function(val, key) {
        that[key] = val;
    });
    that.marker = new google.maps.Marker({
        raiseOnDrag: false,
        shape: {coords: [8, 8, 8], type: 'circle'}
        //title: that.place.name,
        //zIndex: 1000
    });

    setOptions();

    function click() {
        var key = that.map.getKey(),
            place, bounds, southWest, northEast;
        if (!that.place.selected) {
            if (
                that.map.options('editable')
                && (key == 'meta' || key == 'shift')
            ) {
                place = that.map.getSelectedPlace();
            }
            if (place) {
                bounds = new google.maps.LatLngBounds(
                    new google.maps.LatLng(place.south, place.west),
                    new google.maps.LatLng(place.north, place.east)
                );
                bounds = bounds.union(that.place.bounds);
                southWest = bounds.getSouthWest();
                northEast = bounds.getNorthEast();
                that.map.newPlace(new Ox.MapPlace({
                    // fixme: duplicated, see Ox.Map.js
                    alternativeNames: [],
                    countryCode: '',
                    editable: true,
                    geoname: '',
                    id: '_' + Ox.encodeBase32(Ox.uid()), // fixme: stupid
                    map: that.map,
                    name: '',
                    type: 'feature',
                    south: southWest.lat(),
                    west: southWest.lng(),
                    north: northEast.lat(),
                    east: northEast.lng()
                }));                    
            } else {
                that.map.options({selected: that.place.id});
            }
        } else {
            if (key == 'meta') {
                that.map.options({selected: null});
            } else {
                that.map.panToPlace();
            }
        }
    }

    function dblclick() {
        that.place.selected && that.map.zoomToPlace();
    }

    function dragstart(e) {
        Ox.$body.addClass('OxDragging');
    }

    function drag(e) {
        var northSouth = (that.place.north - that.place.south) / 2,
            lat = Ox.limit(
                e.latLng.lat(),
                Ox.MIN_LATITUDE + northSouth,
                Ox.MAX_LATITUDE - northSouth
            ),
            lng = e.latLng.lng(),
            span = Math.min(
                that.place.sizeEastWest * Ox.getDegreesPerMeter(lat) / 2, 179.99999999
            ),
            degreesPerMeter = Ox.getDegreesPerMeter(lat);
        that.place.south += lat - that.place.lat;
        that.place.north += lat - that.place.lat;
        that.place.west = lng - span;
        that.place.east = lng + span;
        if (that.place.west < -180) {
            that.place.west += 360;
        } else if (that.place.east > 180) {
            that.place.east -= 360;
        }
        Ox.Log('Map', 'west', that.place.west, 'east', that.place.east, 'span', span);
        that.place.update();
        that.marker.setOptions({
            position: that.place.center
        });
        that.place.rectangle.update();
    }

    function dragend(e) {
        Ox.$body.removeClass('OxDragging');
        that.map.triggerEvent('changeplaceend', that.place);
    }

    function getMarkerImage(options, callback) {
        // fixme: unused
        options = Ox.extend({
            background: [255, 0, 0],
            editing: false,
            result: false,
            selected: false,
            size: 16
        }, options);
        var background = options.result ? [255, 255, 0] : [255, 0, 0],
            border = options.editing ? [128, 128, 255] :
               options.selected ? [255, 255, 255] : [0, 0, 0],
            c = Ox.canvas(options.size, options.size),
            image,
            r = options.size / 2;
        if (Ox.isArray(background)) {
            c.context.fillStyle = 'rgba(' + background.join(', ') + ', 0.5)';
            c.context.arc(r, r, r - 2, 0, 360);
            c.context.fill();
            renderImage();
        } else {
            image = new Image();
            image.onload = renderImage;
            image.src = background;
        }
        function renderImage() {
            //var i;
            if (Ox.isString(background)) {
                c.context.drawImage(image, 1, 1, options.size - 2, options.size - 2);
                /*
                c.imageData = c.context.getImageData(0, 0, options.size, options.size);
                c.data = c.imageData.data;
                for (i = 3; i < c.data.length; i += 1) {
                    c.data[i] = Math.round(c.data[i] * 0.5);
                }
                c.context.putImageData(c.imageData, 0, 0);
                */
            }
            c.context.beginPath();
            c.context.lineWidth = 2;
            c.context.strokeStyle = 'rgb(' + border.join(', ') + ')';
            c.context.arc(r, r, r - 1, 0, 360);
            c.context.stroke();
            callback(new google.maps.MarkerImage(
                c.canvas.toDataURL(),
                new google.maps.Size(options.size, options.size),
                new google.maps.Point(0, 0),
                new google.maps.Point(r, r)
            ));
        }
    }

    function mouseover(e) {
        var offset = that.map.offset(),
            xy = that.map.overlayView.getProjection()
                .fromLatLngToContainerPixel(e.latLng);        
        that.tooltip.show(
            offset.left + Math.round(xy.x) - 4,
            offset.top + Math.round(xy.y) + 20
        );
    }

    function mouseout() {
        that.tooltip.hide();
    }

    function setOptions() {
        // workaround to prevent marker from appearing twice
        // after setting draggable from true to false (google maps bug)
        var fix = that.marker.getDraggable() && !that.place.editing,
            color = that.map.options('markerColor'),
            size = that.map.options('markerSize');
        //Ox.Log('Map', 'setOptions, that.map: ', that.map)
        if (color == 'auto') {
            that.color = typeColor[that.place.type];
        } else if (Ox.isArray(color)) {
            that.color = color;
        } else {
            that.color = color(that.place);
        }
        if (size == 'auto') {
            that.size = 8;
            Ox.forEach(areaSize, function(size, area) {
                if (that.place.area >= area) {
                    that.size = size;
                } else {
                    return false; // break
                }
            });
        } else if (Ox.isNumber(size)) {
            that.size = size;
        } else {
            that.size = size(that.place);
        }
        that.marker.setOptions({
            // fixme: cursor remains pointer
            cursor: that.place.editing ? 'move' : 'pointer',
            draggable: that.place.editing,
            icon: Ox.MapMarkerImage({
                color: that.color,
                mode: that.place.editing ? 'editing' :
                    that.place.selected ? 'selected' : 'normal',
                size: that.size,
                type: that.place.id[0] == '_' ? 'result' : 'place'
            }),
            position: that.place.center
        });
        if (fix) {
            that.marker.setVisible(false);
            setTimeout(function() {
                that.marker.setVisible(true);
            }, 0);
        }
        setTooltip();
    }

    function setTooltip() {
        that.tooltip && that.tooltip.remove();
        that.tooltip = Ox.Tooltip({
                title: '<img src="'
                    + Ox.getFlagByGeoname(that.place.geoname, 16)
                    + '" style="float: left; width: 16px; height: 16px; margin: 1px 0 1px -1px; border-radius: 4px"/>'
                    + '<div style="float: left; margin: 4px -1px 0 4px; font-size: 9px;">'
                    + that.map.options('markerTooltip')(that.place) + '</div>'
            })
            .addClass('OxMapMarkerTooltip');
    }

    /*@
    add <f> add to map
        () -> <f> add to map, returns MapMarker
    @*/
    that.add = function() {
        that.marker.setMap(that.map.map);
        google.maps.event.addListener(that.marker, 'click', click);
        google.maps.event.addListener(that.marker, 'dblclick', dblclick);
        google.maps.event.addListener(that.marker, 'mouseover', mouseover);
        google.maps.event.addListener(that.marker, 'mouseout', mouseout);
        return that;
    };

    /*@
    edit <f> edit marker
        () -> <f> edit marker, returns MapMarker
    @*/
    that.edit = function() {
        setOptions();
        google.maps.event.addListener(that.marker, 'dragstart', dragstart);
        google.maps.event.addListener(that.marker, 'drag', drag);
        google.maps.event.addListener(that.marker, 'dragend', dragend);
        return that;
    };

    /*@
    remove <f> remove marker
        () -> <f> remove marker from map, returns MapMarker
    @*/
    that.remove = function() {
        that.marker.setMap(null);
        google.maps.event.clearListeners(that.marker);
        return that;
    };

    /*@
    submit <f> submit marker
        () -> <f> clear edit listeners, returns MapMarker
    @*/
    that.submit = function() {
        google.maps.event.clearListeners(that.marker, 'dragstart');
        google.maps.event.clearListeners(that.marker, 'drag');
        google.maps.event.clearListeners(that.marker, 'dragend');
        return that;
    }

    /*@
    update <f> update marker
        () -> <f> update marker, returns MapMarker
    @*/
    that.update = function() {
        setOptions();
        return that;
    }

    return that;

};
