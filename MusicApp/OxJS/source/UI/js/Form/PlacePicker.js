'use strict';

/*@
Ox.PlacePicker <f> PlacePicker Object
    options <o> Options object
        id <s> element id
        value <s|United States> default value of place input
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.Picker> PlacePicker Object
@*/

Ox.PlacePicker = function(options, self) {

    var that;
    self = Ox.extend(self || {}, {
            options: Ox.extend({
                id: '',
                value: 'United States'
            }, options)
        });

    self.$element = Ox.Element()
        .css({
            width: '256px',
            height: '192px'
        })
        .append(
            self.$topBar = Ox.Bar({
                    size: 16
                })
                .css({
                    MozBorderRadius: '0 8px 0 0',
                    WebkitBorderRadius: '0 8px 0 0'
                })
                .append(
                    self.$input = Ox.Input({
                            clear: true,
                            id: self.options.id + 'Input',
                            placeholder: Ox._('Find'),
                            width: 256
                        })
                        .bindEvent('submit', findPlace)
                )
        )
        .append(
            self.$container = Ox.Element()
                .css({
                    width: '256px',
                    height: '160px'
                })
        )
        .append(
            self.$bottomBar = Ox.Bar({
                    size: 16
                })
                .append(
                    self.$range = Ox.Range({
                            arrows: true,
                            changeOnDrag: true,
                            id: self.options.id + 'Range',
                            max: 22,
                            size: 256,
                            thumbSize: 32,
                            thumbValue: true
                        })
                        .bindEvent('change', changeZoom)
                )
        );

    self.$input.children('input[type=text]').css({
        width: '230px',
        paddingLeft: '2px',
        MozBorderRadius: '0 8px 8px 0',
        WebkitBorderRadius: '0 8px 8px 0'
    });
    self.$input.children('input[type=image]').css({
        MozBorderRadius: '0 8px 0 0',
        WebkitBorderRadius: '0 8px 0 0'
    });
    self.$range.children('input').css({
        MozBorderRadius: 0,
        WebkitBorderRadius: 0
    });

    that = Ox.Picker({
            element: self.$element,
            elementHeight: 192,
            elementWidth: 256,
            id: self.options.id,
            overlap: self.options.overlap,
            value: self.options.value
        }, self)
        .bindEvent('show', showPicker);

    that.$label.on('click', clickLabel);

    self.map = false;

    function changeZoom(data) {
        //Ox.Log('Form', 'changeZoom')
        self.$map.zoom(data.value);
    }

    function clickLabel() {
        var name = that.$label.html();
        if (name) {
            self.$input
                .value(name)
                .triggerEvent('submit', {
                    value: name
                });
        }
    }

    function findPlace(data) {
        //Ox.Log('Form', 'findPlace', data);
        self.$map.find(data.value, function(place) {
            place && that.$label.html(place.geoname);
        });
    }

    function onSelect(data) {
        that.$label.html(data.geoname);
    }

    function onZoom(data) {
        self.$range.value(data.value);
    }

    function showPicker() {
        if (!self.map) {
            self.$map = Ox.Map({
                    clickable: true,
                    id: self.options.id + 'Map',
                    // fixme: this is retarded, allow for map without places
                    places: [{south: -85, west: -179, north: -85, east: 179}]
                    //places: [self.options.value]
                })
                .css({
                    top: '16px',
                    width: '256px',
                    height: '160px'
                })
                .bindEvent({
                    select: onSelect,
                    zoom: onZoom
                })
                .appendTo(self.$container);
            self.map = true;
        }
    }

    return that;

};
