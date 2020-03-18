'use strict';

/*@
Ox.MapEditor <f> Map Editor
    options <o> Options object
        height <n|256> Height in px
        labels <b|false> If true, show labels
        mode <s|'add'> Mode ('add' or 'define')
        places <a|f|null> Array of places, or function that returns places
        selected <s|''> Id of the selected place
        width <n|256> Width in px
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.SplitPanel> Map Editor
        addplace <!> addplace
        removeplace <!> removeplace
        geocode <!> geocode
        loadlist <!> loadlist
@*/

Ox.MapEditor = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({
            addPlace: null,
            collapsible: false,
            editPlace: null,
            getMatches: null,
            hasMatches: false,
            height: 256,
            labels: false,
            mode: 'add',
            pageLength: 100,
            places: null,
            removePlace: null,
            selected: '',
            showControls: false,
            showLabels: false,
            showTypes: false,
            sort: [{key: 'geoname', operator: '+'}],
            width: 256
        })
        .options(options || {})
        .update({
            height: function() {
                self.$list.size();
                self.$map.resizeMap();
            },
            selected: function() {
                self.$list.options({selected: self.options.selected});
            },
            width: function() {
                self.$map.resizeMap();
            }
        })
        .css({
            width: self.options.width + 'px',
            height: self.options.height + 'px'
        });

    self.isAsync = Ox.isFunction(self.options.places);

    // FIXME: duplicated, see MapMarker
    self.typeColor = {
        country: [64, 64, 255],
        region: [0, 192, 192],
        city: [255, 0, 0],
        borough: [255, 128, 0],
        street: [255, 255, 0],
        building: [255, 64, 128],
        feature: [0, 192, 0]
    };
    self.areaSize = {
        1000000: 8, // 1 x 1 km
        10000000000: 10 // 100 x 100 km
    };

    self.columns = [
        {
            format: function(value, data) {
                return data.type
                    ? Ox.$('<img>')
                        .attr({
                            src: Ox.getFlagByGeoname(data.geoname, 16)
                        })
                        .css({
                            width: '14px',
                            height: '14px',
                            borderRadius: '4px',
                            marginLeft: '-3px',
                            marginTop: 0
                        })
                    : '';
            },
            id: 'countryCode',
            operator: '+',
            resizable: false, // fixme: implement
            sort: function(value) {
                var names = value.split(', ');
                if (!Ox.getCountryByGeoname(names[names.length - 1])) {
                    names.push('~');
                }
                return names.reverse().join(', ');
            },
            title: Ox._('Flag'),
            titleImage: 'flag',
            tooltip: function(data) {
                return Ox.toTitleCase(data.geoname || '')
            },
            visible: true,
            width: 16
        },
        {
            format: function(value, data) {
                var iconSize = 6;
                Ox.forEach(self.areaSize, function(size, area) {
                    if (data.area >= area) {
                        iconSize = size;
                    } else {
                        return false; // break
                    }
                });
                return data.type
                    ? Ox.$('<div>')
                        .addClass('OxTypeIcon')
                        .css({
                            width: iconSize + 'px',
                            height: iconSize + 'px',
                            borderRadius: (iconSize + 4) / 2 + 'px',
                            margin: [0, 0, 0, -3].map(function(v) {
                                return v + (10 - iconSize) / 2 + 'px';
                            }).join(' '),
                            background: 'rgb(' + self.typeColor[data.type].join(', ') + ')'
                        })
                    : '';
            },
            id: 'type',
            operator: '+',
            title: Ox._('Type'),
            titleImage: 'icon',
            tooltip: function(data) {
                return Ox.toTitleCase(data.type || '');
            },
            visible: true,
            width: 16
        },
        {
            format: function(value, data) {
                return data.type
                    ? value
                    : Ox.$('<span>').addClass('OxWarning').html(value);
            },
            id: 'name',
            operator: '+',
            removable: false,
            title: Ox._('Name'),
            visible: true,
            width: 144
        },
        {
            format: function(value) {
                return value.join('; ');
            },
            id: 'alternativeNames',
            operator: '+',
            title: Ox._('Alternative Names'),
            visible: true,
            width: 144
        },
        {
            id: 'geoname',
            operator: '+',
            sort: function(value) {
                var names = value.split(', ');
                if (!Ox.getCountryByGeoname(names[names.length - 1])) {
                    names.push('~');
                }
                return names.reverse().join(', ');
            },
            title: Ox._('Geoname'),
            visible: false,
            width: 192
        },
        {
            align: 'right',
            format: toFixed,
            id: 'lat',
            operator: '+',
            title: Ox._('Latitude'),
            visible: true,
            width: 64
        },
        {
            align: 'right',
            format: toFixed,
            id: 'lng',
            operator: '+',
            title: Ox._('Longitude'),
            visible: true,
            width: 64
        },
        {
            align: 'right',
            format: toFixed,
            id: 'south',
            operator: '+',
            title: Ox._('South'),
            visible: false,
            width: 64
        },
        {
            align: 'right',
            id: 'west',
            operator: '+',
            title: Ox._('West'),
            visible: false,
            width: 64
        },
        {
            align: 'right',
            format: toFixed,
            id: 'north',
            operator: '+',
            title: Ox._('North'),
            visible: false,
            width: 64
        },
        {
            align: 'right',
            format: toFixed,
            id: 'east',
            operator: '+',
            title: Ox._('East'),
            visible: false,
            width: 64
        },
        {
            align: 'right',
            format: {type: 'area', args: []},
            id: 'area',
            operator: '-',
            title: Ox._('Area'),
            visible: true,
            width: 128
        },
        {
            format: function(value) {
                return Ox.encodeHTMLEntities(value);
            },
            id: 'user',
            operator: '+',
            title: Ox._('User'),
            visible: false,
            width: 96
        },
        {
            format: function(value) {
                return value.replace('T', ' ').replace('Z', '');
            },
            id: 'created',
            operator: '-',
            title: Ox._('Date Created'),
            visible: false,
            width: 128
        },
        {
            format: function(value) {
                return value.replace('T', ' ').replace('Z', '');
            },
            id: 'modified',
            operator: '-',
            title: Ox._('Date Modified'),
            visible: false,
            width: 128
        }
    ];

    self.options.hasMatches && self.columns.push({
        align: 'right',
        id: 'matches',
        operator: '-',
        title: Ox._('Matches'),
        visible: true,
        width: 64
    });

    self.$listToolbar = Ox.Bar({
        size: 24
    });

    self.$findElement = Ox.FormElementGroup({
            elements: [
                self.$findSelect = Ox.Select({
                        items: [
                            {id: 'all', title: Ox._('Find: All')},
                            {id: 'name', title: Ox._('Find: Name')},
                            {id: 'alternativeNames', title: Ox._('Find: Alternative Names')},
                            {id: 'geoname', title: Ox._('Find: Geoname')}
                        ],
                        overlap: 'right',
                        type: 'image'
                    })
                    .bindEvent({
                        change: function(data) {
                            var key = data.value,
                                value = self.$findInput.value();
                            value && updateList(key, value);
                        }
                    }),
                self.$findInput = Ox.Input({
                        clear: true,
                        placeholder: Ox._('Find in List'),
                        width: 234
                    })
                    .bindEvent({
                        submit: function(data) {
                            var key = self.$findSelect.value(),
                                value = data.value;
                            updateList(key, value);
                        }
                    })
            ]
        })
        .css({float: 'right', margin: '4px'})
        .appendTo(self.$listToolbar);

    self.$list = Ox.TableList({
            columns: self.columns,
            columnsRemovable: true,
            columnsVisible: true,
            items: Ox.clone(self.options.places),
            //items: self.options.places,
            // area needed for icon, geoname needed for flag
            keys: ['area', 'geoname', 'matches'],
            max: 1,
            min: 0,
            pageLength: self.options.pageLength,
            scrollbarVisible: true,
            selected: self.options.selected ? [self.options.selected] : [],
            sort: self.options.sort,
            unique: 'id'
        })
        .bindEvent({
            'delete': removeItem,
            init: initList,
            // fixme: do we need 0/shift-0? return already zooms to place
            key_0: function() {
                self.$map.panToPlace();
            },
            key_equal: function() {
                self.$map.zoom(1);
            },
            key_minus: function() {
                self.$map.zoom(-1);
            },
            key_shift_0: function() {
                self.$map.zoomToPlace();
            },
            load: function() {
                that.triggerEvent('loadlist');
            },
            open: openItem,
            select: function(data) {
                selectItem(data);
            }
        });

    // if loaded with selection, set map and form
    self.options.selected && self.$list.bindEventOnce({
        load: function() {
            self.$list.triggerEvent({
                select: {ids: [self.options.selected]}
            });
        }
    });

    self.$listStatusbar = Ox.Bar({
        size: 16
    });

    self.$status = Ox.Element()
        .css({paddingTop: '2px', margin: 'auto', fontSize: '9px', textAlign: 'center'})
        .appendTo(self.$listStatusbar);

    self.$map = Ox.Map({
            clickable: true,
            editable: true,
            findPlaceholder: Ox._('Find on Map'),
            height: self.options.height,
            places: self.options.places,
            //statusbar: true,
            showControls: self.options.showControls,
            showLabels: self.options.showLabels,
            showTypes: self.options.showTypes,
            toolbar: true,
            width: self.options.width - 514,//self.mapResize[1],
            zoombar: true
        })
        .bindEvent({
            /*
            addplace: function(data) {
                that.triggerEvent('addplace', data);
            },
            */
            changeplace: function(data) {
                self.$placeForm.values(data).show();
                self.$areaKmInput.value(Ox.formatArea(data.area));
            },
            changeplaceend: function(data) {
                //Ox.Log('Map', 'ssP', self.selectedPlace);
                var isResult = self.selectedPlace[0] == '_';
                !isResult && editPlace([
                    'lat', 'lng', 'south', 'west', 'north', 'east', 'area'
                ]);
            },
            geocode: function(data) {
                that.triggerEvent('geocode', data);
            },
            /*
            resize: function() {
                self.$map.resizeMap(); // fixme: don't need event
            },
            */
            select: selectPlace
        });

    self.$placeTitlebar = Ox.Bar({
        size: 24
    });
    self.$placeTitle = Ox.$('<div>')
        .hide()
        .appendTo(self.$placeTitlebar);
    if (self.options.mode == 'define') {
        self.$findPlaceButton = Ox.Button({
                title: 'find',
                tooltip: Ox._('Find'),
                type: 'image'
            })
            .css({float: 'left', margin: '4px'})
            .bindEvent({
                click: findPlace
            })
            .hide()
            .appendTo(self.$placeTitle);
    }
    self.$placeFlag = Ox.$('<img>')
        .addClass('OxFlag')
        .attr({
            src: Ox.getFlagByGeoname('', 16)
        })
        .css({float: 'left', margin: '4px'})
        .appendTo(self.$placeTitle);
    self.$placeName = Ox.Label({
            title: '',
            width: 208
        })
        .css({float: 'left', margin: '4px 0 4px 0'})
        .bindEvent({
            singleclick: function() {
                self.$map.panToPlace();
            },
            doubleclick: function() {
                self.$map.zoomToPlace();
            }
        })
        .appendTo(self.$placeTitle);
    self.$deselectPlaceButton = Ox.Button({
            title: 'close',
            tooltip: Ox._('Done'),
            type: 'image'
        })
        .css({float: 'left', margin: '4px'})
        .bindEvent({
            click: function() {
                self.$list.options({selected: []});
                // FIXME: list doesn't fire select event
                selectItem({ids: []});
            }
        })
        .appendTo(self.$placeTitle);

    self.$placeData = Ox.Element();

    self.$placeForm = Ox.Form({
            items: [].concat([
                self.$nameInput = Ox.Input({
                    id: 'name',
                    label: Ox._('Name'),
                    labelWidth: 80,
                    width: 240
                }),
                self.$alternativeNamesInput = Ox.ArrayInput({
                    id: 'alternativeNames',
                    label: Ox._('Alternative Names'),
                    max: 10,
                    //sort: true,
                    values: [],
                    width: 240
                }),
                self.$geonameInput = Ox.Input({
                    id: 'geoname',
                    label: Ox._('Geoname'),
                    labelWidth: 80,
                    width: 240
                }),
                Ox.Input({
                    id: 'countryCode'
                }).hide(),
                Ox.Select({
                    id: 'type',
                    items: [
                        {id: 'country', title: Ox._('Country')},
                        {id: 'region', title: Ox._('Region')}, // administative (Kansas) or colloquial (Midwest)
                        {id: 'city', title: Ox._('City')},
                        {id: 'borough', title: Ox._('Borough')},
                        {id: 'street', title: Ox._('Street')}, // streets, squares, bridges, tunnels, ...
                        {id: 'building', title: Ox._('Building')}, // airports, stations, stadiums, military installations, ...
                        {id: 'feature', title: Ox._('Feature')} // continents, islands, rivers, lakes, seas, oceans, mountains...
                    ],
                    label: Ox._('Type'),
                    labelWidth: 80,
                    width: 240
                })
            ], ['Latitude', 'Longitude', 'South', 'West', 'North', 'East'].map(function(v) {
                var id = (
                        v == 'Latitude' ? 'lat' : v == 'Longitude' ? 'lng' : v
                    ).toLowerCase(),
                    max = ['Latitude', 'South', 'North'].indexOf(v) > -1 ? Ox.MAX_LATITUDE : 180;
                return Ox.Input({
                    changeOnKeypress: true,
                    decimals: 8,
                    disabled: ['lat', 'lng'].indexOf(id) > -1,
                    id: id,
                    label: Ox._(v),
                    labelWidth: 80,
                    min: -max,
                    max: max,
                    type: 'float',
                    width: 240
                });
            }),
            [
                self.$areaInput = Ox.Input({
                    id: 'area',
                    type: 'float'
                }).hide()
            ]),
            width: 240
        })
        .css({margin: '8px'})
        .hide()
        .bindEvent({
            change: function(data) {
                var isResult = self.selectedPlace[0] == '_';
                if (data.id == 'name') {
                    var name = data.data.value;
                    !isResult && self.$list.value(self.selectedPlace, 'name', name);
                    self.$placeName.options({title: name});
                    if (!self.isAsync) {
                        Ox.getObjectById(
                            self.options.places, self.selectedPlace
                        ).name = name;
                    } else if (isResult) {
                        getMatches(this.values());
                    } else {
                        editPlace(['name']);
                    }
                    self.$map.value(self.selectedPlace, 'name', name);
                } else if (data.id == 'alternativeNames') {
                    if (!self.isAsync) {
                        // ...
                    } else if (isResult) {
                        getMatches(this.values());
                    } else {
                        editPlace(['alternativeNames']);
                    }
                    self.$map.value(self.selectedPlace, 'alternativeNames', data.data.value);
                } else if (data.id == 'geoname') {
                    var geoname = data.data.value,
                        country = Ox.getCountryByGeoname(geoname),
                        countryCode = country ? country.code : '';
                    self.$placeFlag.attr({
                        src: Ox.getFlagByGeoname(geoname, 16)
                    });
                    self.$placeForm.values({countryCode: countryCode});
                    if (!self.isAsync) {
                        if (!isResult) {
                            self.$list.value(self.selectedPlace, 'geoname', geoname);
                            self.$list.value(self.selectedPlace, 'countryCode', countryCode);
                        }
                    } else {
                        !isResult && editPlace(['countryCode', 'geoname']);
                    }
                    self.$map.value(self.selectedPlace, 'countryCode', countryCode);
                    self.$map.value(self.selectedPlace, 'geoname', geoname);
                } else if (data.id == 'type') {
                    if (!self.isAsync) {
                        // ...
                    } else {
                        !isResult && editPlace(['type']);
                    }
                    self.$map.value(self.selectedPlace, 'type', data.data.value);
                } else { // south, west, north, east
                    if (!self.isAsync) {
                        // ...
                    } else {
                        !isResult && editPlace([data.id]);
                    }
                    self.$map.value(self.selectedPlace, data.id, parseFloat(data.data.value));
                }
            }
        })
        .appendTo(self.$placeData);

    self.$areaKmInput = Ox.Input({
            disabled: true,
            id: 'areaKm',
            label: Ox._('Area'),
            labelWidth: 80,
            textAlign: 'right',
            width: 240
        })
        .css({margin: '8px 8px 0 8px'})
        .hide()
        .appendTo(self.$placeData);

    if (self.options.hasMatches) {
        self.$matchesInput = Ox.Input({
            disabled: true,
            id: 'matches',
            label: Ox._('Matches'),
            labelWidth: 80,
            type: 'int',
            width: 240
        })
        .css({margin: '8px'})
        .hide()
        .appendTo(self.$placeData);
    }

    self.$placeStatusbar = Ox.Bar({
        size: 24
    });

    self.$addPlaceButton = Ox.Button({
            title: Ox._('Add Place'),
            width: 90
        })
        .css({float: 'left', margin: '4px'})
        .bindEvent({
            click: function() {
                if (this.options('title') == Ox._('Add Place')) {
                    addPlace();
                } else {
                    removePlace();
                }
            }
        })
        .hide()
        .appendTo(self.$placeStatusbar);

    self.$newPlaceButton = Ox.Button({
            title: Ox._('New Place'),
            width: 70
        })
        .css({float: 'right', margin: '4px'})
        .bindEvent({
            click: function() {
                self.$map.newPlace();
            }
        })
        .appendTo(self.$placeStatusbar);

    if (self.options.mode == 'define') {
        self.$definePlaceButton = Ox.Button({
                title: Ox._('Define Place'),
                width: 80
            })
            .css({float: 'right', margin: '4px 0 4px 0'})
            .bindEvent({
                click: function() {
                    if (this.options('title') == Ox._('Define Place')) {
                        definePlace();
                    } else {
                        clearPlace();
                    }
                }
            })
            .hide()
            .appendTo(self.$placeStatusbar);
    }

    /*
    self.mapResize = [
        Math.round(self.options.width * 0.25),
        Math.round(self.options.width * 0.5),
        Math.round(self.options.width * 0.75)
    ];
    */

    /*
    if (!self.isAsync) {
        self.placesLength = self.options.places.length;
        setStatus();
    } else {
        self.options.places({}, function(results) {
            self.placesLength = results.data.items;
            setStatus();
        });
    }
    */

    that.setElement(
        Ox.SplitPanel({
            elements: [
                {
                    collapsible: self.options.collapsible,
                    element: self.$listPanel = Ox.SplitPanel({
                        elements: [
                            {
                                element: self.$listToolbar,
                                size: 24
                            },
                            {
                                element: self.$list
                            },
                            {
                                element: self.$listStatusbar,
                                size: 16
                            }
                        ],
                        orientation: 'vertical'
                    }),
                    resizable: true,
                    resize: [256, 384, 512],
                    size: 256
                },
                {
                    element: self.$map
                        .bindEvent({
                            resize: function() {
                                self.$map.resizeMap();
                            }
                        })
                },
                {
                    collapsible: self.options.collapsible,
                    element: Ox.SplitPanel({
                        elements: [
                            {
                                element: self.$placeTitlebar,
                                size: 24
                            },
                            {
                                element: self.$placeData
                            },
                            {
                                element: self.$placeStatusbar,
                                size: 24
                            }
                        ],
                        orientation: 'vertical'
                    })
                    .bindEvent({
                        resize: function(data) {
                            self.$placeName.options({width: data.size - 48});
                            // fixme: pass width through form
                            self.$placeForm.options('items').forEach(function($item) {
                                $item.options({width: data.size - 16});
                            });
                            self.$areaKmInput.options({width: data.size - 16});
                            self.$matchesInput && self.$matchesInput.options({width: data.size - 16});
                        }
                    }),
                    resizable: true,
                    resize: [256, 384],
                    size: 256
                }
            ],
            orientation: 'horizontal'
        })
        .addClass('OxMapEditor')
    );

    function addPlace() {
        var place = self.$placeForm.values(),
            country = Ox.getCountryByGeoname(place.geoname);
        place.countryCode = country ? country.code : '';
        if (!self.isAsync) {
            place.id = self.selectedPlace.slice(1); // fixme: safe?
            self.selectedPlace = place.id;
            self.options.selected = place.id;
            self.options.places.push(place);
            self.$list.options({
                items: Ox.clone(self.options.places)
            }).options({
                selected: [place.id]
            });
            self.$map.addPlace(place);
            self.$addPlaceButton.options({title: Ox._('Remove Place')});
            //setStatus();
        } else {
            self.$addPlaceButton.options({disabled: true, title: Ox._('Adding...')});
            self.options.addPlace(encodeValues(place), function(result) {
                if (result.status.code == 200) {
                    place.id = result.data.id;
                    self.options.selected = place.id;
                    self.selectedPlace = place.id;
                    self.$list.reloadList().options({selected: [place.id]});
                    self.$map.addPlace(place);
                    self.options.hasMatches && self.$matchesInput.value(
                        result.data.matches
                    ).show();
                    self.options.mode == 'define' && self.$definePlaceButton.options({
                        disabled: !result.data.matches,
                        title: Ox._('Clear Place')
                    }).show();
                    self.$addPlaceButton.options({
                        disabled: false,
                        title: Ox._('Remove Place')
                    }).show();
                } else if (result.status.code == 409) {
                    if (result.data.names.indexOf(self.$nameInput.value()) > -1) {
                        self.$nameInput.addClass('OxError');
                    }
                    self.$alternativeNamesInput.setErrors(result.data.names);
                    self.$addPlaceButton.options({disabled: false, title: Ox._('Add Place')});
                }
            });
        }
    }

    function clearPlace() {
        var values = {
            id: self.selectedPlace,
            alternativeNames: [], geoname: '', type: '',
            lat: null, lng: null,
            south: null, west: null, north: null, east: null, area: null
        };
        self.$definePlaceButton.options({disabled: true, title: Ox._('Clearing...')});
        self.options.editPlace(values, function() {
            self.$map.removePlace();
            self.$list.reloadList();
            self.$findPlaceButton.show();
            self.$placeFlag.hide();
            hideForm();
            self.$definePlaceButton.options({disabled: false, title: Ox._('Define Place')})
        });
    }

    function decodeValues(place) {
        return Ox.map(place, function(value) {
            var type = Ox.typeOf(value);
            return type == 'string' ? Ox.decodeHTMLEntities(value)
                : type == 'array' ? Ox.map(value, function(value) {
                    return decodeValues(value);
                })
                : value;
        });
    }

    function definePlace() {
        self.$map.newPlace(); // this will call selectPlace, then editPlace
        self.$definePlaceButton.options({title: Ox._('Clear Place')});
    }

    function encodeValues(place) {
        return Ox.map(place, function(value) {
            var type = Ox.typeOf(value);
            return type == 'string' ? Ox.encodeHTMLEntities(value)
                : type == 'array' ? Ox.map(value, function(value) {
                    return encodeValues(value);
                })
                : value;
        });
    }

    function editPlace(keys) {
        Ox.Log('Map', 'EDIT PLACE', keys, self.$placeForm.values())
        var values = Ox.filter(self.$placeForm.values(), function(values, key) {
            return keys.indexOf(key) > -1;
        });
        values.id = self.selectedPlace;
        self.options.editPlace(encodeValues(values), function(result) {
            Ox.Log('Map', 'EDIT PLACE::', result)
            if (result.status.code == 200) {
                if (
                    keys.indexOf(self.$list.options('sort')[0].key) > -1
                    || (
                        self.options.mode == 'define'
                        && (
                            keys.indexOf('name') > -1
                            || keys.indexOf('alternativeNames') > -1
                        )
                    )
                ) {
                    self.$list.reloadList();
                } else {
                    Ox.forEach(values, function(value, key) {
                        if (key != 'id') {
                            self.$list.value(values.id, key, value);
                            self.$map.value(values.id, key, value);
                        }
                    });
                    self.$list.value(values.id, 'matches', result.data.matches);
                }
                if (self.options.mode == 'define') {
                    self.$findPlaceButton.hide();
                    self.$placeFlag.show();
                }
                self.options.hasMatches && self.$matchesInput.value(result.data.matches);
                if (self.options.mode == 'define') {
                    self.$definePlaceButton.options({
                        disabled: !result.data.matches,
                        title: Ox._('Clear Place')
                    });
                    self.$addPlaceButton.options({
                        disabled: !!result.data.matches
                    });
                }
            } else {
                if (result.data.names.indexOf(self.$nameInput.value()) > -1) {
                    self.$nameInput.addClass('OxError');
                }
                self.$alternativeNamesInput.setErrors(result.data.names);
            }
        });
    }

    function findPlace() {
        self.$map
            //.options({find: ''})
            .options({find: self.$list.value(self.options.selected, 'name')});
    }

    function hideForm() {
        self.$placeForm.hide();
        self.$areaKmInput.hide();
    }

    function getMatches(place) {
        var names;
        if (self.options.hasMatches) {
            names = Ox.filter([place.name].concat(place.alternativeNames), function(name) {
                return name !== '';
            });
            self.options.getMatches(names, function(matches) {
                self.$matchesInput.value(matches);
            });
        }
    }

    function initList(data) {
        self.$status.html(Ox.formatCount(data.items, 'Place'));
    }

    function openItem(data) {
        selectItem(data);
        self.$map.zoomToPlace(data.ids[0]);
    }

    function removeItem(data) {
        var id = data.ids[0];
        self.$list.value(id, 'type') && self.$map.removePlace(id);
        // FIXME: events or callback functions??
        that.triggerEvent('removeplace', {id: id});
    }

    function removePlace() {
        var index;
        Ox.Log('Map', 'REMOVE PLACE', self.selectedPlace, index)
        if (!self.isAsync) {
            // fixme: doesn't call self.options.removePlace!
            index = Ox.getIndexById(self.options.places, self.selectedPlace);
            self.options.selected = '';
            self.options.places.splice(index, 1);
            self.$list.options({items: Ox.clone(self.options.places)});
            self.$addPlaceButton.options({title: Ox._('Add Place')});
            //setStatus();
        }
        // fixme: what is this? both options.removePlace and event removeplace??
        if (self.isAsync) {
            self.$addPlaceButton.options({disabled: true, title: Ox._('Removing...')})
            self.options.removePlace({id: self.selectedPlace}, function() {
                self.options.selected = '';
                self.$list.options({selected: []}).reloadList(true);
                self.options.hasMatches && self.$matchesInput.hide();
                self.options.mode == 'define' && self.$definePlaceButton.options({
                    disabled: true
                });
                self.$addPlaceButton.options({disabled: false, title: Ox._('Add Place')});
            });
        }
        self.$map.removePlace();
        that.triggerEvent('removeplace', {id: self.selectedPlace});
    }

    function selectItem(data, place) {
        // Select item in list
        var isUndefined, selectedPlace;
        self.options.selected = data.ids.length ? data.ids[0] : '';
        place = place || (
            self.options.selected
            ? self.$list.value(self.options.selected)
            : {}
        );
        isUndefined = !!self.options.selected && !place.type;
        selectedPlace = self.options.selected && !isUndefined
            ? self.options.selected : '';
        self.$map.options({selected: selectedPlace});
        selectedPlace && self.$map.panToPlace();
        if (self.options.selected) {
            self.options.mode == 'define'
                && self.$findPlaceButton[isUndefined ? 'show' : 'hide']();
            self.$placeFlag.attr({
                src: Ox.getFlagByGeoname(place.geoname || '', 16)
            })[isUndefined ? 'hide' : 'show']();
            self.$placeName.options({title: place.name || ''});
            self.$placeTitle.show();
            !isUndefined ? showForm(place) : hideForm();
            self.options.hasMatches && self.$matchesInput.value(place.matches || 0).show();
            self.options.mode == 'define' && self.$definePlaceButton.options({
                disabled: !isUndefined && !place.matches,
                title: isUndefined ? 'Define Place' : 'Clear Place'
            }).show();
            self.$addPlaceButton.options({
                disabled: self.options.mode == 'define' && !!place.matches,
                title: Ox._('Remove Place')
            }).show();
        } else {
            self.$placeTitle.hide();
            hideForm();
            self.options.hasMatches && self.$matchesInput.hide();
            self.options.mode == 'define' && self.$definePlaceButton.hide();
            self.$addPlaceButton.hide();
        }
    }

    function selectPlace(place) {
        // Select place on map
        var isResult = place && place.id[0] == '_',
            isUndefined = !!self.options.selected
                && !self.$list.value(self.options.selected, 'type');
        self.selectedPlace = place.id || '';
        if (isResult && isUndefined) {
            Ox.print('place.id', place.id, 'self.options.selected', self.options.selected, 'type', self.$list.value(self.options.selected));
            // define undefined place
            self.selectedPlace = self.options.selected;
            place.name = self.$list.value(self.options.selected, 'name');
            place.id = self.options.selected;
            self.$map.addPlace(place);
            self.$findPlaceButton.hide();
            self.$placeFlag.attr({
                src: Ox.getFlagByGeoname(place.geoname || '', 16)
            }).show();
            showForm(place);
            editPlace([
                'geoname', 'type',
                'lat', 'lng',
                'south', 'west', 'north', 'east', 'area'
            ]);
        } else if (self.selectedPlace && isResult) {
            // select result place
            self.$list.options({selected: []});
            self.$placeFlag.attr({
                src: Ox.getFlagByGeoname(place.geoname || '', 16)
            }).show();
            self.$placeName.options({title: place.name || ''});
            self.$placeTitle.show();
            showForm(place);
            if (self.options.hasMatches) {
                self.$matchesInput.value('').show();
                getMatches(place);
            }
            self.options.mode == 'define' && self.$definePlaceButton.hide();
            self.$addPlaceButton.options({disabled: false, title: Ox._('Add Place')}).show();
        } else if (!self.selectedPlace && !self.options.selected) {
            // deselect result place
            self.$placeFlag.hide();
            self.$placeTitle.hide();
            hideForm();
            self.options.hasMatches && self.$matchesInput.hide();
        } else if (!self.selectedPlace && isUndefined) {
            // deselect triggered by selecting an undefined item,
            // so do nothing
        } else {
            // select or deselect existing place
            self.options.selected = self.selectedPlace;
            self.$list.options({
                selected: self.options.selected ? [self.options.selected] : []
            });
            // FIXME: list doesn't fire select event
            selectItem({ids: self.$list.options('selected')}, place);
        }
    }

    function showForm(place) {
        self.$nameInput.removeClass('OxError');
        self.$alternativeNamesInput.setErrors([]);
        self.$placeForm.values(decodeValues(place)).show();
        self.$areaKmInput.value(Ox.formatArea(place.area)).show();
    }

    function toFixed(val) {
        return Ox.isNumber(val) ? val.toFixed(3) : '';
    }

    function toggleList() {
        var list = self.$listSelect.options('value');
        list == 'names' && !self.namesLoaded ? load() : toggle();
        function load() {
            self.options.names(function(data) {
                self.$namesList.options({items: data});
                self.namesLoaded = true;
                toggle();
            });
        }
        function toggle() {
            self.$listPanel.replaceElement(1, self[list == 'places' ? '$list' : '$namesList']);
        }
    }

    function updateList(key, value) {
        var query = {
                conditions: [].concat(
                    ['all', 'name'].indexOf(key) > -1
                        ? [{key: 'name', value: value, operator: '='}] : [],
                    ['all', 'alternativeNames'].indexOf(key) > -1
                        ? [{key: 'alternativeNames', value: value, operator: '='}] : [],
                    ['all', 'geoname'].indexOf(key) > -1
                        ? [{key: 'geoname', value: value, operator: '='}] : []
                ),
                operator: key == 'all' ? '|' : '&'
            };
        self.$list.options({
            items: function(data, callback) {
                return pandora.api.findPlaces(Ox.extend(data, {
                    query: query
                }), callback);
            }
        });
    }

    /*@
    focusList <f> focusList
    @*/
    that.focusList = function() {
        self.$list.gainFocus();
        return that;
    };

    /*@
    reloadList <f> reloadList
    @*/
    that.reloadList = function() {
        self.$list.reloadList();
        return that;
    };

    /*@
    resizeMap <f> resizeMap
    @*/
    that.resizeMap = function() {
        self.$map.resizeMap();
        return that;
    };

    return that;

};
