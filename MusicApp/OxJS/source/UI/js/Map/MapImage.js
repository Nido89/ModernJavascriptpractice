'use strict';

/*@
Ox.MapImage <f> MapImage Object
    options <o> Options object
        height <n|360> image height (px)
        place <o|null> Object with south, west, north and east properties
        type <s|satellite> map type ('hybrid', 'roadmap', 'satellite', 'terrain')
        width <n|640> image width (px)
    self <o> shared private variable
    ([options[, self]]) -> <o:Ox.Element> MapImage Object
@*/

Ox.MapImage = function(options, self) {

    var self = self || {},
        that = Ox.Element('<img>', self)
            .defaults({
                backgroundColor: [0, 0, 0, 0],
                borderColor: [0, 0, 0, 0],
                borderWidth: 0,
                height: 640,
                markers: [],
                place: null,
                type: 'satellite',
                width: 640
            })
            .options(options || {});

    self.src = document.location.protocol
        + '//maps.google.com/maps/api/staticmap?sensor=false' +
        '&size=' + self.options.width + 'x' + self.options.height +
        '&maptype=' + self.options.type;

    if (self.options.place) {
        self.src += '&path=fillcolor:' + formatColor(self.options.backgroundColor)
            + '|color:0x' + formatColor(self.options.borderColor)
            + '|weight:' + self.options.borderWidth + '|'
            + [
                ['south', 'west'],
                ['north', 'west'],
                ['north', 'east'],
                ['south', 'east'],
                ['south', 'west']
            ].map(function(keys) {
                return [
                    self.options.place[keys[0]],
                    self.options.place[keys[1]]
                ].join(',');
            }).join('|');
    } else {
        self.src += '&center=0,0&zoom=2'
    }
    if (self.options.markers.length) {
        self.src += '&markers='
            + self.options.markers.map(function(marker) {
                return [marker.lat, marker.lng].join(',')
            }).join('|');
    }

    that.attr({
        src: self.src
    });

    function formatColor(color) {
        return color.map(function(c) {
            return Ox.pad(c.toString(16), 'left', 2, '0');
        }).join('')
    }

    return that;

};
