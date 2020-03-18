'use strict';

/*@
Ox.cache <f> Memoize a function
    fn <f> function
    options <o>
        async <b|false> function is async, last argument must be callback
        key   <f|JSON.stringify> return key for arguments
    <script>
        Ox.test.fn = Ox.cache(function(n) { return n * Math.random(); });
    </script>
    > Ox.test.fn(10) == Ox.test.fn(10);
    true
    > Ox.test.fn(10) == Ox.test.fn.clear()(10);
    false
@*/
// TODO: add async test
Ox.cache = function(fn, options) {
    var cache = {}, ret;
    options = options || {};
    options.async = options.async || false;
    options.key = options.key || JSON.stringify;
    ret = function() {
        var args = Ox.slice(arguments), key = options.key(args);
        function callback() {
            // cache all arguments passed to callback
            cache[key] = Ox.slice(arguments);
            // call the original callback
            Ox.last(args).apply(this, arguments);
        }
        if (options.async) {
            if (!(key in cache)) {
                // call function with patched callback
                fn.apply(this, args.slice(0, -1).concat(callback));
            } else {
                // call callback with cached arguments
                setTimeout(function() {
                    callback.apply(this, cache[key]);
                });
            }
        } else {
            if (!(key in cache)) {
                cache[key] = fn.apply(this, args);
            }
            return cache[key];
        }
    };
    ret.clear = function() {
        if (arguments.length == 0) {
            cache = {};
        } else {
            Ox.makeArray(arguments).forEach(function(key) {
                delete cache[key];
            });
        }
        return ret;
    };
    return ret;
};

/*@
Ox.debounce <f> Runs a function once it stops being called for a given interval
    (fn[, ms][, immediate]) -> <f> Debounced function
    fn <f> Function to debounce
    ms <n|250> Interval in milliseconds
    immediate <b|false> If true, function is called once immediately
@*/
Ox.debounce = function(fn/*, ms, immediate*/) {
    var args,
        immediate = Ox.last(arguments) === true,
        ms = Ox.isNumber(arguments[1]) ? arguments[1] : 250,
        timeout;
    return function() {
        args = arguments;
        if (!timeout) {
            if (immediate) {
                fn.apply(null, args);
                args = null;
            }
        } else {
            clearTimeout(timeout);
        }
        timeout = setTimeout(function() {
            if (args !== null) {
                fn.apply(null, args);
            }
            timeout = null;
        }, ms);
    };
};

/*@
Ox.identity <f> Returns its first argument
    This can be used as a default iterator
    > Ox.identity(Infinity)
    Infinity
@*/
Ox.identity = function(value) {
    return value;
};

/*@
Ox.noop <f> Returns undefined and calls optional callback without arguments
    This can be used as a default iterator in an asynchronous loop, or to
    combine a synchronous and an asynchronous code path.
    > Ox.noop(1, 2, 3)
    undefined
    > Ox.noop(1, 2, 3, function() { Ox.test(arguments.length, 0); })
    undefined
@*/
Ox.noop = function() {
    var callback = Ox.last(arguments);
    Ox.isFunction(callback) && callback();
};

/*@
Ox.once <f> Runs a function once, and then never again
    (fn) -> <f> Function that will run only once
    fn <f> Function to run once
@*/
Ox.once = function(fn) {
    var once = false;
    return function() {
        if (!once) {
            once = true;
            fn.apply(null, arguments);
        }
    };
};

/*@
Ox.queue <f> Queue of asynchronous function calls with cached results
    The results are cached based on all arguments to `fn`, except the last one,
    which is the callback.
    (fn, maxThreads) -> <f> Queue function
        .cancel <f> Cancels all running function calls
        .clear <f> Clears the queue
        .reset <f> Cancels all running function calls and clears the queue
    fn <f> Queued function
    maxThreads <n|10> Number of parallel function calls
@*/
Ox.queue = function(fn, maxThreads) {
    maxThreads = maxThreads || 10;
    var processing = [],
        queued = [],
        ret = Ox.cache(function() {
            var args = Ox.slice(arguments);
            queued.push({args: args, key: getKey(args)});
            process();
        }, {async: true, key: getKey}),
        threads = 0;
    ret.cancel = function() {
        threads -= processing.length;
        processing = [];
        return ret;
    };
    ret.clear = function() {
        threads = 0;
        queued = [];
        return ret;
    };
    ret.reset = function() {
        return ret.cancel().clear();
    };
    function getKey(args) {
        return JSON.stringify(args.slice(0, -1));
    }
    function process() {
        var n = Math.min(queued.length, maxThreads - threads);
        if (n) {
            threads += n;
            processing = processing.concat(queued.splice(0, n));
            Ox.parallelForEach(
                processing,
                function(value, index, array, callback) {
                    var args = value.args, key = value.key;
                    fn.apply(this, args.slice(0, -1).concat(function(result) {
                        var index = Ox.indexOf(processing, function(value) {
                            return value.key == key;
                        });
                        if (index > -1) {
                            processing.splice(index, 1);
                            args.slice(-1)[0](result);
                            threads--;
                        }
                        callback();
                    }));
                },
                process
            );
        }
    }
    return ret;
};

/*@
Ox.throttle <f> Runs a function at most once per given interval
    (fn[, ms]) -> <f> Throttled function
    fn <f> Function to throttle
    ms <n|250> Interval in milliseconds
@*/
Ox.throttle = function(fn, ms) {
    var args,
        timeout;
    ms = arguments.length == 1 ? 250 : ms;
    return function() {
        args = arguments;
        if (!timeout) {
            fn.apply(null, args);
            args = null;
            timeout = setTimeout(function() {
                if (args !== null) {
                    fn.apply(null, args);
                }
                timeout = null;
            }, ms);
        }
    };
};

/*@
Ox.time <f> Returns the time it takes to execute a given function
    (fn) -> <n> Time in milliseconds
@*/
Ox.time = function(fn) {
    var time = new Date();
    fn();
    return new Date() - time;
};
