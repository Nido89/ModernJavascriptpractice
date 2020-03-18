'use strict';

(function(window) {

    var canDefineProperty = !!Object.defineProperty && (function() {
            try {
                Object.defineProperty({}, 'a', {});
                return true;
            } catch (e) {} // IE 8
        }()),
        chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
        log;

    Ox.polyfill = {};

    /*@
    Ox.polyfill.atob <f> see https://developer.mozilla.org/en/DOM/window.atob
        > Ox.polyfill.atob('Cg==')
        '\n'
        > Ox.polyfill.atob('Zm9v')
        'foo'
    @*/
    Ox.polyfill.atob = function(string) {
        var binary = '', ret = '';
        String(string).replace(/=/g, '').split('').forEach(function(char) {
            binary += Ox.pad(chars.indexOf(char).toString(2), 'left', 6, '0');
        });
        while (binary.length >= 8) {
            ret += Ox.char(parseInt(binary.slice(0, 8), 2));
            binary = binary.slice(8);
        }
        return ret;
    };
    /*@
    Ox.polyfill.btoa <f> see https://developer.mozilla.org/en/DOM/window.btoa
        > Ox.polyfill.btoa('\n')
        'Cg=='
        > Ox.polyfill.btoa('foo')
        'Zm9v'
    @*/
    Ox.polyfill.btoa = function(string) {
        var binary = '', ret = '';
        String(string).split('').forEach(function(char) {
            binary += Ox.pad(char.charCodeAt(0).toString(2), 'left', 8, '0');
        });
        binary = Ox.pad(binary, Math.ceil(binary.length / 6) * 6, '0');
        while (binary) {
            ret += chars[parseInt(binary.slice(0, 6), 2)];
            binary = binary.slice(6);
        }
        return Ox.pad(ret, Math.ceil(ret.length / 4) * 4, '=');
    };

    /*@
    Ox.polyfill.bind <f> see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind
        <script>
            Ox.test.object = {
                get: function() {
                    return this.value;
                },
                value: 'foo'
            };
            Ox.test.get = Ox.test.object.get;
            Ox.test.value = 'bar';
        </script>
        > Ox.test.object.get()
        'foo'
        > Ox.test.get()
        'bar'
        > Ox.polyfill.bind.call(Ox.test.get, Ox.test.object)()
        'foo'
    @*/
    Ox.polyfill.bind = function(that) {
        if (typeof this !== 'function') {
            throw new TypeError();
        }
        var args = Array.prototype.slice.call(arguments, 1),
            fn = function() {},
            this_ = this,
            ret = function() {
                return this_.apply(
                    this instanceof fn ? this : that || window,
                    args.concat(Array.prototype.slice.call(arguments))
                );
            };
        fn.prototype = this.prototype;  
        ret.prototype = new fn();
        return ret;
    };

    /*@
    Ox.polyfill.every <f> see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/every
        > Ox.polyfill.every.call([0, 1, 2], function(v, i) { return v == i; })
        true
        > Ox.polyfill.every.call([true, true, false], Ox.identity)
        false
    @*/
    Ox.polyfill.every = function(iterator, that) {
        if (this === void 0 || this === null || typeof iterator !== 'function') {
            throw new TypeError();  
        }
        var array = Object(this), i, length = array.length >>> 0, ret = true;
        for (i = 0; i < length; i++) {  
            if (i in array && !iterator.call(that, array[i], i, array)) {
                ret = false;
                break;  
            }
        }
        return ret;
    };

    /*@
    Ox.polyfill.filter <f> see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/filter
        > Ox.polyfill.filter.call([2, 1, 0], function(v, i) { return v == i; })
        [1]
    @*/
    Ox.polyfill.filter = function(iterator, that) {  
        if (this === void 0 || this === null || typeof iterator !== 'function') {
            throw new TypeError();  
        }
        var array = Object(this), i, length = array.length >>> 0, ret = [], value;
        for (i = 0; i < length; i++) {  
            // save value in case iterator mutates it
            if (i in array && iterator.call(that, value = array[i], i, array)) {
                ret.push(value);
            }  
        }
        return ret;  
    };

    /*@
    Ox.polyfill.forEach <f> see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/forEach
        <script>
            Ox.test.array = [];
            Ox.polyfill.forEach.call([1, 2, 3], function(v, i) { Ox.test.array.push([v, i])})
        </script>
        > Ox.test.array
        [[1, 0], [2, 1], [3, 2]]
    @*/
    Ox.polyfill.forEach = function(iterator, that) {
        if (this === void 0 || this === null || typeof iterator !== 'function') {
            throw new TypeError();  
        }
        var array = Object(this), i, length = array.length >>> 0;
        for (i = 0; i < length; i++) {  
            if (i in array) {
                iterator.call(that, array[i], i, array);
            }
        }
    };

    /*@
    Ox.polyfill.indexOf <f> see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/indexOf
        > Ox.polyfill.indexOf.call([1, 2, 3, 2, 1], 2)
        1
        > Ox.polyfill.indexOf.call([1, 2, 3, 2, 1], 4)
        -1
    @*/
    Ox.polyfill.indexOf = function(value) {  
        if (this === void 0 || this === null) {  
            throw new TypeError();  
        }  
        var array = Object(this), i, length = array.length >>> 0, ret = -1;
        for (i = 0; i < length; i++) {
            if (i in array && array[i] === value) {
                ret = i;
                break;
            }
        }
        return ret;
    };

    /*@
    Ox.polyfill.isArray <f> see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/isArray
        > Ox.polyfill.isArray([])
        true
        > Ox.polyfill.isArray((function() { return arguments; }()))
        false
        > Ox.polyfill.isArray({0: 0, length: 1})
        false
    @*/
    Ox.polyfill.isArray = function(value) {
        return Object.prototype.toString.call(value) == '[object Array]';
    };

    /*@
    Ox.polyfill.JSON <o> see https://github.com/douglascrockford/JSON-js
        > Ox.polyfill.JSON.parse('{"a": [1, 2], "b": [3, 4]}')
        {a: [1, 2], b: [3, 4]}
        > Ox.polyfill.JSON.stringify([(function(){ return arguments; }()), false, null, 0, -0, Infinity, NaN, / /, void 0])
        '[{},false,null,0,0,null,null,{},null]'
        > Ox.polyfill.JSON.stringify(new Date()).length
        24
    @*/
    Ox.polyfill.JSON = (function() {
        var replace = {
            '"': '\\"',
            '\b': '\\b',
            '\f': '\\f',
            '\n': '\\n',
            '\r': '\\r',
            '\t': '\\t',
            '\\': '\\\\'
        };
        function quote(value) {
            return '"' + value.split('').map(function(char) {
                return replace[char] || char;
            }).join('') + '"';
        }
        return {
            parse: function parse(string) {
                return eval('(' + string + ')');
            },
            stringify: function stringify(value) {
                var ret = 'null', type = Ox.typeOf(value);
                if (type == 'arguments' || type == 'regexp') {
                    ret = '{}';
                } else if (type == 'array') {
                    ret = ['[', ']'].join(
                        value.map(function(v) {
                            return stringify(v);
                        }).join(',')
                    );
                } else if (type == 'boolean') {
                    ret = String(value);
                } else if (type == 'date') {
                    ret = Ox.splice(
                        Ox.getISODate(value, true), 19, 0,
                        '.' + String(+value).slice(-3)
                    );
                } else if (type == 'number') {
                    ret = isFinite(value) ? String(value) : 'null';
                } else if (type == 'object') {
                    ret = ['{', '}'].join(
                        Object.keys(value).map(function(k) {
                            return quote(k) + ': ' + stringify(value[k]);
                        }).join(',')
                    );
                } else if (type == 'string') {
                    ret = quote(value);
                }
                return ret;
            }
        };
    }());

    /*@
    Ox.polyfill.keys <f> see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Object/keys
        > Ox.polyfill.keys({a: 1, b: 2, c: 3})
        ['a', 'b', 'c']
    @*/
    Ox.polyfill.keys = function(object) {  
        if (object !== Object(object)) {
            throw new TypeError();  
        }
        var key, ret = [];  
        for (key in object) {
            Object.prototype.hasOwnProperty.call(object, key) && ret.push(key);
        }
        return ret;
    };

    /*@
    Ox.polyfill.lastIndexOf <f> see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/lastIndexOf
        > Ox.polyfill.lastIndexOf.call([1, 2, 3, 2, 1], 2)
        3
        > Ox.polyfill.lastIndexOf.call([1, 2, 3, 2, 1], 4)
        -1
    @*/
    Ox.polyfill.lastIndexOf = function(value) {  
        if (this === void 0 || this === null) {  
            throw new TypeError();  
        }  
        var array = Object(this), i, length = array.length >>> 0, ret = -1;
        for (i = length - 1; i >= 0; i--) {
            if (i in array && array[i] === value) {
                ret = i;
                break;
            }
        }
        return ret;
    };

    /*@
    Ox.polyfill.map <f> see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/map
        > Ox.polyfill.map.call([2, 1, 0], function(v, i) { return v == i; })
        [false, true, false]
    @*/
    Ox.polyfill.map = function(iterator, that) {
        if (this === void 0 || this === null || typeof iterator !== 'function') {
            throw new TypeError();
        }
        var array = Object(this), i, length = array.length >>> 0,
            ret = new Array(length);
        for (i = 0; i < length; i++) {
            if (i in array) {
                ret[i] = iterator.call(that, array[i], i, array);
            }
        }
        return ret;
    };

    /*@
    Ox.polyfill.reduce <f> see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/reduce
        > Ox.polyfill.reduce.call([1, 2, 3], function(p, c, i) { return p + c + i; }, 1)
        10
    @*/
    Ox.polyfill.reduce = function(iterator, ret) {
        if (this === void 0 || this === null || typeof iterator !== 'function') {
            throw new TypeError();
        }
        var array = Object(this), i, length = array.length;
        if (!length && ret === void 0) {
            throw new TypeError();
        }
        if (ret === void 0) {
            ret = array[0];
            i = 1;
        }
        for (i = i || 0; i < length; i++) {
            if (i in array) {
                ret = iterator.call(void 0, ret, array[i], i, array);
            }
        }
        return ret;
    };

    /*@
    Ox.polyfill.reduceRight <f> see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/reduceRight
        > Ox.polyfill.reduceRight.call([1, 2, 3], function(p, c, i) { return p + c + i; }, 1)
        10
    @*/
    Ox.polyfill.reduceRight = function(iterator, ret) {
        if (this === void 0 || this === null || typeof iterator !== 'function') {
            throw new TypeError();
        }
        var array = Object(this), i, length = array.length;
        if (!length && ret === void 0) {
            throw new TypeError();
        }
        if (ret === void 0) {
            ret = array[length - 1];
            i = length - 2;
        }
        for (i = i || length - 1; i >= 0; i--) {
            if (i in array) {
                ret = iterator.call(void 0, ret, array[i], i, array);
            }
        }
        return ret;
    };

    /*@
    Ox.polyfill.some <f> see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/some
        > Ox.polyfill.some.call([2, 1, 0], function(v, i) { return v == i; })
        true
        > Ox.polyfill.some.call([false, false, false], Ox.identity)
        false
    @*/
    Ox.polyfill.some = function(iterator, that) {
        if (this === void 0 || this === null || typeof iterator !== 'function') {
            throw new TypeError();  
        }
        var array = Object(this), i, length = array.length >>> 0, ret = false;
        for (i = 0; i < length; i++) {  
            if (i in array && iterator.call(that, array[i], i, array)) {
                ret = true;
                break;  
            }
        }
        return ret;
    };

    /*@
    Ox.polyfill.trim <f> see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/String/Trim
        > Ox.polyfill.trim.call('  foo  ')
        'foo'
    @*/
    Ox.polyfill.trim = function() {
        if (this === void 0 || this === null) {
            throw new TypeError();
        }
        return this.replace(/^\s+|\s+$/g, '');
    };

    [
        [Array, ['isArray']],
        [Array.prototype, [
            'every', 'filter', 'forEach', 'indexOf', 'lastIndexOf',
            'map', 'reduce', 'reduceRight', 'some']
        ],
        [Function.prototype, ['bind']],
        [Object, ['keys']],
        [String.prototype, ['trim']],
        [window, ['atob', 'btoa', 'JSON']]
    ].forEach(function(item) {
        var object = item[0], keys = item[1];
        keys.forEach(function(key) {
            if (!key in object) {
                if (canDefineProperty) {
                    Object.defineProperty(object, key, {
                        configurable: true,
                        enumerable: false,
                        writable: true,
                        value: Ox.polyfill[key]
                    });
                } else {
                    object[key] = Ox.polyfill[key];
                }
            }
        });
    });

    // In IE8, window.console.log is an object,
    // in IE9, window.console.log.apply is undefined
    // see http://stackoverflow.com/questions/5472938/does-ie9-support-console-log-and-is-it-a-real-function
    if (window.console) {
        if (typeof window.console.log !== 'function') {
            log = window.console.log;
            window.console.log = function() {
                log(Array.prototype.slice.call(arguments).join(' '));
            };
        } else if (!window.console.log.apply) {
            window.console.log = Function.prototype.bind.call(
                window.console.log, window.console
            );
        }
    }

}(this));
