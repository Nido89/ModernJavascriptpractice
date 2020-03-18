'use strict';

//@ Ox.AMPM <[s]> ['AM', 'PM']
Ox.AMPM = ['AM', 'PM'];
//@ Ox.BASE_32_ALIASES <o> Base 32 aliases
Ox.BASE_32_ALIASES = {'I': '1', 'L': '1', 'O': '0', 'U': 'V'},
//@ Ox.BASE_32_DIGITS <o> Base 32 digits
Ox.BASE_32_DIGITS = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
//@ Ox.BCAD <[s]> ['BC', 'AD']
Ox.BCAD = ['BC', 'AD'];
/*@
Ox.EARTH_RADIUS <n> Radius of the earth in meters
    See http://en.wikipedia.org/wiki/WGS-84
*/
Ox.EARTH_RADIUS = 6378137;
//@ Ox.EARTH_CIRCUMFERENCE <n> Circumference of the earth in meters
Ox.EARTH_CIRCUMFERENCE = 2 * Math.PI * Ox.EARTH_RADIUS;
//@ Ox.EARTH_SURFACE <n> Surface of the earth in square meters
Ox.EARTH_SURFACE = 4 * Math.PI * Math.pow(Ox.EARTH_RADIUS, 2);
//@ Ox.HTML_ENTITIES <o> HTML entities for ... (FIXME)
Ox.HTML_ENTITIES = {
    '"': '&quot;', '&': '&amp;', "'": '&apos;', '<': '&lt;', '>': '&gt;'
};
//@ Ox.KEYS <o> Names for key codes
// The dot notation ('0.numpad') allows for namespaced events ('key_0.numpad'),
// so that binding to 'key_0' will catch both 'key_0' and 'key_0.numpad'.
Ox.KEYS = {
    0: 'section', 8: 'backspace', 9: 'tab', 12: 'clear', 13: 'enter',
    16: 'shift', 17: 'control', 18: 'alt', 20: 'capslock', 27: 'escape',
    32: 'space', 33: 'pageup', 34: 'pagedown', 35: 'end', 36: 'home',
    37: 'left', 38: 'up', 39: 'right', 40: 'down',
    45: 'insert', 46: 'delete', 47: 'help',
    48: '0', 49: '1', 50: '2', 51: '3', 52: '4',
    53: '5', 54: '6', 55: '7', 56: '8', 57: '9',
    65: 'a', 66: 'b', 67: 'c', 68: 'd', 69: 'e',
    70: 'f', 71: 'g', 72: 'h', 73: 'i', 74: 'j',
    75: 'k', 76: 'l', 77: 'm', 78: 'n', 79: 'o',
    80: 'p', 81: 'q', 82: 'r', 83: 's', 84: 't',
    85: 'u', 86: 'v', 87: 'w', 88: 'x', 89: 'y', 90: 'z',
    // fixme: this is usually 91: window.left, 92: window.right, 93: select
    91: 'meta.left', 92: 'meta.right', 93: 'meta.right',
    96: '0.numpad', 97: '1.numpad', 98: '2.numpad',
    99: '3.numpad', 100: '4.numpad', 101: '5.numpad',
    102: '6.numpad', 103: '7.numpad', 104: '8.numpad', 105: '9.numpad',
    106: 'asterisk.numpad', 107: 'plus.numpad', 109: 'minus.numpad',
    108: 'enter.numpad', 110: 'dot.numpad', 111: 'slash.numpad',
    112: 'f1', 113: 'f2', 114: 'f3', 115: 'f4', 116: 'f5',
    117: 'f6', 118: 'f7', 119: 'f8', 120: 'f9', 121: 'f10',
    122: 'f11', 123: 'f12', 124: 'f13', 125: 'f14', 126: 'f15',
    127: 'f16', 128: 'f17', 129: 'f18', 130: 'f19', 131: 'f20',
    144: 'numlock', 145: 'scrolllock',
    186: 'semicolon', 187: 'equal', 188: 'comma', 189: 'minus',
    190: 'dot', 191: 'slash', 192: 'backtick', 219: 'openbracket',
    220: 'backslash', 221: 'closebracket', 222: 'quote', 224: 'meta'
    // see dojo, for ex.
};
//@ Ox.LOCALE <s> Default locale
Ox.LOCALE = 'en';
//@ Ox.LOCALE_NAMES <o> Locale names
Ox.LOCALE_NAMES = {
    'ar': 'العربية',
    'de': 'Deutsch',
    'el': 'Ελληνικά',
    'en': 'English',
    'fr': 'Français',
    'hi': 'हिन्दी'
};
//@ Ox.LOCALES <o> Locales per module
Ox.LOCALES = {};
//@ Ox.MAX_LATITUDE <n> Maximum latitude of a Mercator projection
Ox.MAX_LATITUDE = Ox.deg(Math.atan(Ox.sinh(Math.PI)));
//@ Ox.MIN_LATITUDE <n> Minimum latitude of a Mercator projection
Ox.MIN_LATITUDE = -Ox.MAX_LATITUDE;
//@ Ox.MODIFIER_KEYS <o> Names for modifier keys
// meta comes last so that one can differentiate between
// alt_control_shift_meta.left and alt_control_shift_meta.right
Ox.MODIFIER_KEYS = {
    altKey: 'alt', // Mac: option
    ctrlKey: 'control',
    shiftKey: 'shift',
    metaKey: 'meta' // Mac: command
};
//@ Ox.MONTHS <[s]> Names of months
Ox.MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];
//@ Ox.SHORT_MONTHS <[s]> Short names of months
Ox.SHORT_MONTHS = Ox.MONTHS.map(function(val) {
    return val.slice(0, 3);
});
//@ Ox.PATH <s> Path of Ox.js
Ox.PATH = (function() {
    // IE8 can't apply slice to NodeLists, see Ox.slice
    var index, regexp = /Ox\.js(\?.+|)$/,
        scripts = document.getElementsByTagName('script'), src;
    for (index = scripts.length - 1; index >= 0; index--) {
        src = scripts[index].src;
        if (regexp.test(src)) {
            return src.replace(regexp, '');
        }
    }
}());
//@ Ox.MODE <s> Mode ('dev' or 'min')
Ox.MODE = Ox.PATH.slice(0, -1).split('/').pop();
//@ Ox.PREFIXES <[str]> `['', 'K', 'M', 'G', 'T', 'P']`
Ox.PREFIXES = ['', 'K', 'M', 'G', 'T', 'P'];
//@ Ox.SEASONS <[s]> Names of the seasons of the year
Ox.SEASONS = ['Winter', 'Spring', 'Summer', 'Fall'];
//@ Ox.STACK_SIZE <n> Maximum number of arguments
Ox.STACK_SIZE = 65536;
//@ Ox.SYMBOLS <o> Unicode characters for symbols
Ox.SYMBOLS = {
    dollar: '\u0024', cent: '\u00A2', pound: '\u00A3', currency: '\u00A4',
    yen: '\u00A5', bullet: '\u2022', ellipsis: '\u2026', permille: '\u2030',
    colon: '\u20A1', cruzeiro: '\u20A2', franc: '\u20A3', lira: '\u20A4',
    naira: '\u20A6',  peseta: '\u20A7', won: '\u20A9', sheqel: '\u20AA',
    dong: '\u20AB', euro: '\u20AC', kip: '\u20AD', tugrik: '\u20AE',
    drachma: '\u20AF', peso: '\u20B1', guarani: '\u20B2', austral: '\u20B3',
    hryvnia: '\u20B4', cedi: '\u20B5', tenge: '\u20B8', rupee: '\u20B9',
    celsius: '\u2103', fahrenheit: '\u2109', pounds: '\u2114', ounce: '\u2125',
    ohm: '\u2126', kelvin: '\u212A', angstrom: '\u212B', info: '\u2139',
    arrow_left: '\u2190', arrow_up: '\u2191', arrow_right: '\u2192',
    arrow_down: '\u2193', home: '\u2196', end: '\u2198', 'return': '\u21A9',
    redo: '\u21BA', undo: '\u21BB', page_up: '\u21DE', page_down: '\u21DF',
    tab: '\u21E5', shift: '\u21E7', capslock: '\u21EA', infinity: '\u221E',
    control: '\u2303', command: '\u2318', enter: '\u2324', alt: '\u2325',
    'delete': '\u2326', clear:'\u2327', backspace: '\u232B', option: '\u2387',
    navigate: '\u2388', escape: '\u238B', eject: '\u23CF', space: '\u2423',
    triangle_up: '\u25B2', triangle_right: '\u25BA', triangle_down: '\u25BC',
    select: '\u25BE', triangle_left: '\u25C0', diamond: '\u25C6',
    black_star: '\u2605', white_star: '\u2606', burn: '\u2622',
    sound: '\u266B', trash: '\u267A', flag: '\u2691', anchor: '\u2693',
    gear: '\u2699', atom: '\u269B', warning: '\u26A0', voltage: '\u26A1',
    cut: '\u2702', backup: '\u2707', fly: '\u2708', check: '\u2713',
    close: '\u2715', ballot: '\u2717', windows: '\u2756', edit: '\uF802',
    click: '\uF803', apple: '\uF8FF'
};
//@ Ox.VERSION <s> OxJS version number
Ox.VERSION = '0.1';
//@ Ox.WEEKDAYS <[s]> Names of weekdays
Ox.WEEKDAYS = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];
//@ Ox.SHORT_WEEKDAYS <[s]> Short names of weekdays
Ox.SHORT_WEEKDAYS = Ox.WEEKDAYS.map(function(val) {
    return val.slice(0, 3);
});
