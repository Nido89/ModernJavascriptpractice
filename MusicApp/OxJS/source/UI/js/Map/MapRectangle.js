'use strict';

/*@
Ox.MapRectangle <f> MapRectangle Object
    (options) -> <o> MapRectangle Object
    options <o> Options object
        map <o|null> map
        place <o|null> place
@*/

Ox.MapRectangle = function(options) {

    options = Ox.extend({
        map: null,
        place: null
    }, options);

    var that = this,
        themeData = Ox.Theme.getThemeData();

    Ox.forEach(options, function(val, key) {
        that[key] = val;
    });

    /*@
    rectangle <f> google.maps.Rectangle
    @*/
    that.rectangle = new google.maps.Rectangle({
        clickable: true,
        bounds: that.place.bounds
    });
    /*@
    markers <a> array of markers
    @*/
    that.markers = Ox.map(that.place.points, function(point, position) {
        return new Ox.MapRectangleMarker({
            map: that.map,
            place: that.place,
            position: position
        });
    });

    setOptions();

    function click() {
        if (
            that.map.options('editable')
            && that.place.editable
            && !that.place.editing
        ) {
            that.place.edit();
        } else if (that.map.getKey() == 'meta') {
            that.place.submit();
        } else if (that.map.getKey() == 'shift') {
            that.map.zoomToPlace();
        } else {
            that.map.panToPlace();
        }
    }

    function setOptions() {
        var color = '#' + Ox.toHex(themeData[
            that.place.editing
            ? 'mapPlaceEditingBorder'
            : 'mapPlaceSelectedBorder'
        ]);
        that.rectangle.setOptions({
            bounds: that.place.bounds,
            fillColor: color,
            fillOpacity: that.place.editing ? 0.1 : 0,
            strokeColor: color,
            strokeOpacity: that.place.id[0] == '_' ? 0.5 : 1,
            strokeWeight: 2
        });
    }

    /*@
    add <f> add
    @*/
    that.add = function() {
        that.rectangle.setMap(that.map.map);
        google.maps.event.addListener(that.rectangle, 'click', click);
        return that;
    };

    /*@
    deselect <f> deselect
    @*/
    that.deselect = function() {
        setOptions();
        Ox.Log('Map', 'MARKERS', that.markers)
        Ox.forEach(that.markers, function(marker) {
            marker.remove();
        });
        return that;
    };

    /*@
    remove <f> remove
    @*/
    that.remove = function() {
        that.rectangle.setMap(null);
        google.maps.event.clearListeners(that.rectangle);
        return that;
    }

    /*@
    select <f> select
    @*/
    that.select = function() {
        setOptions();
        Ox.forEach(that.markers, function(marker) {
            marker.add();
        });
        return that;
    };

    /*@
    update <f> udpate
    @*/
    that.update = function() {
        Ox.Log('Map', 'UPDATE...')
        setOptions();
        Ox.forEach(that.markers, function(marker) {
            marker.update();
        });
        return that;
    }

    return that;

};
