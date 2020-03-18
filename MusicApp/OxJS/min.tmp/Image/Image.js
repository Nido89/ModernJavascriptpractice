'use strict';

Ox.load.Image = function(options, callback) {

    //@ Image

    /*@
    Ox.Image <f> Generic image object
        To render the image as an image element, use its `src()` method, to
        render it as a canvas, use its `canvas` property.
        (src, callback) -> <u> undefined
        (width, height[, background], callback) -> <u> undefined
        src <s> Image source (local, remote or data URL)
        width <n> Width in px
        height <n> Height in px
        background <[n]> Background color (RGB or RGBA)
        callback <f> Callback function
            image <o> Image object
        @ Ox.Image(1, 1, [255, 0, 0], function(i) { Ox.test(i.pixel([0, 0]), [255, 0, 0, 255]); })
        undefined
        @ Ox.Image(Ox.UI.PATH + 'themes/oxlight/png/icon16.png', function(i) { i.encode('foo', function(i) { i.decode(function(s) { Ox.test(s, 'foo'); })})})
        undefined
    @*/
    Ox.Image = function() {

        var self = {},
            that = {};

        function error(mode) {
            throw new RangeError('PNG codec can\'t ' + mode + ' ' + (
                mode == 'encode' ? 'data' : 'image'
            ));
        }

        function getCapacity(bpb) {
            var capacity = 0;
            that.forEach(function(rgba) {
                capacity += rgba[3] == 255 ? bpb * 3/8 : 0;
            });
            return capacity;
        }

        function getIndex(xy) {
            return (
                Ox.mod(xy[0], self.width)
                + Ox.mod(xy[1] * self.width, self.width * self.height)
            ) * 4;
        }

        function getXY(index) {
            index /= 4;
            return [index % self.width, Math.floor(index / self.width)];
        }

        function init() {
            if (self.image) {
                self.width = self.image.width;
                self.height = self.image.height;
            }
            that.canvas = Ox.$('<canvas>').attr({
                width: self.width,
                height: self.height
            });
            that.context = that.canvas[0].getContext('2d');
            if (self.image) {
                that.context.drawImage(self.image, 0, 0);
            } else if (!Ox.isEqual(self.background, [0, 0, 0, 0])) {
                that.context.fillStyle = (
                    self.background.length == 3 ? 'rgb' : 'rgba'
                ) + '(' + self.background.join(', ') + ')';
                that.context.fillRect(0, 0, self.width, self.height);
            }
            self.imageData = that.context.getImageData(
                0, 0, self.width, self.height
            );
            self.data = self.imageData.data;
            self.callback(that);
        }

        function parseDrawOptions(options) {
            options = options || {};
            that.context.strokeStyle = options.width === 0
                ? 'rgba(0, 0, 0, 0)' : options.color || 'rgb(0, 0, 0)';
            that.context.fillStyle = options.fill || 'rgba(0, 0, 0, 0)';
            that.context.lineWidth = options.width !== void 0
                ? options.width : 1;
        }

        function setSL(sl, d) {
            var c = sl == 's' ? 1 : 2;
            return that.map(function(rgba) {
                var hsl = Ox.hsl([rgba[0], rgba[1], rgba[2]]);
                hsl[c] = d < 0 ? hsl[c] * (d + 1) : hsl[c] + (1 - hsl[c]) * d;
                return Ox.rgb(hsl).concat(rgba[3]);
            });
        }

        /*@
        blur <f> Apply blur filter
            (val) -> <o> The image object
            val <n> Amount of blur (1 to 5, more is slow)
        @*/
        that.blur = function(val) {
            var filter = [],
                size = val * 2 + 1,
                sum = 0
            Ox.loop(size, function(x) {
                Ox.loop(size, function(y) {
                    var isInCircle = +(Math.sqrt(
                        Math.pow(x - val, 2) + Math.pow(y - val, 2)
                    ) <= val);
                    sum += isInCircle;
                    filter.push(isInCircle)
                });
            });
            filter = filter.map(function(val) {
                return val / sum;
            });
            return that.filter(filter);
        };

        //@ canvas <o> Canvas element

        /*@
        channel <f> Reduce the image to one channel
            (channel) -> <o> The image object
            channel <str> 'r', 'g', 'b', 'a', 'h', 's' or 'l'
        @*/
        that.channel = function(str) {
            str = str[0].toLowerCase();
            return that.map(function(rgba) {
                var i = ['r', 'g', 'b', 'a'].indexOf(str), rgb, val;
                if (i > -1) {
                    return Ox.map(rgba, function(v, c) {
                        return str == 'a'
                            ? (c < 3 ? rgba[3] : 255)
                            : (c == i || c == 3 ? v : 0);
                    });
                } else {
                    i = ['h', 's', 'l'].indexOf(str);
                    val = Ox.hsl([rgba[0], rgba[1], rgba[2]])[i];
                    rgb = i == 0 
                        ? Ox.rgb([val, 1, 0.5])
                        : Ox.range(3).map(function() {
                            return Math.floor(val * 255);
                        });
                    return rgb.concat(rgba[3]);
                }
            });
        };

        //@ context <o> 2D drawing context

        /*@
        contour <f> Apply contour filter
            () -> <o> The image object
        @*/
        that.contour = function(val) {
            return that.filter([
                +1, +1, +1,
                +1, -7, +1,
                +1, +1, +1
            ]);
        };

        /*@
        depth <f> Reduce the bit depth
            (depth) -> <o> The image object
            depth <n> Bits per channel (1 to 7)
        @*/
        that.depth = function(val) {
            var pow = Math.pow(2, 8 - val);
            return that.map(function(rgba) {
                return rgba.map(function(v, i) {
                    return i < 3 ? Math.floor(v / pow) * pow/* * 255 / val*/ : v;
                });
            });
        };

        /*@
        drawCircle <f> Draws a circle
            (point, radius, options) -> <o> The image object
            point <[n]> Center (`[x, y]`)
            radius <n> Radius in px
            options <o> Options
                color <s|'rgb(0, 0, 0)'> CSS color
                fill <s|'rgba(0, 0, 0, 0)'> CSS color
                width <n|1> Line width in px
        @*/
        that.drawCircle = function(point, radius, options) {
            parseDrawOptions(options);
            that.context.beginPath();
            that.context.arc(point[0], point[1], radius, 0, 2 * Math.PI);
            that.context.fill();
            that.context.stroke();
            return that;
        };

        /*@
        drawLine <f> Draws a line
            (points, options) -> <o> The image object
            points <[a]> End points (`[[x1, y1], [x2, y2]]`)
            options <o> Options
                color <s|'rgb(0, 0, 0)'> CSS color
                width <n|1> Line width in px
        @*/
        that.drawLine = function(points, options, isPath) {
            parseDrawOptions(options);
            !isPath && that.context.beginPath();
            !isPath && that.context.moveTo(points[0][0], points[0][1]);
            that.context.lineTo(points[1][0], points[1][1]);
            !isPath && that.context.stroke();
            return that;
        };

        /*@
        drawPath <f> Draws a path
            (points, options) -> <o> The image object
            points <[a]> Points (`[[x1, y2], [x2, y2], ...]`)
            options <o> Options
                color <s|'rgb(0, 0, 0)'> CSS color
                fill <s|'rgba(0, 0, 0, 0)'> CSS color
                width <n|1> Line width in px
        @*/
        that.drawPath = function(points, options) {
            var n = points.length;
            parseDrawOptions(options);
            that.context.beginPath();
            that.context.moveTo(points[0][0], points[0][1]);
            Ox.loop(options.close ? n : n - 1, function(i) {
                that.drawLine([points[i], points[(i + 1) % n]], options, true);
            });
            that.context.fill();
            that.context.stroke();
            return that;
        };

        /*@
        drawRectangle <f> Draws a rectangle
            (point, size, options) -> <o> The image object
            point <[n]> Top left corner (`[x, y]`)
            size <[n]> Width and height in px (`[w, h]`)
            options <o> Options
                color <s|'rgb(0, 0, 0)'> CSS color
                fill <s|'rgba(0, 0, 0, 0)'> CSS color
                width <n|1> Line width in px
        @*/
        that.drawRectangle = function(point, size, options) {
            parseDrawOptions(options);
            that.context.fillRect(point[0], point[1], size[0], size[1]);
            that.context.strokeRect(point[0], point[1], size[0], size[1]);
            return that;
        };

        /*@
        drawText <f> Draws text
            (text, point, options) -> <o> The image object
            text <s> Text
            point <[n]> Top left corner (`[x, y]`)
            options <o> Options
                color <s|'rgb(0, 0, 0)'> CSS color
                font <s|'10px sans-serif'> CSS font
                outline <s|'0px rgba(0, 0, 0, 0)'> CSS border
                textAlign <n|'start'> CSS text-align
        @*/
        that.drawText = function(text, point, options) {
            options = options || {};
            var match = (
                    options.outline || '0px rgba(0, 0, 0, 0)'
                ).match(/^([\d\.]+)px (.+)$/),
                outlineWidth = match[1],
                outlineColor = match[2];
            that.context.fillStyle = options.color || 'rgb(0, 0, 0)';
            that.context.font = options.font || '10px sans-serif';
            that.context.strokeStyle = outlineColor;
            that.context.lineWidth = outlineWidth;
            that.context.textAlign = options.textAlign || 'start';
            that.context.fillText(text, point[0], point[1])
            that.context.strokeText(text, point[0], point[1])
            return that;
        };

        /*@
        edges <f> Apply edges filter
            () -> <o> The image object
        @*/
        that.edges = function(val) {
            return that.filter([
                -1, -1, -1,
                -1, +8, -1,
                -1, -1, -1
            ]).saturation(-1);
        };

        /*@
        emboss <f> Apply emboss filter
            () -> <o> The image object
        @*/
        that.emboss = function(val) {
            return that.filter([
                -1, -1,  0,
                -1,  0, +1,
                 0, +1, +1
            ], 128).saturation(-1);
        };

        /*@
        encode <f> Encodes a string into the image
            For most purposes, deflate and mode should be omitted, since the
            defaults make the existence of the message harder to detect. A valid
            use case for deflate and mode would be to first encode a more easily
            detected decoy string, and only then the secret string:
            `image.encode(decoy, false, 1, function(image) {
            image.encode(secret, -1, callback); })`.
            (str, callback) -> <o> The image object (unmodified)
            (str, deflate, callback) -> <o> The image object (unmodified)
            (str, mode, callback) -> <o> The image object (unmodified)
            (str, deflate, mode, callback) -> <o> The image object (unmodified)
            (str, mode, deflate, callback) -> <o> The image object (unmodified)
            str <s> The string to be encoded
            callback <f> Callback function
                image <o> The image object (modified)
            deflate <b|true> If true, encode the string with deflate
            mode <n|0> Encoding mode
                If mode is between -7 and 0, the string will be encoded one bit
                per RGB byte, as the number of bits within that byte set to 1,
                modulo 2, by flipping, if necessary, the most (mode -7) to least
                (mode 0) significant bit. If mode is between 1 and 255, the
                string will be encoded bitwise into all bits per RGB byte that,
                in mode, are set to 1.
        @*/
        that.encode = function(str) {
            var callback = arguments[arguments.length - 1],
                deflate = Ox.isBoolean(arguments[1]) ? arguments[1]
                    : Ox.isBoolean(arguments[2]) ? arguments[2] : true,
                mode = Ox.isNumber(arguments[1]) ? arguments[1]
                    : Ox.isNumber(arguments[2]) ? arguments[2] : 0,
                b = 0, bin,
                // Array of bits per byte to be modified (0 is LSB)
                bits = mode < 1 ? [-mode] : Ox.filter(Ox.range(8), function(i) {
                    return mode & 1 << i;
                }),
                cap = getCapacity(bits.length), len;
            // Compress the string
            str = Ox[deflate ? 'encodeDeflate' : 'encodeUTF8'](str);
            len = str.length;
            // Prefix the string with its length, as a four-byte value
            str = Ox.pad(Ox.encodeBase256(len), 'left', 4, '\u0000') + str;
            str.length > cap && error('encode');
            while (str.length < cap) {
                str += str.substr(4, len);
            }
            str = str.slice(0, Math.ceil(cap));
            // Create an array of bit values
            bin = Ox.flatten(Ox.map(str.split(''), function(chr) {
                return Ox.range(8).map(function(i) {
                    return chr.charCodeAt(0) >> 7 - i & 1;
                });
            }));
            b = 0;
            that.forEach(function(rgba, xy, index) {
                // If alpha is not 255, the RGB values may not be preserved
                if (rgba[3] == 255) {
                    Ox.loop(3, function(c) {
                        // fixme: use: var data = that.context.imageData.data[i + c]
                        var i = index + c;
                        Ox.forEach(bits, function(bit) {
                            if ((
                                mode < 1 
                                // If the number of bits set to 1, mod 2
                                ? Ox.sum(Ox.range(8).map(function(bit) {
                                    return +!!(self.data[i] & 1 << bit);
                                })) % 2
                                // or the one bit in question
                                : +!!(self.data[i] & 1 << bit)
                                // is not equal to the data bit
                            ) != bin[b++]) {
                                // then flip the bit
                                self.data[i] ^= 1 << bit;
                            }
                        });
                    });
                }
            }, function() {
                that.context.putImageData(self.imageData, 0, 0);
                callback(that);
            });
            return that;
        };

        /*@
        decode <f> Decode encoded string
            (callback) -> <o> The image object (unmodified)
            (deflate, callback) -> <o> The image object (unmodified)
            (mode, callback) -> <o> The image object (unmodified)
            (deflate, mode, callback) -> <o> The image object (unmodified)
            (mode, deflate, callback) -> <o> The image object (unmodified)
            deflate <b|true> If true, decode the string with deflate
            mode <n|0> See encode method
            callback <f> Callback function
                image <o> The image object (modified)
        @*/
        that.decode = function() {
            var callback = arguments[arguments.length - 1],
                deflate = Ox.isBoolean(arguments[0]) ? arguments[0]
                    : Ox.isBoolean(arguments[1]) ? arguments[1] : true,
                mode = Ox.isNumber(arguments[0]) ? arguments[0]
                    : Ox.isNumber(arguments[1]) ? arguments[1] : 0,
                bin = '',
                // Array of bits per byte to be modified (0 is LSB)
                bits = mode < 1 ? [-mode] : Ox.range(8).filter(function(i) {
                    return mode & 1 << i;
                }),
                done = 0, len = 4, str = '';
            that.forEach(function(rgba, xy, index) {
                if (rgba[3] == 255) {
                    Ox.loop(3, function(c) {
                        var i = index + c;
                        Ox.forEach(bits, function(bit) {
                            bin += mode < 1
                                // Read the number of bits set to 1, mod 2
                                ? Ox.sum(Ox.range(8).map(function(bit) {
                                    return +!!(self.data[i] & 1 << bit);
                                })) % 2
                                // or the one bit in question
                                : +!!(self.data[i] & 1 << bit);
                            if (bin.length == 8) {
                                // Every 8 bits, add one byte to the string
                                str += Ox.char(parseInt(bin, 2));
                                bin = '';
                                if (str.length == len) {
                                    if (++done == 1) {
                                        // After 4 bytes, parse string as length
                                        len = Ox.decodeBase256(str);
                                        if (
                                            len <= 0 ||
                                            len > getCapacity(bits.length) - 4
                                        ) {
                                            error('decode');
                                        }
                                        str = '';
                                    } else {
                                        // After length more bytes, break
                                        return false;
                                    }
                                }
                            }
                        });
                        // If done == 2, break
                        return done < 2;
                    });
                    // If done == 2, break
                    return done < 2;
                }
            }, function() {
                try {
                    if (deflate) {
                        Ox.decodeDeflate(str, callback);
                    } else {
                        callback(Ox.decodeUTF8(str));
                    }
                } catch (e) {
                    error('decode');
                }
            });
            return that;
        };

        /*@
        filter <f> Pixel-wise filter function
            Undocumented, see source code
            (filter) -> <o> The image object
            (filter, bias) -> <o> The image object
            filter <[n]> Filter matrix
            bias <n> Bias
        @*/
        that.filter = function(filter, bias) {
            bias = bias || 0;
            var filterSize = Math.sqrt(filter.length),
                d = (filterSize - 1) / 2,
                imageData = that.context.createImageData(self.width, self.height),
                data = [];
            self.imageData = that.context.getImageData(0, 0, self.width, self.height);
            self.data = self.imageData.data;
            Ox.loop(0, self.data.length, 4, function(i) {
                var filterIndex = 0,
                    xy = getXY(i);
                Ox.loop(3, function(c) {
                    data[i + c] = 0;
                });
                Ox.loop(-d, d + 1, function(x) {
                    Ox.loop(-d, d + 1, function(y) {
                        var pixelIndex = getIndex([xy[0] + x, xy[1] + y]);
                        Ox.loop(3, function(c) {
                            data[i + c] += self.data[pixelIndex + c] * filter[filterIndex];
                        });
                        filterIndex++;
                    });
                });
            });
            Ox.loop(0, self.data.length, 4, function(i) {
                Ox.loop(4, function(c) {
                    imageData.data[i + c] = c < 3
                        ? Ox.limit(Math.round(data[i + c] + bias), 0, 255)
                        : self.data[i + c];
                });
            });
            that.context.putImageData(imageData, 0, 0);
            self.imageData = imageData;
            self.data = data;
            return that;
        };

        /*@
        forEach <f> Pixel-wise forEach loop
        (fn) -> <o> The image object
        (fn, callback) -> <o> The image object
        fn <f> Iterator function
            rgba <[n]> RGBA values
            xy <[n]> XY coordinates
            i <n> Pixel index
        callback <f> Callback function (if present, forEach is async)
        @*/
        that.forEach = function(iterator, callback) {
            var data = self.data,
                forEach = callback ? Ox.nonblockingForEach : Ox.forEach;
            forEach(Ox.range(0, data.length, 4), function(i) {
                return iterator([
                    data[i], data[i + 1], data[i + 2], data[i + 3]
                ], getXY(i), i);
            }, callback, 250);
            return that;
        };

        /*@
        getSize <f> Returns width and height
            () -> <o> Image size
                width <n> Width in px
                height <n> Height in px
        @*/
        that.getSize = function() {
            return {width: self.width, height: self.height};
        };

        /*@
        hue <f> Change the hue of the image
            (val) -> <o> The image object
            val <n> Hue, in degrees
        @*/
        that.hue = function(val) {
            return that.map(function(rgba) {
                var hsl = Ox.hsl([rgba[0], rgba[1], rgba[2]]);
                hsl[0] = (hsl[0] + val) % 360;
                return Ox.rgb(hsl).concat(rgba[3]);
            });
        };

        /*@
        imageData <f> Get or set image data
            () -> <o> ImageData object
                data <+> CanvasPixelArray
                    see https://developer.mozilla.org/en/DOM/CanvasPixelArray
                height <n> Height in px
                width <n> Width in px
            (imageData) -> <o> Image object with new image data
            imageData <o> ImageData object
        @*/
        that.imageData = function() {
            if (arguments.length == 0) {
                return self.imageData;
            } else {
                self.imageData = self.context.createImageData(arguments[0]);
            }
        };

        /*@
        invert <f> Apply invert filter
            () -> <o> The image object
        @*/
        that.invert = function() {
            return that.map(function(rgba) {
                return [255 - rgba[0], 255 - rgba[1], 255 - rgba[2], rgba[3]];
            });
        };

        /*@
        lightness <f> Apply lightness filter
            (val) -> <o> The image object
            val <n> Amount, from -1 (darkest) to 1 (lightest)
        @*/
        that.lightness = function(val) {
            return setSL('l', val);
        };

        /*@
        map <f> Pixel-wise map function
        (fn) -> <o> The image object
        fn <f> Iterator function
            rgba <[n]> RGBA values
            xy <[n]> XY coordinates
            i <n> Pixel index
        @*/
        that.map = function(fn, callback) {
            self.imageData = that.context.getImageData(
                0, 0, self.width, self.height
            );
            self.data = self.imageData.data;
            that.forEach(function(rgba, xy, i) {
                fn(rgba, xy, i).forEach(function(val, c) {
                    self.data[i + c] = val;
                });
            });
            that.context.putImageData(self.imageData, 0, 0);
            return that;
        };

        /*@
        mosaic <f> Apply mosaic filter
            (size) -> <o> The image object
            size <n> Mosaic size
        @*/
        that.mosaic = function(size) {
            that.forEach(function(rgba, xy) {
                if (xy[0] % size == 0 && xy[1] % size == 0) {
                    Ox.loop(size, function(x) {
                        Ox.loop(size, function(y) {
                            var hsl, rgb, xy_ = [xy[0] + x, xy[1] + y];
                            if (
                                (x == 0 || y == 0)
                                && !(x == size - 1 || y == size - 1)
                            ) {
                                that.pixel(xy_, rgba.map(function(c, i) {
                                    return i < 3 ? Math.min(c + 16, 255) : c;
                                }));
                            } else if (
                                (x == size - 1 || y == size - 1)
                                && !(x == 0 || y == 0)
                            ) {
                                that.pixel(xy_, rgba.map(function(c, i) {
                                    return i < 3 ? Math.max(c - 16, 0) : c;
                                }));
                            } else {
                                that.pixel(xy_, rgba);
                            }
                        });
                    });
                }
            });
            that.context.putImageData(self.imageData, 0, 0);
            return that;
        };

        /*@
        motionBlur <f> Apply motion blur filter
            () -> <o> The image object
        @*/
        that.motionBlur = function() {
            return that.filter([
                0.2, 0.0, 0.0, 0.0, 0.0,
                0.0, 0.2, 0.0, 0.0, 0.0,
                0.0, 0.0, 0.2, 0.0, 0.0,
                0.0, 0.0, 0.0, 0.2, 0.0,
                0.0, 0.0, 0.0, 0.0, 0.2
            ]);
        };

        /*@
        photocopy <f> Apply photocopy filter
            () -> <o> The image object
        @*/
        that.photocopy = function(val) {
            return that.saturation(-1).depth(1).blur(1);
        };

        /*@
        pixel <f> Get or set pixel values
            (xy) -> <[n]> RGBA values
            (x, y) -> <[n]> RGBA values
            (xy, val) -> <o> The image object
            (x, y, val) -> <o> The image object
            x <n> X coordinate
            y <n> Y coordinate
            xy <[n]> XY coordinates ([x, y])
            val <[n]> RGBA values
        @*/
        that.pixel = function() {
            var xy = Ox.isArray(arguments[0])
                    ? arguments[0] : [arguments[0], arguments[1]],
                val = arguments.length > 1 && Ox.isArray(Ox.last(arguments))
                    ? Ox.last(arguments) : null,
                i = getIndex(xy),
                ret;
            if (!val) {
                ret = Ox.range(4).map(function(c) {
                    return self.data[i + c];
                });
            } else {
                val.forEach(function(v, c) {
                   self.data[i + c] = v;
                });
                that.context.putImageData(self.imageData, 0, 0);
                ret = that;
            }
            return ret;
        };

        /*@
        posterize <f> Apply posterize filter
            () -> <o> The image object
        @*/
        that.posterize = function() {
            return that.blur(3).map(function(rgba) {
                return [
                    Math.floor(rgba[0] / 64) * 64,
                    Math.floor(rgba[1] / 64) * 64,
                    Math.floor(rgba[2] / 64) * 64,
                    rgba[3]
                ];
            });
        };

        that.resize = function(width, height) {
            // fixme: doesn't work this way
            that.canvas.attr({
                width: width,
                height: height
            });
            return that;
        };

        /*@
        saturation <f> Apply saturation filter
            (val) -> <o> The image object
            val <n> Amount, from -1 (lowest) to 1 (highest)
        @*/
        that.saturation = function(val) {
            return setSL('s', val);
        };

        /*@
        sharpen <f> Apply sharpen filter
            () -> <o> The image object
        @*/
        that.sharpen = function(val) {
            return that.filter([
                -1, -1, -1,
                -1, +9, -1,
                -1, -1, -1
            ]);
        };

        /*@
        solarize <f> Apply solarize filter
            () -> <o> The image object
        @*/
        that.solarize = function() {
            return that.map(function(rgba) {
                return [
                    rgba[0] < 128 ? rgba[0] : 255 - rgba[0],
                    rgba[1] < 128 ? rgba[1] : 255 - rgba[1],
                    rgba[2] < 128 ? rgba[2] : 255 - rgba[2],
                    rgba[3]
                ];
            });
        };

        /*@
        src <f> Get or set the image source
            () -> <s> Data URL
            (src) -> <o> Image object with new source
            src <s> Image source (local, remote or data URL)
        @*/
        that.src = function() {
            var ret;
            if (arguments.length == 0) {
                ret = that.canvas[0].toDataURL();
            } else {
                var callback = arguments[1];
                self.src = arguments[0];
                self.image = new Image();
                self.image.onload = function() {
                    self.width = self.image.width;
                    self.height = self.image.height;
                    that.canvas.attr({
                        width: self.width,
                        height: self.height
                    });
                    that.context.drawImage(self.image, 0, 0);
                    self.imageData = that.context.getImageData(
                        0, 0, self.width, self.height
                    );
                    self.data = self.imageData.data;
                    callback && callback(that);
                }
                self.image.src = self.src;
                ret = that;
            }
            return ret;
        };

        self.callback = arguments[arguments.length - 1];
        if (arguments.length == 2) {
            self.src = arguments[0];
            self.image = new Image();
            self.image.onload = init;
            self.image.src = self.src;
        } else {
            self.width = arguments[0];
            self.height = arguments[1];
            self.background = arguments.length == 4
                ? arguments[2] : [0, 0, 0, 0];
            init();
        }

    };

    callback(true);

}

