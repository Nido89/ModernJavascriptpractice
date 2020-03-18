'use strict';

(function() {

    // fixme: make all this work with different types of "points"
    // i.e. {lat, lng}, [lat, lng]

    function deg(point) {
        return Ox.map(point, function(val) {
            return Ox.mod(Ox.deg(val) + 180, 360) - 180;
        });
    }

    function rad(point) {
        return Ox.map(point, function(val) {
            return Ox.rad(val);
        });
    }

    function splitArea(area) {
        return Ox.crossesDateline(area.sw, area.ne) ? [
            {sw: area.sw, ne: {lat: area.ne.lat, lng: 180}},
            {sw: {lat: area.sw.lat, lng: -180}, ne: area.ne}
        ] : [area];
    }

    /*@
    Ox.crossesDateline <f> Returns true if a given line crosses the dateline
        > Ox.crossesDateline({lat: 0, lng: -90}, {lat: 0, lng: 90})
        false
        > Ox.crossesDateline({lat: 0, lng: 90}, {lat: 0, lng: -90})
        true
    @*/
    // FIXME: argument should be {w: ..., e: ...}
    Ox.crossesDateline = function(pointA, pointB) {
        return pointA.lng > pointB.lng;
    };

    /*@
    Ox.getArea <f> Returns the area in square meters of a given rectancle
    @*/
    // FIXME: argument should be {sw: ..., ne: ...}
    Ox.getArea = function(pointA, pointB) {
        /*
        area of a ring between two latitudes:
        2 * PI * r^2 * abs(sin(latA) - sin(latB))
        see http://mathforum.org/library/drmath/view/63767.html
        =>
        2 * Math.PI
        * Math.pow(Ox.EARTH_RADIUS, 2)
        * Math.abs(Math.sin(Ox.rad(latA)) - Math.sin(Ox.rad(latB)))
        * Math.abs(Ox.rad(lngA) - Ox.rad(lngB))
        / (2 * Math.PI)
        */
        if (Ox.crossesDateline(pointA, pointB)) {
            pointB.lng += 360;
        }
        pointA = rad(pointA);
        pointB = rad(pointB);
        return Math.pow(Ox.EARTH_RADIUS, 2)
            * Math.abs(Math.sin(pointA.lat) - Math.sin(pointB.lat))
            * Math.abs(pointA.lng - pointB.lng);
    };

    /*@
    Ox.getAverageBearing <f> Returns the average of two bearings
        > Ox.getAverageBearing(0, 90)
        45
        > Ox.getAverageBearing(10, 350)
        0
    @*/
    // FIXME: find the proper name of this operation
    // FIMXE: use in manhattan grid example
    Ox.getAverageBearing = function(bearingA, bearingB) {
        return Ox.mod((bearingA + bearingB) / 2 + (
            Math.abs(bearingA - bearingB) > 180 ? 180 : 0
        ), 360);
    };

    /*@
    Ox.getBearing <f> Returns the bearing from one point to another
        > Ox.getBearing({lat: -45, lng: 0}, {lat: 45, lng: 0})
        0
        > Ox.getBearing({lat: 0, lng: -90}, {lat: 0, lng: 90})
        90
    @*/
    Ox.getBearing = function(pointA, pointB) {
        pointA = rad(pointA);
        pointB = rad(pointB);
        var x = Math.cos(pointA.lat) * Math.sin(pointB.lat)
                - Math.sin(pointA.lat) * Math.cos(pointB.lat)
                * Math.cos(pointB.lng - pointA.lng),
            y = Math.sin(pointB.lng - pointA.lng)
                * Math.cos(pointB.lat);
        return (Ox.deg(Math.atan2(y, x)) + 360) % 360;
    };

    // FIXME: name, docs
    Ox.getBearingDifference = function(bearingA, bearingB) {
        var difference = Math.abs(bearingA - bearingB);
        return difference > 180 ? 360 - difference : difference;
    };

    /*@
    Ox.getCenter <f> Returns the center of a recangle on a spehre
        > Ox.getCenter({lat: -45, lng: -90}, {lat: 45, lng: 90})
        {lat: 0, lng: 0}
    @*/
    Ox.getCenter = function(pointA, pointB) {
        pointA = rad(pointA);
        pointB = rad(pointB);
        var x = Math.cos(pointB.lat)
                * Math.cos(pointB.lng - pointA.lng),
            y = Math.cos(pointB.lat)
                * Math.sin(pointB.lng - pointA.lng),
            d = Math.sqrt(
                Math.pow(Math.cos(pointA.lat) + x, 2) + Math.pow(y, 2)
            ),
            lat = Math.atan2(Math.sin(pointA.lat) + Math.sin(pointB.lat), d),
            lng = pointA.lng + Math.atan2(y, Math.cos(pointA.lat) + x);
        return deg({lat: lat, lng: lng});
    };

    /*@
    Ox.getCircle <f> Returns points on a circle around a given point
        (center, radius, precision) -> <a> Points
        center    <o> Center point ({lat, lng})
        radius    <n> Radius in meters
        precision <n> Precision (the circle will have 2^precision segments)
    @*/
    Ox.getCircle = function(center, radius, precision) {
        return Ox.range(
            0, 360, 360 / Math.pow(2, precision)
        ).map(function(bearing) {
            return Ox.getPoint(center, radius, bearing);
        });
    };

    // FIXME: name, docs
    Ox.getClosestBearing = function(bearing, bearings) {
        var differences = bearings.map(function(bearing_) {
            return getBearingDifference(bearing, bearing_);
        });
        return bearings[differences.indexOf(Ox.min(differences))];
    };

    /*@
    Ox.getDegreesPerMeter <f> Returns degrees per meter at a given latitude
        > 360 / Ox.getDegreesPerMeter(0)
        Ox.EARTH_CIRCUMFERENCE
    @*/
    Ox.getDegreesPerMeter = function(lat) {
        return 360 / Ox.EARTH_CIRCUMFERENCE / Math.cos(lat * Math.PI / 180);
    };

    /*@
    Ox.getDistance <f> Returns the distance in meters between two points
        > Ox.getDistance({lat: -45, lng: -90}, {lat: 45, lng: 90}) * 2
        Ox.EARTH_CIRCUMFERENCE
    @*/
    Ox.getDistance = function(pointA, pointB) {
        pointA = rad(pointA);
        pointB = rad(pointB);
        return Math.acos(
            Math.sin(pointA.lat) * Math.sin(pointB.lat)
            + Math.cos(pointA.lat) * Math.cos(pointB.lat)
            * Math.cos(pointB.lng - pointA.lng)
        ) * Ox.EARTH_RADIUS;
    };

    /*@
    Ox.getLatLngByXY <f> Returns lat/lng for a given x/y on a 1x1 mercator projection
        > Ox.getLatLngByXY({x: 0.5, y: 0.5})
        {lat: -0, lng: 0}
    @*/
    Ox.getLatLngByXY = function(xy) {
        function getValue(value) {
            return (value - 0.5) * 2 * Math.PI;
        }
        return {
            lat: -Ox.deg(Math.atan(Ox.sinh(getValue(xy.y)))),
            lng: Ox.deg(getValue(xy.x))
        };
    };

    /*@
    Ox.getLine <f> Returns points on a line between two points
        (pointA, pointB, precision) -> <a> Points
        pointA    <o> Start point ({lat, lng})
        pointB    <o> End point ({lat, lng})
        precision <n> Precision (the line will have 2^precision segments)
    @*/
    Ox.getLine = function(pointA, pointB, precision) {
        var line = [pointA, pointB], points;
        while (precision > 0) {
            points = [line[0]];
            Ox.loop(line.length - 1, function(i) {
                points.push(
                    Ox.getCenter(line[i], line[i + 1]),
                    line[i + 1]
                );
            });
            line = points;
            precision--;
        }
        return line;
    };

    /*@
    Ox.getMetersPerDegree <f> Returns meters per degree at a given latitude
        > Ox.getMetersPerDegree(0) * 360
        Ox.EARTH_CIRCUMFERENCE
    @*/
    Ox.getMetersPerDegree = function(lat) {
        return Math.cos(lat * Math.PI / 180) * Ox.EARTH_CIRCUMFERENCE / 360;
    };

    /*@
    Ox.getPoint <f> Returns a point at a given distance/bearing from a given point
        > Ox.getPoint({lat: -45, lng: 0}, Ox.EARTH_CIRCUMFERENCE / 4, 0)
        {lat: 45, lng: 0}
    @*/
    Ox.getPoint = function(point, distance, bearing) {
        var pointB = {};
        point = rad(point);
        distance /= Ox.EARTH_RADIUS;
        bearing = Ox.rad(bearing);
        pointB.lat = Math.asin(
            Math.sin(point.lat) * Math.cos(distance)
            + Math.cos(point.lat) * Math.sin(distance) * Math.cos(bearing)
        );
        pointB.lng = point.lng + Math.atan2(
            Math.sin(bearing) * Math.sin(distance) * Math.cos(point.lat),
            Math.cos(distance) - Math.sin(point.lat) * Math.sin(pointB.lat)
        );
        return deg(pointB);
    };

    /*@
    Ox.getXYByLatLng <f> Returns x/y on a 1x1 mercator projection for a given lat/lng
        > Ox.getXYByLatLng({lat: 0, lng: 0})
        {x: 0.5, y: 0.5}
    @*/
    Ox.getXYByLatLng = function(latlng) {
        function getValue(value) {
            return value / (2 * Math.PI) + 0.5;
        }
        return {
            x: getValue(Ox.rad(latlng.lng)),
            y: getValue(Ox.asinh(Math.tan(Ox.rad(-latlng.lat))))
        };
    };

    /*@
    Ox.isPolar <f> Returns true if a given point is outside the bounds of a mercator projection
        > Ox.isPolar({lat: 90, lng: 0})
        true
    @*/
    Ox.isPolar = function(point) {
        return point.lat < Ox.MIN_LATITUDE || point.lat > Ox.MAX_LATITUDE;
    };

    /*@
    Ox.containsArea <f> Returns true if an area contains another area
        <script>
            Ox.test.areas = [
                {sw: {lat: -30, lng: -30}, ne: {lat: 30, lng: 30}},
                {sw: {lat: -20, lng: -40}, ne: {lat: 20, lng: 40}},
                {sw: {lat: -30, lng: 150}, ne: {lat: 30, lng: -150}},
                {sw: {lat: 10, lng: -170}, ne: {lat: 20, lng: -160}}
            ];
        </script>
        > Ox.containsArea(Ox.test.areas[0], Ox.test.areas[1])
        false
        > Ox.containsArea(Ox.test.areas[2], Ox.test.areas[3])
        true
    @*/
    // FIXME: Shouldn't this be rewritten as a test
    // if the intersection is equal to the inner area?
    Ox.containsArea = function(areaA, areaB) {
        // If an area crosses the dateline,
        // we split it into two parts,
        // west and east of the dateline
        var areas = [areaA, areaB].map(splitArea), ret;
        function contains(areaA, areaB) {
            return areaA.sw.lat <= areaB.sw.lat
                && areaA.sw.lng <= areaB.sw.lng
                && areaA.ne.lat >= areaB.ne.lat
                && areaA.ne.lng >= areaB.ne.lng;
        }
        // For each part of the inner area, test if it
        // is contained in any part of the outer area
        Ox.forEach(areas[1], function(area1) {
            Ox.forEach(areas[0], function(area0) {
                ret = contains(area0, area1);
                // Break if the outer part contains the inner part
                return !ret;
            });
            // Break if no outer part contains the inner part
            return ret;
        });
        return ret;
    };

    /*@
    Ox.intersectAreas <f> Returns the intersection of two areas, or null
        <script>
            Ox.test.areas = [
                {sw: {lat: -10, lng: -10}, ne: {lat: 0, lng: 0}},
                {sw: {lat: 0, lng: 0}, ne: {lat: 10, lng: 10}},
                {sw: {lat: -30, lng: 150}, ne: {lat: 30, lng: -150}},
                {sw: {lat: 25, lng: -155}, ne: {lat: 35, lng: -145}}
            ];
        </script>
        > Ox.intersectAreas([Ox.test.areas[0], Ox.test.areas[1]])
        {sw: {lat: 0, lng: 0}, ne: {lat: 0, lng: 0}}
        > Ox.intersectAreas([Ox.test.areas[2], Ox.test.areas[3]])
        {sw: {lat: 25, lng: -155}, ne: {lat: 30, lng: -150}}
    @*/
    // FIXME: handle the a corner case where
    // two areas have two intersections
    Ox.intersectAreas = function(areas) {
        var intersections, ret;
        // If an area crosses the dateline,
        // we split it into two parts,
        // west and east of the dateline
        areas = areas.map(splitArea);
        ret = areas[0];
        function intersect(areaA, areaB) {
            return areaA.sw.lat > areaB.ne.lat
                || areaA.sw.lng > areaB.ne.lng
                || areaA.ne.lat < areaB.sw.lat
                || areaA.ne.lng < areaB.sw.lng
            ? null : {
                sw: {
                    lat: Math.max(areaA.sw.lat, areaB.sw.lat),
                    lng: Math.max(areaA.sw.lng, areaB.sw.lng)
                },
                ne: {
                    lat: Math.min(areaA.ne.lat, areaB.ne.lat),
                    lng: Math.min(areaA.ne.lng, areaB.ne.lng)
                }
            };
        }
        Ox.forEach(areas.slice(1), function(parts) {
            if (ret.length == 1 && parts.length == 1) {
                ret = intersect(ret[0], parts[0]);
            } else {
                // intersect each part of the intersection
                // with all parts of the next area
                intersections = Ox.compact(ret.map(function(part) {
                    return Ox.intersectAreas(parts.concat(part));
                }));
                ret = intersections.length == 0 ? null
                    : Ox.joinAreas(intersections);
            }
            if (ret === null) {
                return false; // break
            } else {
                ret = splitArea(ret);
            }
        });
        return ret ? Ox.joinAreas(ret) : null;
    };

    /*@
    Ox.joinAreas <f> Joins an array of areas
        <script>
            Ox.test.areas = [
                {sw: {lat: -30, lng: 150}, ne: {lat: -20, lng: 160}},
                {sw: {lat: -10, lng: 170}, ne: {lat: 10, lng: -170}},
                {sw: {lat: 20, lng: -160}, ne: {lat: 30, lng: -150}}
            ];
        </script>
        > Ox.joinAreas(Ox.test.areas)
        {sw: {lat: -30, lng: 150}, ne: {lat: 30, lng: -150}}
    @*/
    Ox.joinAreas = function(areas) {
        // While the combined latitude is trivial (min to max), the combined longitude
        // spans from the eastern to the western edge of the largest gap between areas
        var ret = areas[0],
            gaps = [{
                sw: {lat: -90, lng: ret.ne.lng},
                ne: {lat: 90, lng: ret.sw.lng}
            }];
        function containsGaps(area) {
            return Ox.getIndices(gaps, function(gap) {
                return Ox.containsArea({
                    sw: {lat: -90, lng: area.sw.lng},
                    ne: {lat: 90, lng: area.ne.lng}
                }, gap);
            });
        }
        function intersectsWithGaps(area) {
            var ret = {};
            gaps.forEach(function(gap, i) {
                var intersection = Ox.intersectAreas([area, gap]);
                if (intersection) {
                    ret[i] = intersection;
                }
            });
            return ret;
        }
        function isContainedInGap(area) {
            var ret = -1;
            Ox.forEach(gaps, function(gap, i) {
                if (Ox.containsArea(gap, area)) {
                    ret = i;
                    return false; // break
                }
            });
            return ret;
        }
        areas.slice(1).forEach(function(area) {
            var index, indices, intersections;
            if (area.sw.lat < ret.sw.lat) {
                ret.sw.lat = area.sw.lat;
            }
            if (area.ne.lat > ret.ne.lat) {
                ret.ne.lat = area.ne.lat;
            }
            // If the area is contained in a gap, split the gap in two
            index = isContainedInGap(area);
            if (index > -1) {
                gaps.push({
                    sw: gaps[index].sw,
                    ne: {lat: 90, lng: area.sw.lng}
                });
                gaps.push({
                    sw: {lat: -90, lng: area.ne.lng},
                    ne: gaps[index].ne
                });
                gaps.splice(index, 1);
            } else {
                // If the area contains gaps, remove them
                indices = containsGaps(area);
                Ox.reverse(indices).forEach(function(index) {
                    gaps.splice(index, 1);
                });
                // If the area intersects with gaps, shrink them
                intersections = intersectsWithGaps(area);
                Ox.forEach(intersections, function(intersection, index) {
                    gaps[index] = {
                        sw: {
                            lat: -90,
                            lng: gaps[index].sw.lng == intersection.sw.lng
                                ? intersection.ne.lng : gaps[index].sw.lng
                        },
                        ne: {
                            lat: 90,
                            lng: gaps[index].ne.lng == intersection.ne.lng
                                ? intersection.sw.lng : gaps[index].ne.lng
                        }
                    };
                });
            }
        });
        if (gaps.length == 0) {
            ret.sw.lng = -180;
            ret.ne.lng = 180;
        } else {
            gaps.sort(function(a, b) {
                return (
                    b.ne.lng
                    + (Ox.crossesDateline(b.sw, b.ne) ? 360 : 0)
                    - b.sw.lng
                ) - (
                    a.ne.lng
                    + (Ox.crossesDateline(a.sw, a.ne) ? 360 : 0)
                    - a.sw.lng
                );
            });
            ret.sw.lng = gaps[0].ne.lng;
            ret.ne.lng = gaps[0].sw.lng;
        }
        return ret;
    };

}());

