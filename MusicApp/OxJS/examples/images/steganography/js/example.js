/*
Ox.Image provides a pair of methods, `encode` and `decode`, which can be used
for <a href="http://en.wikipedia.org/wiki/Steganography">steganography</a>, i.e.
to add a hidden message to an image.<br><br> The signature of the `encode`
function is `image.encode(message, deflate, mode, callback)`. `deflate` turns
deflate-compression on or off, and `mode` determines which bits of the image the
message will be written to &mdash; but for most purposes, the default values
(`true` and `0`) are fine, so `deflate` and `mode` can be omitted.

In this example, we demonstrate a valid use case for `deflate` and `mode`: To
encode an decoy message (a line of text), which will be relatively easy to
detect, and then the the actual message, (another image, itself containing
another line of text), which will be harder to detect.
*/
'use strict';

Ox.load('Image', function() {

    var $table = Ox.$('<table>').appendTo(Ox.$('body')),
        $tr,
        text = {
            iceland: 'The first image he told me about '
                + 'was of three children on a road in Iceland in 1965.',
            vietnam: 'He said for him it was the image of happiness, '
                + 'and that he had often tried to link it to other images, '
                + 'but it had never worked.'
        };

    encode(decode);

    /*
    So we first encode two lines text into two images, by writing them bit by
    bit (without compression, `deflate = false`), into the least significant bit
    of each 8-bit RGB value (`mode = 1`). Then we encode one image into the
    other: We take the (deflate-compressed, `deflate = true`) data URL of the
    source image and flip, if needed, the second least significant bit of each
    RGB value of the target image, so that the number of bits set to 1, modulo 2
    (for example: 10101010 -> 0), is the bit we're encoding (`mode = -1`). As
    the least significant bit remains untouched, this will preserve the encoded
    text.
    */
    function encode(callback) {
        status('Load iceland.png');
        Ox.Image('png/iceland.png', function(iceland) {
            result(Ox.$('<img>').attr({src: iceland.src()}));
            status(
                'Encode the text <i>"' + text.iceland + '"</i> into '
                + 'the least significant bits of iceland.png'
            );
            iceland.encode(text.iceland, false, 1, function(iceland) {
                result(Ox.$('<img>').attr({src: iceland.src()}));
                status('Load vietnam.png');
                Ox.Image('png/vietnam.png', function(vietnam) {
                    result(Ox.$('<img>').attr({src: vietnam.src()}));
                    status(
                        'Encode the text <i>"' + text.vietnam + '"</i> into'
                        + ' the least significant bits of vietnam.png'
                    );
                    vietnam.encode(text.vietnam, false, 1, function(vietnam) {
                        result(Ox.$('<img>').attr({src: vietnam.src()}));
                        status(
                            'Encode vietnam.png into iceland.png '
                            + 'by flipping the second least significant bits'
                        );
                        iceland.encode(vietnam.src(), -1, function(iceland) {
                            result(Ox.$('<img>').attr({src: iceland.src()}));
                            callback(iceland);
                        });
                    });
                });
            });
        });
    }

    /*
    Finally, we decode all the data again.
    */
    function decode(iceland) {
        status('Decode the least signigicant bits of iceland.png');
        iceland.decode(false, 1, function(str) {
            result(str);
            status('Decode all bits of iceland.png');
            iceland.decode(-1, function(src) {
                result(
                    src.slice(0, 32) + '<i> ... ['
                    + Ox.formatNumber(src.length - 64)
                    + ' more bytes] ... </i>' + src.slice(-32)
                );
                status('Load as vietnam.png');
                Ox.Image(src, function(image) {
                    result(Ox.$('<img>').attr({src: src}));
                    status('Decode the least significant bits of vietnam.png');
                    image.decode(false, 1, result);
                });
            });
        });
    }

    function status(value) {
        var $td = Ox.$('<td>');
        if (Ox.isString(value)) {
            $td.html(
                value.replace(/(\w+\.png)/g, '<b>$1</b>')
            );
        } else {
            $td.append(value);
        }
        $tr = Ox.$('<tr>').append($td).appendTo($table);
    }

    function result(value) {
        var $td = Ox.$('<td>');
        if (Ox.isString(value)) {
            $td.html(value);
        } else {
            $td.append(value);
        }
        $tr.append($td);
    }

});