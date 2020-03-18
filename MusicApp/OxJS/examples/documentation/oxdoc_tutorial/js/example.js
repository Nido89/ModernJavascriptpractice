/*
<br>
**OxDoc Tutorial**
*/

/*
An `OxDoc` comment is an inline or  multi-line comment that starts with `@`:
```
//@ ...
/*@
...
*&#047;
```
The syntax is simple: almost every line has the form `name <type> summary`. If
it doesn't, its meaning depends on its context. 
*/
'use strict';

this.My = {};

/*
**Sections**
*/
/*
If the first line of the comment doesn't match `name <type> summary`, it is a
section definition. Here, it marks a section named 'Primitives'.
*/
//@ Primitives

/*
**Name, Type, Summary**
*/
/*
This inline comment documents an item by providing its name, type and one-line
summary.
*/
//@ My.REQUEST_TIMEOUT <number> Request timeout, in milliseconds
My.REQUEST_TIMEOUT = 60000;

/*
**Descriptions**
*/
/*
In a multiline comment, lines that follow the inital definition are indented, as
they refer to the item defined in the line above. Lines that don't match `name
<type> summary` are parsed as a description. Like the summary, the description
can contain some `markdown` (see Ox.parseMarkdown).
*/
/*@
My.MAGIC_CONSTANT <number> Magic constant, needed for HTTP requests
    Please note that the value of `My.MAGIC_CONSTANT` (either `23` or `42`) is
    browser-dependent.
*/
My.MAGIC_CONSTANT = navigator.userAgent.length % 2 ? 23 : 42;

/*
This defines a new section named 'Objects'.
*/
//@ Objects

/*
**Comments, Properties, Events, Tests**
*/
/*
A line that starts with `#` is a comment, and will be ignored by the parser.

The following lines document properties of the `My.favorites` object. This
example shows all possible values for `type`. These values can be shortened —
it's sufficient to specify their first character.

If an object fires events, they can be documented as well.

A line that starts with `>` is an inline test statement, followed by the
expected result. (Yes, it's that simple!) A benefit of inline tests is the fact
that they're not just machine-, but also human-readable. As an illustration of a
function's behavior, they are often more compact and comprehensible than a long
description.
*/
/*@
My.favorite <object> Collection of favorites
    # Properties ---------------------------------------------------------------
    array       <a> My favorite array
    boolean     <b> My favorite boolean value
    date        <d> My favorite date
    error       <e> My favorite error
    function    <f> My favorite function
    arguments   <g> My favorite arguments
    htmlelement <h> My favorite HTML element
    nodelist    <l> My favorite nodelist
    number      <n> My favorite number
    object      <o> My favorite object
    regexp      <r> My favorite regular expression
    string      <s> My favorite string
    undefined   <u> Undefined is an all-time favorite
    window      <w> So is the DOM window
    other       <+> And the document
    any         <*> Favorite of the day
    # Events -------------------------------------------------------------------
    event       <!> Fires when My.favorite['function'] is called
    # Tests --------------------------------------------------------------------
    > My.favorite.array.length + My.favorite.string.length
    0
    > My.favorite['function'].length + My.favorite.arguments.length
    0
    > My.favorite.number + Object.keys(My.favorite.object).length
    0
    > My.favorite.regexp.toString()
    '/(?:)/'
*/
My.favorite = (function() {
    var favorite = {
            array: [],
            boolean: false,
            date: new Date(),
            error: new Error(),
            'function': function() {
                My.Event.trigger(favorite, 'event');
            },
            arguments: (function() { return arguments; }()),
            htmlelement: document.createElement('a'),
            nodelist: document.getElementsByTagName('a'),
            number: 0,
            object: {},
            regexp: new RegExp(),
            string: '',
            'undefined': void 0,
            'window': window,
            other: document
        },
        keys = Object.keys(favorite);
    favorite.any = favorite[
        keys[Math.floor(+new Date / 86400) % keys.length]
    ];
    return favorite;
}());

/*
**Nesting, Arrays**
*/
/*
Documentation can be nested. In other words, one can document the properties of
a property (of a property...).

If all elements of an array are of a known type (in this case `string`), one can
mark the type as `<[s]>` instead of just `<a>`.
*/
/*@
My.HTMLUtils <o> HTML Utilities
    namedEntities <[s]> Named HTML entities
    replace <o> Entity decoding utilities
        namedEntities <a> Can be passed to `String.prototype.replace`
            0 <r> Matches named entities
            1 <f> Decodes named entities
        numericEntities <a> Can be passed to `String.prototype.replace`
            0 <r> Matches numeric entities
            1 <f> Decodes numeric entities
    > ''.replace.apply('&amp;', My.HTMLUtils.replace.namedEntities)
    '&'
    > ''.replace.apply('&#x2620;', My.HTMLUtils.replace.numericEntities)
    '☠'
*/
My.HTMLUtils = (function() {
    var chars = '"&\'<>',
        entities = ['&quot;', '&amp;', '&apos;', '&lt;', '&gt;'];
    return {
        namedEntities: entities,
        replace: {
            namedEntities: [
                new RegExp('(' + entities.join('|') + ')', 'g'),
                function(match) {
                    return chars[entities.indexOf(match)];
                }
            ],
            numericEntities: [
                /&#([0-9A-FX]+);/gi,
                function(match, code) {
                    return String.fromCharCode(
                        /^X/i.test(code)
                            ? parseInt(code.slice(1), 16)
                            : parseInt(code, 10)
                    );
                }
            ]
        }
    };
}());

/*
The beginning of another section, named 'Functions'.
*/
//@ Functions

/*
**Functions, Arguments, Return Values, Multiple Types, Default Values**
*/
/*
In the case of a function, the indented lines don't document properties, but the
function's signature, return value and arguments. Signature and return value are
just a special case of `name <type> summary`, where `name` has the form
`(arguments) ->`.

If an item can be of more than one type (in this case `string` or `function`),
this is documented as `<s|f>`. If it has a default value (in this case the
string `'GET'`), this is documented as `<s|'GET'>`. For a function-type argument
(usually a callback function), there is no return value to document, only the
arguments it gets passed.
*/
/*@
My.readURL <f> Asynchronously reads a remote resource
    (url[, method], callback) -> <u> undefined
        Please note that the return value of `My.readURL` may change in the
        future.
    url <s|f> Remote URL, or function that returns one
    method <s|'GET'> Request method ('GET', 'POST', 'PUT' or 'DELETE')
    callback <f> Callback function
        result <s|null> Response text, or `null` in case of an error
        error <o|null> Error object, or `null` in case of success
            code <n> Error code
            text <s> Error text
*/
My.readURL = function(url, method, callback) {
    var request = new XMLHttpRequest();
    if (Ox.isFunction(url)) {
        url = url();
    }
    if (arguments.length == 2) {
        callback = method;
        method = 'GET';
    }
    request.open(method, url, true);
    request.onreadystatechange = function() {
        if (request.readyState == 4) {
            if (request.status == 200) {
                callback(request.responseText, null);
            } else {
                callback(null, {
                    code: request.status,
                    text: request.statusText
                });
            }
        }
    };
    request.send();
};

/*
**Multiple Signatures, Asynchronous Tests**
*/
/*
If a function's return value depends on the absence or presence of optional
arguments, there can be multiple `(arguments) -> <type> summary` lines.

To test asynchronous functions, just call `Ox.test(actual, expected)` in the
callback.
*/
/*@
My.isOdd <f> Synchronously or asynchronously computes if a given number is odd
    (number) -> <b> True if the number is odd
    (number, callback) -> <u> undefined
    number <n> Any number
    callback <f> Callback function
        isOdd <b> True if the number is odd
        ms <n> Time it took to compute the result, in milliseconds
    > My.isOdd(0)
    false
    > My.isOdd(1, function(isOdd, ms) { Ox.test(isOdd, true); })
    undefined
*/
My.isOdd = function(number, callback) {
    var time = +new Date, isOdd = !!(number % 2);
    if (callback) {
        callback(isOdd, +new Date - time);
    } else {
        return isOdd;
    }
};

/*
Another case for multiple `(arguments) -> <type> summary` lines are functions
whose signature cannot be represented in `(required[, optional])` notation. For
a range function — `(stop)` or `(start, stop)` or `(start, stop, step)` — the
notation `([start, ]stop[, step])` would be ambigious, since you cannot call it
with `(stop, step)`.
*/
/*@
My.range <f> Returns a python-style range
    (b)       -> <[n]> Integers from 0 (inclusive) to b (exclusive)
    (a, b)    -> <[n]> Integers from a (inclusice) to b (exclusive)
    (a, b, c) -> <[n]> Numbers from a (inclusive) to b (exclusive), growing by c
    > My.range(2)
    [0, 1]
    > My.range(1, 3)
    [1, 2]
    > My.range(2, 6, 2)
    [2, 4]
*/
My.range = function() {
    var a = [];
    Ox.loop.apply(null, Ox.slice(arguments).concat(function(i) {
        a.push(i);
    }));
    return a;
};

/*
**Function Properties**
*/
/*
As functions are objects in JavaScript, they may have their own properties or
methods that need documentation. These get prefixed with `.`, in order to
differentiate them from arguments.
*/
/*@
My.localStorage <f> Returns a localStorage handler for a given namespace
    (ns) -> storage <f> localStorage handler
        () -> <o> Returns all key:value pairs
        (key) -> <*> Returns one value
        (key, value) -> <f> Sets one value, returns the handler
        ({key: value, ...}) -> <f> Sets one or more values, returns the handler
        key <s> Any string
        value <*> Any value that can be JSON-serialized
        .delete <f> Delete method
            () -> <f> Deletes all key:value pairs, returns the handler
            (key[, ...]) -> <f> Deletes one or more pairs, returns the handler
            key <s> Any string
    ns <s> Namespace
    > Ox.typeOf((My.test = {storage: My.localStorage('My')}).storage)
    'function'
    > My.test.storage({foo: 'bar'})('baz')
    undefined
    > My.test.storage('bar', 'baz')('bar')
    'baz'
    > My.test.storage.delete('bar')('foo')
    'bar'
    > My.test.storage.delete()()
    {}
*/
My.localStorage = function(ns) {
    function storage(key, value) {
        var ret;
        if (arguments.length == 0) {
            ret = {};
            Ox.forEach(localStorage, function(value, key) {
                if (Ox.startsWith(key, ns + '.')) {
                    ret[key.slice(ns.length + 1)] = JSON.parse(value);
                }
            });
        } else if (arguments.length == 1 && !Ox.isObject(key)) {
            value = localStorage[ns + '.' + key];
            ret = Ox.isUndefined(value) ? void 0 : JSON.parse(value);
        } else {
            Ox.forEach(Ox.makeObject(arguments), function(value, key) {
                localStorage[ns + '.' + key] = JSON.stringify(value);
            });
            ret = storage;
        }
        return ret;
    }
    storage.delete = function() {
        var keys = arguments.length == 0 ? Object.keys(storage())
            : Ox.slice(arguments)
        keys.forEach(function(key) {
            delete localStorage[ns + '.' + key];
        });
        return storage;
    };
    return storage;
};

/*
And another section, named 'UI Elements'.
*/
//@ UI Elements

/*
**Constructors, Event Properties, Separate Documentation of Properties**
*/
/*
When documenting a constructor function, the returned object may come with a lot
more documentation than the function itself. In this case, one may want to
document the contructor's arguments first, then the signature and return value,
follwed by the documentation of the returned object

If an event has properties (i.e. passes an object to its handler), these
properties can be documented as well, just like regular object properties.
*/
/*@
My.Box <f> A very simple colored box
    options <o> Options
        color <[n]> RGB value
    self <o> Shared private object
    ([options[, self]]) -> <o> Box object
        change <!> Fires when the color of the box changes
            color <[n]> RGB value
    > My.Box({color: [0, 255, 0]}).getHSL()
    [120, 1, 0.5]
    > My.Box().setHSL(240, 1, 0.5).options('color')
    [0, 0, 255]
    > My.Box().toGrayscale().options('color')
    [85, 85, 85]
*/
My.Box = function(options, self) {
    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({color: [255, 0, 0]})
        .options(options || {})
        .update(setColor)
        .css({width: '256px', height: '256px'});
    setColor();
    function setColor() {
        that.css({background: 'rgb(' + self.options.color.join(', ') + ')'});
        if (arguments.length) {
            that.triggerEvent('change', {color: self.options.color});
        }
    }
    /*
    Sometimes, it can be more convenient to document properties at the place
    where they are defined. A name prefixed with a `.` signals that what follows
    is not a standalone item, but a property of the previous one (or, in case
    the previous item is a function that returns an object, a property of the
    retuned object).
    */
    /*@
    .getHSL <f> Returns the color of the box as HSL value
        () -> <[n]> HSL value
    */
    that.getHSL = function() {
        return Ox.hsl(self.options.color);
    };
    /*@
    .setHSL <f> Sets the color of the box to a given HSL value
        (hsl) -> <o> The Box object
        hsl <[n]> HSL value
    */
    that.setHSL = function(hsl) {
        return that.options({color: Ox.rgb(hsl)});
    };
    /*@
    .toGrayscale <f> Changes the color of the box to grayscale.
        () -> <o> The Box object
    */
    that.toGrayscale = function() {
        return that.options({
            color: Ox.repeat([Math.round(Ox.avg(self.options.color))], 3)
        });
    };
    return that;
};

/*
**Inheritance**
*/
/*
If an object extends or inherits from another one, one can specify its "class"
(the name of the constuctor of the object it inherits from). Here,
`My.ExtendedBox` extends `My.Box`. All events and properties of the latter,
unless redefined, will be present on the former.
*/
/*@
My.ExtendedBox <f> An extended box with random color
    options <o> Options
        height <n> Height in px
        width <n> Width in px
    self <o> Shared private object
    ([options[, self]]) -> <o:My.Box> Extended Box object
    > My.ExtendedBox().options({color: [0, 255, 0]}).getHSL()
    [120, 1, 0.5]
    > My.ExtendedBox().setHSL(240, 1, 0.5).options('color')
    [0, 0, 255]
    > [My.ExtendedBox().options('width'), My.ExtendedBox().options('height')]
    [256, 256]
*/
My.ExtendedBox = function(options, self) {
    self = self || {};
    var that = My.Box({}, self)
        .defaults({
            height: 256,
            width: 256
        })
        .options(options || {})
        .update(function(key, value) {
            if (key == 'width' || key == 'height') {
                setSize();
            }
        });
    randomize();
    setSize();
    function randomize() {
        that.options({
            color: Ox.range(3).map(function() {
                return Ox.random(256);
            })
        });
    }
    function setSize() {
        that.css({
            width: self.options.width + 'px',
            height: self.options.height + 'px'
        })
    }
    /*@
    .randomize <f> Randomizes the colors of the box
        () -> <o> The Extended Box object
    */
    that.randomize = randomize;
    return that;
};

/*
The next item will get added to the 'Objects' section.
*/
//@ Objects

/*
**Extended Tests**
*/
/*
Whenever an item requires some setup before it can be tested with just a series
of one-liners, a `<script>` tag can be added before the tests. Since the script
will be evaluated in the global context, it's a good idea not to create or leave
any clutter.
*/
/*@
My.Event <o> Provides basic event handling
    bind <f> Adds an event handler
        (object[, event], callback) -> <o> My.Event
        object <o> Any object that triggers events
        event <s> Event name (if missing, add handler for all events)
        callback <f> Event handler
            data <o|null> Event data (if any)
    trigger <f> Triggers an event
        (object, event[, data]) -> <o> My.Event
        object <o> The object that triggers the event
        event <s> Event name
        data <o> Event data (optional)
    unbind <f> Removes one or more event handlers
        (object[, event[, callback]]) -> <o> My.Event
        object <o> The object that triggers the event
        event <s> Event name (if missing, remove handlers for all events)
        callback <f> Event handler (if missing, remove all handlers)
    <script>
        My.test = {
            array: [],
            handler: function(data) {
                My.test.array.push(data.id);
            },
            object: (function() {
                var id = 0,
                    that = {
                        ping: function() {
                            My.Event.trigger(that, 'ping', {id: id});
                            return id++;
                        }
                    };
                return that;
            }())
        };
        setTimeout(function() {
            delete My.test;
        }, 1000);
    </script>
    > My.test.object.ping() == 0
    true
    > Ox.methods(My.Event.bind(My.test.object, 'ping', My.test.handler))
    ['bind', 'trigger', 'unbind']
    > My.test.object.ping() == 1
    true
    > Ox.methods(My.Event.unbind(My.test.object, 'ping', My.test.handler))
    ['bind', 'trigger', 'unbind']
    > My.test.object.ping() == 2
    true
    > My.test.array
    [1]
    */
My.Event = (function() {
    var handlers = [], that = {};
    that.bind = function(object, event, callback) {
        if (arguments.length == 2) {
            callback = event;
            event = null;
        }
        handlers.push({object: object, event: event, callback: callback});
        return that;
    };
    that.trigger = function(object, event, data) {
        handlers.forEach(function(handler) {
            if (handler.object === object && handler.event === event) {
                handler.callback(data || null);
            }
        });
        return that;
    };
    that.unbind = function(object, event, callback) {
        handlers.forEach(function(handler, i) {
            if (
                handler.object === object
                && (!event || !handler.event || handler.event === event)
                && (!callback || handler.callback === callback)
            ) {
                handlers.splice(i, 1);
            }
        });
        return that;
    };
    return that;
}());
//@

/*
**Demo: Source, Parser, Browser**
*/
/*
And finally, this is how everything gets parsed and displayed, in less than 30
lines of code. Note that it would be more efficient to parse the source once
```
var doc = Ox.doc(source);
```
and use
```
Ox.SyntaxHighlighter({
    showLineNumbers: true,
    source: source
})
```
and
```
Ox.TreeList({data: doc})
```
and
```
Ox.DocPanel({
    expanded: true,
    items: doc,
    getModule: function() {
        return 'My';
    },
    path: path,
    showTests: true,
    stripComments: true
});
```
— but the thing we want to demonstrate here is that we can just pass files to
Ox.SyntaxHighlighter and Ox.DocPanel, and they'll do the rest.
<br>&nbsp;
*/
Ox.load('UI', function() {
    var file = 'example.js',
        path = Ox.PATH + '../examples/documentation/oxdoc_tutorial/js/';
    Ox.get(path + file, function(source) {
        Ox.TabPanel({
            content: function(id) {
                return id == 'source' ? Ox.SyntaxHighlighter({
                        file: path + file,
                        showLineNumbers: true,
                    }).css({overflowY: 'scroll'})
                    : id == 'items' ? Ox.TreeList({data: Ox.doc(source)})
                    : Ox.DocPanel({
                        expanded: true,
                        files: [file],
                        getModule: function() { return 'My'; },
                        path: path,
                        showTests: true,
                        stripComments: true
                    });
            },
            tabs: [
                {id: 'source', title: 'Source Code'},
                {id: 'items', title: 'Parsed Documentation'},
                {id: 'panel', title: 'Documentation Browser'}
            ]
        }).appendTo(Ox.$body);
    });
});
