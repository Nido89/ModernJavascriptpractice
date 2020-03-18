'use strict';

(function() {

    function asyncMap(forEach, collection, iterator, that, callback) {
        var type = Ox.typeOf(collection),
            results = type == 'object' ? {} : [];
        callback = Ox.last(arguments);
        that = arguments.length == 5 ? that : null;
        forEach(collection, function(value, key, collection, callback) {
            iterator(value, key, collection, function(value) {
                results[key] = value;
                callback();
            });
        }, that, function() {
            callback(type == 'string' ? results.join('') : results);
        });
    }

    Ox.asyncMap = function(array, iterator, that, callback) {
        array = Ox.makeArray(array);
        callback = Ox.last(arguments);
        that = arguments.length == 4 ? that : null;
        if (array.some(Ox.isArray)) {
            Ox.serialMap(array, function(value, key, array, callback) {
                Ox.parallelMap(Ox.makeArray(value), iterator, callback);
            }, callback);
        } else {
            Ox.parallelMap(array, iterator, callback);
        }
    };

    /*@
    Ox.nonblockingForEach <f> Non-blocking `forEach` with synchronous iterator
        (col, iterator[, that], callback[, ms]) -> <u> undefined
        collection <a|o|s> Collection
        iterator <f> Iterator function
            value <*> Value
            key <n|s> Key
            collection <a|o|s> The collection
        that <o> The iterator's `this` binding
        callback <f> Callback function
        ms <n> Number of milliseconds after which to insert a `setTimeout` call
    @*/
    Ox.nonblockingForEach = function(collection, iterator, that, callback, ms) {
        var i = 0, keys, last = Ox.last(arguments),
            n, time, type = Ox.typeOf(collection);
        callback = Ox.isFunction(last) ? last : arguments[arguments.length - 2];
        collection = type == 'array' || type == 'object'
            ? collection : Ox.slice(collection);
        keys = type == 'object'
            ? Object.keys(collection) : Ox.range(collection.length);
        ms = ms || 1000;
        n = Ox.len(collection);
        that = arguments.length == 5 || (
            arguments.length == 4 && Ox.isFunction(last)
        ) ? that : null;
        time = +new Date();
        iterate();
        function iterate() {
            Ox.forEach(keys.slice(i), function(key) {
                if (key in collection) {
                    if (iterator.call(
                        that, collection[key], key, collection
                    ) === false) {
                        i = n;
                        return false;
                    }
                }
                i++;
                if (+new Date() >= time + ms) {
                    return false; // break
                }
            });
            if (i < n) {
                setTimeout(function() {
                    time = +new Date();
                    iterate();
                }, 1);
            } else {
                callback();
            }
        }
    };

    /*@
    Ox.nonblockingMap <f> Non-blocking `map` with synchronous iterator
        (collection, iterator[, that], callback[, ms]) -> <u> undefined
        collection <a|o|s> Collection
        iterator <f> Iterator function
        that <o> The iterator's `this` binding
        callback <f> Callback function
        ms <n> Number of milliseconds after which to insert a `setTimeout` call
        <script>
            // var time = +new Date();
            // Ox.nonblockingMap(
            //     Ox.range(1000000),
            //     function (value, index, array) {
            //         return +new Date() - time;
            //     },
            //     function(results) {
            //         Ox.print(results.length);
            //     },
            //     1000
            // );
        </script>
        > Ox.nonblockingMap(Ox.range(100000), Ox.identity, function(r) { Ox.test(r.length, 100000); })
        undefined
    @*/
    Ox.nonblockingMap = function(collection, iterator, that, callback, ms) {
        var last = Ox.last(arguments),
            type = Ox.typeOf(collection),
            results = type == 'object' ? {} : [];
        callback = Ox.isFunction(last) ? last : arguments[arguments.length - 2];
        that = arguments.length == 5 || (
            arguments.length == 4 && Ox.isFunction(last)
        ) ? that : null;
        Ox.nonblockingForEach(collection, function(value, key, collection) {
            results[key] = iterator.call(that, value, key, collection);
        }, function() {
            callback(type == 'string' ? results.join('') : results);
        }, ms);
    };

    /*@
    Ox.parallelForEach <f> `forEach` with asynchronous iterator, running in parallel
        (collection, iterator[, that], callback) -> <u> undefined
        collection <a|o|s> Collection
        iterator <f> Iterator function
            value <*> Value
            key <n|s> Key
            collection <a|o|s> The collection
            callback <f> Callback function
        that <o> The iterator's this binding
        callback <f> Callback function
        <script>
            Ox.test.pfeNumber = 0;
            Ox.test.pfeIterator = function(value, index, array, callback) {
                if (index < 5) {
                    Ox.test.pfeNumber++;
                }
                setTimeout(callback);
            };
        </script>
        > Ox.parallelForEach(Ox.range(10), Ox.test.pfeIterator, function() { Ox.test(Ox.test.pfeNumber, 5); })
        undefined
    @*/
    Ox.parallelForEach = function(collection, iterator, that, callback) {
        var i = 0, n, type = Ox.typeOf(collection);
        callback = callback || (arguments.length == 3 ? arguments[2] : Ox.noop);
        collection = type == 'array' || type == 'object'
            ? collection : Ox.slice(collection);
        n = Ox.len(collection);
        that = arguments.length == 4 ? that : null;
        Ox.forEach(collection, function(value, key, collection) {
            iterator.call(that, value, key, collection, function() {
                ++i == n && callback();
            });
        });
    };

    /*@
    Ox.parallelMap <f> Parallel `map` with asynchronous iterator
        (collection, iterator[, that], callback) -> <u> undefined
        collection <a|o|s> Collection
        iterator <f> Iterator function
            value <*> Value
            key <n|s> Key
            collection <a|o|s> The collection
            callback <f> Callback function
        that <o> The iterator's this binding
        callback <f> Callback function
            results <a|o|s> Results
        <script>
            // var time = +new Date();
            // Ox.parallelMap(
            //     Ox.range(10),
            //     function (value, index, array, callback) {
            //         setTimeout(function() {
            //             callback(+new Date() - time);
            //         }, Ox.random(1000));
            //     },
            //     function(results) {
            //         Ox.print(results);
            //     }
            // );
            Ox.test.pmIterator = function(value, index, array, callback) {
                setTimeout(callback(value - index));
            };
        </script>
        > Ox.parallelMap(Ox.range(10), Ox.test.pmIterator, function(r) { Ox.test(Ox.sum(r), 0); })
        undefined
    @*/
    Ox.parallelMap = function() {
        asyncMap.apply(null, [Ox.parallelForEach].concat(Ox.slice(arguments)));
    };

    /*@
    Ox.serialForEach <f> `forEach` with asynchronous iterator, run serially
        (collection, iterator[, that], callback) -> <u> undefined
        collection <a|o|s> Collection
        iterator <f> Iterator function
            value <*> Value
            key <n|s> Key
            collection <a|o|s> The collection
            callback <f> Callback function
        that <o> The iterator's this binding
        callback <f> Callback function
        <script>
            Ox.test.sfeNumber = 0;
            Ox.test.sfeIterator = function(value, index, array, callback) {
                Ox.test.sfeNumber++;
                setTimeout(function() {
                    callback(index < 4);
                });
            };
        </script>
        > Ox.serialForEach(Ox.range(10), Ox.test.sfeIterator, function() { Ox.test(Ox.test.sfeNumber, 5); })
        undefined
    @*/
    Ox.serialForEach = function(collection, iterator, that, callback) {
        var i = 0, keys, n, type = Ox.typeOf(collection);
        callback = callback || (arguments.length == 3 ? arguments[2] : Ox.noop);
        collection = type == 'array' || type == 'object'
            ? collection : Ox.slice(collection);
        keys = type == 'object'
            ? Object.keys(collection) : Ox.range(collection.length);
        n = Ox.len(collection);
        that = arguments.length == 4 ? that : null;
        iterate();
        function iterate(value) {
            if (value !== false) {
                if (keys[i] in collection) {
                    iterator.call(
                        that,
                        collection[keys[i]],
                        keys[i],
                        collection,
                        ++i < n ? iterate : callback
                    );
                } else {
                    ++i < n ? iterate() : callback();
                }
            } else {
                callback();
            }
        }
    };

    /*@
    Ox.serialMap <f> Serial `map` with asynchronous iterator
        (collection, iterator[, that], callback) -> <u> undefined
        collection <a|o|s> Collection
        iterator <f> Iterator function
            value <*> Value
            key <n|s> Key
            collection <a|o|s> The collection
            callback <f> Callback function
        that <o> The iterator's this binding
        callback <f> Callback function
            results <a|o|s> Results
        <script>
            // var time = +new Date();
            // Ox.serialMap(
            //     Ox.range(10),
            //     function (value, index, array, callback) {
            //         setTimeout(function() {
            //             callback(+new Date() - time);
            //         }, Ox.random(1000));
            //     },
            //     function(results) {
            //         Ox.print(results);
            //     }
            // );
            Ox.test.smIterator = function(value, index, array, callback) {
                setTimeout(callback(value - index));
            };
        </script>
        > Ox.serialMap(Ox.range(10), Ox.test.smIterator, function(r) { Ox.test(Ox.sum(r), 0); })
        undefined
    @*/
    Ox.serialMap = function(collection, iterator, that, callback) {
        asyncMap.apply(null, [Ox.serialForEach].concat(Ox.slice(arguments)));
    };
    // FIXME: The above test with 10000 iterations blows the stack

}());
