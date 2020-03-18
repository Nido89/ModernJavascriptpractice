'use strict';

/*@
Ox.api <f> Turns an array into a list API
    `Ox.api` takes an array and returns a function that allows you to run
    complex queries against it. See the examples below for details.
    items <[o]> An array of objects (key/value stores)
    options <o> API Options
        cache <b|false> If true, cache results
        enums <o> Enumerables, for example `{size: ['S', 'M', 'L']}`
        geo <b|false> If true, return combined area with totals
        map <o> Sort map, for example `{name: function(v, o) { return o.sortName; }}`
        sort <[o]|[s]> Default sort, for example `['+name', '-age']`
        sums <[s]> List of keys to be included in totals
        unique <s|'id'> The name of the unique key
    (items, options) -> <f> List API
        (options) -> <o> Results
        (options, callback) -> <o> Results
            area <o> Combined area
                Present if `keys` was undefined and the `geo` option was set
                east <n> Longitude
                north <n> Latitude
                south <n> Latitude
                west <n> Longitude
            items <n|[o]> Number of items or array of items
                Present if `positions` was not passed. Number if `keys` was
                undefined, otherwise array
            positions <o> Position (value) for each id (key)
                Present if `positions` was passed
            * <n> Sum of the values of any key specified in `sums`
                Present if `keys` was undefined
        options <o> Request options
            keys <[s]> Array of keys to be returned, or empty array for all keys
                Leaving `keys` undefined returns totals, not items
            positions <[s]> Array of ids
                Passing `positions` returns positions, not items
            query <o> Query object
                conditions <[o]> Array of condition objects and/or query objects
                    Passing a query object instead of a condition object inserts
                    a subcondition
                    key <s> Key
                    operator <s> Operator, like `'='` or `'!='`
                        Can be `'='` (contains) `'=='` (is), `'^'` (starts
                        with), `'$'` (ends with), `'<'`, `'<='`,  `'>'`, `'>='`,
                        optionally prefixed with `'!'` (not)
                    value <*> Value
                operator <s> `'&'` or `'|'`
            range <[n]> Range of results, like `[100, 200]`
            sort <[s]> Array of sort strings, like `['+name', '-age']`
        callback <f> Callback function
            results <o> Results
    <script>
        Ox.test.api = Ox.api([
            {id: 'foo', n: 2},
            {id: 'bar', n: 2},
            {id: 'baz', n: 1}
        ], {
            sums: ['n']
        });
        Ox.test.apiResults = {
            0: Ox.test.api(),
            1: Ox.test.api({
                keys: []
            }),
            2: Ox.test.api({
                keys: ['id'],
                sort: ['-n', '+id']
            }),
            3: Ox.test.api({
                keys: [],
                query: {
                    conditions: [
                        {key: 'id', operator: '!^', value: 'f'},
                        {key: 'n', operator: '>', value: 1}
                    ],
                    operator: '&'
                }
            }),
            4: Ox.test.api({
                keys: [],
                query: {
                    conditions: [
                        {key: 'id', operator: '=', value: 'O'},
                        {key: 'n', operator: '=', value: [1, 2]}
                    ],
                    operator: '|'
                },
                sort: ['+id']
            }),
            5: Ox.test.api({
                keys: [],
                query: {
                    conditions: [
                        {key: 'id', operator: '=', value: 'f'},
                        {
                            conditions: [
                                {key: 'id', operator: '=', value: 'a'},
                                {key: 'id', operator: '=', value: 'z'}
                            ],
                            operator: '&'
                        }
                    ],
                    operator: '|'
                },
                sort: ['+id']
            }),
            6: Ox.test.api({
                keys: [],
                range: [1, 2],
                sort: ['+id']
            }),
            7: Ox.test.api({
                positions: ['foo', 'bar'],
                sort: ['+id']
            })
        };
        Ox.test.api = Ox.api([
            {i: 0, size: 'S'},
            {i: 1, size: 'M'},
            {i: 2, size: 'L'}
        ], {
            enums: {size: ['S', 'M', 'L']},
            unique: 'i'
        });
        Ox.test.apiResults[8] = Ox.test.api({
            keys: ['size'],
            query: {
                conditions: [{key: 'size', operator: '>=', value: 'M'}],
                operator: '&'
            },
            sort: [{key: 'size', operator: '-'}]
        });
        Ox.test.api = Ox.api([
            {name: 'John Cale', sortName: 'Cale, John'},
            {name: 'Brian Eno', sortName: 'Eno, Brian'}
        ], {
            map: {name: function(value, object) { return object.sortName; }},
            unique: 'name'
        });
        Ox.test.apiResults[9] = Ox.test.api({
            keys: ['name'],
            sort: [{key: 'name', operator: '+'}]
        });
    </script>
    > Ox.test.apiResults[0].data
    {items: 3, n: 5}
    > Ox.test.apiResults[1].data
    {items: [{id: 'foo', n: 2}, {id: 'bar', n: 2}, {id: 'baz', n: 1}]}
    > Ox.test.apiResults[2].data
    {items: [{id: 'bar'}, {id: 'foo'}, {id: 'baz'}]}
    > Ox.test.apiResults[3].data
    {items: [{id: 'bar', n: 2}]}
    > Ox.test.apiResults[4].data
    {items: [{id: 'baz', n: 1}, {id: 'foo', n: 2}]}
    > Ox.test.apiResults[5].data
    {items: [{id: 'baz', n: 1}, {id: 'foo', n: 2}]}
    > Ox.test.apiResults[6].data
    {items: [{id: 'baz', n: 1}]}
    > Ox.test.apiResults[7].data
    {positions: {foo: 2, bar: 0}}
    > Ox.test.apiResults[8].data
    {items: [{i: 2, size: 'L'}, {i: 1, size: 'M'}]}
    > Ox.test.apiResults[9].data
    {items: [{name: 'John Cale'}, {name: 'Brian Eno'}]}
@*/
Ox.api = function(items, options) {

    options = options || {};

    var api = {
            cache: options.cache,
            enums: options.enums ? parseEnums(options.enums) : {},
            geo: options.geo,
            map: options.map || {},
            sort: options.sort || [],
            sums: options.sums || [],
            unique: options.unique || 'id'
        },
        fn = function(options, callback) {
            var data,
                keys,
                map = {},
                result = {data: {}, status: {code: 200, text: 'ok'}};
            options = options || {};
            if (options.query) {
                // find
                options.query.conditions = parseConditions(options.query.conditions);
                result.data.items = items.filter(function(item) {
                    return testQuery(item, options.query);
                });
            } else {
                result.data.items = Ox.clone(items);
            }
            if (options.sort && result.data.items.length > 1) {
                // sort
                keys = [];
                options.sort = parseSort(
                    options.sort.concat(api.sort)
                ).filter(function(v) {
                    var ret = keys.indexOf(v.key) == -1;
                    keys.push(v.key);
                    return ret;
                });
                options.sort.forEach(function(v) {
                    var key = v.key;
                    if (api.enums[key]) {
                        map[key] = function(value) {
                            return api.enums[key].indexOf(value.toLowerCase());
                        };
                    } else if (api.map[key]) {
                        map[key] = api.map[key];
                    }/* else if (Ox.isArray(items[0][key])) {
                        sort[key] = function(value) {
                            return value.join(', ');
                        };
                    }*/
                });
                if (options.keys || options.positions) {
                    result.data.items = sortBy(
                        result.data.items, options.sort, map, options.query
                    );
                }
            }
            if (options.positions) {
                // return positions
                data = {positions: {}};
                options.positions.forEach(function(id) {
                    data.positions[id] = Ox.indexOf(result.data.items, function(item) {
                        return item[api.unique] == id;
                    });
                });
                result.data = data;
            } else if (!options.keys) {
                // return totals
                data = {};
                api.sums.forEach(function(key) {
                    data[key] = result.data.items.map(function(item) {
                        return item[key];
                    });
                    data[key] = Ox.isString(data[key][0])
                        ? Ox.unique(data[key]).length
                        : Ox.sum(data[key]);
                });
                data.items = result.data.items.length;
                if (api.geo) {
                    /*
                    fixme: slow, disabled
                    data.area = Ox.joinAreas(result.data.items.map(function(item) {
                        return {
                            sw: {lat: item.south, lng: item.west},
                            ne: {lat: item.north, lng: item.east}
                        };
                    }));
                    data.area = {
                        south: data.area.sw.lat,
                        west: data.area.sw.lng,
                        north: data.area.ne.lat,
                        east: data.area.ne.lng
                    };
                    */
                    data.area = data.items == 0 ? {
                        south: -Ox.MAX_LATITUDE,
                        west: -179,
                        north: Ox.MAX_LATITUDE,
                        east: 179
                    } : result.data.items.reduce(function(prev, curr) {
                        return {
                            south: Math.min(prev.south, curr.south),
                            west: Math.min(prev.west, curr.west),
                            north: Math.max(prev.north, curr.north),
                            east: Math.max(prev.east, curr.east)
                        };
                    }, {
                        south: Ox.MAX_LATITUDE,
                        west: 180,
                        north: -Ox.MAX_LATITUDE,
                        east: -180
                    });
                }
                result.data = data;
            } else {
                // return items
                if (!Ox.isEmpty(options.keys)) {
                    // filter keys
                    if (options.keys.indexOf(api.unique) == -1) {
                        options.keys.push(api.unique);
                    }
                    result.data.items = result.data.items.map(function(item) {
                        var ret = {};
                        options.keys.forEach(function(key) {
                            ret[key] = item[key];
                        });
                        return ret;
                    });
                }
                if (options.range) {
                    // apply range
                    result.data.items = result.data.items.slice(
                        options.range[0], options.range[1]
                    );
                }
            }
            callback && callback(result);
            return result;
        },
        ret = Ox.extend(
            api.cache ? Ox.cache(fn, {async: true}) : fn,
            {
                update: function(updatedItems) {
                    items = updatedItems;
                    api.cache && ret.clear();
                    sortBy.clear();
                    return ret;
                }
            }
        ),
        sortBy = Ox.cache(function sortBy(array, by, map, query) {
            return Ox.sortBy(array, by, map);
        }, {
            key: function(args) {
                return JSON.stringify([args[1], args[3]]);
            }
        });

    function parseEnums(enums) {
        // make enumerable strings lowercase
        return Ox.map(enums, function(values) {
            return values.map(function(value) {
                return value.toLowerCase();
            });
        });
    }

    function parseConditions(conditions) {
        // make string values lowercase,
        // and replace enumerable strings used with the
        // <, !<, <=, !<=, >, !>, >= or !>= operator
        // with their index
        return conditions.map(function(condition) {
            var key = condition.key,
                operator = condition.operator,
                values = Ox.makeArray(condition.value);
            if (condition.conditions) {
                condition.conditions = parseConditions(condition.conditions);
            } else {
                values = values.map(function(value) {
                    if (Ox.isString(value)) {
                        value = value.toLowerCase();
                    }
                    if (api.enums[key] && (
                        operator.indexOf('<') > -1
                        || operator.indexOf('>') > -1
                    )) {
                        value = api.enums[key].indexOf(value);
                    }
                    return value;
                });
                condition.value = Ox.isArray(condition.value)
                    ? values : values[0];
            }
            return condition;
        });
    }

    function parseSort(sort) {
        // translate 'foo' to {key: 'foo', operator: '+'}
        return sort.map(function(sort) {
            return Ox.isString(sort) ? {
                key: sort.replace(/^[\+\-]/, ''),
                operator: sort[0] == '-' ? '-' : '+'
            } : sort;
        });
    }

    function testCondition(item, condition) {
        var key = condition.key,
            operator = condition.operator.replace('!', ''),
            value = condition.value,
            not = condition.operator[0] == '!',
            itemValue = item[key],
            test = {
                '=': function(a, b) {
                    return Ox.isArray(b) ? a >= b[0] && a < b[1]
                        : Ox.isArray(a) ? a.some(function(value) {
                            return value.indexOf(b) > -1;
                        })
                        : Ox.isString(a) ? a.indexOf(b) > -1
                        : a === b;
                },
                '==': function(a, b) {
                    return Ox.isArray(a) ? a.some(function(value) {
                            return value === b;
                        })
                        : a === b;
                },
                '<': function(a, b) { return a < b; },
                '<=': function(a, b) { return a <= b; },
                '>': function(a, b) { return a > b; },
                '>=': function(a, b) { return a >= b; },
                '^': function(a, b) { return Ox.startsWith(a, b); },
                '$': function(a, b) { return Ox.endsWith(a, b); }
            };
        if (Ox.isString(itemValue)) {
            itemValue = itemValue.toLowerCase();
        } else if (Ox.isArray(itemValue) && Ox.isString(itemValue[0])) {
            itemValue = itemValue.map(function(value) {
                return value.toLowerCase();
            });
        }
        if (api.enums[key] && (
            operator.indexOf('<') > -1
            || operator.indexOf('>') > -1
        )) {
            itemValue = api.enums[key].indexOf(itemValue);
        }
        return test[operator](itemValue, value) == !not;
    }

    function testQuery(item, query) {
        var match = true;
        Ox.forEach(query.conditions, function(condition) {
            match = (
                condition.conditions ? testQuery : testCondition
            )(item, condition);
            if (
                (query.operator == '&' && !match)
                || (query.operator == '|' && match)
            ) {
                return false; // break
            }
        });
        return match;
    }

    return ret;

};

/*@
Ox.compact <f> Removes `null` or `undefined` values from an array
    (array) -> <a> Array without `null` or `undefined` values
    > Ox.compact([null,,1,,2,,3])
    [1, 2, 3]
@*/
Ox.compact = function(array) {
    return array.filter(function(value) {
        return value != null;
    });
};

/*@
Ox.find <f> Returns array elements that match a string
    Returns an array of case-insensitive matches: exact match first, then
    leading matches, then other matches
    (array, query[, leading]) -> <[s]> Array of matches
    array <[s]> Array of strings
    query <s> Query string
    leading <b> If true, returns leading matches only
    > Ox.find(['Bar', 'Barfoo', 'Foo', 'Foobar'], 'foo')
    ['Foo', 'Foobar', 'Barfoo']
    > Ox.find(['Bar', 'Barfoo', 'Foo', 'Foobar'], 'foo', true)
    ['Foo', 'Foobar']
@*/
Ox.find = function(array, string, leading) {
    var matches = [[], []];
    string = string.toLowerCase();
    array.forEach(function(value) {
        var lowerCase = value.toLowerCase(),
            index = lowerCase.indexOf(string);
        index > -1 && matches[index == 0 ? 0 : 1][
            lowerCase == string ? 'unshift' : 'push'
        ](value);
    });
    return leading ? matches[0] : matches[0].concat(matches[1]);
};

/*@
Ox.flatten <f> Flattens an array
    (array) -> <a> Flattened array
    > Ox.flatten([1, [2, [3], 2], 1])
    [1, 2, 3, 2, 1]
@*/
Ox.flatten = function(array) {
    var ret = [];
    array.forEach(function(value) {
        if (Ox.isArray(value)) {
            ret = ret.concat(Ox.flatten(value));
        } else {
            ret.push(value);
        }
    });
    return ret;
};

// FIXME: add docs and tests
Ox.getIndex = function(array, key, value) {
    return Ox.indexOf(array, function(obj) {
        return obj[key] === value;
    });
};

/*@
Ox.getIndexById <f> Returns the first array index of an object with a given id
    (array, id) -> <n> Index (or `-1`)
    array <[o]> Array of objects with a unique `'id'` property
    id <s> Id
    > Ox.getIndexById([{id: 'foo', str: 'Foo'}, {id: 'bar', str: 'Bar'}], 'bar')
    1
    > Ox.getIndexById([{id: 'foo', str: 'Foo'}, {id: 'bar', str: 'Bar'}], 'baz')
    -1
@*/
Ox.getIndexById = function(array, id) {
    return Ox.getIndex(array, 'id', id);
};

// FIXME: add docs and tests
Ox.getObject = function(array, key, value) {
    var index = Ox.getIndex(array, key, value);
    return index > -1 ? array[index] : null;
};

/*@
Ox.getObjectById <f> Returns the first object in an array with a given id
    (array, id) -> <o> Object (or `null`)
    array <[o]> Array of objects with a unique `'id'` property
    id <s> Id
    > Ox.getObjectById([{id: 'foo', str: 'Foo'}, {id: 'bar', str: 'Bar'}], 'bar')
    {id: "bar", str: "Bar"}
    > Ox.getObjectById([{id: 'foo', str: 'Foo'}, {id: 'bar', str: 'Bar'}], 'baz')
    null
@*/
Ox.getObjectById = function(array, id) {
    return Ox.getObject(array, 'id', id);
};

/*
Ox.indexOf = function(arr) {
    // indexOf for primitives, test for function, deep equal for others
};
*/

/*@
Ox.last <f> Gets or sets the last element of an array
    Unlike `arrayWithALongName[arrayWithALongName.length - 1]`,
    `Ox.last(arrayWithALongName)` is short.
    <script>
        Ox.test.array = [1, 2, 3];
    </script>
    > Ox.last(Ox.test.array)
    3
    > Ox.last(Ox.test.array, 4)
    [1, 2, 4]
    > Ox.test.array
    [1, 2, 4]
    > Ox.last('123')
    '3'
@*/
Ox.last = function(array, value) {
    var ret;
    if (arguments.length == 1) {
        ret = array[array.length - 1];
    } else {
        array[array.length - 1] = value;
        ret = array;
    }
    return ret;
};

/*@
Ox.makeArray <f> Wraps any non-array in an array.
    (value) -> <a> Array
    value <*> Any value
    > Ox.makeArray('foo')
    ['foo']
    > Ox.makeArray(['foo'])
    ['foo']
@*/
// FIXME: rename to toArray
Ox.makeArray = function(value) {
    var ret, type = Ox.typeOf(value);
    if (type == 'arguments' || type == 'nodelist') {
        ret = Ox.slice(value);
    } else if (type == 'array') {
        ret = value;
    } else {
        ret = [value];
    }
    return ret;
};

/*@
Ox.nextValue <f> Next value, given an array of numbers, a number and a direction
    (array, value, direction) -> <n> Next value
    array <[n]> Sorted array of numbers
    value <n> Number
    direction <n|1> Direction (-1 for left or 1 for right)
    > Ox.nextValue([0, 2, 4, 6, 8], 5, -1)
    4
    > Ox.nextValue([], 1, 1)
    void 0
@*/
Ox.nextValue = function(array, value, direction) {
    var found = false, nextValue;
    direction = direction || 1;
    direction == -1 && array.reverse();
    Ox.forEach(array, function(v) {
        if (direction == 1 ? v > value : v < value) {
            nextValue = v;
            found = true;
            return false; // break
        }
    });
    direction == -1 && array.reverse();
    if (!found) {
        nextValue = array[direction == 1 ? 0 : array.length - 1];
    }
    return nextValue;
};

/*@
Ox.range <f> Python-style range
    (stop) -> <[n]> range
        Returns an array of integers from `0` (inclusive) to `stop` (exclusive).
    (start, stop) -> <[n]> range
        Returns an array of integers from `start` (inclusive) to `stop`
        (exclusive).
    (start, stop, step) -> <[n]> range
        Returns an array of numbers from `start` (inclusive) to `stop`
        (exclusive), incrementing by `step`.
    start <n> Start value
    stop <n> Stop value
    step <n> Step value
    > Ox.range(3)
    [0, 1, 2]
    > Ox.range(1, 4)
    [1, 2, 3]
    > Ox.range(3, 0)
    [3, 2, 1]
    > Ox.range(1, 2, 0.5)
    [1, 1.5]
    > Ox.range(-1, -2, -0.5)
    [-1, -1.5]
@*/
Ox.range = function() {
    var array = [];
    Ox.loop.apply(null, Ox.slice(arguments).concat(function(index) {
        array.push(index);
    }));
    return array;
};

(function() {

    var getSortValue = Ox.cache(function getSortValue(value) {
        var sortValue = value;
        function trim(value) {
            return value.replace(/^\W+(?=\w)/, '');
        }
        if (
            Ox.isEmpty(value)
            || Ox.isNull(value)
            || Ox.isUndefined(value)
        ) {
            sortValue = null;
        } else if (Ox.isString(value)) {
            // make lowercase and remove leading non-word characters
            sortValue = trim(value.toLowerCase());
            // move leading articles to the end
            // and remove leading non-word characters
            Ox.forEach(['a', 'an', 'the'], function(article) {
                if (new RegExp('^' + article + ' ').test(sortValue)) {
                    sortValue = trim(sortValue.slice(article.length + 1))
                        + ', ' + sortValue.slice(0, article.length);
                    return false; // break
                }
            });
            // remove thousand separators and pad numbers
            sortValue = sortValue.replace(/(\d),(?=(\d{3}))/g, '$1')
                .replace(/\d+/g, function(match) {
                    return Ox.pad(match, 'left', 64, '0');
                });
        }
        return sortValue;
    }, {key: function(args) {
        return Ox.typeOf(args[0]) + ' ' + args[0];
    }});

    /*@
    Ox.sort <f> Sorts an array, handling articles and digits, ignoring capitalization
        (array) -> <a> Sorted array
        (array, map) -> <a> Sorted array
        array <a> Array
        map <f|u> Optional map function that returns the value for the array element
        > Ox.sort(['"z"', '10', '9', 'B', 'a'])
        ['9', '10', 'a', 'B', '"z"']
        > Ox.sort([{id: 0, name: '80 Days'}, {id: 1, name: '8 Women'}], function(v) {return v.name})
        [{id: 1, name: '8 Women'}, {id: 0, name: '80 Days'}]
        > Ox.sort(['In 80 Days Around the World', 'In 9 Minutes Around the World'])
        ['In 9 Minutes Around the World', 'In 80 Days Around the World']
        > Ox.sort(['80 Days', '20,000 Leagues'])
        ['80 Days', '20,000 Leagues']
        > Ox.sort(['Man', 'A Plan', 'The Canal'])
        ['The Canal', 'Man', 'A Plan']
        > Ox.sort(['The 9', 'The 10', 'An A', 'A "B"'])
        ['The 9', 'The 10', 'An A', 'A "B"']
    @*/
    Ox.sort = function(array, map) {
        return array.sort(function(a, b) {
            a = getSortValue(map ? map(a) : a);
            b = getSortValue(map ? map(b) : b);
            return a < b ? -1 : a > b ? 1 : 0;
        });
    };

    /*@
    Ox.sortBy <f> Sorts an array of objects by given properties
        (array, by[, map]) -> <a> Sorted array
        array <[o]> Array of objects
        by <[s]> Array of object keys (asc: 'foo' or '+foo', desc: '-foo')
        map <o> Optional map functions, per key, that return the sort value
        > Ox.sortBy([{x: 1, y: 1}, {x: 1, y: 2}, {x: 2, y: 2}], ['+x', '-y'])
        [{x: 1, y: 2}, {x: 1, y: 1}, {x: 2, y: 2}]
        > Ox.sortBy([{id: 0, name: '80 Days'}, {id: 1, name: '8 Women'}], ['name'])
        [{id: 1, name: '8 Women'}, {id: 0, name: '80 Days'}]
    @*/
    Ox.sortBy = function(array, by, map) {
        var sortValues = {};
        by = Ox.makeArray(by).map(function(value) {
            return Ox.isString(value) ? {
                key: value.replace(/^[\+\-]/, ''),
                operator: value[0] == '-' ? '-' : '+'
            } : value;
        });
        map = map || {};
        return array.sort(function(a, b) {
            var aValue, bValue, index = 0, key, ret = 0;
            while (ret == 0 && index < by.length) {
                key = by[index].key;
                aValue = getSortValue(
                    map[key] ? map[key](a[key], a) : a[key]
                );
                bValue = getSortValue(
                    map[key] ? map[key](b[key], b) : b[key]
                );
                if ((aValue === null) != (bValue === null)) {
                    ret = aValue === null ? 1 : -1;
                } else if (aValue < bValue) {
                    ret = by[index].operator == '+' ? -1 : 1;
                } else if (aValue > bValue) {
                    ret = by[index].operator == '+' ? 1 : -1;
                } else {
                    index++;
                }
            }
            return ret;
        });
    };

}());

/*@
Ox.unique <f> Removes duplicate values from an array
    (array) -> <a> Array without duplicate values
    > Ox.unique([1, 2, 3, 2, 1])
    [1, 2, 3]
    > Ox.unique([NaN, NaN])
    []
    > Ox.unique('foo')
    'fo'
@*/
Ox.unique = function(array) {
    return Ox.filter(array, function(value, index) {
        return array.indexOf(value) == index;
    });
};

/*@
Ox.zip <f> Zips an array of arrays
    > Ox.zip([[0, 1], [2, 3], [4, 5]])
    [[0, 2, 4], [1, 3, 5]]
    > Ox.zip([0, 1, 2], [3, 4, 5])
    [[0, 3], [1, 4], [2, 5]]
@*/
Ox.zip = function() {
    var args = arguments.length == 1 ? arguments[0] : Ox.slice(arguments),
        array = [];
    args[0].forEach(function(value, index) {
        array[index] = [];
        args.forEach(function(value) {
            array[index].push(value[index]);
        });
    });
    return array;
};
