'use strict';

/*@
Ox.char <f> Alias for String.fromCharCode
@*/
Ox.char = String.fromCharCode;

/*@
Ox.clean <f> Remove leading, trailing and double whitespace from a string
    > Ox.clean('foo  bar')
    'foo bar'
    > Ox.clean(' foo  bar ')
    'foo bar'
    > Ox.clean(' foo \n bar ')
    'foo\nbar'
    > Ox.clean(' \nfoo\n\nbar\n ')
    'foo\nbar'
    > Ox.clean(' foo\tbar ')
    'foo bar'
@*/
Ox.clean = function(string) {
    return Ox.filter(Ox.map(string.split('\n'), function(string) {
        return string.replace(/\s+/g, ' ').trim() || '';
    })).join('\n');
};

/*@
Ox.codePointAt <f> Returns the code point at a given index
    (string, index) -> <n> Code point
    > Ox.codePointAt('\uD83D\uDCA9', 0)
    0x1F4A9
@*/
Ox.codePointAt = function(string, index) {
    var first, length = string.length, ret, second;
    if (index >= 0 && index < length) {
        first = string.charCodeAt(index);
        if (first < 0xD800 || first > 0xDBFF || index == length - 1) {
            ret = first;
        } else {
            second = string.charCodeAt(index + 1);
            ret = second < 0xDC00 || second > 0xDFFF ? first
                : ((first - 0xD800) * 0x400) + (second - 0xDC00) + 0x10000;
        }
    }
    return ret;
};

/*@
Ox.endsWith <f> Tests if a string ends with a given substring
    Equivalent to (but faster than)
    `new RegExp(Ox.escapeRegExp(substring) + '$').test(string)`.
    (string, substring) -> <b> True if string ends with substring
    > Ox.endsWith('foobar', 'bar')
    true
    > Ox.endsWith('foobar', 'foo')
    false
@*/
Ox.endsWith = function(string, substring) {
    string = string.toString();
    substring = substring.toString();
    return string.slice(string.length - substring.length) == substring;
};

/*@
Ox.fromCodePoint <f> Returns a string for one or more given code points
    (codePoint[, codePoint[, ...]]) -> <s> String
    > Ox.fromCodePoint(102, 111, 111)
    'foo'
    > Ox.fromCodePoint(0x1F4A9)
    '\uD83D\uDCA9'
@*/
Ox.fromCodePoint = function() {
    var ret = '';
    Ox.forEach(arguments, function(number) {
        if (number < 0 || number > 0x10FFFF || !Ox.isInt(number)) {
            throw new RangeError();
        }
        if (number < 0x10000) {
            ret += String.fromCharCode(number);
        } else {
            number -= 0x10000;
            ret += String.fromCharCode((number >> 10) + 0xD800)
                + String.fromCharCode((number % 0x400) + 0xDC00);
        }
    });
    return ret;
};

/*@
Ox.isValidEmail <f> Tests if a string is a valid e-mail address
    (str) -> <b> True if the string is a valid e-mail address
    str <s> Any string
    > Ox.isValidEmail('foo@bar.com')
    true
    > Ox.isValidEmail('foo.bar@foobar.co.uk')
    true
    > Ox.isValidEmail('foo@bar')
    false
    > Ox.isValidEmail('foo@bar..com')
    false
@*/
Ox.isValidEmail = function(string) {
    return !!/^[0-9A-Z\.\+\-_]+@(?:[0-9A-Z\-]+\.)+[A-Z]{2,64}$/i.test(string);
};

/*@
Ox.pad <f> Pad a string to a given length
    (string[, position], length[, padding]) -> <s> Padded string
    string <s> String
    position <s|'right'> Position ('left' or 'right')
        When passing a number as `string`, the default position is 'left'.
    length <n> Length
    padding <s|' '> Padding
        When passing a number as `string`, and leaving out or passing 'left' as
        `position`, the default padding is '0'.
    > Ox.pad('foo', 6)
    'foo   '
    > Ox.pad('foo', 'left', 6)
    '   foo'
    > Ox.pad('foo', 6, '.')
    'foo...'
    > Ox.pad('foo', 'left', 6, '.')
    '...foo'
    > Ox.pad(1, 2)
    '01'
    > Ox.pad(1, 2, ' ')
    ' 1'
    > Ox.pad(1, 'right', 2)
    '1 '
    > Ox.pad(1, 'right', 2, '_')
    '1_'
    > Ox.pad('foo', 6, '123456')
    'foo123'
    > Ox.pad('foo', 'left', 6, '123456')
    '456foo'
    > Ox.pad('foobar', 3)
    'foo'
    > Ox.pad('foobar', 'left', 3)
    'bar'
    > Ox.pad('foo', -1)
    ''
@*/
Ox.pad = function(string, position, length, padding) {
    var hasPosition = Ox.isString(arguments[1]),
        isNumber = Ox.isNumber(arguments[0]),
        last = Ox.last(arguments);
    position = hasPosition ? arguments[1] : isNumber ? 'left' : 'right';
    length = Math.max(hasPosition ? arguments[2] : arguments[1], 0);
    padding = Ox.isString(last) ? last
        : isNumber && position == 'left' ? '0' : ' ';
    string = string.toString();
    padding = Ox.repeat(padding, length - string.length);
    return position == 'left'
        ? (padding + string).slice(-length)
        : (string + padding).slice(0, length);
};

/*@
Ox.parseDuration <f> Takes a formatted duration, returns seconds
    > Ox.parseDuration('1:02:03:04.05')
    93784.05
    > Ox.parseDuration('3')
    3
    > Ox.parseDuration('2:')
    120
    > Ox.parseDuration('1::')
    3600
@*/
Ox.parseDuration = function(string) {
    return string.split(':').reverse().slice(0, 4).reduce(function(p, c, i) {
        return p + (parseFloat(c) || 0) * (i == 3 ? 86400 : Math.pow(60, i));
    }, 0);
};

/*@
Ox.parsePath <f> Returns the components of a path
    (str) -> <o> Path
        extension <s> File extension
        filename <s> Filename
        pathname <s> Pathname
    > Ox.parsePath('/foo/bar/foo.bar')
    {extension: 'bar', filename: 'foo.bar', pathname: '/foo/bar/'}
    > Ox.parsePath('foo/')
    {extension: '', filename: '', pathname: 'foo/'}
    > Ox.parsePath('foo')
    {extension: '', filename: 'foo', pathname: ''}
    > Ox.parsePath('.foo')
    {extension: '', filename: '.foo', pathname: ''}
@*/
Ox.parsePath = function(string) {
    var matches = /^(.+\/)?(.+?(\..+)?)?$/.exec(string);
    return {
        pathname: matches[1] || '',
        filename: matches[2] || '',
        extension: matches[3] ? matches[3].slice(1) : ''
    };
};

/*@
Ox.parseSRT <f> Parses an srt subtitle file
    (str) -> <o> Parsed subtitles
        in <n> In point (sec)
        out <n> Out point (sec)
        text <s> Text
    str <s> Contents of an srt subtitle file
    > Ox.parseSRT('1\n01:02:00,000 --> 01:02:03,400\nHello World')
    [{'in': 3720, out: 3723.4, text: 'Hello World'}]
@*/
Ox.parseSRT = function(string, fps) {
    return string.replace(/\r\n/g, '\n').trim().split('\n\n')
        .map(function(block) {
            var lines = block.split('\n'), points;
            if (lines.length < 3) {
                Ox.Log('Core', 'skip invalid srt block', lines);
                return {};
            }
            lines.shift();
            points = lines.shift().split(' --> ').map(function(point) {
                return point.replace(',', ':').split(':')
                    .reduce(function(previous, current, index) {
                        return previous + parseInt(current, 10) *
                            [3600, 60, 1, 0.001][index];
                    }, 0);
            });
            if (fps) {
                points = points.map(function(point) {
                    return Math.round(point * fps) / fps;
                });
            }
            return {
                'in': points[0],
                out: points[1],
                text: lines.join('\n')
            };
        }).filter(function(block) { return !Ox.isEmpty(block); });
};

/*@
Ox.parseURL <f> Takes a URL, returns its components
    (url) -> <o> URL components
        hash <s> Hash
        host <s> Host
        hostname <s> Hostname
        origin <s> Origin
        pathname <s> Pathname
        port <s> Port
        protocol <s> Protocol
        search <s> Search
    url <s> URL
    > Ox.parseURL('http://www.foo.com:8080/bar/index.html?a=0&b=1#c').hash
    '#c'
    > Ox.parseURL('http://www.foo.com:8080/bar/index.html?a=0&b=1#c').host
    'www.foo.com:8080'
    > Ox.parseURL('http://www.foo.com:8080/bar/index.html?a=0&b=1#c').hostname
    'www.foo.com'
    > Ox.parseURL('http://www.foo.com:8080/bar/index.html?a=0&b=1#c').origin
    'http://www.foo.com:8080'
    > Ox.parseURL('http://www.foo.com:8080/bar/index.html?a=0&b=1#c').pathname
    '/bar/index.html'
    > Ox.parseURL('http://www.foo.com:8080/bar/index.html?a=0&b=1#c').port
    '8080'
    > Ox.parseURL('http://www.foo.com:8080/bar/index.html?a=0&b=1#c').protocol
    'http:'
    > Ox.parseURL('http://www.foo.com:8080/bar/index.html?a=0&b=1#c').search
    '?a=0&b=1'
@*/
Ox.parseURL = (function() {
    var a = document.createElement('a'),
        keys = ['hash', 'host', 'hostname', 'origin',
            'pathname', 'port', 'protocol', 'search'];
    return function(string) {
        var ret = {};
        a.href = string;
        keys.forEach(function(key) {
            ret[key] = a[key];
        });
        return ret;
    };
}());

// FIXME: can we get rid of this?
Ox.parseUserAgent = function(userAgent) {
    var aliases = {
            browser: {
                'Firefox': /(Fennec|Firebird|Iceweasel|Minefield|Namoroka|Phoenix|SeaMonkey|Shiretoko)/
            },
            system: {
                'BSD': /(FreeBSD|NetBSD|OpenBSD)/,
                'Linux': /(CrOS|MeeGo|webOS)/,
                'Unix': /(AIX|HP-UX|IRIX|SunOS)/
            }
        },
        names = {
            browser: {
                'chromeframe': 'Chrome Frame',
                'MSIE': 'Internet Explorer'
            },
            system: {
                'CPU OS': 'iOS',
                'iPhone OS': 'iOS',
                'Macintosh': 'Mac OS X'
            }
        },    
        regexps = {
            browser: [
                /(Camino)\/(\d+)/,
                /(chromeframe)\/(\d+)/,
                /(Edge)\/(\d+)/, // has to be before "Chrome"
                /(Chrome)\/(\d+)/,
                /(Epiphany)\/(\d+)/,
                /(Firefox)\/(\d+)/,
                /(Galeon)\/(\d+)/,
                /(Googlebot)\/(\d+)/,
                /(Konqueror)\/(\d+)/,
                /(MSIE) (\d+)/,
                /(Netscape)\d?\/(\d+)/,
                /(NokiaBrowser)\/(\d+)/,
                /(Opera) (\d+)/,
                /(Opera)\/.+Version\/(\d+)/,
                /(YandexBot)\/(\d+)/,
                /(YandexMobileBot)\/(\d+)/,
                /Version\/(\d+).+(Safari)/
            ],
            system: [
                /(Android) (\d+)/,
                /(BeOS)/,
                /(BlackBerry) (\d+)/,
                /(Darwin)/,
                /(BSD) (FreeBSD|NetBSD|OpenBSD)/,
                /(CPU OS) (\d+)/,
                /(iPhone OS) (\d+)/,
                /(Linux).+(CentOS|CrOS|Debian|Fedora|Gentoo|Mandriva|MeeGo|Mint|Red Hat|SUSE|Ubuntu|webOS)/,
                /(CentOS|CrOS|Debian|Fedora|Gentoo|Mandriva|MeeGo|Mint|Red Hat|SUSE|Ubuntu|webOS).+(Linux)/,
                /(Linux)/,
                /(Mac OS X) (10.\d+)/,
                /(Mac OS X)/,
                /(Macintosh)/,
                /(SymbianOS)\/(\d+)/,
                /(SymbOS)/,
                /(OS\/2)/,
                /(Unix) (AIX|HP-UX|IRIX|SunOS)/,
                /(Unix)/,
                /(Windows) (NT \d\.\d)/,
                /(Windows) (95|98|2000|2003|ME|NT|XP)/, // Opera
                /(Windows).+(Win 9x 4\.90)/, // Firefox
                /(Windows).+(Win9\d)/, // Firefox
                /(Windows).+(WinNT4.0)/ // Firefox
            ]
        },
        versions = {
            browser: {},
            system: {
                '10.0': '10.0 (Cheetah)',
                '10.1': '10.1 (Puma)',
                '10.2': '10.2 (Jaguar)',
                '10.3': '10.3 (Panther)',
                '10.4': '10.4 (Tiger)',
                '10.5': '10.5 (Leopard)',
                '10.6': '10.6 (Snow Leopard)',
                '10.7': '10.7 (Lion)',
                '10.8': '10.8 (Mountain Lion)',
                '10.9': '10.9 (Mavericks)',
                '10.10': '10.10 (Yosemite)',
                '10.11': '10.11 (El Capitan)',
                '10.12': '10.12 (Sierra)',
                '10.13': '10.13 (High Sierra)',
                'CrOS': 'Chrome OS',
                'NT 4.0': 'NT 4.0 (Windows NT)',
                'NT 4.1': 'NT 4.1 (Windows 98)',
                'Win 9x 4.90': 'NT 4.9 (Windows ME)',
                'NT 5.0': 'NT 5.0 (Windows 2000)',
                'NT 5.1': 'NT 5.1 (Windows XP)',
                'NT 5.2': 'NT 5.2 (Windows 2003)',
                'NT 6.0': 'NT 6.0 (Windows Vista)',
                'NT 6.1': 'NT 6.1 (Windows 7)',
                'NT 6.2': 'NT 6.2 (Windows 8)',
                'NT 6.3': 'NT 6.3 (Windows 8.1)',
                'NT 6.4': 'NT 6.4 (Windows 10)',
                '95': 'NT 4.0 (Windows 95)',
                'NT': 'NT 4.0 (Windows NT)',
                '98': 'NT 4.1 (Windows 98)',
                'ME': 'NT 4.9 (Windows ME)',
                '2000': 'NT 5.0 (Windows 2000)',
                '2003': 'NT 5.2 (Windows 2003)',
                'XP': 'NT 5.1 (Windows XP)',
                'Win95': 'NT 4.0 (Windows 95)',
                'WinNT4.0': 'NT 4.0 (Windows NT)',
                'Win98': 'NT 4.1 (Windows 98)'
            }
        },
        userAgentData = {};
    Ox.forEach(regexps, function(regexps, key) {
        userAgentData[key] = {name: '', string: '', version: ''};
        Ox.forEach(aliases[key], function(regexp, alias) {
            userAgent = userAgent.replace(
                regexp, key == 'browser' ? alias : alias + ' $1'
            );
        });
        Ox.forEach(regexps, function(regexp) {
            var matches = userAgent.match(regexp),
                name, string, swap, version;
            if (matches) {
                matches[2] = matches[2] || '';
                swap = matches[1].match(/^\d/) || matches[2] == 'Linux';
                name = matches[swap ? 2 : 1];
                version = matches[swap ? 1 : 2].replace('_', '.');
                name = names[key][name] || name,
                version = versions[key][version] || version;
                string = name;
                if (version) {
                    string += ' ' + (
                        ['BSD', 'Linux', 'Unix'].indexOf(name) > -1
                        ? '(' + version + ')'
                        : version
                    );
                }
                userAgentData[key] = {
                    name: names[name] || name,
                    string: string,
                    version: versions[version] || version
                };
                return false; // break
            }
        });
    });
    return userAgentData;
};

/*@
Ox.repeat <f> Repeat a value multiple times
    Works for arrays, numbers and strings
    > Ox.repeat(1, 3)
    '111'
    > Ox.repeat('foo', 3)
    'foofoofoo'
    > Ox.repeat([1, 2], 3)
    [1, 2, 1, 2, 1, 2]
    > Ox.repeat([{k: 'v'}], 3)
    [{k: 'v'}, {k: 'v'}, {k: 'v'}]
@*/
// FIXME: see https://github.com/paulmillr/es6-shim/blob/master/es6-shim.js
// for a faster version
Ox.repeat = function(value, times) {
    var ret;
    if (Ox.isArray(value)) {
        ret = [];
        Ox.loop(times, function() {
            ret = ret.concat(value);
        });
    } else {
        ret = times >= 1 ? new Array(times + 1).join(value.toString()) : '';
    }
    return ret;
};

/*@
Ox.splice <f> `[].splice` for strings, returns a new string
    > Ox.splice('12xxxxx89', 2, 5, 3, 4, 5, 6, 7)
    '123456789'
@*/
Ox.splice = function(string, index, remove) {
    var array = string.split('');
    Array.prototype.splice.apply(array, Ox.slice(arguments, 1));
    return array.join('');
};

/*@
Ox.startsWith <f> Tests if a string ends with a given substring
    Equivalent to (but faster than)
    `new RegExp('^' + Ox.escapeRegExp(substring)).test(string)`.
    (string, substring) -> <b> True if string starts with substring
    > Ox.startsWith('foobar', 'foo')
    true
    > Ox.startsWith('foobar', 'bar')
    false
@*/
Ox.startsWith = function(string, substring) {
    string = string.toString();
    substring = substring.toString();
    return string.slice(0, substring.length) == substring;
};

/*@
Ox.toCamelCase <f> Takes a string with '-', '/' or '_', returns a camelCase string
    > Ox.toCamelCase('foo-bar-baz')
    'fooBarBaz'
    > Ox.toCamelCase('foo/bar/baz')
    'fooBarBaz'
    > Ox.toCamelCase('foo_bar_baz')
    'fooBarBaz'
@*/
Ox.toCamelCase = function(string) {
    return string.replace(/[\-\/_][a-z]/g, function(string) {
        return string[1].toUpperCase();
    });
};

/*@
Ox.toDashes <f> Takes a camelCase string, returns a string with dashes
    > Ox.toDashes('fooBarBaz')
    'foo-bar-baz'
@*/
Ox.toDashes = function(string) {
    return string.replace(/[A-Z]/g, function(string) {
        return '-' + string.toLowerCase();
    });
};

/*@
Ox.toSlashes <f> Takes a camelCase string, returns a string with slashes
    > Ox.toSlashes('fooBarBaz')
    'foo/bar/baz'
@*/
Ox.toSlashes = function(string) {
    return string.replace(/[A-Z]/g, function(string) {
        return '/' + string.toLowerCase();
    });
};

/*@
Ox.toTitleCase <f> Returns a string with capitalized words
    > Ox.toTitleCase('foo')
    'Foo'
    > Ox.toTitleCase('Apple releases iPhone, IBM stock plummets')
    'Apple Releases iPhone, IBM Stock Plummets'
@*/
Ox.toTitleCase = function(string) {
    return string.split(' ').map(function(value) {
        var substring = value.slice(1),
            lowercase = substring.toLowerCase();
        if (substring == lowercase) {
            value = value.slice(0, 1).toUpperCase() + lowercase;
        }
        return value;
    }).join(' ');
};

/*@
Ox.toUnderscores <f> Takes a camelCase string, returns string with underscores
    > Ox.toUnderscores('fooBarBaz')
    'foo_bar_baz'
@*/
Ox.toUnderscores = function(string) {
    return string.replace(/[A-Z]/g, function(string) {
        return '_' + string.toLowerCase();
    });
};

/*@
Ox.truncate <f> Truncate a string to a given length
    (string[, position], length[, padding]) -> Truncated string
    string <s> String
    position <s|'right'> Position ('left', 'center' or 'right')
    length <n> Length
    padding <s|'…'> Padding
    > Ox.truncate('anticonstitutionellement', 16)
    'anticonstitutio…'
    > Ox.truncate('anticonstitutionellement', 'left', 16)
    '…itutionellement'
    > Ox.truncate('anticonstitutionellement', 16, '...')
    'anticonstitut...'
    > Ox.truncate('anticonstitutionellement', 'center', 16, '...')
    'anticon...lement'
@*/
Ox.truncate = function(string, position, length, padding) {
    var hasPosition = Ox.isString(arguments[1]), last = Ox.last(arguments);
    position = hasPosition ? arguments[1] : 'right';
    length = hasPosition ? arguments[2] : arguments[1];
    padding = Ox.isString(last) ? last : '…';
    if (string.length > length) {
        if (position == 'left') {
            string = padding
                + string.slice(padding.length + string.length - length);
        } else if (position == 'center') {
            string = string.slice(0, Math.ceil((length - padding.length) / 2))
                + padding
                + string.slice(-Math.floor((length - padding.length) / 2));
        } else if (position == 'right') {
            string = string.slice(0, length - padding.length) + padding;
        }
    }
    return string;
};

/*@
Ox.words <f> Splits a string into words, removing punctuation
    (string) -> <[s]> Array of words
    string <s> Any string
    > Ox.words('Let\'s "split" array-likes into key/value pairs--okay?')
    ['let\'s', 'split', 'array-likes', 'into', 'key', 'value', 'pairs', 'okay']
@*/
Ox.words = function(string) {
    var array = string.toLowerCase().split(/\b/),
        length = array.length,
        startsWithWord = /\w/.test(array[0]);
    array.forEach(function(v, i) {
        // find single occurrences of "-" or "'" that are not at the beginning
        // or end of the string, and join the surrounding words with them
        if (
            i > 0 && i < length - 1 && (v == '-' || v == '\'')
        ) {
            array[i + 1] = array[i - 1] + array[i] + array[i + 1];
            array[i - 1] = array[i] = '';
        }
    });
    // remove elements that have been emptied above
    array = array.filter(function(v) {
        return v.length;
    });
    // return words, not spaces or punctuation
    return array.filter(function(v, i) {
        return i % 2 == !startsWithWord;
    });
};

/*@
Ox.wordwrap <f> Wrap a string at word boundaries
    (string, length) -> <s> Wrapped string
    (string, length, newline) -> <s> Wrapped string
    (string, length, balanced) -> <s> Wrapped string
    (string, length, balanced, newline) -> <s> Wrapped string
    (string, length, newline, balanced) -> <s> Wrapped string
    string <s> String
    length <n|80> Line length
    balanced <b|false> If true, lines will have similar length
    newline <s|'\n'> Newline character or string
    > Ox.wordwrap('Anticonstitutionellement, Paris s\'eveille', 25)
    'Anticonstitutionellement, \nParis s\'eveille'
    > Ox.wordwrap('Anticonstitutionellement, Paris s\'eveille', 25, '<br>')
    'Anticonstitutionellement, <br>Paris s\'eveille'
    > Ox.wordwrap('Anticonstitutionellement, Paris s\'eveille', 16, '<br>')
    'Anticonstitution<br>ellement, Paris <br>s\'eveille'
    > Ox.wordwrap('These are short words', 16)
    'These are short \nwords'
    > Ox.wordwrap('These are short words', 16, true)
    'These are \nshort words'
@*/
Ox.wordwrap = function(string, length) {
    var balanced, lines, max, newline, words;
    string = String(string);
    length = length || 80;
    balanced = Ox.isBoolean(arguments[2]) ? arguments[2]
        : Ox.isBoolean(arguments[3]) ? arguments[3]
        : false;
    newline = Ox.isString(arguments[2]) ? arguments[2]
        : Ox.isString(arguments[3]) ? arguments[3]
        : '\n';
    words = string.split(' ');
    if (balanced) {
        // balanced lines: test if same number of lines
        // can be achieved with a shorter line length
        lines = Ox.wordwrap(string, length, newline).split(newline);
        if (lines.length > 1) {
            // test shorter line, unless
            // that means cutting a word
            max = Ox.max(words.map(function(word) {
                return word.length;
            }));
            while (length > max) {
                if (Ox.wordwrap(
                    string, --length, newline
                ).split(newline).length > lines.length) {
                    length++;
                    break;
                }
            }
        }
    }
    lines = [''];
    words.forEach(function(word) {
        var index;
        if ((lines[lines.length - 1] + word).length <= length) {
            // word fits in current line
            lines[lines.length - 1] += word + ' ';
        } else {
            if (word.length <= length) {
                // word fits in next line
                lines.push(word + ' ');
            } else {
                // word is longer than line
                index = length - lines[lines.length - 1].length;
                lines[lines.length - 1] += word.slice(0, index);
                while (index < word.length) {
                    lines.push(word.substr(index, length));
                    index += length;
                }
                lines[lines.length - 1] += ' ';
            }
        }
    });
    return lines.join(newline).trim();
};
