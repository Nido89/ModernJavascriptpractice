'use strict';

/*@
Ox.MapPlace <f> MapPlace Object
    (options) -> <o> MapPlace Object
    options <o> Options object
        east <n|0> 
        editing <b|false> 
        geoname <s|''> 
        map <o|null> 
        markerColor <a|[255>  0>  0]> 
        markerSize <n|16> 
        name <s|''> 
        north <n|0> 
        selected <b|false> 
        south <n|0> 
        type <s|''> 
        visible <b|false> 
        west <n|0> 
@*/

Ox.MapPlace = function(options) {

    options = Ox.extend({
        east: 0,
        editing: false,
        geoname: '',
        map: null,
        name: '',
        north: 0,
        selected: false,
        south: 0,
        type: '',
        visible: false,
        west: 0
    }, options);

    var that = this;

    Ox.forEach(options, function(val, key) {
        that[key] = val;
    });

    update();

    function update(updateMarker) {
        that.points = {
            ne: new google.maps.LatLng(that.north, that.east),
            sw: new google.maps.LatLng(that.south, that.west)
        };
        that.bounds = new google.maps.LatLngBounds(that.points.sw, that.points.ne);
        that.center = that.bounds.getCenter();
        that.lat = that.center.lat();
        that.lng = that.center.lng();
        Ox.extend(that.points, {
            e: new google.maps.LatLng(that.lat, that.east),
            s: new google.maps.LatLng(that.south, that.lng),
            se: new google.maps.LatLng(that.south, that.east),
            n: new google.maps.LatLng(that.north, that.lng),
            nw: new google.maps.LatLng(that.north, that.west),
            w: new google.maps.LatLng(that.lat, that.west)
        });
        // fixme: use bounds.toSpan()
        that.sizeNorthSouth = (that.north - that.south)
            * Ox.EARTH_CIRCUMFERENCE / 360;
        that.sizeEastWest = (that.east + (that.west > that.east ? 360 : 0) - that.west)
            * Ox.getMetersPerDegree(that.lat);
        that.area = Ox.getArea(
            {lat: that.south, lng: that.west},
            {lat: that.north, lng: that.east}
        );
        if (!that.marker) {
            that.marker = new Ox.MapMarker({
                map: that.map,
                place: that
            });
            that.rectangle = new Ox.MapRectangle({
                map: that.map,
                place: that
            });
        } else if (updateMarker) {
            that.marker.update();
            that.rectangle.update();
        }
    }

    function editable() {
        return that.map.options('editable') && that.editable;
    }

    /*@
    add <f> add
    @*/
    that.add = function() {
        that.visible = true;
        that.marker.add();
        return that;
    };

    /*@
    cancel <f> cancel
    @*/
    that.cancel = function() {
        if (editable()) {
            that.undo();
            that.editing = false;
            that.marker.update();
            that.rectangle.deselect();
        }
        return that;
    };

    /*@
    crossesDateline <f> crossesDateline
    @*/
    that.crossesDateline = function() {
        return that.west > that.east;
    }

    /*@
    deselect <f> dselect
    @*/
    that.deselect = function() {
        that.editing && that.submit();
        that.selected = false;
        that.marker.update();
        that.rectangle.remove();
        return that;
    };

    /*@
    edit <f> edit
    @*/
    that.edit = function() {
        if (editable()) {
            that.editing = true;
            that.original = {
                south: that.south,
                west: that.west,
                north: that.north,
                east: that.east
            };
            that.marker.edit();
            that.rectangle.select();
        }
        return that;
    };

    // fixme: make this an Ox.Element to get options handling for free?
    that.options = function(options) {
        options = Ox.makeObject(arguments);
        Ox.forEach(options, function(value, key) {
            that[key] = value;
        });
        update(true);
    };

    /*@
    remove <f> remove
    @*/
    that.remove = function() {
        that.editing && that.submit();
        that.selected && that.deselect();
        that.visible = false;
        that.marker.remove();
        return that;
    };

    /*@
    select <f> select
    @*/
    that.select = function() {
        that.selected = true;
        !that.visible && that.add();
        that.marker.update();
        that.rectangle.add();
        return that;
    };

    /*@
    submit <f> submit
    @*/
    that.submit = function() {
        if (editable()) {
            that.editing = false;
            that.marker.update();
            that.rectangle.deselect();
        }
        return that;
    };

    /*@
    update <f> update
    @*/
    that.update = function(updateMarker) {
        update(updateMarker);
        that.map.triggerEvent('changeplace', that);
        return that;
    };

    /*@
    undo <f> undo
    @*/
    that.undo = function() {
        if (editable()) {
            Ox.forEach(that.original, function(v, k) {
                that[k] = v;
            });
            that.update();
            that.marker.update();
            that.rectangle.update();
        }
        return that;
    };

    return that;

};
