/*
<br>
**Parasitic Inheritance**
*/
/*
The following examples illustrate the common design pattern for `OxJS` UI
widgets: an inheritance model that is neither classical nor prototypal, but
"parasitic" (a term coined by <a
href="http://www.crockford.com/javascript/inheritance.html">Douglas
Crockford</a>).

In a nutshell, "instances" are created by augmenting other
instances, but in addition to private members (`var foo`) and public members
(`that.bar`), they can have shared private members (`self.baz`). `self` cannot
be accessed from outside, but since `self` itself is an argument of the
"constructor", an instance can inherit its parent's `self` by passing its own
`self`.
*/
'use strict';


/*
Create our own namespace. Not required, but if we wanted to create a module
named `My`, this is how we would do it.
*/
Ox.My = {};

/*
**Box**
*/
/*
First, lets build the most basic Box widget. A widget is a "constructor"
function that takes two (optional) arguments, `options` and `self`, and returns
a widget object. It's not a constructor in JavaScript terms though: It doesn't
have to be called with `new`, and doesn't return an `instanceof` anything. It
just enhances another widget object and returns it.
*/
Ox.My.Box = function(options, self) {

    /*
    This is how every widget "constructor" begins. `self` is the widget's shared
    private object.
    */
    self = self || {};
    /*
    `that` is the widget itself, its public object, or, in JavaScript terms, its
    `this`. Every widget "inherits" from another widget by simple assignment.
    All public properties of the "super" widget, i.e. all properties of its
    `that`, will be present on our own `that`. In this case, we use Ox.Element,
    the "root" widget at the end of the inheritance chain, and pass an empty
    options object. But we always pass our own `self`, which means that any
    property that Ox.Element (or any other widget in the inheritance chain) adds
    to `self` will be present on our own `self`.
    */
    var that = Ox.Element({}, self)
        /*
        Then we call the public `defaults`, `options` and `update` methods of
        Ox.Element. `defaults` assigns the defaults object to `self.defaults`
        and copies it to `self.options`, `options` extends `self.options` with
        the options object, and `update` adds one or more callbacks that are
        invoked whenever, by way of calling the `options` method, a property of
        `self.options` is modified or added.
        */
        .defaults({
            color: [128, 128, 128],
            size: [128, 128]
        })
        .options(options || {})
        .update({
            color: setColor,
            size: setSize
        })
        /*
        `addClass` is a jQuery method. In fact, Ox.Element (and any widget
        derived from it) provides, on its prototype, all methods of a jQuery
        `$('<div>')`. Chaining works too: If you have `var $d = $('<div>'), $e =
        Ox.Element();`, then `$d.appendTo($e)` returns `$d`, and `$e.append($d)`
        returns `$e`. If you type `Ox.Element()` in the console, you will get
        something like `[<div class="OxElement"></div>]`. Any widget's `0`
        property is an actual DOM element, and in case you ever need the
        jQuery-wrapped element &mdash; that's the widget's `$element` property.

        The purpose of the `OxMyBox` class is just to allow us to add CSS
        declarations in an external style sheet. In this case, `.css({float:
        'left'})` would do the same thing.
        */
        .addClass('OxMyBox');

    /*
    The second part of the "constructor" function can be thought of as the
    "initializer", and contains everything needed to set up the "instance". In
    this case, we just define a minimum and maximum size and then set the
    widget's color and size.
    
    We could have used `var minSize` and `var maxSize` here, but by using `self`
    for private variables that we want to be accessible across all the widget's
    methods, we can be sure that inside such methods, any local `var` is
    actually local to the method.
    */
    self.minSize = 1;
    self.maxSize = 256;

    setColor();
    setSize();

    /*
    Third, we declare the widget's private methods. These are just function
    declarations, hoisted to the top of the "constructor".
    */
    function setColor() {
        that.css({
            backgroundColor: 'rgb(' + self.options.color.join(', ') + ')',
        });
    }

    function setSize() {
        /*
        Before setting the size, we make sure the value is between `minSize` and
        `maxSize`.
        */
        self.options.size = self.options.size.map(function(value) {
            return Ox.limit(value, self.minSize, self.maxSize);
        });
        that.css({
            width: self.options.size[0] + 'px',
            height: self.options.size[1] + 'px'
        });
    }

    /*
    Next, we define the widgets public methods, as properties of `that`. (Note
    that unlike private methods, they are not hoisted.)
    */
    that.displayText = function(text) {
        /*
        As there isn't much to do yet, this method just displays some text.
        Here, `.addClass('OxMyText')` is equivalent to `.css({padding: '4px'})`.
        */
        that.empty();
        text && that.append(Ox.$('<div>').addClass('OxMyText').html(text));
        /*
        Public methods should return `that`, for chaining.
        */
        return that;
    };

    /*
    And finally, at the very end of the "constructor", we return `that`. And
    that's it.
    */
    return that;
    
};

/*
**InvertibleBox**
*/
/*
Now we can "subclass" our Box. Let's build one that can have its color inverted.
*/
Ox.My.InvertibleBox = function(options, self) { 

    self = self || {};
    /*
    We no longer inherit from Ox.Element, but from `Ox.My.Box`.
    We could have written
    <pre>
    var that = Ox.My.Box({}, self)
        .defaults({
            color: [128, 128, 128],
            inverted: false,
            size: [128, 128]
        })
        .options(options || ())
        .update({
            ...
        })
    </pre>
    &mdash; but why repeat the defaults of `Ox.My.Box` if we can simply extend
    them. (Just like `options()` returns all options of a widget, `defaults()`
    returns all its defaults.)
    */
    var that = Ox.My.Box({}, self);
    that.defaults(Ox.extend(that.defaults(), {
            inverted: false
        }))
        .options(options || {})
        /*
        Again, we add handlers that run when the widget's options are updated.
        The original handlers of `Ox.My.Box` will run next, so we just add the
        ones we need. We leave out `size`, so when the `size` option changes,
        we'll get the original behavior.
        */
        .update({
            color: setColor,
            inverted: setColor
        })
        /*
        The same as `.css({cursor: 'pointer'})`.
        */
        .addClass('OxMyInvertibleBox')
        /*
        Ox.Element and its descendants provide a number of public methods
        (`bindEvent`, `bindEventOnce`, `triggerEvent` and `unbindEvent`) that
        allow widgets to communicate via custom events. Here, we add a handler
        for Ox.Element's `doubleclick` event. If we just wanted to handle a
        `click` event, we could also use jQuery here:
        <pre>
        .on({
            click: function() {
                that.invert();
            }
        })
        </pre>
        */
        .bindEvent({
            doubleclick: function() {
                that.invert();
            }
        });

    /*
    The idea is that our widget's inverted state is separate from its color. If
    the inverted option is set, then the color option stays the same, but has
    the inverse effect. This means that when initializing the widget, we have
    to call our custom `setColor` method if `self.options.inverted` is `true`.
    */
    self.options.inverted && setColor();

    /*
    When `setColor` is invoked as an update handler, returning `false` signals
    that no further handlers should run. Otherwise, the original handler of
    `Ox.My.Box` would run next, and revert any inversion we might have done
    here.
    */
    function setColor() {
        that.css({backgroundColor: 'rgb(' + (
            self.options.inverted ? self.options.color.map(function(value) {
                return 255 - value;
            }) : self.options.color
        ).join(', ') + ')'});
        return false;
    }

    /*
    The public `invert` method is added as a convenience for the users of our
    widget, so that when they want to toggle its inverted state, they don't have
    to write
    <pre>
    $widget.options({
        inverted: !$widget.options('inverted')
    });
    </pre>
    all the time.
    
    Also, we trigger an `invert` event, that anyone can bind to via
    <pre>
    $widget.bindEvent({
        invert: function() { ... }
    });
    </pre>
    */
    that.invert = function() {
        that.options({inverted: !self.options.inverted}).triggerEvent('invert');
        return that;
    };

    /*
    And again, we return `that`.
    */
    return that;

};

/*
**MetaBox**
*/
/*
Now it's time for something more funky: A MetaBox &mdash; that is, a box of
boxes.
*/
Ox.My.MetaBox = function(options, self) {

    /*
    This time, we inherit from `Ox.My.InvertibleBox`. The one thing that's
    different though is the `color` option: It is no longer a single value, but
    an array of array of values. That's how the boxes inside our MetaBox are
    specified. The following would create a grid of boxes with two rows and
    three columns:
    <pre>
    Ox.My.MetaBox({
        color: [
            [[64, 0, 0], [64, 64, 0], [0, 64, 0]],
            [[0, 64, 64], [0, 0, 64], [64, 0, 64]]
        ]
    });
    </pre>
    */
    self = self || {};
    var that = Ox.My.InvertibleBox({}, self)
        .options(options || {})
        .update({color: setColor});

    /*
    But we keep the default color of `Ox.My.InvertibleBox` (`[128, 128, 128]`)
    as our own default color, and only here check if the color option is a
    single RGB value. In that case, we convert it to an array of one row and one
    column. This way, whenever someone accidentally passes a single color value,
    our MetaBox can handle it.
    */
    if (Ox.isNumber(self.options.color[0])) {
        self.options.color = [[self.options.color]];
    }

    /*
    `self.sizes` holds the width of each column and the height of each row.
    `self.options.color.length` is the number of rows,
    `self.options.color[0].length` the number of columns, and Ox.splitInt(a, b)
    "splits" an integer `a` into an array of `b` integers that sum up to `a`.
    (We don't want fractional pixel sizes.)
    */
    self.sizes = [
        Ox.splitInt(self.options.size[0], self.options.color[0].length),
        Ox.splitInt(self.options.size[1], self.options.color.length)
    ];

    /*
    `self.$boxes` are the actual boxes. We use `Ox.My.InvertibleBox`, but remove
    the `doubleclick` handlers, since our MetaBox already has one, being an
    InvertibleBox itself. (`unbindEvent(event)` removes all handlers,
    `unbindEvent(event, handler)` removes a specific one.) Then we simply append
    each box to the meta-box.
    */
    self.$boxes = self.options.color.map(function(array, y) {
        return array.map(function(color, x) {
            return Ox.My.InvertibleBox({
                    color: color,
                    size: [self.sizes[0][x], self.sizes[1][y]]
                })
                .unbindEvent('doubleclick')
                .appendTo(that);
        });
    });

    /*
    To set the color of a meta-box means to set the color of each box.
    */
    function setColor() {
        self.$boxes.forEach(function(array, y) {
            array.forEach(function($box, x) {
                $box.options({color: self.options.color[y][x]});
            });
        });
    }

    /*
    This is the rare case of a shared private method. Its purpose will become
    apparent a bit later. Otherwise, we could just have made a private function,
    or an anonymous function in the loop below.
    */
    self.invertBox = function($box) {
        $box.invert();
    };

    /*
    Here, we override the public `invert` method of `Ox.My.InvertibleBox`. When
    inverting an `Ox.My.MetaBox`, we have to invert each of its boxes. (If we
    wanted to keep the original method around, we could store it as
    `that.superInvert` before.)
    */
    that.invert = function() {
        self.$boxes.forEach(function(array) {
            array.forEach(self.invertBox);
        });
        that.options({inverted: !self.options.inverted}).triggerEvent('invert');
        return that;
    };

    /*
    And that's all it takes to make a meta-box.
    */
    return that;

};

/*
**PixelBox**
*/
/*
The next widget is a peculiar type of meta-box. A PixelBox has only one color,
but this color will be split up into a red box, a green box and a blue box.
*/
Ox.My.PixelBox = function(options, self) {

    self = self || {};

    /*
    The challenge here is that we want our PixelBox to be an instance of
    `Ox.My.MetaBox`, but with a `color` option like `Ox.My.Box`. So we have to
    parse the options ourselves, by first extending the defaults of `Ox.My.Box`
    and then transforming the single-value `color` option into a multi-value
    `color` option. Calling<br>
    `Ox.My.PixelBox().options('color')`<br>
    will now return<br>
    `[[[128, 0, 0], [0, 128, 0], [0, 0, 128]]]`.
    */
    self.options = Ox.extend(Ox.My.Box().defaults(), options || {});
    self.options.color = getColor();
    /*
    Now we can pass `self.options` to `Ox.My.MetaBox`.
    */
    var that = Ox.My.MetaBox(self.options, self)
    /*
    Again, we add a custom handler for `color` updates.
    */
        .update({color: setColor});

    /*
    This is how a single RGB value gets split up into a red box, a green box and
    a blue box.
    */
    function getColor(color) {
        return [[
            [self.options.color[0], 0, 0],
            [0, self.options.color[1], 0],
            [0, 0, self.options.color[2]]
        ]];
    }

    /*
    When the `color` option gets updated to a new single value, we update it
    again, this time to multiple values, and return `false` to keep the MetaBox
    handler from running. We have updated `color`, so our handler will get
    called again, but now it does nothing, and the MetaBox handler will get
    invoked.
    */
    function setColor() {
        if (Ox.isNumber(self.options.color[0])) {
            that.options({color: getColor()});
            return false;
        }
    }

    /*
    Inverting a PixelBox is different from inverting a MetaBox, since we only
    want to invert one color channel per box. This is where the shared private
    `invertBox` method of `Ox.My.MetaBox` comes into play. Since we share the
    same `self`, we can simply override it. (Alternatively, we could have added
    an `invertBox` option to `Ox.My.MetaBox`, but overriding a shared private
    method is much more elegant than cluttering the public API of
    `Ox.My.MetaBox` with such an option.)
    */
    self.invertBox = function($box, x) {
        $box.options({
            color: $box.options('color').map(function(value, i) {
                return i == x ? 255 - value : value
            })
        });
    };

    /*
    And that's the PixelBox.
    */
    return that;

};

/*
**ImageBox**
*/
/*
And finally &mdash; a meta-meta-box! An ImageBox takes an image and, for each
pixel, displays a PixelBox.
*/
Ox.My.ImageBox = function(options, self) {

    self = self || {};
    /*
    Loading the image is asynchronous, but we want to display a box immediately.
    So we just subclass `Ox.My.Box`. Also, this seems to be a good use case for
    its `displayText` method.
    */
    var that = Ox.My.Box({}, self).displayText('Loading...');
    /*
    It's not required to define empty defaults &mdash; omitting them would
    simply leave them undefined. Still, to add an explicit `null` default is a
    good practice, as it makes it obvious to any reader of our code that
    `Ox.My.ImageBox` expects an `image` option.
    */
    that.defaults(Ox.extend(that.defaults(), {
            image: null
        }))
        .options(options || {});

    /*
    Ox.Image takes a URI and passes an image object to its callback function.
    */
    self.options.image && Ox.Image(self.options.image, function(image) {
        var size = image.getSize();
        size = [size.width, size.height];
        /*
        Again, we have to compute the width of each column and the height of
        each row.
        */
        self.sizes = size.map(function(value, index) {
            return Ox.splitInt(self.options.size[index], value);
        });
        /*
        Remove the 'Loading...' message.
        */
        that.displayText();
        /*
        For each pixel ...
        */
        self.$boxes = Ox.range(size[1]).map(function(y) {
            return Ox.range(size[0]).map(function(x) {
                /*
                ... create a PixelBox ...
                */
                return Ox.My.PixelBox({
                        /*
                        (`image.pixel` returns RGBA, so discard alpha)
                        */
                        color: image.pixel(x, y).slice(0, 3),
                        size: [self.sizes[0][x], self.sizes[1][y]]
                    })
                    /*
                    ... remove its `doubleclick` handler ...
                    */
                    .unbindEvent('doubleclick')
                    /*
                    ... and append it to the ImageBox.
                    */
                    .appendTo(that);
            });
        });
    });

    /*
    We've inherited from `Ox.My.Box`, so we don't have an `invert` method yet.
    This is how we can borrow the one from `Ox.My.MetaBox`. We're passing our
    own `self`, so the `self.$boxes` that the `invert` method of `Ox.My.MetaBox`
    operates on will be the PixelBoxes that we are assigning in the asynchronous
    callback above. (This pattern is somewhat analogous to the
    `someOtherObject.method.apply(this, args)` idiom that is common in
    JavaScript.)

    Note that we have to pass `self.options` too, otherwise our own
    `self.options.size` would get overwritten by the MetaBox default size.

    Passing `self` to `Ox.My.MetaBox` has another nice effect: the MetaBox will
    add its own event handlers to it. So even though `Ox.My.ImageBox` is just an
    `Ox.My.Box`, it has now inherited `doubleclick` handling from
    `Ox.My.MetaBox`.

    (Internally, `Ox.Element` stores event handlers in `self`. So what happens
    is this: `self` gets passed all the way down from `Ox.My.ImageBox` to
    `Ox.My.MetaBox` to `Ox.My.InvertibleBox` to `Ox.My.Box` to Ox.Element, and
    when `Ox.My.InvertibleBox` defines its `doubleclick` handler, it ends up on
    `self`. So when the Ox.Element that is actually in the DOM &mdash; the
    `Ox.My.Box` that `Ox.My.ImageBox` inherits from, which shares the same
    `self` &mdash; receives a `doubleclick`, there is now a handler for it.)
    */
    that.invert = Ox.My.MetaBox(self.options, self).invert;

    /*
    And that's it.
    */
    return that;

};

/*
**VideoBox**
*/
/*
This one is left as an exercise to the reader ;)
*/
Ox.My.VideoBox = function(options, self) {
    
};

/*
**Demo**
*/
/*
Load the Image and UI modules.
*/
Ox.load(['Image', 'UI'], function() {
    /*
    Pick a random color. Ox.rgb will convert HSL to RGB.
    */
    var h = Ox.random(360), s = 1, l = 0.5;
    /*
    Create a global variable, so that we can interact with our widgets in the
    console.
    */
    window.My = {};
    /*
    Since `Ox.My.Box` is a good multi-purpose container, we create one to
    contain the first four boxes.
    */
    Ox.My.Box({
            size: [256, 256]
        })
        .append(
            My.$box = Ox.My.Box({
                color: Ox.rgb(h, s, l)
            }),
            My.$invertibleBox = Ox.My.InvertibleBox({
                color: Ox.rgb(h + 120, s, l)
            }),
            My.$metaBox = Ox.My.MetaBox({
                color: Ox.range(2).map(function(y) {
                    return Ox.range(3).map(function(x) {
                        return Ox.rgb(h + x * 60 + y * 180, s, l);
                    });
                })
            }),
            My.$pixelBox = Ox.My.PixelBox({
                color: Ox.rgb(h + 120, s, l)
            })
        )
        .appendTo(Ox.$body);
    /*
    The ImageBox is a bit larger.
    */
    My.$imageBox = Ox.My.ImageBox({
            image: 'png/pandora32.png',
            size: [256, 256]
        })
        .appendTo(Ox.$body);
    /*
    As a last step, we add another `doubleclick` handler to each widget. It will
    display the widget's name and options inside the first box.
    */
    Ox.forEach(My, function($box, name) {
        $box.bindEvent({
            doubleclick: function() {
                My.$box.displayText(
                    '<b>' + name[1].toUpperCase() + name.slice(2) + '</b><br>'
                    + JSON.stringify($box.options()).replace(/([,:])/g, '$1 ')
                );
            }
        });
    });
});
