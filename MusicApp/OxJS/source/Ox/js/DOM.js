'use strict';

/*@
Ox.$ <f> Generic HTML element, mimics jQuery
    value <s|h|w|?> tagname, selector, html element, `window`, or `document`
        Passing a tagname ('<tagname>') creates an element, passing a selector
        ('tagname', '.classname' or '#id') selects an element.
    (value) -> <o> Element object
    > Ox.$('<div>').addClass('red').hasClass('red')
    true
    > Ox.$('<div>').addClass('red').removeClass('red').hasClass('red')
    false
    > Ox.$('<div>').addClass('red').addClass('red')[0].className
    'red'
    > Ox.$('<a>').append(Ox.$('<b>')).children('b').length
    1
    > Ox.$('<b>').appendTo(Ox.$('<a>')).parents('a').length
    1
    > Ox.$('<div>').attr({id: 'red'}).attr('id')
    'red'
    > Ox.$('<div>').attr({id: 'red'}).removeAttr('id').attr('id')
    void 0
    > Ox.$('<div>').css({color: 'red'}).css('color')
    'red'
    > Ox.$('<div>').html('red').html()
    'red'
    > Ox.$('<div>').html('red').empty().html()
    ''
    > !!Ox.$('<div>').on({click: function(e) { Ox.test(e.type, 'click'); }}).trigger('click')
    true
    > Ox.$('<input>').val('red').val()
    'red'
@*/
Ox.$ = Ox.element = function $(value) {

    var elements = Ox.isArray(value) ? value // array of elements
            : Ox.isNodeList(value) ? Ox.slice(value) // nodelist
            : !Ox.isString(value) ? [value] // window, document or element
            : value[0] == '<' ? [document.createElement(value.slice(1, -1))]
            : Ox.slice(document.querySelectorAll(value)),
        mousewheelEvents = ['wheel', 'mousewheel'],
        originalMousewheelEvents = 'onwheel' in document ? ['wheel']
            : ['mousewheel', 'DOMMouseScroll', 'MozMousePixelScroll'],
        previousDisplay;

    function getElements($other) {
        return $other.forEach ? $other
            : Ox.range($other.length).map(function(index) {
                return $other[index];
            });
    }

    function normalizeEvents(args) {
        var ret = {};
        Ox.forEach(Ox.makeObject(args), function(callback, event) {
            if (Ox.contains(mousewheelEvents, event)) {
                originalMousewheelEvents.forEach(function(event) {
                    ret[event] = callback;
                });
            } else {
                ret[event] = callback;
            }
        });
        return ret;
    }

    return elements.length ? Ox.extend(
        Ox.zipObject(Ox.range(elements.length), elements
    ), {

        /*@
        add <f> Adds another DOM object to this DOM object
            (other) -> This DOM object
            other <o> Other DOM object
        @*/
        add: function add($other) {
            elements = Ox.unique(elements.concat($other.elements()));
            this.length = elements.length;
            return this;
        },

        /*@
        addClass <f> Adds a class name to all elements
            (className) -> <o> This DOM object
            className <s> Class name
        @*/
        addClass: function addClass(string) {
            string = Ox.clean(string);
            elements.forEach(function(element) {
                element.className = Ox.unique(((
                    element.className ? element.className + ' ' : ''
                ) + string).split(' ')).join(' ');
            });
            return this;
        },

        /*@
        append <f> Appends one or more DOM objects to this DOM object
            (object[, object[, ...]]) -> <o> This DOM object
            element <o> Another DOM object
        @*/
        append: function append() {
            var $others = Ox.slice(arguments);
            elements.forEach(function(element) {
                $others.forEach(function($other) {
                    getElements($other).forEach(function(otherElement) {
                        element.appendChild(otherElement);
                    });
                });
            });
            return this;
        },

        /*@
        appendTo <f> Appends this DOM object to another DOM object
            (object) -> <o> This DOM object
            object <o> Another DOM object
        @*/
        appendTo: function appendTo($other) {
            getElements($other).forEach(function(otherElement) {
                elements.forEach(function(element) {
                    otherElement.appendChild(element);
                });
            });
            return this;
        },

        /*@
        attr <f> Gets or sets an attribute for all elements
            (key) -> <s> Value
            (key, value) -> <o> This DOM object
            ({key0: value0, key1: value1, ...}) -> <o> This DOM object
            key <s> Attribute name
            value <s> Attribute value
        @*/
        attr: function attr() {
            var args = arguments, ret;
            if (args.length == 1 && Ox.isString(args[0])) {
                ret = this[0].getAttribute
                    ? this[0].getAttribute(args[0])
                    : void 0;
                // fixme: why exactly is this needed?
                return ret === null ? void 0 : ret;
            } else {
                args = Ox.makeObject(args);
                elements.forEach(function(element) {
                    Ox.forEach(args, function(value, key) {
                        if (
                            element.setAttribute
                            && !Ox.contains([false, null, void 0], value)
                        ) {
                            element.setAttribute(key, value);
                        }
                    });
                });
                return this;
            }
        },

        /*@
        children <f> Returns the unique list of children of all elements
            ([selector]) -> <[h]> Children
            selector <s|'*'> CSS selector
        @*/
        children: function children(selector) {
            var children = Ox.unique(Ox.flatten(elements.map(function(element) {
                return Ox.slice(element.childNodes);
            })));
            return Ox.$(selector ? children.filter(function(child) {
                return Ox.$(child).is(selector);
            }) : children);
        },

        /*@
        css <f> Gets or sets a CSS attribute for all elements
            (key) -> <s> Value
            (key, value) -> <o> This DOM object
            ({key0: value0, key1: value1, ...}) -> <o> This DOM object
            key <s> Attribute name
            value <s> Attribute value
        @*/
        css: function css() {
            var args = arguments;
            if (args.length == 1 && Ox.isString(args[0])) {
                return elements[0].style[args[0]];
            } else {
                elements.forEach(function(element) {
                    Ox.forEach(Ox.makeObject(args), function(value, key) {
                        element.style[key] = value;
                    });
                });
                return this;
            }
        },

        /*@
        data <f> Gets or sets data
            () -> <o> All data
            (key) -> <s> Value
            (key, value) -> <o> This DOM object
            ({key0: value0, key1: value1, ...}) -> <o> This DOM object
            key <s> Property
            value <*> Value
        @*/
        data: function data() {
            var args;
            if (arguments.length == 1 && Ox.isString(arguments[0])) {
                return element.getAttribute('data-' + arguments[0]);
            } else {
                args = Ox.makeObject(arguments);
                elements.forEach(function(element) {
                    Ox.forEach(args, function(value, key) {
                        element.setAttribute('data-' + key, value);
                    });
                });
                return this;
            }
        },

        /*@
        elements <a> All elements
        @*/
        elements: elements,

        /*@
        eq <f> Reduces the list of elements to the one at the given index
            () -> <o> This DOM object
        @*/
        eq: function eq() {
            var that = this;
            Ox.loop(1, this.length, function(index) {
                delete that[index];
            });
            this.elements = [this.elements[index]];
            this.length = 1;
            return this;
        },

        /*@
        empty <f> Empties the inner HTML of all elements
            () -> <o> This DOM object
        @*/
        empty: function empty() {
            return this.html('');
        },

        /*@
        every <f> Tests if every element satisfies a given condition
            (test) -> True if every element passes the test
            test <f> Test function
        @*/
        every: function every() {
            return Array.prototype.every.apply(elements, arguments);
        },

        /*@
        filter <f> Filters all elements by a given condition
            (test) -> Array of matching elements
            test <f> Test function
        @*/
        filter: function filter() {
            return Array.prototype.filter.apply(elements, arguments);
        },

        /*@
        find <f> Find all descendant elements matching a CSS selector
            ([selector]) -> <[h]> Elements
            selector <s|'*'> CSS selector
        @*/
        find: function find(selector) {
            return Ox.$(Ox.unique(Ox.flatten(elements.map(function(element) {
                return Ox.slice(element.querySelectorAll(selector || '*'));
            }))));
        },

        /*@
        forEach <f> Loops over all elements
            (iterator) -> This DOM object
            iterator <f> Iterator function
        @*/
        forEach: function forEach() {
            Array.prototype.forEach.apply(elements, arguments);
            return this;
        },

        /*@
        hasClass <f> Returns true if this element has a given class
            (className) -> <b> True if this element has the class
            className <s> Class name
        @*/
        hasClass: function hasClass(string) {
            return elements.some(function(element) {
                return Ox.contains(element.className.split(' '), string);
            });
        },

        /*@
        height <f> Returns the height of the first element
            () -> <n> Height in px
        @*/
        height: function height() {
            return elements[0][
                elements[0] == document ? 'height'
                : elements[0] == window ? 'innerHeight'
                : 'offsetHeight'
            ];
        },

        /*@
        hide <f> Hides all elements
            () -> <o> This DOM object
        @*/
        hide: function hide() {
            previousDisplay = this.css('display');
            return this.css({display: 'none'});
        },

        /*@
        html <f> Gets or sets the innerHTML of all elements
            () -> <s> The inner HTML
            (html) -> <o> This DOM object
            html <s> The inner HTML
        @*/
        html: function html(string) {
            var html = '';
            if (arguments.length == 0) {
                elements.forEach(function(element) {
                    html += element.innerHTML;
                })
                return html;
            } else {
                elements.forEach(function(element) {
                    element.innerHTML = string;
                });
                return this;
            }
        },

        /*@
        insertAfter <f> Inserts this DOM object after another DOM object
            (object) -> <o> This DOM object
            object <o> Another DOM object
        @*/
        insertAfter: function insertAfter($other) {
            var nextSibling = $other[0].nextSibling;
            elements.forEach(function(element) {
                $other[0].parentNode.insertBefore(element, nextSibling);
            })
            return this;
        },

        /*@
        insertBefore <f> Inserts this DOM object before another DOM object
            (object) -> <o> This DOM object
            object <o> Another DOM object
        @*/
        insertBefore: function insertBefore($other) {
            elements.forEach(function(element) {
                $other[0].parentNode.insertBefore(element, $other[0]);
            });
            return this;
        },

        /*@
        is <f> Tests if any element matches a CSS selector
            (selector) -> <b> True if the element matches the selector
            selector <s> CSS selector
        @*/
        is: function is(selector) {
            return elements.some(function(element) {
                var parent = element.parentNode;
                if (!parent) {
                    parent = document.createElement('div');
                    parent.appendChild(element);
                }
                return Ox.contains(parent.querySelectorAll(selector), element);
            });
        },

        /*@
        length <n> Number of elements
        @*/
        length: elements.length,

        /*@
        map <f> Transforms all elements
            (iterator) -> [] Transformed elements
            iterator <f> Iterator function
        @*/
        map: function map() {
            return Array.prototype.map.apply(elements, arguments);
        },

        /*@
        next <f> Returns the unique list of siblings directly after all elements
            () -> <[h]> Siblings
        @*/
        next: function next() {
            return Ox.$(Ox.unique(Ox.filter(elements.map(function(element) {
                return element.nextSibling;
            }))));
        },

        /*@
        nextAll <f> Returns the unique list of siblings after all elements
            () -> <[h]> Siblings
        @*/
        nextAll: function nextAll() {
            var siblings = [];
            elements.forEach(function(element) {
                var sibling = element;
                while (true) {
                    sibling = sibling.nextSibling;
                    if (!sibling) {
                        break;
                    }
                    siblings.push(sibling);
                }
            });
            return Ox.$(Ox.unique(siblings));
        },

        /*@
        off <f> Unbinds a callback from an event
            (event) -> <o> This DOM object (unbinds all callbacks)
            (event, callback) -> <o> This DOM object
            ({event0: callback0, event1: callback1, ...}) -> <o> This DOM object
            event <s> Event name
            callback <f> Callback function
        @*/
        off: function off(event, callback) {
            var args = normalizeEvents(arguments);
            elements.forEach(function(element) {
                Ox.forEach(args, function(callback, event) {
                    if (callback) {
                        element.removeEventListener(event, callback, false);
                    } else {
                        element['on' + event] = null;
                    }
                });
            });
            return this;
        },

        /*@
        on <f> Binds a callback to an event
            (event, callback) -> <o> This DOM object
            ({event0: callback0, event1: callback1, ...}) -> <o> This DOM object
            event <s> Event name
            callback <f> Callback function
                e <o> Event properties
        @*/
        on: function on() {
            var args = normalizeEvents(arguments);
            elements.forEach(function(element) {
                Ox.forEach(args, function(callback, event) {
                    element.addEventListener(event, callback, false);
                });
            });
            return this;
        },

        /*@
        one <f> Binds a callback to an event and unbinds it on first invocation
            (event, callback) -> <o> This DOM object
            ({event0: callback0, event1: callback1, ...}) -> <o> This DOM object
            event <s> Event name
            callback <f> Callback function
                e <o> Event properties
        @*/
        one: function one(events) {
            var args = Ox.slice(arguments), that = this;
            Ox.forEach(normalizeEvents(arguments), function(callback, event) {
                that.on(event, function fn() {
                    that.off(event, fn);
                    return callback.apply(that, args);
                });
            });
            return this;
        },

        /*@
        parent <f> Returns the unique list of parents of all elements
            () -> <[h]> Parent elements
        @*/
        parent: function parent() {
            return Ox.$(Ox.unique(Ox.compact(elements.map(function(element) {
                return element.parentNode;
            }))));
        },

        /*@
        parents <f> Returns the unique list of all ancestors of all elements
            ([selector]) -> <[h]> Ancestor elements
            selector <s|'*'> CSS selector
        @*/
        parents: function parents(selector) {
            var parents = [];
            Ox.reverse(elements).forEach(function(element) {
                var parent = element;
                while (true) {
                    parent = parent.parentNode;
                    if (!parent || parent == document) {
                        break;
                    }
                    parents.unshift(parent);
                }
            });
            parents = Ox.unique(parents);
            return Ox.$(selector ? parents.filter(function(parent) {
                return Ox.$(parent).is(selector);
            }) : parents);
        },

        /*@
        prepend <f> Prepends one or more DOM objects to this DOM object
            (object[, object[, ...]]) -> <o> DOM object
            object <o> Another DOM objectt
        @*/
        prepend: function prepend() {
            var $others = Ox.slice(arguments).reverse();
            elements.forEach(function(element) {
                var parent = element.parentNode;
                $others.forEach(function($other) {
                    getElements($other).forEach(function(otherElement) {
                        parent.insertBefore(otherElement, parent.firstChild);
                    });
                });
            });
            return this;
        },

        /*@
        prependTo <f> Prepends this DOM object to another DOM object
            (object) -> <o> This DOM object
            object <o> Another DOM object
        @*/
        prependTo: function prependTo($other) {
            getElements($other).forEach(function(otherElement) {
                var firstChild = otherElement.firstChild
                elements.forEach(function(element) {
                    otherElement.insertBefore(element, firstChild);
                });
            });
            return this;
        },

        /*@
        prev <f> Returns the unique list of siblings directly before all elements
            () -> <[h]> Siblings
        @*/
        prev: function prev() {
            return Ox.$(Ox.unique(Ox.filter(elements.map(function(element) {
                return element.previousSibling;
            }))));
        },

        /*@
        prevAll <f> Returns the unique list of siblings before all elements
            () -> <[h]> Siblings
        @*/
        prevAll: function prevAll() {
            var siblings = [];
            Ox.reverse(elements).forEach(function(element) {
                var sibling = element;
                while (true) {
                    sibling = sibling.previousSibling;
                    if (!sibling) {
                        break;
                    }
                    siblings.unshift(sibling);
                }
            });
            return Ox.$(Ox.unique(siblings));
        },

        /*@
        reduce <f> Applies `reduce` to all elements
        @*/
        reduce: function reduce() {
            return Array.prototype.reduce.apply(elements, arguments);
        },

        /*@
        remove <f> Removes all element from the DOM
            () -> <o> This DOM object
        @*/
        remove: function remove() {
            elements.forEach(function(element) {
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            });
            return this;
        },

        /*@
        removeAttr <f> Removes an attribute from all elements
            (key) -> <o> This DOM object
            ([key0, key1, ...]) -> <o> This DOM object
            key <s> The attribute
        @*/
        removeAttr: function removeAttr() {
            var keys = Ox.makeArray(arguments);
            elements.forEach(function(element) {
                keys.forEach(function(key) {
                    element.removeAttribute(key);
                });
            });
            return this;
        },

        /*@
        removeClass <f> Removes a class name from all elements
            (className) -> <o> This DOM object
            className <s> Class name
        @*/
        removeClass: function removeClass(string) {
            var classNames = Ox.clean(string).split(' ');
            elements.forEach(function(element) {
                element.className = element.className.split(' ')
                    .filter(function(className) {
                        return !Ox.contains(classNames, className)
                    })
                    .join(' ');
            });
            return this;
        },

        /*@
        replace <f> Replaces another DOM object with this DOM object
            (object) -> <o> This DOM object
            object <o> Another DOM object
        @*/
        replace: function replace($other) {
            getElements($other).forEach(function(otherElement) {
                var parent = otherElement.parentNode,
                    sibling = otherElement.nextSibling;
                if (parent) {
                    parent.removeChild(otherElement);
                    elements.forEach(function(element) {
                        parent.insertBefore(element, sibling)
                    });
                }
            });
            return this;
        },

        /*@
        replaceWith <f> Replaces this DOM object with another DOM object
            (object) -> <o> This DOM object
            object <o> Another DOM object
        @*/
        replaceWith: function replaceWith($other) {
            elements.forEach(function(element) {
                var parent = element.parentNode,
                    sibling = element.nextSibling;
                if (parent) {
                    parent.removeChild(element);
                    getElements($other).forEach(function(otherElement) {
                        parent.insertBefore(otherElement, sibling);
                    });
                }
            });
            return this;
        },

        /*@
        show <f> Shows all elements
            () -> This DOM object
        @*/
        show: function show() {
            return this.css({display: previousDisplay || 'block'});
        },

        /*@
        siblings <f> Returns all siblings of all elements
            ([selector]) -> <[h]> Siblings
            selector <s|'*'> CSS selector
        @*/
        siblings: function siblings(selector) {
            var siblings = Ox.unique(elements.map(function(element) {
                return Ox.filter(
                    element.parentNode.childNodes,
                    function(sibling) {
                        return sibling !== element;
                    }
                );
            }));
            return Ox.$(selector ? siblings.filter(function(sibling) {
                return Ox.$(sibling).is(selector);
            }) : siblings);
        },

        /*@
        some <f> Tests if some elements satisfy a given condition
            (test) -> True if some elements pass the test
            test <f> Test function
        @*/
        some: function some() {
            return Array.prototype.some.apply(elements, arguments);
        },

        /*@
        text <f> Gets or sets the text contents of all elements
            () -> <s> The text contents
            (text) -> <o> This DOM object
            text <s> The text contents
        @*/
        text: function text(string) {
            var text = '';
            if (arguments.length == 0) {
                elements.forEach(function(element) {
                    text += Ox.isString(element.textContent)
                        ? element.textContent : element.innerText; 
                });
                return text;
            } else {
                elements.forEach(function(element) {
                    element.empty();
                    element.appendChild(document.createTextNode(string));
                });
                return this;
            }
        },

        /*@
        toggle <f> Toggle visibility of all elements
            () -> This DOM object
        @*/
        toggle: function toggle() {
            return this[
                Ox.$(element).css('display') == 'none' ? 'show' : 'hide'
            ]();
        },

        /*@
        toggleClass <f> Toggles a class name for all elements
            (className) -> <o> This DOM object
            className <s> Class name
        @*/
        toggleClass: function toggleClass(string) {
            elements.forEach(function(element) {
                var $element = Ox.$(element);
                $element[
                    $element.hasClass(string) ? 'removeClass' : 'addClass'
                ](string);
            })
            return this;
        },

        /*@
        trigger <f> Triggers an event
            (event) -> <o> This DOM object
        @*/
        trigger: function trigger(event) {
            elements.forEach(function(element) {
                var e = document.createEvent('MouseEvents');
                e.initEvent(event, true, true);
                element.dispatchEvent(e);
            });
            return this;
        },

        /*@
        val <f> Gets the value of the first or sets the value of all elements
            () -> <s> Value
            (value) -> <o> This DOM object
            value <s> Value
        @*/
        val: function val(value) {
            var ret;
            if (arguments.length == 0) {
                return elements[0].value;
            } else {
                elements.forEach(function(element) {
                    element.value = value;
                });
                return this;
            }
        },

        /*@
        width <f> Returns the width of the first element
            () -> <n> Width in px
        @*/
        width: function width() {
            return elements[0][
                elements[0] == document ? 'width'
                : elements[0] == window ? 'innerWidth'
                : 'offsetWidth'
            ];
        }

    }) : null;

};

/*@
Ox.canvas <function> Generic canvas object
    Returns an object with the properties: `canvas`, `context`, `data` and
    `imageData`.
    (width, height) -> <o> canvas
    (image) -> <o> canvas
    width <n> Width in px
    height <n> Height in px
    image <e> Image object
@*/
Ox.canvas = function() {
    var c = {}, isImage = arguments.length == 1,
        image = isImage ? arguments[0] : {
            width: arguments[0], height: arguments[1]
        };
    c.context = (c.canvas = Ox.$('<canvas>').attr({
        width: image.width, height: image.height
    })[0]).getContext('2d');
    isImage && c.context.drawImage(image, 0, 0);
    c.data = (c.imageData = c.context.getImageData(
        0, 0, image.width, image.height
    )).data;
    return c;
};

/*@
Ox.documentReady <function> Calls a callback function once the DOM is ready
    (callback) -> <b> If true, the document was ready
    callback <f> Callback function
@*/
Ox.documentReady = (function() {
    var callbacks = [];
    document.onreadystatechange = window.onload = function() {
        if (document.readyState == 'complete') {
            callbacks.forEach(function(callback) {
                callback();
            });
            document.onreadystatechange = window.onload = null;
        }
    };
    return function(callback) {
        if (document.readyState == 'complete') {
            callback();
            return true;
        } else {
            callbacks.push(callback);
            return false;
        }
    };
}());
