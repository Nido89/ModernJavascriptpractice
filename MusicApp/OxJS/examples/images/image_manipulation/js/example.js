/*
Load the image module.
*/
Ox.load('Image', function() {

    /*
    Load a sample image (which has its own entry in
    <a href="http://en.wikipedia.org/wiki/Lenna">Wikipedia</a>).
    */
    Ox.Image('png/lenna256.png', function(image) {

        /*
        Create some DOM elements. Ox.$ works like jQuery.
        */
        var $body = Ox.$('body'),
            $select = Ox.$('<select>').on({change: change}).appendTo($body),
            $image = Ox.$('<img>').attr({src: image.src()}).appendTo($body);

        [
            'Method...', 'src("png/lenna256.png")',
            'blur(2)', 'blur(4)',
            'channel("r")', 'channel("g")', 'channel("b")',
            'channel("h")', 'channel("s")', 'channel("l")',
            'contour()',
            'depth(1)', 'depth(2)', 'depth(4)',
            'drawCircle([128, 128], 64, {"fill": "rgba(0, 0, 0, 0.5)"})',
            'drawLine([[64, 64], [192, 192]], {"color": "green", "width": 2})',
            'drawPath([[64, 64], [192, 64], [64, 192]], {"close": true})',
            'drawRectangle([64, 64], [128, 128], {"fill": "red", "width": 0})',
            'drawText("?", [16, 240], {"color": "blue", "font": "64px Arial"})',
            'edges()', 'emboss()',
            'encode("secret")', 'decode()',
            'encode("secret", false)', 'decode(false)',
            'encode("secret", 1)', 'decode(1)',
            'encode("secret", false, 15)', 'decode(false, 15)',
            'encode("secret", 127)', 'decode(127)',
            'filter([0, 1, 0, 1, -2, 1, 0, 1, 0])',
            'hue(-60)', 'hue(60)',
            'invert()',
            'lightness(-0.5)', 'lightness(0.5)',
            'map(function(v, xy) { return Ox.sum(xy) % 2 ? [0, 0, 0] : v; })',
            'mosaic(4)', 'motionBlur()',
            'photocopy()', 'pixel([16, 16], [255, 255, 255])', 'posterize()',
            'saturation(-0.5)', 'saturation(0.5)',
            'sharpen()', 'solarize()'
        ].forEach(function(method) {
            Ox.$('<option>').html(method).appendTo($select);
        });

        function change() {
            var value = $select.val(),
                match = value.match(/^(\w+)\((.*?)\)$/),
                fn = match[1], args;
            /*
            The `map` method takes a function as its argument, which we can't
            `JSON.parse`, but have to `eval`.
            */
            try {
                args = JSON.parse('[' + match[2] + ']');
            } catch(e) {
                args = [eval('f = ' + match[2])];
            }
            /*
            The `src` and `encode` methods are asynchronous and take a callback
            function.
            */
            if (fn == 'src' || fn == 'encode') {
                image[fn].apply(null, args.concat(function(image) {
                    $image.attr({src: image.src()});
                }));
            /*
            The `decode` method is asynchronous too, and its callback function
            gets passed a string.
            */
            } else if (fn == 'decode') {
                image[fn].apply(null, args.concat(alert));
            /*
            All other methods simply return the image.
            */
            } else {
                $image.attr({src: image[fn].apply(null, args).src()});
            }
            $select.val('Method...');
        }

    });

});
