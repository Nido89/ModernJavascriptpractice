/*
In this example, we use Ox.Map to display the countries provided by Ox.COUNTRIES
on a world map.
*/

'use strict';

Ox.load(['UI', 'Geo'], function() {

    var $map = Ox.Map({
            keys: ['region'],
            markerColor: function(place) {
                return Ox.getGeoColor(place.region);
            },
            markerSize: function(place) {
                return place.area >= 1e13 ? 24
                    : place.area >= 1e12 ? 22
                    : place.area >= 1e11 ? 20
                    : place.area >= 1e10 ? 18
                    : place.area >= 1e9 ? 16
                    : place.area >= 1e8 ? 14
                    : place.area >= 1e7 ? 12
                    : place.area >= 1e6 ? 10
                    : 8;
            },
            maxMarkers: Ox.COUNTRIES.length,
            places: Ox.COUNTRIES.map(function(country) {
                return Ox.extend(country, {geoname: country.name});
            }),
            showZoombar: true
        })
        .appendTo(Ox.$body);

    Ox.$window.bind({resize: $map.resizeMap});

});

/*
For an example that shows more properties of Ox.COUNTRIES, see
<a href="#examples/countries">here</a>.
*/