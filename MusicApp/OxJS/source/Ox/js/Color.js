'use strict';

/*@
Ox.hsl <f> Takes RGB values and returns HSL values
    (rgb) <[n]> HSL values
    (r, g, b) <[n]> HSL values
    rgb <[n]> RGB values
    r <n> red
    g <n> green
    b <n> blue
    > Ox.hsl([0, 0, 0])
    [0, 0, 0]
    > Ox.hsl([255, 255, 255])
    [0, 0, 1]
    > Ox.hsl(0, 255, 0)
    [120, 1, 0.5]
@*/
Ox.hsl = function(rgb) {
    var hsl = [0, 0, 0], max, min;
    if (arguments.length == 3) {
        rgb = Ox.slice(arguments);
    }
    rgb = Ox.clone(rgb).map(function(value) {
        return value / 255;
    });
    max = Ox.max(rgb);
    min = Ox.min(rgb);
    hsl[2] = 0.5 * (max + min);
    if (max == min) {
        hsl[0] = 0;
        hsl[1] = 0;
    } else {
        if (max == rgb[0]) {
            hsl[0] = (60 * (rgb[1] - rgb[2]) / (max - min) + 360) % 360;
        } else if (max == rgb[1]) {
            hsl[0] = 60 * (rgb[2] - rgb[0]) / (max - min) + 120;
        } else if (max == rgb[2]) {
            hsl[0] = 60 * (rgb[0] - rgb[1]) / (max - min) + 240;
        }
        if (hsl[2] <= 0.5) {
            hsl[1] = (max - min) / (2 * hsl[2]);
        } else {
            hsl[1] = (max - min) / (2 - 2 * hsl[2]);
        }
    }
    return hsl;
};

/*@
Ox.rgb <f> Takes HSL values and returns RGB values
    (hsl) <[n]> RGB values
    (h, s, l) <[n]> RGB values
    hsl <[n]> HSL values
    h <n> hue
    s <n> saturation
    l <n> lightness
    > Ox.rgb([0, 0, 0])
    [0, 0, 0]
    > Ox.rgb([0, 0, 1])
    [255, 255, 255]
    > Ox.rgb(120, 1, 0.5)
    [0, 255, 0]
@*/

Ox.rgb = function(hsl) {
    var rgb = [0, 0, 0], v1, v2, v3;
    if (arguments.length == 3) {
        hsl = Ox.slice(arguments);
    }
    hsl = Ox.clone(hsl);
    hsl[0] /= 360;
    if (hsl[1] == 0) {
        rgb = [hsl[2], hsl[2], hsl[2]];
    } else {
        if (hsl[2] < 0.5) {
            v2 = hsl[2] * (1 + hsl[1]); 
        } else {
            v2 = hsl[1] + hsl[2] - (hsl[1] * hsl[2]);
        }
        v1 = 2 * hsl[2] - v2;
        rgb.forEach(function(v, i) {
            v3 = hsl[0] + (1 - i) * 1/3;
            if (v3 < 0) {
                v3++;
            } else if (v3 > 1) {
                v3--;
            }
            if (v3 < 1/6) {
                rgb[i] = v1 + ((v2 - v1) * 6 * v3);
            } else if (v3 < 0.5) {
                rgb[i] = v2;
            } else if (v3 < 2/3) {
                rgb[i] = v1 + ((v2 - v1) * 6 * (2/3 - v3));
            } else {
                rgb[i] = v1;
            }
        });
    }
    return rgb.map(function(value) {
        return Math.round(value * 255);
    });
};

/*@
Ox.toHex <f> Format RGB array as hex value
    > Ox.toHex([192, 128, 64])
    'C08040'
@*/
Ox.toHex = function(rgb) {
    return rgb.map(function(value) {
        return Ox.pad(value.toString(16).toUpperCase(), 'left', 2, '0');
    }).join('');
};

/*@
Ox.toRGB <f> Format hex value as RGB array
    > Ox.toRGB('C08040')
    [192, 128, 64]
@*/
Ox.toRGB = function(hex) {
    return Ox.range(3).map(function(index) {
        return parseInt(hex.substr(index * 2, 2), 16);
    });
};
