/*
In this example, we will build a list of cities that interacts with a map.
*/
'use strict';

/*
We load the `UI` and `Geo` modules. The latter provides a number of methods to
retrieve geographic and political information about countries.
*/
Ox.load({UI: {showScreen: true}, Geo: {}}, function() {

    /*
    We load the list of cities.
    */
    Ox.getJSON('json/cities.json', function(cities) {

        /*
        The data originally comes from
        <a href="http://download.geonames.org/export/dump"
        target="_blank">geonames.org</a>. It's an array of 10,000 city objects,
        each of which has the following properties:
        <pre>
        {
            "country&#95;code": "CN", 
            "elevation": 0, 
            "feature&#95;code": "PPLA", 
            "latitude": 31.22222, 
            "longitude": 121.45806, 
            "name": "Shanghai", 
            "population": 14608512
        }
        </pre>
        */
        cities = cities.map(function(data, id) {
            /*
            First of all, we have to patch this data, so that it becomes more
            useful both for the list and the map. Ox.getCountryByCode gives us
            the names of the country, region and continent. For the map, we need
            a geoname, and the cities have to be rectangular areas, not just
            points. So we set the area to 100 square meters per inhabitant,
            which will turn out to be relatively realistic. Then we calculate
            how large the resulting square will be, in degrees. (The number of
            degrees from west to east depends on the city's proximity to the
            equator. OxJS has some utility functions built in that make this
            easy to compute.) Finally, we can set the values for south, north,
            west and east. A nice side effect of deriving the size of the city
            from its population is that the map, which will always show the
            largest places in the visible area, will now show the most populated
            cities.
            */
            var area = Math.max(data.population, 1) * 100,
                country = Ox.getCountryByCode(data.country_code),
                latSize = Math.sqrt(area) / Ox.EARTH_CIRCUMFERENCE * 360,
                lngSize = Math.sqrt(area) * Ox.getDegreesPerMeter(data.latitude);
            /*
            Our city object will look like this:
            <pre>
            {
                "area": 1460851200,
                "capital": false,
                "country": "China",
                "east": 121.65880869475835,
                "elevation": 0,
                "geoname": "Shanghai, China",
                "id": "0",
                "lat": 31.22222,
                "lng": 121.45806,
                "name": "Shanghai",
                "north": 31.393892916013158,
                "population": 14608512,
                "region": "Asia, Eastern Asia, China",
                "south": 31.050547083986842,
                "west": 121.25731130524166
            }
            </pre>
            Obviously, in a real-world scenario, you would make sure that the
            data already comes in this form.
            */            
            return {
                area: area,
                capital: data.feature_code == 'PPLC',
                country: country.name,
                east: data.longitude + lngSize / 2,
                elevation: data.elevation,
                geoname: [data.name, country.name].join(', '),
                id: id.toString(),
                lat: data.latitude,
                lng: data.longitude,
                name: data.name,
                north: data.latitude + latSize / 2,
                population: data.population,
                region: [country.continent, country.region, country.name].join(', '),
                south: data.latitude - latSize / 2,
                west: data.longitude - lngSize / 2
            };
        });

        /*
        The preview button opens or closes the preview dialog (which we will
        create later). It does so by calling the `openPreview` or `closePreview`
        method of the list (which we will also create in a moment).
        */
        var $preview = Ox.Button({
                    disabled: true,
                    selectable: true,
                    title: 'view',
                    type: 'image'
                })
                .bindEvent({
                    change: function(data) {
                        $list[(data.value ? 'open' : 'close') + 'Preview']();
                    }
                }),
            /*
            As we want the list to be searchable, we add an input element.
            */
            $find = Ox.Input({
                    clear: true,
                    placeholder: 'Find',
                    width: 192
                })
                .bindEvent({
                    submit: function(data) {
                        $list.options({
                            /*
                            This query will find matches in either `name`,
                            `region` or `continent`.
                            */
                            query: {
                                conditions: [
                                    'name', 'region', 'continent'
                                ].map(function(key) {
                                    return {
                                        key: key,
                                        operator: '=',
                                        value: data.value
                                    };
                                }),
                                operator: '|'
                            }
                        });
                    }
                }),
            /*
            The toolbar holds the preview button and the find element.
            */
            $toolbar = Ox.Bar({size: 24})
                .attr({id: 'toolbar'})
                .append($preview)
                .append($find),
            /*
            This is our list.
            */
            $list = Ox.TableList({
                    /*
                    First of all, we define the columns.
                    */
                    columns: [
                        {
                            /*
                            We use the `format` function to display the region
                            as a colored icon with a tooltip. The region class
                            is added to apply our own custom CSS, and
                            Ox.getGeoColor returns a color for the region. Note
                            that the actual value is 'Continent, Region,
                            Country', which results in a nicer sort order than
                            just 'Region'.
                            */
                            format: function(value) {
                                var region = value.split(', ')[1];
                                return Ox.Element({
                                        tooltip: region
                                    })
                                    .addClass('region')
                                    .css({
                                        background: 'rgb('
                                            + Ox.getGeoColor(region).join(', ')
                                            + ')'
                                    });
                            },
                            id: 'region',
                            /*
                            The operator indicates that we want the default sort
                            order for this column to be ascending.
                            */
                            operator: '+',
                            /*
                            We want the column title to be a symbol, so we pass
                            the 'icon' symbol as the `titleImage`. We can pick
                            anything from the collection of symbols that comes
                            with Ox.UI. The column still needs a textual title,
                            to be displayed in the menu that allows to show or
                            hide specific columns.
                            */
                            title: 'Region',
                            titleImage: 'icon',
                            /**/
                            visible: true,
                            width: 16
                        },
                        {
                            /*
                            Ox.getFlagByGeoname and Ox.getFlagByCountryCode
                            return pretty flag icons.
                            */
                            format: function(value) {
                                return Ox.Element({
                                        element: '<img>',
                                        tooltip: value
                                    })
                                    .addClass('flag')
                                    .attr({
                                        src: Ox.getFlagByGeoname(value)
                                    })
                            },
                            id: 'country',
                            operator: '+',
                            title: 'Country',
                            titleImage: 'flag',
                            visible: true,
                            width: 16
                        },
                        {
                            /*
                            If `capital` is `true`, we display a star.
                            */
                            format: function(value) {
                                return value
                                    ? Ox.Element({
                                            element: '<img>',
                                            tooltip: 'Capital'
                                        })
                                        .addClass('capital')
                                        .attr({
                                            src: Ox.UI.getImageURL('symbolStar')
                                        })
                                    : '';
                            },
                            id: 'capital',
                            operator: '-',
                            title: 'Capital',
                            titleImage: 'star',
                            visible: true,
                            width: 16
                        },
                        {
                            /*
                            The format function has a second argument that
                            contains the values of all columns. This allows us
                            to format a value dependent on other values. In this
                            case, we want to display the name in bold if the
                            value for capital is `true`.
                            */
                            format: function(value, data) {
                                return data.capital
                                    ? '<b>' + value + '</b>'
                                    : value;
                            },
                            id: 'name',
                            operator: '+',
                            /*
                            As it wouldn't make much sense to display the list
                            without the name column, we make it non-removable.
                            */
                            removable: false,
                            title: 'Name',
                            visible: true,
                            width: 128
                        },
                        {
                            /*
                            Since the following values are numbers, they should
                            be right-aligned. Also, we use some of the built-in
                            format functions.
                            */
                            align: 'right',
                            format: function(value) {
                                return Ox.formatNumber(value);
                            },
                            id: 'population',
                            operator: '-',
                            title: 'Population',
                            visible: true,
                            width: 80
                        },
                        {
                            align: 'right',
                            format: function(value) {
                                return Ox.formatDegrees(value, 'lat');
                            },
                            id: 'lat',
                            operator: '-',
                            title: 'Latitude',
                            visible: true,
                            width: 80
                        },
                        {
                            align: 'right',
                            format: function(value) {
                                return Ox.formatDegrees(value, 'lng');
                            },
                            id: 'lng',
                            operator: '+',
                            title: 'Longitude',
                            visible: true,
                            width: 80
                        },
                        /*
                        The elevation data is not very accurate, so we omit the
                        `visible` attribute, which defaults to `false`. Still,
                        the user can make the column visible.
                        */
                        {
                            align: 'right',
                            format: function(value) {
                                return Ox.formatNumber(value) + ' m';
                            },
                            id: 'elevation',
                            operator: '-',
                            title: 'Elevation',
                            width: 80
                        }
                    ],
                    /*
                    This allows the user to move the columns around.
                    */
                    columnsMovable: true,
                    /*
                    This adds a menu that can be used to show or hide specific
                    columns.
                    */
                    columnsRemovable: true,
                    /*
                    This makes sure the column titles get displayed.
                    */
                    columnsVisible: true,
                    /*
                    We pass our array of cities as `items`.
                    */
                    items: cities,
                    /*
                    We don't want to allow simulaneous selection of multiple
                    items, so we set `max` to `1`.
                    */
                    max: 1,
                    scrollbarVisible: true,
                    /*
                    We have to specify the default sort order (by population,
                    descending, and, if equal, by name, ascending).
                    */
                    sort: ['-population', '+name'],
                    /*
                    When the list retrieves items, it fires an `init` event. By
                    default, this event has an `items` property, which is the
                    number of items. Via `sums`, we can add more properties.
                    In this case, the `init` event will have a `population`
                    property that is the sum of the population of all items.
                    */
                    sums: ['population'],
                    /*
                    The 'id' property is the unique key of our table. In
                    consequence, whenever the list fires a `select` event, it
                    will reference this value as the item's unique id.
                    */
                    unique: 'id'
                })
                .bindEvent({
                    /*
                    The `closepreview` event fires when the user presses `space`
                    while preview is active. See `openpreview`, below.
                    */
                    closepreview: function() {
                        $preview.options({value: false});
                        $dialog.close();
                    },
                    /*
                    On `init`, we display the number of cities and the total
                    population.
                    */
                    init: function(data) {
                        $status.html(
                            (data.items ? Ox.formatNumber(data.items) : 'No')
                            + ' Cit' + (data.items == 1 ? 'y' : 'ies')
                            + ', Populaion: ' + (
                                data.population
                                ? Ox.formatNumber(data.population)
                                : 'None'
                            )
                        );
                    },
                    /*
                    The `open` event fires when the user doubleclicks an item,
                    or presses `enter` while an item is selected. In this case,
                    we want the map to zoom to the selected place.
                    */
                    open: function(data) {
                        $map.zoomToPlace();
                    },
                    /*
                    The `openpreview` event fires when an item is selected and
                    the user presses `space`. It can be used to implement
                    functionality similar to the "QuickView" feature in the Mac
                    OS X Finder. In this case, we open a dialog that shows a
                    flag and a map.
                    */
                    openpreview: function(data) {
                        var item = Ox.getObjectById(cities, data.ids[0]);
                        $flagImage = $('<img>').attr({
                            src: Ox.getFlagByGeoname(item.country, 256)
                        });
                        $mapImage = Ox.MapImage({
                            height: 256,
                            markers: [item],
                            place: Ox.getCountryByGeoname(item.country),
                            width: 256
                        });
                        setImageSizes();
                        $preview.options({value: true});
                        $dialog.options({
                            content: $content = Ox.Element()
                                .attr({id: 'content'})
                                .append($flagImage)
                                .append($mapImage),
                            title: [item.name, item.country].join(', ')
                        }).open();
                    },
                    /*
                    The `select` event passes an array of selected ids &mdash;
                    either one, as defined above, or none. We enable or disable
                    the preview button accordingly. Then we set the `selected`
                    option of the map to the selected id (or to `undefined`,
                    which will cause a deselect), and pan to that place (which
                    will do nothing if no place is selected).
                    */
                    select: function(data) {
                        $preview.options({disabled: data.ids.length == 0});
                        $map.options({selected: data.ids[0]}).panToPlace();
                    }
                }),
            $flagImage,
            $mapImage,
            $content = Ox.Element(),
            /*
            This is the preview dialog. By setting `focus` to `false`, we make
            it non-modal, i.e. the user can still interact with the rest of the
            application while the dialog is open.
            */
            $dialog = Ox.Dialog({
                    closeButton: true,
                    content: $content,
                    fixedRatio: true,
                    focus: false,
                    height: 288,
                    maximizeButton: true,
                    maxHeight: 432,
                    maxWidth: 864,
                    minHeight: 144,
                    minWidth: 384,
                    width: 576
                })
                .bindEvent({
                    close: function() {
                        $list.closePreview();
                    },
                    resize: function(data) {
                        $content.css({height: data.height - 16 + 'px'})
                        setImageSizes();
                    }
                }),
            /*
            The status bar displays the list's totals.
            */
            $status = $('<div>').css({
                margin: '3px',
                fontSize: '9px',
                textAlign: 'center'
            }),
            $statusbar = Ox.Bar({size: 16}).append($status),
            /*
            Now we create the map.
            */
            $map = Ox.Map({
                    /*
                    When `clickable` is `true`, clicking on the map will perform
                    a reverse geo lookup and select the matching geographic
                    entity.
                    */
                    clickable: true,
                    keys: ['population'],
                    /*
                    Here, we add custom marker colors and sizes, depending on
                    population. Note that we have to handle `void 0` too, since
                    by clicking on the map, or using the map's find element, the
                    user may select a place that is not one of our cities.
                    */
                    markerColor: function(place) {
                        return place.population === void 0 ? [128, 128, 128]
                            : place.population >= 10000000 ? [255, 0, 0]
                            : place.population >= 5000000 ? [255, 32, 0]
                            : place.population >= 2000000 ? [255, 64, 0]
                            : place.population >= 1000000 ? [255, 96, 0]
                            : place.population >= 500000 ? [255, 128, 0]
                            : place.population >= 200000 ? [255, 160, 0]
                            : place.population >= 100000 ? [255, 192, 0]
                            : place.population >= 50000 ? [255, 224, 0]
                            : [255, 255, 0];
                    },
                    markerSize: function(place) {
                        return place.population === void 0 ? 16 
                            : place.population >= 10000000 ? 24
                            : place.population >= 5000000 ? 22
                            : place.population >= 2000000 ? 20
                            : place.population >= 1000000 ? 18
                            : place.population >= 500000 ? 16
                            : place.population >= 200000 ? 14
                            : place.population >= 100000 ? 12
                            : place.population >= 50000 ? 10
                            : 8;
                    },
                    /*
                    We pass our array of cities as `places`.
                    */
                    places: cities,
                    /*
                    Finally, we enable a number of interface elements.
                    */
                    showControls: true,
                    showToolbar: true,
                    showZoombar: true
                })
                .bindEvent({
                    /*
                    The `select` event fires when a place is selected or
                    deselected. We set the `selected` option of the list to the
                    selected id, wrapped in an array. (Note that if the selected
                    place is not one of our cities, it will have a temporary id
                    that doesn't exist in our list. Selecting a non-existent id
                    will cause a deselect, which is what we want here.)
                    */
                    select: function(data) {
                        $list.options({selected: data ? [data.id] : []});
                    }
                }),
            /*
            The list panel holds the toolbar, the list, and the statusbar.
            */
            $listPanel = Ox.SplitPanel({
                    elements: [
                        {element: $toolbar, size: 24},
                        {element: $list},
                        {element: $statusbar, size: 16}
                    ],
                    orientation: 'vertical'
                }),
            /*
            The main panel holds the list panel and the map.
            */
            $mainPanel = Ox.SplitPanel({
                    elements: [
                        {
                            /*
                            Elements of a split panel fire `resize` and
                            `resizeend` events when they are resized. Here, we
                            make sure that the find element shrinks accordingly.
                            */
                            element: $listPanel.bindEvent({
                                resize: function(data) {
                                    $find.options({
                                        width: data.size < 220
                                            ? data.size - 28
                                            : 192
                                    });
                                }
                            }),
                            resizable: true,
                            /*
                            The `resize` option is usually `[min, max]`, but by
                            specifying additional values, we make the panel
                            "snappy" at these points. Here, the points are the
                            positions of our list columns.
                            */
                            resize: [176, 256, 336, 416, 496].map(function(size) {
                                return size + Ox.UI.SCROLLBAR_SIZE;
                            }),
                            size: 416 + Ox.UI.SCROLLBAR_SIZE
                        },
                        {
                            /*
                            The map uses the Google Maps API, which requires a
                            notification when the map size changes. The map's
                            `resizeMap` method takes care of that.
                            */
                            element: $map.bindEvent({resizeend: $map.resizeMap})
                        }
                    ],
                    orientation: 'horizontal'
                })
                .appendTo(Ox.$body);

        /*
        Helper function that sets the flag and map image sizes when the preview
        dialog is initialized, or resized.
        */
        function setImageSizes() {
            var size = Math.floor(($dialog.options('width') - 64) / 2);
            [$flagImage, $mapImage].forEach(function($image) {
                $image.css({width: size + 'px', height: size + 'px'});
            });
        }

        /*
        When the window size changes, the map size changes too, so we have to
        notify the map.
        */
        Ox.$window.bind({resize: $map.resizeMap});

    });

});