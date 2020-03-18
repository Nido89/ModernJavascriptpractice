'use strict';

/*@
Ox.MapRectangleMarker <f> MapRectangleMarker Object
    (options) -> <o> MapRectangleMarker Object
    options <o> Options object
        map <o|null> map
        place <o|null> place
        position <s|''>
@*/

Ox.MapRectangleMarker = function(options) {

    options = Ox.extend({
        map: null,
        place: null,
        position: ''
    }, options);

    var that = this;

    Ox.forEach(options, function(val, key) {
        that[key] = val;
    });

    that.markerImage = new google.maps.MarkerImage
    that.marker = new google.maps.Marker({
        cursor: that.position + '-resize',
        draggable: true,
        icon: Ox.MapMarkerImage({
            mode: 'editing',
            rectangle: true,
            type: that.place.id[0] == '_' ? 'result' : 'place'
        }),
        position: that.place.points[that.position],
        raiseOnDrag: false
    });

    function dragstart(e) {
        Ox.$body.addClass('OxDragging');
        that.drag = {
            lat: e.latLng.lat(),
            lng: e.latLng.lng()
        };
    }

    function drag(e) {
        // fixme: implement shift+drag (center stays the same)
        Ox.Log('Map', e.pixel.x, e.pixel.y)
        var lat = Ox.limit(e.latLng.lat(), Ox.MIN_LATITUDE, Ox.MAX_LATITUDE),
            lng = e.latLng.lng();
        that.drag = {
            lat: lat,
            lng: lng
        };
        if (that.position.indexOf('s') > -1) {
            that.place.south = lat;
        }
        if (that.position.indexOf('n') > -1) {
            that.place.north = lat;
        }
        if (that.position.indexOf('w') > -1) {
            that.place.west = lng;
        }
        if (that.position.indexOf('e') > -1) {
            that.place.east = lng;
        }
        //Ox.Log('Map', 'west', that.place.west, 'east', that.place.east);
        //Ox.Log('Map', 'south', that.place.south, 'north', that.place.north);
        that.place.update();
        that.place.marker.update();
        that.place.rectangle.update();
    }

    function dragend(e) {
        var south;
        Ox.$body.removeClass('OxDragging');
        if (that.place.south > that.place.north) {
            south = that.place.south;
            that.place.south = that.place.north;
            that.place.north = south;
            that.place.update();
            that.place.marker.update();
            that.place.rectangle.update();
        }
        that.map.triggerEvent('changeplaceend', that.place);
    }

    /*@
    add <f> add
    @*/
    that.add = function() {
        that.marker.setMap(that.map.map);
        google.maps.event.addListener(that.marker, 'dragstart', dragstart);
        google.maps.event.addListener(that.marker, 'drag', drag);
        google.maps.event.addListener(that.marker, 'dragend', dragend);
    };

    /*@
    remove <f> remove
    @*/
    that.remove = function() {
        that.marker.setMap(null);
        google.maps.event.clearListeners(that.marker);
    };

    /*@
    update <f> update
    @*/
    that.update = function() {
        that.marker.setOptions({
            icon: Ox.MapMarkerImage({
                mode: 'editing',
                rectangle: true,
                type: that.place.id[0] == '_' ? 'result' : 'place'
            }),
            position: that.place.points[that.position]
        });
    };

    return that;

};
