'use strict';

/*@
Ox.avg <f> Returns the average of an array's values, or an object's properties
    (collection) -> <n> Average value
    collection <[n]|o> Array or object with numerical values
    > Ox.avg([-1, 0, 1])
    0
    > Ox.avg({a: 1, b: 2, c: 3})
    2
    > Ox.avg('avg is 0.1')
    0.1
@*/
Ox.avg = function(collection) {
    return Ox.sum(collection) / Ox.len(collection);
};

/*@
Ox.clone <f> Returns a (shallow or deep) copy of an array or object
    > (function() { var a = ['v'], b = Ox.clone(a); a[0] = null; return b[0]; }())
    'v'
    > (function() { var a = {k: 'v'}, b = Ox.clone(a); a.k = null; return b.k; }())
    'v'
    > Ox.clone(0)
    0
    > (function() { var a = [[0, 1]], b = Ox.clone(a); a[0][0] = null; return b[0]; }())
    [null, 1]
    > (function() { var a = [[0, 1]], b = Ox.clone(a, true); a[0][0] = null; return b[0]; }())
    [0, 1]
@*/
Ox.clone = function(collection, deep) {
    var ret, type = Ox.typeOf(collection);
    if (type != 'array' && type != 'object') {
        ret = collection;
    } else if (deep) {
        ret = type == 'array' ? [] : {};
        Ox.forEach(collection, function(value, key) {
            type = Ox.typeOf(value);
            ret[key] = type == 'array' || type == 'object'
                ? Ox.clone(value, true) : value;
        });
    } else {
        ret = type == 'array' ? collection.slice() : Ox.extend({}, collection);
    }
    return ret;
};

/*@
Ox.contains <f> Tests if a collection contains a value
    (collection, value) -> <b> If true, the collection contains the value
    collection <a|o|s> Collection
    value <*> Any value
    > Ox.contains(['foo', 'bar'], 'foo')
    true
    > Ox.contains({foo: 'bar'}, 'bar')
    true
    > Ox.contains({foo: 'bar'}, 'foo')
    false
    > Ox.contains('foobar', 'bar')
    true
@*/ 
Ox.contains = function(collection, value) {
    var type = Ox.typeOf(collection);
    return (
        type == 'nodelist' || type == 'object'
        ? Ox.values(collection) : collection
    ).indexOf(value) > -1;
};

/*@
Ox.count <f> Counts the occurences of values in a collection
    (collection) -> <o> Number of occurrences per value
    (collection, value) -> <n> Number of occurrences of the given value
    collection <a|o|s> Collection
    value <*> Any value
    > Ox.count(['f', 'o', 'o'])
    {f: 1, o: 2}
    > Ox.count({a: 'f', b: 'o', c: 'o'})
    {f: 1, o: 2}
    > Ox.count('foo')
    {f: 1, o: 2}
    > Ox.count('foo', 'f')
    1
    > Ox.count('foo', 'x')
    0
@*/
Ox.count = function(collection, value) {
    var count = {};
    Ox.forEach(collection, function(value) {
        count[value] = (count[value] || 0) + 1;
    });
    return value ? count[value] || 0 : count;
};

/*@
Ox.every <f> Tests if every element of a collection satisfies a given condition
    Unlike `Array.prototype.every`, `Ox.every` works for arrays, objects and
    strings.
    (collection[, iterator]) -> <b> True if every element passes the test
    collection <a|o|s> Collection
    iterator <f> Iterator
        value <*> Value
        key <n|s> Index or key
        collection <a|o|s> The collection
    > Ox.every([0, 1, 2], function(v, i) { return v == i; })
    true
    > Ox.every({a: 1, b: 2, c: 3}, function(v) { return v == 1; })
    false
    > Ox.every('foo', function(v) { return v == 'f'; })
    false
    > Ox.every([true, true, true])
    true
@*/
Ox.every = function(collection, iterator, that) {
    iterator = iterator || Ox.identity;
    return Ox.forEach(collection, function(value, key, collection) {
        return !!iterator.call(that, value, key, collection);
    }) == Ox.len(collection);
};

/*@
Ox.filter <f> Filters a collection by a given condition
    Unlike `Array.prototype.filter`, `Ox.filter` works for arrays, objects and
    strings.
    > Ox.filter([2, 1, 0], function(v, i) { return v == i; })
    [1]
    > Ox.filter({a: 'c', b: 'b', c: 'a'}, function(v, k) { return v == k; })
    {b: 'b'}
    > Ox.filter(' foo bar ', function(v) { return v != ' '; })
    'foobar'
@*/
Ox.filter = function(collection, iterator, that) {
    var ret, type = Ox.typeOf(collection);
    iterator = iterator || Ox.identity;
    if (type == 'object' || type == 'storage') {
        ret = {};
        Ox.forEach(collection, function(value, key) {
            if (iterator.call(that, value, key, collection)) {
                ret[key] = value;
            }
        });
    } else {
        ret = Ox.slice(collection).filter(iterator, that);
        if (type == 'string') {
            ret = ret.join('');
        }
    }
    return ret;
};

/*@
Ox.forEach <f> forEach loop
    `Ox.forEach` loops over arrays, objects and strings. Returning `false` from
    the iterator acts like a `break` statement. Unlike `for`, which leaks its
    counter variable to the outer scope, `Ox.forEach` returns it.
    (collection, iterator[, that]) -> <n> Next index
    collection <a|o|s> Collection
    iterator <f> Iterator
        value <*> Value
        key <n|s> Index or key
        collection <a|o|s> The collection
    that <o> The iterator's `this` binding
    <script>
        Ox.test.string = "";
        Ox.forEach(['f', 'o', 'o'], function(v, i) { Ox.test.string += i; });
        Ox.forEach({a: 'f', b: 'o', c: 'o'}, function(v, k) { Ox.test.string += k; });
        Ox.forEach("foo", function(v) { Ox.test.string += v; });
    </script>
    > Ox.test.string
    "012abcfoo"
    > Ox.forEach({a: 'f', b: 'o', c: 'o'}, function(v, k) { return v != 'o' });
    1
@*/
Ox.forEach = function(collection, iterator, that) {
    var i = 0, key, type = Ox.typeOf(collection);
    if (type == 'object' || type == 'storage') {
        for (key in collection) {
            if (
                Ox.hasOwn(collection, key)
                && iterator.call(that, collection[key], key, collection) === false
            ) {
                break;
            }
            i++;
        }
    } else {
        collection = Ox.slice(collection);
        for (i = 0; i < collection.length; i++) {
            if (
                i in collection
                && iterator.call(that, collection[i], i, collection) === false
            ) {
                break;
            }
        }
    }
    return i;
};

/*@
Ox.indexOf <f> Returns the first index of a collection element that passes a test
    > Ox.indexOf([1, 2, 3], function(val) { return val % 2 == 0; })
    1
    > Ox.indexOf({a: 1, b: 2, c: 3}, function(val) { return val % 2 == 0; })
    'b'
    > Ox.indexOf('FooBar', function(val) { return val == val.toUpperCase(); })
    0
    > Ox.indexOf([1, 2, 3], function(val) { return val == 0; })
    -1
@*/
Ox.indexOf = function(collection, test) {
    var index = Ox.forEach(collection, function(value) {
        return !test(value); // break if test succeeds
    });
    return Ox.isObject(collection) ? Object.keys(collection)[index] || null
        : index == collection.length ? -1 : index;
};

/*@
Ox.indicesOf <f> Returns all indices of collection elements that pass a test
    > Ox.indicesOf([1, 2, 3], function(val) { return val % 2 == 1; })
    [0, 2]
    > Ox.indicesOf({a: 1, b: 2, c: 3}, function(val) { return val % 2 == 1; })
    ['a', 'c']
    > Ox.indicesOf('FooBar', function(val) { return val == val.toUpperCase(); })
    [0, 3]
    > Ox.indicesOf([1, 2, 3], function(val) { return val == 0; })
    []
@*/
Ox.indicesOf = function(collection, test) {
    var ret = [];
    Ox.forEach(collection, function(value, index) {
        test(value) && ret.push(index);
    });
    return ret;
};

/*@
Ox.len <f> Returns the length of an array, nodelist, object, storage or string
    Not to be confused with `Ox.length`, which is the `length` property of the
    `Ox` function (`1`).
    > Ox.len((function() { return arguments; }(1, 2, 3)))
    3
    > Ox.len([1, 2, 3])
    3
    > Ox.len([,])
    1
    > Ox.typeOf(Ox.len(document.getElementsByTagName('a')))
    'number'
    > Ox.len({a: 1, b: 2, c: 3})
    3
    > Ox.typeOf(Ox.len(localStorage))
    'number'
    > Ox.len('abc')
    3
    > Ox.len(function(a, b, c) {})
    undefined
@*/
Ox.len = function(collection) {
    var ret, type = Ox.typeOf(collection);
    if (
        type == 'arguments' || type == 'array'
        || type == 'nodelist' || type == 'string'
    ) {
        ret = collection.length;
    } else if (type == 'object' || type == 'storage') {
        ret = Object.keys(collection).length;
    }
    return ret;
};

/*@
Ox.map <f> Transforms the values of an array, object or string
    Unlike `Array.prototype.map`, `Ox.map` works for arrays, objects and
    strings.
    > Ox.map([2, 1, 0], function(v, i) { return v == i; })
    [false, true, false]
    > Ox.map({a: 'b', b: 'b', c: 'b'}, function(v, k) { return v == k; })
    {a: false, b: true, c: false}
    > Ox.map('foo', function(v) { return v.toUpperCase(); })
    'FOO'
    > Ox.map([,], function(v, i) { return i; })
    [,]
@*/
Ox.map = function(collection, iterator, that) {
    var ret, type = Ox.typeOf(collection);
    if (type == 'object' || type == 'storage') {
        ret = {};
        Ox.forEach(collection, function(value, key) {
            ret[key] = iterator.call(that, value, key, collection);
        });
    } else {
        ret = Ox.slice(collection).map(iterator);
        if (type == 'string') {
            ret = ret.join('');
        }
    }
    return ret;
};

/*@
Ox.max <f> Returns the maximum value of a collection
    > Ox.max([1, 2, 3])
    3
    > Ox.max({a: 1, b: 2, c: 3})
    3
    > Ox.max('123')
    3
    > Ox.max([])
    -Infinity
@*/
Ox.max = function(collection) {
    var ret, values = Ox.values(collection);
    if (values.length < Ox.STACK_LENGTH) {
        ret = Math.max.apply(null, values);
    } else {
        ret = values.reduce(function(previousValue, currentValue) {
            return Math.max(previousValue, currentValue);
        }, -Infinity);
    }
    return ret;
};

/*@
Ox.min <f> Returns the minimum value of a collection
    > Ox.min([1, 2, 3])
    1
    > Ox.min({a: 1, b: 2, c: 3})
    1
    > Ox.min('123')
    1
    > Ox.min([])
    Infinity
@*/
Ox.min = function(collection) {
    var ret, values = Ox.values(collection);
    if (values.length < Ox.STACK_LENGTH) {
        ret = Math.min.apply(null, values);
    } else {
        ret = values.reduce(function(previousValue, currentValue) {
            return Math.min(previousValue, currentValue);
        }, Infinity);
    }
    return ret;
};

/*@
Ox.numberOf <f> Returns the number of elements in a collection that pass a test
    (collection, test) -> <n> Number of elements
    collection <a|o|s> Collection
    test <f> Test function
        value <*> Value
        key <n|s> Key
        collection <a|o|s> Collection
    > Ox.numberOf([0, 1, 0, 1], function(v) { return v; })
    2
    > Ox.numberOf({a: 'a', b: 'c'}, function(v, k) { return v == k; })
    1
    > Ox.numberOf('foo', function(v, k, c) { return v == c[k - 1]; })
    1
@*/
Ox.numberOf = function(collection, test) {
    return Ox.len(Ox.filter(collection, test));
};

/*@
Ox.remove <f> Removes an element from an array or object and returns it
    (collection, element) -> <*> Element, or undefined if not found
    <script>
        Ox.test.collection = [
            ['a', 'b', 'c'],
            {a: 0, b: 1, c: 2}
        ];
    </script>
    > Ox.remove(Ox.test.collection[0], 'b')
    'b'
    > Ox.remove(Ox.test.collection[1], 1)
    1
    > Ox.remove(Ox.test.collection[1], 3)
    void 0
    > Ox.test.collection
    [['a', 'c'], {a: 0, c: 2}]
@*/
Ox.remove = function(collection, element) {
    var ret, key;
    if (Ox.isArray(collection)) {
        key = collection.indexOf(element);
        if (key > -1) {
            ret = collection.splice(key, 1)[0];
        }
    } else {
        key = Ox.keyOf(collection, element);
        if (key) {
            ret = collection[key];
            delete collection[key];
        }
    }
    return ret;
};

/*@
Ox.reverse <f> Reverses an array or string
    > Ox.reverse([1, 2, 3])
    [3, 2, 1]
    > Ox.reverse('foobar')
    'raboof'
@*/
Ox.reverse = function(collection) {
    return Ox.isArray(collection)
        ? Ox.clone(collection).reverse()
        : collection.toString().split('').reverse().join('');
};

/*@
Ox.shuffle <f> Randomizes the order of values within a collection
    > Ox.shuffle([1, 2, 3]).length
    3
    > Ox.len(Ox.shuffle({a: 1, b: 2, c: 3}))
    3
    > Ox.shuffle('123').split('').sort().join('')
    '123'
@*/
Ox.shuffle = function(collection) {
    var keys, ret, type = Ox.typeOf(collection), values;
    if (type == 'object' || type == 'storage') {
        keys = Object.keys(collection);
        values = Ox.shuffle(Ox.values(collection));
        ret = {};
        keys.forEach(function(key, index) {
            ret[key] = values[index];
        });
    } else {
        ret = [];
        Ox.slice(collection).forEach(function(value, index) {
            var random = Math.floor(Math.random() * (index + 1));
            ret[index] = ret[random];
            ret[random] = value;
        });
        if (type == 'string') {
            ret = ret.join('');
        }
    }
    return ret;
};

/*@
Ox.slice <f> Alias for `Array.prototype.slice.call`
    (collection[, start[, stop]]) -> <a> Array
    collection <a|o|s> Array-like
    start <n> Start position
    stop <n> Stop position
    > (function() { return Ox.slice(arguments); }(1, 2, 3))
    [1, 2, 3]
    > Ox.slice('foo', 0, 1);
    ['f']
    > Ox.slice({0: 'f', 1: 'o', 2: 'o', length: 3}, -2)
    ['o', 'o']
@*/
// FIXME: remove toArray alias
Ox.slice = Ox.toArray = function(collection, start, stop) {
    return Array.prototype.slice.call(collection, start, stop);
};
// IE8 can't apply slice to NodeLists, returns an empty array if undefined is
// passed as stop and returns an array of null values if a string is passed as
// value. Firefox 3.6 returns an array of undefined values if a string is passed
// as value.
if (
    Ox.slice([0]).length == 0
    || Ox.slice('0')[0] === null
    || Ox.slice('0')[0] === void 0
    || !(function() {
        try {
            return Ox.slice(document.getElementsByTagName('a'));
        } catch (error) {}
    }())
) {
    // FIXME: remove toArray alias
    Ox.slice = Ox.toArray = function(collection, start, stop) {
        var args = stop === void 0 ? [start] : [start, stop],
            array = [], index, length, ret;
        if (Ox.typeOf(collection) == 'string') {
            collection = collection.split('');
        }
        try {
            ret = Array.prototype.slice.apply(collection, args);
        } catch (error) {
            length = collection.length;
            for (index = 0; index < length; index++) {
                array[index] = collection[index];
            }
            ret = Array.prototype.slice.apply(array, args);
        }
        return ret;
    };
}

/*@
Ox.some <f> Tests if one or more elements of a collection meet a given condition
    Unlike `Array.prototype.some`, `Ox.some` works for arrays, objects and
    strings.
    > Ox.some([2, 1, 0], function(i, v) { return i == v; })
    true
    > Ox.some({a: 1, b: 2, c: 3}, function(v) { return v == 1; })
    true
    > Ox.some("foo", function(v) { return v == 'f'; })
    true
    > Ox.some([false, null, 0, '', void 0])
    false
@*/
Ox.some = function(collection, iterator, that) {
    iterator = iterator || Ox.identity;
    return Ox.forEach(collection, function(value, key, collection) {
        return !iterator.call(that, value, key, collection);
    }) < Ox.len(collection);
};

/*@
Ox.sum <f> Returns the sum of the values of a collection
    > Ox.sum(1, 2, 3)
    6
    > Ox.sum([1, 2, 3])
    6
    > Ox.sum({a: 1, b: 2, c: 3})
    6
    > Ox.sum('123')
    6
    > Ox.sum('123foo')
    6
    > Ox.sum('08', -2, 'foo')
    6
@*/
Ox.sum = function(collection) {
    var ret = 0;
    collection = arguments.length > 1 ? Ox.slice(arguments) : collection;
    Ox.forEach(collection, function(value) {
        value = +value;
        ret += isFinite(value) ? value : 0;
    });
    return ret;
};

/* FIXME: do we need this kind of zip functionality?

Ox.arrayToObject = function(array, key) {
    var ret = {};
    array.forEach(function(v) {
        ret[v[key]] = v;
    });
    return ret;
};

Ox.objectToArray = function(object, key) {
    var ret = [];
    Ox.forEach(object, function(v, k) {
        ret.push(Ox.extend(v, key, k));
    });
    return ret;
};

*/

/*@
Ox.values <f> Returns the values of a collection
    (collection) -> <a> Array of values
    collection <a|o|s> Collection
    > Ox.values([1, 2, 3])
    [1, 2, 3]
    > Ox.values({a: 1, b: 2, c: 3})
    [1, 2, 3]
    > Ox.typeOf(Ox.values(localStorage))
    'array'
    > Ox.values('abc')
    ['a', 'b', 'c']
    > Ox.values([1,,3])
    [1,,3]
@*/
Ox.values = function(collection) {
    var ret, type = Ox.typeOf(collection);
    if (type == 'array' || type == 'nodelist') {
        ret = Ox.slice(collection);
    } else if (type == 'object' || type == 'storage') {
        ret = [];
        Ox.forEach(collection, function(value) {
            ret.push(value);
        });
    } else if (type == 'string') {
        ret = collection.split('');
    }
    return ret;
};

/*@
Ox.walk <f> Iterates over a nested data structure
    (collection, iterator[, that]) -> <u> undefined
    collection <a|o|s> Collection
    iterator <f> Iterator
        value <*> Value
        keys <a> Array of keys
        collection <a|o|s> The collection
    that <o> The iterator's `this` binding
    <script>
        Ox.test.number = 0;
        Ox.walk({a: 1, b: {c: 2, d: 3}}, function(value) {
            Ox.test.number += Ox.isNumber(value) ? value : 0;
        });
        Ox.test.array = [];
        Ox.walk({a: 1, b: {c: 2, d: 3}}, function(value, keys) {
            Ox.isNumber(value) && Ox.test.array.push(keys)
        });
    </script>
    > Ox.test.number
    6
    > Ox.test.array
    [['a'], ['b', 'c'], ['b', 'd']]
@*/
Ox.walk = function(collection, iterator, that, keys) {
    keys = keys || [];
    Ox.forEach(collection, function(value, key) {
        var keys_ = keys.concat(key);
        iterator.call(that, value, keys_, collection);
        Ox.walk(collection[key], iterator, that, keys_);
    });
};
