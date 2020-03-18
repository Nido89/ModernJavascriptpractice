/*
In this example, we will draw flight paths on a world map. We'll use the Image
module and some of the built-in Ox.js functions for dealing with geographic
coordinates.
*/
'use strict';

/*
Include the Image module.
*/
Ox.load('Image', function() {

    /*
    This creates an image object from the specified source.
    */
    Ox.Image('jpg/earth720.jpg', function(image) {

        /*
        We want to map the route New York - London - Tokyo - Johannesburg -
        Sydney - Sao Paulo - New York.
        */
        var airports = [
                {name: 'JFK', lat: 40.643841, lng: -73.782304},
                {name: 'LHR', lat: 51.480902, lng: -0.464773},
                {name: 'NRT', lat: 35.553457, lng: 139.76532},
                {name: 'JNB', lat: -26.140009, lng: 28.242781},
                {name: 'SYD', lat: -33.93567, lng: 151.164322},
                {name: 'GRU', lat: -23.62754, lng: -46.700821},
            ],
            /*
            To get the width (and height) of the image, we call its
            <code>getSize</code> method.
            */
            mapSize = image.getSize().width,
            /*
            Ox.getLine returns a line from one lat/lng pair to another, as an
            array of <code>Math.pow(2, precision) + 1</code> points.
            */
            precision = 8,
            paths = airports.map(function(airport, i) {
                return Ox.getLine(
                    airport,
                    /*
                    We make sure the last airport gets connected with the first
                    one.
                    */
                    airports[(i + 1) % airports.length],
                    precision
                );
            });

        /*
        Ox.getXYByLatLng takes a lat/lng pair and returns its x/y position on a
        1×1 Mercator projection, <code>{x: 0, y: 0}</code> being the top left,
        <code>{x: 1, y: 1}</code> being the bottom right.
        */
        function getXY(point) {
            var xy = Ox.getXYByLatLng(point);
            return [xy.x * mapSize, xy.y * mapSize];
        }

        /*
        For each path, we have to check if it crosses the edge of the map that
        runs through the Pacific. Note that our test (a line crosses the edge
        if it spans more than 180 degrees longitude) is obviously incorrect,
        but works in our case, since all lines are sufficiently short.
        */
        paths.forEach(function(path) {
            var parts = [path];
            Ox.loop(path.length - 1, function(i) {
                var lat, lng;
                if (Math.abs(path[i].lng - path[i + 1].lng) > 180) {
                    /*
                    We split the path in two parts.
                    */
                    parts = [path.slice(0, i + 1), path.slice(i + 1)];
                    /*
                    We get the lat/lng of the points where the line leaves
                    and enters the map...
                    */
                    lat = Ox.getCenter(path[i], path[i + 1]).lat;
                    lng = path[i].lng < 0 ? [-180, 180] : [180, -180];
                    /*
                    ... and append them to the end of the first part and the
                    beginning of the second part.
                    */
                    parts[0].push({lat: lat, lng: lng[0]});
                    parts[1].unshift({lat: lat, lng: lng[1]});
                    /*
                    Returning `false` breaks the loop. Again, note that this
                    assumes no path will cross the edge more than once.
                    */
                    return false;
                }
            });
            /*
            We draw each part.
            */
            parts.forEach(function(part) {
                image.drawPath(part.map(getXY), {color: 'white'});
            });
        });

        /*
        Now lets add some markers.
        */
        airports.forEach(function(airport, i) {
                /*
                <code>j</code> is the index of the next airport.
                */
            var j = (i + 1) % airports.length,
                /*
                These are the options for the draw functions of the image. Some
                of the properties only apply to <code>drawPath</code>, some
                only to <code>drawText</code>, but we can pass all of them to
                both.
                */
                options = {
                    close: true,
                    color: 'rgba(255, 255, 255, 0.75)',
                    fill: 'rgba(0, 0, 0, 0.5)',
                    font: 'bold 11px Lucida Grande, sans-serif',
                    textAlign: 'center'
                },
                /*
                Ox.getDistance returns the distance, in meters, between two
                lat/lng pairs, and Ox.formatNumber adds thousands separators.
                */
                text = airports[i].name + '-' + airports[j].name + ' '
                    + Ox.formatNumber(Math.round(
                        Ox.getDistance(airports[i], airports[j]) / 1000
                    )) + ' km',
                /*
                Ox.getCenter returns the midpoint between two lat/lng pairs.
                In our case, this is where we want to attach markers.
                */
                xy = getXY(Ox.getCenter(airports[i], airports[j])),
                x = Math.round(xy[0]),
                y = Math.round(xy[1]);
            /*
            This is the marker...
            */
            image.drawPath([
                [x, y],
                [x + 4, y - 16],
                [x + 64, y - 16],
                [x + 64, y - 32],
                [x - 64, y - 32],
                [x - 64, y - 16],
                [x - 4, y - 16]
            ], options);
            /*
            ... and this is the text.
            */
            image.drawText(text, [x, y - 20], options);
        });

        /*
        To get the dataURL for our image, we call its <code>src()</code>
        method, and to put it in the DOM, we use Ox.$, which is similar to
        jQuery's <code>$</code>.
        */
        Ox.$('<img>').attr({src: image.src()}).appendTo(Ox.$('body'));

    });

});
