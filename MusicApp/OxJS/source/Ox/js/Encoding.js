'use strict';

/*@
Ox.encodeBase26 <b> Encode a number as bijective base26
    See <a href="http://en.wikipedia.org/wiki/Bijective_numeration">
    Bijective numeration</a>.
    > Ox.encodeBase26(0)
    ''
    > Ox.encodeBase26(1)
    'A'
    > Ox.encodeBase26(26)
    'Z'
    > Ox.encodeBase26(27)
    'AA'
    > Ox.encodeBase26(4461)
    'FOO'
@*/
Ox.encodeBase26 = function(number) {
    var string = '';
    while (number) {
        string = String.fromCharCode(65 + (number - 1) % 26) + string;
        number = Math.floor((number - 1) / 26);
    }
    return string;
};

/*@
Ox.decodeBase26 <f> Decodes a bijective base26-encoded number
    See <a href="http://en.wikipedia.org/wiki/Bijective_numeration">
    Bijective numeration</a>.
    > Ox.decodeBase26('foo')
    4461
@*/
Ox.decodeBase26 = function(string) {
    return string.toUpperCase().split('').reverse().reduce(function(p, c, i) {
        return p + (c.charCodeAt(0) - 64) * Math.pow(26, i);
    }, 0);
};

/*@
Ox.encodeBase32 <b> Encode a number as base32
    See <a href="http://www.crockford.com/wrmg/base32.html">Base 32</a>.
    > Ox.encodeBase32(15360)
    'F00'
    > Ox.encodeBase32(33819)
    '110V'
@*/
Ox.encodeBase32 = function(number) {
    return Ox.map(number.toString(32), function(char) {
        return Ox.BASE_32_DIGITS[parseInt(char, 32)];
    });
};

/*@
Ox.decodeBase32 <f> Decodes a base32-encoded number
    See <a href="http://www.crockford.com/wrmg/base32.html">Base 32</a>.
    > Ox.decodeBase32('foo')
    15360
    > Ox.decodeBase32('ILOU')
    33819
    > Ox.decodeBase32('?').toString()
    'NaN'
@*/
Ox.decodeBase32 = function(string) {
    return parseInt(Ox.map(string.toUpperCase(), function(char) {
        var index = Ox.BASE_32_DIGITS.indexOf(
            Ox.BASE_32_ALIASES[char] || char
        );
        return index == -1 ? ' ' : index.toString(32);
    }), 32);
};

/*@
Ox.encodeBase64 <f> Encode a number as base64
    > Ox.encodeBase64(32394)
    'foo'
@*/
Ox.encodeBase64 = function(number) {
    return btoa(Ox.encodeBase256(number)).replace(/=/g, '');
};

/*@
Ox.decodeBase64 <f> Decodes a base64-encoded number
    > Ox.decodeBase64('foo')
    32394
@*/
Ox.decodeBase64 = function(string) {
    return Ox.decodeBase256(atob(string));
};

/*@
Ox.encodeBase128 <f> Encode a number as base128
    > Ox.encodeBase128(1685487)
    'foo'
@*/
Ox.encodeBase128 = function(number) {
    var string = '';
    while (number) {
        string = Ox.char(number & 127) + string;
        number >>= 7;
    }
    return string;
};

/*@
Ox.decodeBase128 <f> Decode a base128-encoded number
    > Ox.decodeBase128('foo')
    1685487
@*/
Ox.decodeBase128 = function(string) {
    return string.split('').reverse().reduce(function(p, c, i) {
        return p + (c.charCodeAt(0) << i * 7);
    }, 0);
};

/*@
Ox.encodeBase256 <f> Encode a number as base256
    > Ox.encodeBase256(6713199)
    'foo'
@*/
Ox.encodeBase256 = function(number) {
    var string = '';
    while (number) {
        string = Ox.char(number & 255) + string;
        number >>= 8;
    }
    return string;
};

/*@
Ox.decodeBase256 <f> Decode a base256-encoded number
    > Ox.decodeBase256('foo')
    6713199
@*/
Ox.decodeBase256 = function(string) {
    return string.split('').reverse().reduce(function(p, c, i) {
        return p + (c.charCodeAt(0) << i * 8);
    }, 0);
};

/*@
Ox.encodeDeflate <f> Encodes a string, using deflate
    Since PNGs are deflate-encoded, the `canvas` object's `toDataURL` method
    provides an efficient implementation. The string is encoded as UTF-8 and
    written to the RGB channels of a canvas element, then the PNG dataURL is
    decoded from base64, and some head, tail and chunk names are removed.
    (str) -> <s> The encoded string
        str <s> The string to be encoded
    > Ox.decodeDeflate(Ox.encodeDeflate('foo'), function(str) { Ox.test(str, 'foo'); })
    undefined
@*/
Ox.encodeDeflate = function(string, callback) {
    // Make sure we can encode the full unicode range of characters.
    string = Ox.encodeUTF8(string);
    // We can only safely write to RGB, so we need 1 pixel for 3 bytes.
    // The string length may not be a multiple of 3, so we need to encode
    // the number of padding bytes (1 byte), the string, and non-0-bytes
    // as padding, so that the combined length becomes a multiple of 3.
    var length = 1 + string.length, c = Ox.canvas(Math.ceil(length / 3), 1),
        data, idat, pad = (3 - length % 3) % 3;
    string = Ox.char(pad) + string + Ox.repeat('\u00FF', pad);
    Ox.loop(c.data.length, function(i) {
        // Write character codes into RGB, and 255 into ALPHA
        c.data[i] = i % 4 < 3 ? string.charCodeAt(i - parseInt(i / 4)) : 255;
    });
    c.context.putImageData(c.imageData, 0, 0);
    // Get the PNG data from the data URL and decode it from base64.
    string = atob(c.canvas.toDataURL().split(',')[1]);
    // Discard bytes 0 to 15 (8 bytes PNG signature, 4 bytes IHDR length, 4
    // bytes IHDR name), keep bytes 16 to 19 (width), discard bytes 20 to 29
    // (4 bytes height, 5 bytes flags), keep bytes 29 to 32 (IHDR checksum),
    // keep the rest (IDAT chunks), discard the last 12 bytes (IEND chunk).
    data = string.slice(16, 20) + string.slice(29, 33);
    idat = string.slice(33, -12);
    while (idat) {
        // Each IDAT chunk is 4 bytes length, 4 bytes name, length bytes
        // data and 4 bytes checksum. We can discard the name parts.
        length = idat.slice(0, 4);
        data += length + idat.slice(8, 12 + (
            length = Ox.decodeBase256(length)
        ));
        idat = idat.slice(12 + length);
    }
    // Allow for async use, symmetrical to Ox.decodeDeflate
    callback && callback(data);
    return data;
};

/*@
Ox.decodeDeflate <f> Decodes an deflate-encoded string
    Since PNGs are deflate-encoded, the `canvas` object's `drawImage` method
    provides an efficient implementation. The string will be wrapped as a PNG
    dataURL, encoded as base64, and drawn onto a canvas element, then the RGB
    channels will be read, and the result will be decoded from UTF8.
    (str) -> <u> undefined
        str <s> The string to be decoded
        callback <f> Callback function
            str <s> The decoded string
@*/

Ox.decodeDeflate = function(string, callback) {
    var image = new Image(),
        // PNG file signature and IHDR chunk
        data = '\u0089PNG\r\n\u001A\n\u0000\u0000\u0000\u000DIHDR'
            + string.slice(0, 4) + '\u0000\u0000\u0000\u0001'
            + '\u0008\u0006\u0000\u0000\u0000' + string.slice(4, 8),
        // IDAT chunks
        idat = string.slice(8), length;
    function error() {
        throw new RangeError('Deflate codec can\'t decode data.');
    }
    while (idat) {
        // Reinsert the IDAT chunk names
        length = idat.slice(0, 4);
        data += length + 'IDAT' + idat.slice(4, 8 + (
            length = Ox.decodeBase256(length)
        ));
        idat = idat.slice(8 + length);
    }
    // IEND chunk
    data += '\u0000\u0000\u0000\u0000IEND\u00AE\u0042\u0060\u0082';
    // Unfortunately, we can't synchronously set the source of an image,
    // draw it onto a canvas, and read its data.
    image.onload = function() {
        string = Ox.slice(Ox.canvas(image).data).map(function(value, index) {
            // Read one character per RGB byte, ignore ALPHA.
            return index % 4 < 3 ? Ox.char(value) : '';
        }).join('');
        try {
            // Parse the first byte as number of bytes to chop at the end,
            // and the rest, without these bytes, as an UTF8-encoded string.
            string = Ox.decodeUTF8(
                string.slice(1, -string.charCodeAt(0) || void 0)
            );
        } catch (e) {
            error();
        }
        callback(string);
    };
    image.onerror = error;
    image.src = 'data:image/png;base64,' + btoa(data);
};

(function() {

    function replace(string) {
        return string.replace(/%(?![0-9A-Fa-f]{2})/g, '%25')
            .replace(/(%[0-9A-Fa-f]{2})+/g, function(match) {
                var hex = match.split('%').slice(1), ret;
                Ox.forEach(Ox.range(1, hex.length + 1), function(length) {
                    var string = Ox.range(length).map(function(i) {
                        return Ox.char(parseInt(hex[i], 16));
                    }).join('');
                    try {
                        Ox.decodeUTF8(string);
                        ret = match.slice(0, length * 3)
                            + replace(match.slice(length * 3));
                        return false;
                    } catch(e) {}
                });
                return ret || '%25' + hex[0] + replace(match.slice(3));
            });
    }

    /*@
    Ox.decodeURI <f> Decodes URI
        Unlike window.decodeURI, this doesn't throw on trailing '%'.
        (string) -> <s> Decoded string
    @*/
    Ox.decodeURI = function(string) {
        return decodeURI(replace(string));
    };

    /*@
    Ox.decodeURIComponent <f> Decodes URI component
        Unlike window.decodeURIComponent, this doesn't throw on trailing '%'.
        (string) -> <s> Decoded string
    @*/
    Ox.decodeURIComponent = function(string) {
        return decodeURIComponent(replace(string));
    };

}());

/*@
Ox.encodeUTF8 <f> Encodes a string as UTF-8
    see http://en.wikipedia.org/wiki/UTF-8
    (string) -> <s> UTF-8 encoded string
    string <s> Any string
    > Ox.encodeUTF8("YES")
    "YES"
    > Ox.encodeUTF8("¥€$")
    "\u00C2\u00A5\u00E2\u0082\u00AC\u0024"
@*/
Ox.encodeUTF8 = function(string) {
    return Ox.map(string, function(char) {
        var code = char.charCodeAt(0),
            string = '';
        if (code < 128) {
            string = char;
        } else if (code < 2048) {
            string = String.fromCharCode(code >> 6 | 192)
                + String.fromCharCode(code & 63 | 128);
        } else {
            string = String.fromCharCode(code >> 12 | 224)
                + String.fromCharCode(code >> 6 & 63 | 128)
                + String.fromCharCode(code & 63 | 128);
        }
        return string;
    });
};

/*@
Ox.decodeUTF8 <f> Decodes an UTF-8-encoded string
    see http://en.wikipedia.org/wiki/UTF-8
    (utf8) -> <s> string
    utf8 <s> Any UTF-8-encoded string
    > Ox.decodeUTF8('YES')
    'YES'
    > Ox.decodeUTF8('\u00C2\u00A5\u00E2\u0082\u00AC\u0024')
    '¥€$'
@*/
Ox.decodeUTF8 = function(string) {
    var code, i = 0, length = string.length, ret = '';
    function error(byte, position) {
        throw new RangeError(
            'UTF-8 codec can\'t decode byte 0x' +
            byte.toString(16).toUpperCase() + ' at position ' + position
        );
    }
    while (i < length) {
        code = [
            string.charCodeAt(i),
            string.charCodeAt(i + 1),
            string.charCodeAt(i + 2)
        ];
        if (code[0] < 128) {
            ret += string[i];
            i++;
        } else if (
            code[0] >= 192 && code[0] < 240
            && i < length - (code[0] < 224 ? 1 : 2)
        ) {
            if (code[1] >= 128 && code[1] < 192) {
                if (code[0] < 224) {
                    ret += String.fromCharCode(
                        (code[0] & 31) << 6 | code[1] & 63
                    );
                    i += 2;
                } else if (code[2] >= 128 && code[2] < 192) {
                    ret += String.fromCharCode(
                        (code[0] & 15) << 12 | (code[1] & 63) << 6
                        | code[2] & 63
                    );
                    i += 3;
                } else {
                    error(code[2], i + 2);
                }
            } else {
                error(code[1], i + 1);
            }
        } else {
            error(code[0], i);
        }
    }
    return ret;
};
