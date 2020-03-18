'use strict';

/*@
Ox.acosh <f> Inverse hyperbolic cosine
    Missing from `Math`.
    > Ox.acosh(1)
    0
@*/
Ox.acosh = function(x) {
    return Math.log(x + Math.sqrt(x * x - 1));
};

/*@
Ox.asinh <f> Inverse hyperbolic sine
    Missing from `Math`.
    > Ox.asinh(0)
    0
@*/
Ox.asinh = function(x) {
    return Math.log(x + Math.sqrt(x * x + 1));
};

/*@
Ox.atanh <f> Inverse hyperbolic tangent
    Missing from `Math`.
    > Ox.atanh(0)
    0
@*/
Ox.atanh = function(x) {
    return 0.5 * Math.log((1 + x) / (1 - x));
};

/*@
Ox.cosh <f> Hyperbolic cosine
    Missing from `Math`
    > Ox.cosh(0)
    1
@*/
Ox.cosh = function(x) {
    return (Math.exp(x) + Math.exp(-x)) / 2;
};

/*@
Ox.deg <f> Takes radians, returns degrees
    Missing from `Math`.
    > Ox.deg(2 * Math.PI)
    360
@*/
Ox.deg = function(rad) {
    return rad * 180 / Math.PI;
};

/*@
Ox.hypot <f> Returns the square root of the sum of the squares of its arguments
    (x, y[, z]) -> <n> Square root of the sum of the squares of its arguments
    > Ox.hypot(3, 4)
    5
    > Ox.hypot(1, 1, 1)
    Math.sqrt(3)
@*/
Ox.hypot = function() {
    return Math.sqrt(Ox.slice(arguments).reduce(function(sum, number) {
        return sum + number * number;
    }, 0));
};

/*@
Ox.limit <f> Limits a number by a given mininum and maximum
    `Ox.limit(num, min, max)` is a shorthand for `Math.min(Math.max(num, min),
    max)`
    (num) -> <n> `num`
    (num, max) -> <n> `Math.max(num, max)`
    (num, min, max) -> <n> `Math.min(Math.max(num, min), max)`
    num <n> number
    min <n> minimum
    max <n> maximum
    > Ox.limit(1, 2, 3)
    2
    > Ox.limit(4, 2, 3)
    3
    > Ox.limit(2, 1)
    1
    > Ox.limit(-1, -2)
    -2
@*/
Ox.limit = function(/*number[[, min], max]*/) {
    var number = arguments[0],
        min = arguments.length == 3 ? arguments[1] : -Infinity,
        max = arguments[arguments.length - 1];
    return Math.min(Math.max(number, min), max);
};

/*@
Ox.log <f> Returns the logarithm of a given number to a given base
    Missing from `Math`.
    > Ox.log(100, 10)
    2
    > Ox.log(Math.E)
    1
@*/
Ox.log = function(number, base) {
    return Math.log(number) / Math.log(base || Math.E);
};

/*@
Ox.mod <f> Modulo function
    Unlike `-1 % 10`, which returns `-1`, `Ox.mod(-1, 10)` returns `9`.
    > Ox.mod(11, 10)
    1
    > Ox.mod(-11, 10)
    9
@*/
Ox.mod = function(number, by) {
    return (number % by + by) % by;
};

/*@
Ox.rad <f> Takes degrees, returns radians
    Missing from `Math`.
    > Ox.rad(360)
    2 * Math.PI
@*/
Ox.rad = function(deg) {
    return deg * Math.PI / 180;
};

/*@
Ox.random <f> Returns a random integer within a given range
    () -> <n> 0 or 1
    (max) -> <n> Integer between 0 (inclusive) and max (exclusive)
    (min, max) -> <n> Integer between min (inclusive) and max (exclusive)
    > [0, 1].indexOf(Ox.random()) > -1
    true
    > [0, 1, 2].indexOf(Ox.random(3)) > -1
    true
    > Ox.random(1, 2) == 1
    true
@*/
Ox.random = function() {
    var min = arguments.length == 2 ? arguments[0] : 0,
        max = arguments.length ? Ox.last(arguments) : 2;
    return min + Math.floor(Math.random() * (max - min));
};

/*@
Ox.round <f> Rounds a number with a given number of decimals
    > Ox.round(2 / 3, 6)
    0.666667
    > Ox.round(1 / 2, 3)
    0.5
    > Ox.round(1 / 2)
    1
@*/
Ox.round = function(number, decimals) {
    var pow = Math.pow(10, decimals || 0);
    return Math.round(number * pow) / pow;
};

/*@
Ox.sign <f> Returns the sign of a number (-1, 0 or 1)
    > Ox.sign(-Infinity)
    -1
    > Ox.sign(-0)
    -0
    > Ox.sign(NaN)
    NaN
    > Ox.sign(0)
    0
    > Ox.sign(Infinity)
    1
@*/
Ox.sign = function(x) {
    x = +x;
    return x !== x || x === 0 ? x : x < 0 ? -1 : 1;
};

/*@
Ox.sinh <f> Hyperbolic sine
    Missing from `Math`.
    > Ox.sinh(0)
    0
@*/
Ox.sinh = function(x) {
    return (Math.exp(x) - Math.exp(-x)) / 2;
};

/*@
Ox.splitInt <f> Splits an integer into an array of integers
    `Ox.splitInt(num, by)` returns a sorted array of integers that has a sum of
    `num`, a length of `by`, a minimum of `Math.floor(num / by)` and a maximum
    of `Math.ceil(num / by)`.
    > Ox.splitInt(100, 3)
    [33, 33, 34]
    > Ox.splitInt(100, 6)
    [16, 16, 17, 17, 17, 17]
@*/
Ox.splitInt = function(number, by) {
    var div = Math.floor(number / by),
        mod = number % by;
    return Ox.range(by).map(function(i) {
        return div + (i > by - 1 - mod);
    });
};

/*@
Ox.tanh <f> Hyperbolic tangent
    Missing from `Math`.
    > Ox.tanh(0)
    0
@*/
Ox.tanh = function(x) {
    return (Math.exp(x) - Math.exp(-x)) / (Math.exp(x) + Math.exp(-x));
};

/*@
Ox.trunc <f> Truncates a number
    > Ox.trunc(-1.5)
    -1
@*/
Ox.trunc = function(x) {
    return ~~x;
};
