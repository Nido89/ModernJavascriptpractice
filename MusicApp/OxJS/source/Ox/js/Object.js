'use strict';

/*@
Ox.extend <function> Extends an object with one or more other objects
    > Ox.extend({a: 1, b: 1, c: 1}, {b: 2, c: 2}, {c: 3})
    {a: 1, b: 2, c: 3}
    > Ox.extend({a: 1}, 'b', 2)
    {a: 1, b: 2}
    > Ox.extend({a: 1}, 'b')
    {a: 1, b: void 0}
@*/
Ox.extend = function(object) {
    var args = Ox.slice(arguments, 1);
    if (!Ox.isObject(args[0])) {
        args = [Ox.makeObject(args)];
    }
    Ox.forEach(args, function(arg) {
        Ox.forEach(arg, function(value, key) {
            object[key] = value;
        });
    });
    return object;
};

/*@
Ox.getset <f> Generic getter and setter function
    See examples for details.
    # Usage --------------------------------------------------------------------
    (options, args=[])                              -> <o> all options
    (options, args=[key])                           -> <*> options[key]
    (options, args=[key, value], callback, that)    -> <o> that
        sets options[key] to value and calls fn(key, value)
        if the key/value pair was added or modified
    (options, args=[{key: value}], callback, that)   -> <o> that
        sets multiple options and calls fn(key, value)
        for every key/value pair that was added or modified
    # Arguments ----------------------------------------------------------------
    options  <obj> Options object (key/value pairs)
    args     <arr> The arguments "array" of the caller function
    callback <fun> Callback function 
        The callback is called for every key/value pair that was added or
        modified.
        key      <s> Key
        value    <*> Value
    that  <obj> The this object of the caller function (for chaining)
    # Examples -----------------------------------------------------------------
    <script>
        Ox.test.object = new function() {
            var options = {},
                setOption = function(key, value) {
                    // handle added or modified options
                },
                that = this;
            that.options = function() {
                return Ox.getset(options, arguments, setOption, that);
            };
            return that;
        };
    </script>
    > Ox.test.object.options("key", "val").options("key")
    "val"
    > Ox.test.object.options({foo: "foo", bar: "bar"}).options()
    {"key": "val", "foo": "foo", "bar": "bar"}
@*/
Ox.getset = function(object, args, callback, that) {
    var object_ = Ox.clone(object), ret;
    if (args.length == 0) {
        // []
        ret = object_;
    } else if (args.length == 1 && !Ox.isObject(args[0])) {
        // [key]
        ret = Ox.clone(object[args[0]]);
    } else {
        // [key, val] or [{key: val, ...}]
        args = Ox.makeObject(args);
        object = Ox.extend(object, args);
        Ox.forEach(args, function(value, key) {
            if (!object_ || !Ox.isEqual(object_[key], value)) {
                callback && callback(key, value);
            }
        });
        ret = that;                            
    }
    return ret;
};

Ox.hasOwn = function(object, value) {
    return Object.prototype.hasOwnProperty.call(object, value);
};

/*@
Ox.keyOf <f> Equivalent of [].indexOf for objects
    > Ox.keyOf({a: 1, b: 2, c: 3}, 1)
    'a'
@*/
Ox.keyOf = function(object, value) {
    var key;
    Ox.forEach(object, function(v, k) {
        if (v === value) {
            key = k;
            return false; // break
        }
    });
    return key;
};

/*@
Ox.makeObject <f> Takes an array and returns an object
    `Ox.makeObject` is a helper for functions with two alternative signatures
    like `('key', 'val')` and `({key: 'val'})`.
    > (function() { return Ox.makeObject(arguments); }({foo: 1, bar: 2}))
    {foo: 1, bar: 2}
    > (function() { return Ox.makeObject(arguments); }('foo', 1))
    {foo: 1}
    > (function() { return Ox.makeObject(arguments); }('foo'))
    {foo: void 0}
    > (function() { return Ox.makeObject(arguments); }())
    {}
@*/
Ox.makeObject = function(array) {
    var ret = {};
    if (Ox.isObject(array[0])) {
        // [{foo: 'bar'}]
        ret = array[0];
    } else if (array.length) {
        // ['foo', 'bar']
        ret[array[0]] = array[1];
    }
    return ret;
};

/*@
Ox.methods <f> Returns a sorted list of all method names of an object
    > Ox.methods({a: [], b: false, f: function() {}, n: 0, o: {}, s: ''})
    ['f']
@*/
Ox.methods = function(object, includePrototype) {
    var key, keys;
    if (includePrototype) {
        keys = [];
        for (var key in object) {
            keys.push(key);
        }
    } else {
        keys = Object.keys(object);
    }
    return keys.filter(function(key) {
        return Ox.isFunction(object[key]);
    }).sort();
};

/*@
Ox.serialize <f> Parses an object into query parameters
    > Ox.serialize({a: 1, b: 2.3, c: -4})
    'a=1&b=2.3&c=-4'
    > Ox.serialize({a: [], n: null, o: {}, s: '', u: void 0})
    ''
    > Ox.serialize({a: [1, 2], b: true, n: 1, o: {k: 'v'}, s: 'foo'}, true)
    'a=[1,2]&b=true&n=1&o={"k":"v"}&s="foo"'
@*/
Ox.serialize = function(object, isJSON) {
    var ret = [];
    Ox.forEach(object, function(value, key) {
        var value;
        if (isJSON) {
            try {
                value = JSON.stringify(value);
            } catch(e) {}
        }
        if (!Ox.isEmpty(value) && !Ox.isNull(value) && !Ox.isUndefined(value)) {
            ret.push(key + '=' + value);
        }
    });
    return ret.join('&');
};

/*@
Ox.unserialize <f> Parses query parameters into an object
    > Ox.unserialize('a=1&b=2.3&c=-4')
    {a: '1', b: '2.3', c: '-4'}
    > Ox.unserialize('a=foo&b=&c&a=bar')
    {a: 'bar'}
    > Ox.unserialize('a=[1,2]&b=true&n=1.2&o={"k":"v"}&s1="foo"&s2=bar', true)
    {a: [1, 2], b: true, n: 1.2, o: {k: 'v'}, s1: 'foo', s2: 'bar'}

@*/
Ox.unserialize = function(string, isJSON) {
    var ret = {};
    Ox.filter(string.split('&')).forEach(function(value) {
        var array = value.split('=');
        if (array[1]) {
            if (isJSON) {
                try {
                    ret[array[0]] = JSON.parse(array[1]);
                } catch(e) {
                    ret[array[0]] = array[1];
                }
            } else {
                ret[array[0]] = array[1];
            }
        }
    });
    return ret;
};

/*@
Ox.zipObject <f> Takes a keys and a values array, returns a new object
    > Ox.zipObject(['a', 'b'], [1, 2])
    {a: 1, b: 2}
@*/
Ox.zipObject = function(keys, values) {
    var object = {};
    keys = Ox.makeArray(keys);
    values = Ox.makeArray(values);
    keys.forEach(function(key, index) {
        object[key] = values[index];
    });
    return object;
};
