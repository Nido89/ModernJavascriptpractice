'use strict';

/*@
Ox.MapMarkerImage <f> MapMarkerImage Object
    (options) -> <o> google.maps.MarkerImage
    options <o> Options object
        color <a|[255, 0, 0]> marker color
        mode <s|normal> can be: normal, selected, editing
        size <n|16> size
        type <s|place> can be: place, result, rectangle
@*/

Ox.MapMarkerImage = (function() {

    var cache = {};

    return function(options) {

        options = Ox.extend({
            color: [255, 0, 0],
            mode: 'normal', // normal, selected, editing
            rectangle: false,
            size: 16,
            type: 'place' // place, result
        }, options);

        var index = [
                options.type, options.mode, options.size, options.color.join(',')
            ].join(';'),
            themeData = Ox.Theme.getThemeData();

        if (!cache[index]) {
            var color = options.rectangle ? [0, 0, 0, 0]
                    : options.color.concat(
                        [options.type == 'place' ? 0.75 : 0.25]
                    ),
                border = (
                    options.mode == 'normal' ? themeData.mapPlaceBorder
                    : options.mode == 'selected' ? themeData.mapPlaceSelectedBorder
                    : themeData.mapPlaceEditingBorder
                ).concat([options.type == 'result' ? 0.5 : 1]),
                c = Ox.canvas(options.size, options.size),
                image,
                r = options.size / 2;
            c.context.fillStyle = 'rgba(' + color.join(', ') + ')';
            c.context.arc(r, r, r - 2, 0, 360);
            c.context.fill();
            c.context.beginPath();
            c.context.lineWidth = 2;
            c.context.strokeStyle = 'rgba(' + border.join(', ') + ')';
            c.context.arc(r, r, r - 1, 0, 360);
            c.context.stroke();
            cache[index] = new google.maps.MarkerImage(
                c.canvas.toDataURL(),
                new google.maps.Size(options.size, options.size),
                new google.maps.Point(0, 0),
                new google.maps.Point(r, r)
            );
        }

        return cache[index];

    }

}());
