/*
The idea (a slight variation of a proposal by <a href="http://extendny.com/"
target="_blank">Harold Cooper</a> is to extend the Manhattan Grid in all
directions, so that every point on Earth can be addressed as "Xth Ave & Yth St".

The origin of this coordinate system is the intersection of Zero Ave (a.k.a.
Avenue A) and Zero St (a.k.a. Houston St). Avenues east of Zero Ave, just as
Streets south of Zero St, have negative numbers. Broadway, which will split not
only Manhattan but the entire globe into an eastern and a western hemisphere,
retains its orientation, but is adjusted slightly so that it originates at the
intersection of Zero & Zero. From there, Broadway, Zero Ave and Zero St continue
as perfectly straight equatorial lines. All three will intersect once more,
exactly halfway, in the Indian Ocean, (southwest of Australia), at the point
furthest from Manhattan.

As subsequent avenues remain exactly parallel to Zero Ave, and subsequent
streets exactly parallel to Zero St, they form smaller and smaller circles
around the globe. The northernmost and southernmost streets are small circles
in Central Asia (east of the Caspian Sea) and the southern Pacific (near Easter
Island), the westernmost and easternmost avenues small circles in the North
Pacific (west of Hawaii) and the South Atlantic (near St. Helena). These four
extreme points are the North Pole, South Pole, West Pole and East Pole of the
coordinate system.
*/

'use strict';

/*
First of all, we include the Image module. We're going to draw paths on a map
image, and Ox.Image provides a `drawPath` method for that.
*/
Ox.load('Image', function() {

    /*
    Ox.EARTH_CIRCUMFERENCE (40075016.68557849) is a built-in constant.
    */
    var C = Ox.EARTH_CIRCUMFERENCE,
        /*
        We need a few points to determine the orientation and spacing of
        avenues and streets.
        */
        points = {
            /*
            Columbus Circle (8th Ave and 59th St), the lower western corner of
            Central Park
            */
            '8 & 59': {lat: 40.76807,lng: -73.98190},
            /*
            The upper western corner of Central Park, 51 streets up from
            Columbus Circle
            */
            '8 & 110': {lat: 40.80058, lng: -73.95818},
            /*
            The lower eastern corner of Central Park, 3 avenues east of
            Columbus Circle
            */
            '5 & 59': {lat: 40.76429, lng: -73.97301},
        },
        /*
        Ox.getBearing returns the bearing, in degrees, from one lat/lng pair to
        another. To make sure that avenues and streets cross at an exact right
        angle, we first calculate the bearing of a line that cuts the upper
        western quadrant of Columbus Circle in half, then add 45 degrees for
        the direction of the avenues and subtract 45 degrees for the direction
        of the streets.
        */
        bearing = (
            Ox.getBearing(points['8 & 59'], points['8 & 110'])
            + Ox.getBearing(points['5 & 59'], points['8 & 59'])
        ) / 2 + 180,
        bearings = {
            // fixme: Ox.mod ?
            avenues: (bearing + 45) % 360,
            streets: (bearing - 45) % 360
        },
        /*
        Ox.getDistance returns the distance, in meters, from one lat/lng pair
        to another. We use this to determine the spacing between avenues and
        between streets. The result is 287 meters between Avenues and 81 meters
        between streets, which is not too far from the
        <a href="http://en.wikipedia.org/wiki/Commissioners'&#95;Plan&#95;of&#95;1811"
        target="_blank">actual plan</a> of the grid.
        */
        distances = {
            avenues: Ox.getDistance(points['8 & 59'], points['5 & 59']) / 3,
            streets: Ox.getDistance(points['8 & 59'], points['8 & 110']) / 51
        },
        /*
        The number of avenues and streets, in each direction, is a quarter of
        the Earth's circumference divided by the respective spacing. The result
        is 34,966 avenues and 123,582 streets.
        */
        numbers = Ox.map(distances, function(distance) {
            return C / 4 / distance;
        }),
        /*
        A few more variables that we'll need later.
        */
        colors = {
            broadway: 'rgba(0, 0, 255, 0.5)',
            avenues: 'rgba(0, 255, 0, 0.5)',
            streets: 'rgba(255, 0, 0, 0.5)'
        },
        lines,
        poles,
        mapSize,
        precision = 8,
        step = 10000,
        $body = Ox.$('body'),
        $post = Ox.$('<div>').addClass('post').hide().appendTo($body),
        $sign = Ox.$('<div>').addClass('sign').hide().appendTo($body),
        $images = [];
    /*
    Ox.getPoint takes a lat/lng pair, a distance and a bearing, and returns the
    resulting point. We use this to construct the origin of the coordinate
    system, by moving Columbus Circle by minus 59 streets in the direction of
    the avenues and then by minus 8 avenues in the direction of the streets.
    The resulting point is on Stanton St between Norfolk St and Suffolk St,
    which is pretty close to where we expected it to be.
    */
    points['0 & 0'] = Ox.getPoint(
        Ox.getPoint(
            points['8 & 59'],
            -59 * distances.streets,
            bearings.avenues
        ),
        -8 * distances.avenues,
        bearings.streets
    );
    /*
    The second intersection of Zero Ave, Zero St and Broadway is half of the
    Earth's circumference away from the first one, in any direction.
    */
    points['-0 & -0'] = Ox.getPoint(
        points['0 & 0'],
        Ox.EARTH_CIRCUMFERENCE / 2,
        0
    );
    /*
    Now that we have constructed the origin, we can calculate the bearing of
    Broadway, which runs from Zero & Zero through Columbus Circle.
    */
    bearings.broadway = Ox.getBearing(points['0 & 0'], points['8 & 59']),
    /*
    Also, we can construct the poles, each of which is a quarter of Earth's
    circumference away from Zero & Zero.
    */
    poles = {
        north: Ox.getPoint(points['0 & 0'], C / 4, bearings.avenues),
        south: Ox.getPoint(points['0 & 0'], -C / 4, bearings.avenues),
        west: Ox.getPoint(points['0 & 0'], C / 4, bearings.streets),
        east: Ox.getPoint(points['0 & 0'], -C / 4, bearings.streets),
        /*
        Broadway has two poles as well, and constructing them will make drawing
        easier. Ox.mod is the modulo function. Unlike `-90 % 360`,
        which in JavaScript is -90, `Ox.mod(-90, 360)` returns 270.
        */
        westBroadway: Ox.getPoint(
            points['0 & 0'],
            C / 4,
            Ox.mod(bearings.broadway - 90, 360)
        ),
        eastBroadway: Ox.getPoint(
            points['0 & 0'],
            C / 4,
            Ox.mod(bearings.broadway + 90, 360)
        )
    };
    /*
    Now we calculate circles for Broadway, Avenues and Streets. Ox.getCircle
    returns an array of lat/lng pairs that form a circle around a given point,
    with a given radius and a given precision, so that the circle will have
    `Math.pow(2, precision)` segments. 
    */
    lines = {
        /*
        Since there is only one Broadway, this is an array with just one circle
        that runs around one of the Broadway Poles, at a distance of a quarter
        of the Earth's circumference.
        */
        broadway: [Ox.getCircle(poles.westBroadway, C / 4, precision)],
        /*
        For each 10,000th avenue, we compute a circle around the East Pole.
        From there, avenues range from -34,966th to 34,966th, so we start at a
        distance of 966 avenues from the pole, stop once the distance is half
        of the Earth's circumference (the West Pole), and in each step increase
        the distance by 10,000 avenues.
        */
        avenues: Ox.range(
            distances.avenues * (numbers.avenues % step),
            C / 2,
            distances.avenues * step
        ).map(function(distance) {
            return Ox.getCircle(poles.east, distance, precision);
        }),
        /*
        Then we do the same for streets, starting at the South Pole.
        */
        streets: Ox.range(
            distances.streets * (numbers.streets % step),
            C / 2,
            distances.streets * step
        ).map(function(distance) {
            return Ox.getCircle(poles.south, distance, precision);
        })
    };
    /*
    Print our data to the console.
    */
    Ox.print(JSON.stringify({
        bearings: bearings,
        distances: distances,
        numbers: numbers,
        points: points,
        poles: poles
    }, null, '    '));

    /*
    Before we start drawing, we define a few helper functions.
    `getXYByLatLng` returns screen coordinates for a given point.
    We use Ox.getXYByLatLng, which takes a lat/lng pair and returns its x/y
    position on a 1×1 Mercator projection, with `{x: 0, y: 0}` at the
    top left and `{x: 1, y: 1}` at the bottom right.
    */
    function getXYByLatLng(point) {
        return Ox.map(Ox.getXYByLatLng(point), function(v) {
            return v * mapSize;
        });
    }

    /*
    `getLatLngByXY` is the inverse of the above, just like
    Ox.getLatLngByXY.
    */
    function getLatLngByXY(xy) {
        return Ox.getLatLngByXY(Ox.map(xy, function(v) {
            return v / mapSize;
        }));
    }

    /*
    `getASByLatLng` takes lat/lng and returns avenue/street. To
    compute the avenue, we subtract the point's distance from the West Pole, in
    avenues, from the total number of avenues. To compute the street, we
    subtract the point's distance from the North Pole, in streets, from the
    total number of streets. We also return the bearing of the avenues at this
    point (which form a right angle with the line from the point to the West
    Pole), the bearing of the streets (at a right angle with the line to the
    North Pole) and the hemisphere (east or west of Broadway).
    */
    function getASByLatLng(point) {
        var n = Ox.getDistance(point, poles.north),
            w = Ox.getDistance(point, poles.west);
        return {
            avenue: numbers.avenues - w / distances.avenues,
            street: numbers.streets - n / distances.streets,
            bearings: {
                avenues: Ox.mod(Ox.getBearing(point, poles.west) + (
                    w < C / 4 ? -90 : 90
                ), 360),
                streets: Ox.mod(Ox.getBearing(point, poles.north) + (
                    n < C / 4 ? -90 : 90
                ), 360)
            },
            hemisphere: Ox.getDistance(point, poles.eastBroadway) < C / 4
                ? 'E' : 'W'
        };        
    }

    /*
    `getASByXY` returns avenue and street at the given screen
    coordinates.
    */
    function getASByXY(xy) {
        return getASByLatLng(getLatLngByXY(xy));
    }

    /*
    `drawPath` draws a path of lat/lng pairs on an image. For each
    path segment, we have to check if it crosses the eastern or western edge of
    the map that splits the Pacific Ocean. Note that our test (a segment
    crosses the edge if it spans more than 180 degrees longitude) is obviously
    incorrect, but works in our case, since all segments are sufficiently
    short.
    */
    function drawPath(image, path, options) {
        var n, parts = [[]];
        /*
        Close the path by appending the first point.
        */
        path.push(path[0]);
        n = path.length;
        Ox.loop(n, function(i) {
            var lat, lng, split;
            /*
            Append each point to the last part.
            */
            Ox.last(parts).push(path[i]);
            if (Math.abs(path[i].lng - path[(i + 1) % n].lng) > 180) {
                /*
                If the next line crosses the edge, get the lat/lng of the
                points where the line leaves and enters the map.
                */
                lat = Ox.getCenter(path[i], path[i + 1]).lat;
                lng = path[i].lng < 0 ? [-180, 180] : [180, -180];
                /*
                Append the first point to the last part and create a new part
                with the second point.
                */
                Ox.last(parts).push({lat: lat, lng: lng[0]});
                parts.push([{lat: lat, lng: lng[1]}]);
            }
        });
        /*
        We draw each part, translating lat/lng to [x, y].
        */
        parts.forEach(function(part) {
            image.drawPath(part.map(function(point) {
                var xy = getXYByLatLng(point);
                return [xy.x, xy.y];
            }), options);
        });
    }

    /*
    Now it's time to load our map image.
    */
    Ox.Image('jpg/earth1024.jpg', function(image) {

        mapSize = image.getSize().width;
        /*
        First, we draw a circle, centered at the intersection of Zero Ave and
        Zero St, with a radius of the quarter of the Earth's circumference. This
        is the line that runs through all four poles of our coordinate system.
        */
        drawPath(image, Ox.getCircle(points['0 & 0'], C / 4, precision), {
            color: 'rgba(255, 255, 255, 0.25)'
        });
        /*
        Then, we draw the streets, avenues and Broadway. Zero St, Zero Ave and
        Broadway will be twice as bold as the others.
        */
        ['streets', 'avenues', 'broadway'].forEach(function(type) {
            lines[type].forEach(function(line, i) {
                drawPath(image, line, {
                    color: colors[type],
                    width: i == lines[type].length / 2 - 0.5 ? 2 : 1
                });
            });
        });

        /*
        Now we load the map image as the background of our document, and attach
        a few event handlers.
        */
        $body.css({
                minWidth: mapSize + 'px',
                height: mapSize + 'px',
                backgroundImage: 'url(' + image.src() + ')'
            })
            .on({
                click: onClick,
                mouseover: onMouseover,
                mousemove: onMousemove,
                mouseout: onMouseout
            });

        /*
        As an extra feature, we want to provide more detailed renderings at a
        higher zoom level, for three points of interest. (Our point in Paris is
        the closest Manhattan Grid intersection to the Étoile, a real-world
        intersection of twelve large avenues.)
        */
        points['Paris'] = {lat: 48.87377, lng: 2.29505};
        [
            {point: points['0 & 0'], title: 'Manhattan', z: 12},
            {point: getIntersection(points['Paris']), title: 'Paris', z: 13},
            {point: poles.north, title: 'Uzbekistan', z: 14}
        ].forEach(function(marker, i) {
            /*
            We're trying to make this function as generic as possible: for any
            given point and zoom level, it would allow us the retrieve the
            corresponding Google Maps tile. Even though we are just using three
            local images here, their naming scheme matches the logic of Google
            Maps. Manhattan, for example, is "jpg/v=108&x=1206&y=1539&z=12.jpg".
            */
            var as = getASByLatLng(marker.point),
                g = {s: 256, v: 108, z: marker.z},
                xy = getXYByLatLng(marker.point);
            Ox.extend(g, Ox.map(Ox.getXYByLatLng(marker.point), function(v) {
                return Math.floor(v * Math.pow(2, g.z));
            }));
            /*
            For each point, we add a marker, with a click handler that will
            display the corresponding image.
            */
            Ox.$('<div>')
                .addClass('marker')
                .css({
                    left: xy.x - 4 + 'px',
                    top: xy.y - 4 + 'px'
                })
                .on({
                    click: function() {
                        $images.forEach(function($image) {
                            $image.hide();
                        });
                        $images[i].show();
                    }
                })
                .appendTo($body);
            /*
            Now we load the image.
            */
            Ox.Image(Ox.formatString(
                'jpg/v={v}&x={x}&y={y}&z={z}.jpg', g
            ), function(image) {
                /*
                First, we draw the streets.
                */
                if (marker.title == 'Uzbekistan') {
                    /*
                    Uzbekistan, the North Pole of our projection, is a special
                    case, as the streets run in circles around it. (The exact
                    number of streets is a float &mdash; 123582.49214895045
                    &mdash; so the radius of the northernmost street &mdash;
                    123,582th St &mdash; is 0.492 times the distance between
                    streets.)
                    */
                    Ox.loop(
                        distances.streets * (numbers.streets % 1),
                        2000,
                        distances.streets,
                        function(distance) {
                            var circle = mapLine(Ox.getCircle(
                                poles.north, distance, precision
                            ), g);
                            image.drawPath(circle, {
                                close: true,
                                color: colors.streets
                            });
                        }
                    );
                } else {
                    /*
                    Otherwise, we draw all streets from 200 streets "south" to
                    200 steets "north" of the point, using `getLine`, a helper
                    function defined below.
                    */
                    Ox.loop(-200, 200, function(street) {
                        var line = getLine(
                            g, marker.point, as, 'streets', street
                        );
                        image.drawPath(line, {
                            color: colors.streets,
                            width: marker.title == 'Paris' || street ? 1 : 2
                        });
                    });
                }
                /*
                Next, we draw all avenues from 20 avenues "east" to 20 avenues
                "west" of the point.
                */
                Ox.loop(-20, 20, function(avenue) {
                    var line = getLine(g, marker.point, as, 'avenues', avenue);
                    image.drawPath(line, {
                        color: colors.avenues,
                        width: marker.title == 'Paris' || avenue ? 1 : 2
                    });
                });
                /*
                Then, on the Manhattan tile, we draw 20 kilometers of Broadway.
                */
                if (marker.title == 'Manhattan') {
                    var line = mapLine(Ox.getLine(
                        Ox.getPoint(marker.point, -10000, bearings.broadway),
                        Ox.getPoint(marker.point, 10000, bearings.broadway),
                        1
                    ), g);
                    image.drawPath(line, {
                        color: colors.broadway,
                        width: 2
                    });
                }
                /*
                Finally, we add the place name (white text with a black shadow).
                */
                ['black', 'white'].forEach(function(color, i) {
                    image.drawText(marker.title, [240 - i, 240 - i], {
                        color: color,
                        font: 'bold 16px Lucida Grande, sans-serif',
                        textAlign: 'right'
                    });
                });
                /*
                Now we can put the image into the DOM.
                */
                $images[i] = Ox.$('<img>')
                    .attr({src: image.src()})
                    .hide()
                    .appendTo($body);
            });
        });

    });

    /*
    `getIntersection` is a helper function that returns the coordinates of the
    closest intersection from a given point.
    */
    function getIntersection(point) {
        var as = getASByLatLng(point), d = {};
        ['avenue', 'street'].forEach(function(type) {
            var mod = Ox.mod(as[type], 1);
            d[type] = ((mod < 0.5 ? 0 : 1) - mod) * distances[type + 's'];
        });
        return Ox.getPoint(
            Ox.getPoint(
                point,
                d.street,
                as.bearings.avenues
            ),
            d.avenue,
            as.bearings.streets
        );        
    }

    /*
    `getLine` is a helper function that returns the i-th avenue or street from a
    given intersection.
    */
    function getLine(g, point, as, type, i) {
        point = Ox.getPoint(
            point,
            i * distances[type],
            as.bearings[type == 'avenues' ? 'streets' : 'avenues']
        );
        return mapLine(Ox.getLine(
            Ox.getPoint(point, -10000, as.bearings[type]),
            Ox.getPoint(point, 10000, as.bearings[type]),
            1
        ), g);
    }

    /*
    `mapLine` is a helper function that, given a line of points (an array of
    lat/lng pairs) and an object `g` with the properties `lat`, `lng`, `s`
    (tile size) and `z` (zoom level), maps the line to an array of x/y
    coordinates on the zoomed-in map tile.
    */
    function mapLine(line, g) {
        return line.map(function(point) {
            var xy = Ox.map(Ox.getXYByLatLng(point), function(value, key) {
                return (value * Math.pow(2, g.z) - g[key]) * g.s;
            });
            return [xy.x, xy.y];
        });
    }

    /*
    Now all that's left is to define our event handlers. Clicking on any point
    of the map that is not a marker will hide the currently visible overlay
    image (if any).
    */
    function onClick(e) {
        if (e.target.className != 'marker') {
            $images.forEach(function($image) {
                $image.hide();
            });
        }
    }

    /*
    When the mouse enters the map, show a street sign (which consists of a post
    and the actual sign).
    */
    function onMouseover() {
        $post.show();
        $sign.show();
    }

    /*
    When the mouse moves on the map, update the street sign.
    */
    function onMousemove(e) {
        /*
        In case the mouse is on the overlay image, hide the sign and return.
        */
        if (e.target.tagName == 'IMG') {
            onMouseout();
            return;
        }
        var left = window.scrollX,
            right = left + window.innerWidth,
            top = window.scrollY,
            /*
            `xy` is the actual map pixel the mouse is pointing at...
            */
            xy = {x: left + e.clientX, y: top + e.clientY},
            /*
            ... `latlng` is the latitude and longitude of that point ...
            */
            latlng = getLatLngByXY(xy),
            /*
            ... and `as` is the equivalent in avenues and streets.
            */
            as = getASByXY(xy),
            width, height, invertX, invertY;
        /*
        On the street sign, we display both the avenue/street and the lat/lng
        coordinates. `Ox.formatOrdinal` takes care of '1st', '2nd' '3rd', '4th',
        etc.
        */
        $sign.html(
            Ox.formatOrdinal(as.avenue) + ' Av & '
            + as.hemisphere + ' '
            + Ox.formatOrdinal(as.street) + ' St'
            + '<div class="latlng">'
            + Ox.formatDegrees(latlng.lat, 'lat') + ' / '
            + Ox.formatDegrees(((latlng.lng + 180) % 360) - 180, 'lng')
            + '</div>'
        );
        /*
        As the street sign extends to the top and right of the mouse position,
        we have to invert its direction in case the mouse is close to the top or
        right edge of the window.
        */
        width = $sign.width();
        height = $sign.height();
        invertX = xy.x + width > right;
        invertY = xy.y - height - 32 < top;
        $sign.css({
            left: xy.x + (invertX ? 1 - width : -1) + 'px',
            top: xy.y + (invertY ? 32 : -32 - height) + 'px'
        });
        $post.css({
            left: xy.x - 1 + 'px',
            top: xy.y + (invertY ? 0 : -32 - height) + 'px',
            height: height + 32 + 'px'
        });
    }

    /*
    When the mouse leaves the map, hide the street sign.
    */
    function onMouseout() {
        $post.hide();
        $sign.hide();
    }

    /*
    And that's it!
    */
});