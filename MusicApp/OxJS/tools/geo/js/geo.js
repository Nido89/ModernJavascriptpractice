Ox.load('UI', function() {

    Ox.getJSONC('../jsonc/countries.jsonc', function(data) {

        Ox.getJSON('../json/countries.json', function(countries) {

            var $map = $('<img>')
                    .attr({
                        id: 'map',
                        src: '../png/map.png'
                    }),
                $bar = Ox.Bar({size: 24}),
                $status = $('<div>')
                    .css({margin: '5px 0 0 8px'})
                    .appendTo($bar),
                $panel = Ox.SplitPanel({
                        elements: [
                            {
                                element: $map
                            },
                            {
                                element: $bar,
                                size: 24
                            }
                        ],
                        orientation: 'vertical'
                    })
                    .appendTo(Ox.UI.$body),
                errors = [],
                geocoder = new google.maps.Geocoder(),
                json = [],
                length = countries.length,
                timeout = 2000;

            getNextCountry();

            function getNextCountry() {
                getCountryData(countries.shift(), function(country) {
                    addFlag(country);
                    json.push(country);
                    $status.html(json.length + '/' + length + ' ' + country.name);
                    if (countries.length) {
                        setTimeout(getNextCountry, timeout);
                    } else {
                        var $dialog = Ox.Dialog({
                                buttons: [
                                    Ox.Button({
                                        title: 'Close'
                                    })
                                    .bindEvent({
                                        click: function() {
                                            $dialog.close();
                                        }
                                    })
                                ],
                                content: $('<div>')
                                    .css({
                                        margin: '16px',
                                        MozUserSelect: 'text',
                                        WebkitUserSelect: 'text'
                                    })
                                    .html(
                                        '<code><pre>' + JSON.stringify(
                                            errors.length ? {errors: errors, data: json} : json,
                                        null, 4) + '</pre></code>'
                                    ),
                                height: window.innerHeight * 0.9 - 48,
                                title: 'Ox.Geo',
                                width: window.innerWidth * 0.9
                            }).open();
                        $status.html('');
                    }
                });
            }

            function addFlag(country) {
                var $div,
                    center = Ox.getXYByLatLng({lat: country.lat, lng: country.lng}),
                    crossesDateline = country.west > country.east,
                    height = $map.height(),
                    northEast = Ox.getXYByLatLng({lat: country.north, lng: country.east}),
                    southWest = Ox.getXYByLatLng({lat: country.south, lng: country.west}),
                    width = $map.width();
                if (crossesDateline) {
                    $div = [
                        $('<div>')
                            .addClass('rect')
                            .css({
                                left: '-16px',
                                top: (height * northEast.y) + 'px',
                                right: (width - width * northEast.x) + 'px',
                                bottom: (height - height * southWest.y) + 'px',
                            })
                            .hide()
                            .appendTo(Ox.UI.$body),
                        $('<div>')
                            .addClass('rect')
                            .css({
                                left: (width * southWest.x) + 'px',
                                top: (height * northEast.y) + 'px',
                                right: '-16px',
                                bottom: (height - height * southWest.y) + 'px',
                            })
                            .hide()
                            .appendTo(Ox.UI.$body)
                    ];
                } else {
                    $div = [
                        $('<div>')
                            .addClass('rect')
                            .css({
                                left: ($map.width() * southWest.x) + 'px',
                                top: ($map.height() * northEast.y) + 'px',
                                right: ($map.width() - $map.width() * northEast.x) + 'px',
                                bottom: ($map.height() - $map.height() * southWest.y) + 'px',
                            })
                            .hide()
                            .appendTo(Ox.UI.$body)
                    ];
                }
                $('<img>')
                    .attr({
                        src: '../png/icons/16/' + country.code + '.png',
                        title: country.name
                    })
                    .addClass('flag')
                    .css({
                        left: (center.x * 100) + '%',
                        top: (center.y * 100) + '%'
                    })
                    .mouseenter(function() {
                        $(this).css({
                            zIndex: Ox.uid()
                        });
                        $.each($div, function() {
                            $(this).show();
                        });
                    })
                    .mouseleave(function() {
                        $.each($div, function() {
                            $(this).hide();
                        });
                    })
                    .appendTo(Ox.UI.$body);
            }

            function geocode(geoname, callback) {
                var bounds, location = data.location[geoname];
                if (location) {
                    bounds = new google.maps.LatLngBounds(
                        new google.maps.LatLng(location.south, location.west),
                        new google.maps.LatLng(location.north, location.east)
                    );
                    callback({
                        bounds: bounds,
                        location: bounds.getCenter()
                    });
                } else {
                    geocoder.geocode({
                        language: 'en',
                        address: geoname
                    }, function(results, status) {
                        if (results && results.length) {
                            var result = results[0];
                            callback({
                                bounds: result.geometry.bounds || result.geometry.viewport,
                                location: result.geometry.location
                            })
                        } else {
                            errors.push({geoname: geoname, status: status});
                            Ox.print('remove this print statement', errors)
                            callback(null);
                        }
                    });
                }
            }

            function getCountryData(country, callback) {

                var geonames = Ox.clone(data.geocode[country.name]) || [country.name],
                    length = geonames.length,
                    union;
                getNextGeoname();

                function getNextGeoname() {
                    geocode(geonames.shift(), function(geodata) {
                        var center, lat, lng,
                            northEast, southWest,
                            east, north, south, west;
                        if (geodata) {
                            union = !union ? geodata.bounds : union.union(geodata.bounds);
                        }
                        if (geonames.length) {
                            setTimeout(getNextGeoname, timeout);
                        } else {
                            if (union) {
                                if (length == 1) {
                                    lat = geodata.location.lat();
                                    lng = geodata.location.lng();
                                } else {
                                    center = union.getCenter();
                                    lat = center.lat();
                                    lng = center.lng();
                                }
                                northEast = union.getNorthEast();
                                southWest = union.getSouthWest();
                                east = northEast.lng();
                                north = northEast.lat();
                                south = southWest.lat();
                                west = southWest.lng();
                                country = Ox.extend(country, {
                                    area: Ox.getArea(
                                        {lat: south, lng: west},
                                        {lat: north, lng: east}
                                    ),
                                    east: toFixed(east),
                                    lat: toFixed(lat),
                                    lng: toFixed(lng),
                                    north: toFixed(north),
                                    south: toFixed(south),
                                    west: toFixed(west)
                                });
                            }
                            callback(country);
                        }
                    });
                }

            }

            function toFixed(num) {
                return parseFloat(num.toFixed(10));
            }

        });

    });

});