'use strict';

/*@
Ox.checkType <f> Throws a TypeError if a value is not of a given type
    (val, type) -> <u> undefined
    val <*> Any value
    type <s|[s]> Type, or array of types
@*/
Ox.checkType = function(value, type) {
    if (!Ox.contains(Ox.makeArray(type), Ox.typeOf(value))) {
        throw new TypeError();
    }
};

/*@
Ox.isArguments <f> Tests if a value is an arguments "array"
    (value) -> <b> True if the value is an arguments "array"
    value <*> Any value
    > Ox.isArguments((function() { return arguments; }()))
    true
@*/
Ox.isArguments = function(value) {
    return Ox.typeOf(value) == 'arguments';
};

/*@
Ox.isArray <f> Tests if a value is an array
    (value) -> <b> True if the value is a date
    value <*> Any value
    > Ox.isArray([])
    true
    > Ox.isArray((function() { return arguments; }()))
    false
    > Ox.isArray(document.getElementsByTagName('a'))
    false
    > Ox.isArray({0: 0, length: 1})
    false
@*/
Ox.isArray = function(value) {
    return Ox.typeOf(value) == 'array';
};

/*@
Ox.isBoolean <f> Tests if a value is boolean
    (value) -> <b> True if the value is boolean
    value <*> Any value
    > Ox.isBoolean(false)
    true
@*/
Ox.isBoolean = function(value) {
    return Ox.typeOf(value) == 'boolean';
};

/*@
Ox.isDate <f> Tests if a value is a date
    (value) -> <b> True if the value is a date
    value <*> Any value
    > Ox.isDate(new Date())
    true
@*/
Ox.isDate = function(value) {
    return Ox.typeOf(value) == 'date';
};

/*@
Ox.isElement <f> Tests if a value is a DOM element
    (value) -> <b> True if the value is a DOM element
    value <*> Any value
    > Ox.isElement(document.createElement('a'))
    true
@*/
Ox.isElement = function(value) {
    return Ox.endsWith(Ox.typeOf(value), 'element');
};

/*@
Ox.isEmpty <f> Tests if a value is an empty array, object or string
    (value) -> <b> True if the value is an empty array, object or string
    value <*> Any value
    > Ox.isEmpty([])
    true
    > Ox.isEmpty({})
    true
    > Ox.isEmpty('')
    true
	> Ox.isEmpty(document.getElementsByTagName(''))
	true
    > Ox.isEmpty(function() {})
    false
    > Ox.isEmpty(false)
    false
    > Ox.isEmpty(null)
    false
    > Ox.isEmpty(0)
    false
    > Ox.isEmpty()
    false
@*/
Ox.isEmpty = function(value) {
    return Ox.len(value) === 0;
};

/*@
Ox.isEqual <function> Tests if two values are equal
    <script>
        Ox.test.element = document.createElement('a');
        Ox.test.fn = function() {};
    </script>
    > Ox.isEqual((function() { return arguments; }()), (function() { return arguments; }()))
    true
    > Ox.isEqual([1, 2, 3], [1, 2, 3])
    true
    > Ox.isEqual([1, 2, 3], [3, 2, 1])
    false
    > Ox.isEqual(false, false)
    true
    > Ox.isEqual(new Date(0), new Date(0))
    true
    > Ox.isEqual(new Date(0), new Date(1))
    false
    > Ox.isEqual(Ox.test.element, Ox.test.element)
    true
    > Ox.isEqual(document.createElement('a'), document.createElement('a'))
    false
    > Ox.isEqual(Ox.test.fn, Ox.test.fn)
    true
    > Ox.isEqual(function() {}, function() {})
    false
    > Ox.isEqual(Infinity, Infinity)
    true
    > Ox.isEqual(Infinity, -Infinity)
    false
    > Ox.isEqual(NaN, NaN)
    true
    > Ox.isEqual(document.getElementsByTagName('a'), document.getElementsByTagName('a'))
    true
    > Ox.isEqual(null, null)
    true
    > Ox.isEqual(null, void 0)
    false
    > Ox.isEqual(0, 0)
    true
    > Ox.isEqual(-0, +0)
    false
    > Ox.isEqual({}, {})
    true
    > Ox.isEqual({a: 1, b: 2, c: 3}, {c: 3, b: 2, a: 1})
    true
    > Ox.isEqual({a: 1, b: [2, 3], c: {d: '4'}}, {a: 1, b: [2, 3], c: {d: '4'}})
    true
    > Ox.isEqual(/ /, / /)
    true
    > Ox.isEqual(/ /g, / /i)
    false
    > Ox.isEqual('', '')
    true
    > Ox.isEqual(void 0, void 0)
    true
@*/
Ox.isEqual = function(a, b) {
    var ret = false, type = Ox.typeOf(a);
    if (a === b) {
        // 0 === -0, but not equal
        ret = a !== 0 || 1 / a === 1 / b;
    } else if (type == Ox.typeOf(b)) {
        // NaN !== NaN, but equal
        if (a == b || a !== a) {
            ret = true;
        } else if (type == 'date') {
            ret = +a == +b;
        } else if (type == 'element') {
            ret = a.isEqualNode(b);
        } else if (type == 'regexp') {
            ret = a.toString() == b.toString();
        } else if (
            (type == 'arguments' || type == 'array' || type == 'object')
            && Ox.len(a) == Ox.len(b)
        ) {
            ret = true;
            Ox.forEach(a, function(value, key) {
                ret = Ox.isEqual(value, b[key]);
                return ret; // break if not equal
            });
        }
    }
    return ret;
};

/*@
Ox.isError <f> Tests if a value is an error
    (value) -> <b> True if the value is an error
    value <*> Any value
    > Ox.isError(new Error())
    true
@*/
Ox.isError = function(value) {
    return Ox.typeOf(value) == 'error';
};

/*@
Ox.isFunction <f> Tests if a value is a function
    (value) -> <b> True if the value is a function
    value <*> Any value
    > Ox.isFunction(function() {})
    true
    > Ox.isFunction(new RegExp())
    false
@*/
Ox.isFunction = function(value) {
    return Ox.typeOf(value) == 'function';
};

/*@
Ox.isInfinity <f> Tests if a value is positive or negative Infinity
    (value) -> <b> True if the value is positive or negative Infinity
    value <*> Any value
    > Ox.isInfinity(Infinity)
    true
    > Ox.isInfinity(-Infinity)
    true
    > Ox.isInfinity(NaN)
    false
@*/
Ox.isInfinity = function(value) {
    return Ox.typeOf(value) == 'number' && !isFinite(value) && !Ox.isNaN(value);
};

/*@
Ox.isInt <f> Tests if a value is an integer
    (value) -> <b> True if the value is an integer
    value <*> Any value
    > Ox.isInt(0)
    true
    > Ox.isInt(0.5)
    false
    > Ox.isInt(Infinity)
    false
@*/
Ox.isInt = function(value) {
    return isFinite(value) && value === Math.floor(value);
};

/*@
Ox.isInvalidDate <f> Tests if a value is an invalid date
    (value) -> <b> True if the value is an invalid date
    value <*> Any value
    > Ox.isInvalidDate(new Date('foo'))
    true
@*/
Ox.isInvalidDate = function(value) {
    return Ox.isDate(value) && Ox.isNaN(value.getTime());
};

/*@
Ox.isNaN <f> Tests if a value is `NaN`
    (value) -> <b> True if the value is `NaN`
    value <*> Any value
    > Ox.isNaN(NaN)
    true
@*/
Ox.isNaN = function(value) {
    return value !== value;
};

/*@
Ox.isNodeList <f> Tests if a value is a nodelist
    (value) -> <b> True is the value is a nodelist
    > Ox.isNodeList(document.getElementsByTagName('a'))
    true
@*/
Ox.isNodeList = function(value) {
   return Ox.typeOf(value) == 'nodelist'; 
};

/*@
Ox.isNull <f> Tests if a value is `null`
    (value) -> <b> True if the value is `null`
    value <*> Any value
    > Ox.isNull(null)
    true
@*/
Ox.isNull = function(value) {
    return Ox.typeOf(value) == 'null';
};

/*@
Ox.isNumber <f> Tests if a value is a number
    (value) -> <b> True if the value is a number
    value <*> Any value
    > Ox.isNumber(0)
    true
    > Ox.isNumber(Infinity)
    true
    > Ox.isNumber(-Infinity)
    true
    > Ox.isNumber(NaN)
    true
@*/
Ox.isNumber = function(value) {
    return Ox.typeOf(value) == 'number';
};

/*@
Ox.isObject <f> Tests if a value is a an object
    (value) -> <b> True if the value is an object
    value <*> Any value
    > Ox.isObject({})
    true
    > Ox.isObject([])
    false
    > Ox.isObject(new Date())
    false
    > Ox.isObject(null)
    false
    > Ox.isObject(/ /)
    false
@*/
Ox.isObject = function(value) {
    return Ox.typeOf(value) == 'object';
};

/*@
Ox.isPrimitive <f> Tests if a value is a primitive
    (value) -> <b> True if the value is a primitive
    value <*> Any value
    > Ox.isPrimitive(false)
    true
    > Ox.isPrimitive(null)
    true
    > Ox.isPrimitive(0)
    true
    > Ox.isPrimitive('')
    true
    > Ox.isPrimitive()
    true
    > Ox.isPrimitive([])
    false
    > Ox.isPrimitive({})
    false
@*/
Ox.isPrimitive = function(value) {
    return Ox.contains(
        ['boolean', 'null', 'number', 'string', 'undefined'], Ox.typeOf(value)
    );
};

/*@
Ox.isRegExp <f> Tests if a value is a regular expression
    (value) -> <b> True if the value is a regular expression
    value <*> Any value
    > Ox.isRegExp(new RegExp())
    true
@*/
Ox.isRegExp = function(value) {
    return Ox.typeOf(value) == 'regexp';
};

/*@
Ox.isString <f> Tests if a value is a string
    (value) -> <b> True if the value is a string
    value <*> Any value
    > Ox.isString('')
    true
@*/
Ox.isString = function(value) {
    return Ox.typeOf(value) == 'string';
};

/*@
Ox.isUndefined <f> Tests if a value is undefined
    (value) -> <b> True if the value is undefined
    value <*> Any value
    > Ox.isUndefined()
    true
@*/
Ox.isUndefined = function(value) {
    return Ox.typeOf(value) == 'undefined';
};

/*@
Ox.isValidDate <f> Tests if a value is a valid date
    (value) -> <b> True if the value is a valid date
    value <*> Any value
    > Ox.isValidDate(new Date())
    true
@*/
Ox.isValidDate = function(value) {
    return Ox.isDate(value) && !Ox.isNaN(value.getTime());
};

/*@
Ox.typeOf <f> Returns the type of a value
    (value) -> <s> Type
    value <*> Any value
    > Ox.typeOf((function() { return arguments; }()))
    'arguments'
    > Ox.typeOf([])
    'array'
    > Ox.typeOf(false)
    'boolean'
    > Ox.typeOf(new Date())
    'date'
    > Ox.typeOf(new Error())
    'error'
    > Ox.typeOf(function() {})
    'function'
    > Ox.typeOf(window)
    'global'
    > Ox.typeOf(document.createElement('a'))
    "htmlanchorelement"
    > Ox.typeOf(document.getElementsByTagName('a'))
    'nodelist'
    > Ox.typeOf(null)
    'null'
    > Ox.typeOf(0)
    'number'
    > Ox.typeOf(Infinity)
    'number'
    > Ox.typeOf(NaN)
    'number'
    > Ox.typeOf({})
    'object'
    > Ox.typeOf(new RegExp())
    'regexp'
    > Ox.typeOf(localStorage)
    'storage'
    > Ox.typeOf('')
    'string'
    > Ox.typeOf()
    'undefined'
    > Ox.typeOf(Math)
    'math'
    > Ox.typeOf(JSON)
    'json'
@*/
Ox.typeOf = function(value) {
    return Object.prototype.toString.call(value).slice(8, -1).toLowerCase();
};
// Firefox 3.6 returns 'Object' for arguments,
// Internet Explorer 8 returns 'Object' for nodelists,
// Internet Explorer 9 returns 'HTMLCollection' for nodelists,
// Mobile Safari returns 'DOMWindow' for null and undefined
// Firefox 30+ returns 'window' for window
if (
    Ox.typeOf((function() { return arguments; }())) != 'arguments'
    || Ox.typeOf(document.getElementsByTagName('a')) != 'nodelist'
    || Ox.typeOf(null) != 'null'
    || Ox.typeOf(window) != 'global'
    || Ox.typeOf() != 'undefined'
) {
    Ox.typeOf = function(value) {
        var type = Object.prototype.toString.call(
                value
            ).slice(8, -1).toLowerCase();
        if (value === null) {
            type = 'null';
        } else if (value === void 0) {
            type = 'undefined';
        } else if (value === window) {
            type = 'global';
        } else if (type == 'object' && typeof value.callee == 'function') {
            type = 'arguments';
        } else if (
            type == 'htmlcollection' || (
                type == 'object'
                && typeof value.item != 'undefined'
                && typeof value.length == 'number'
            )
        ) {
            type = 'nodelist';
        }
        return type;
    };
}
