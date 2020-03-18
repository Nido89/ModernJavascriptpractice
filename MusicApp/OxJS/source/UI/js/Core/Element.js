'use strict';

(function(_) {
    var noTooltipEvents = {};
    var supportsPassive = false;
    try {
        var opts = Object.defineProperty({}, 'passive', {
            get: function() {
                supportsPassive = true;
            }
        });
        window.addEventListener("test", null, opts);
    } catch (e) {}

    /*@
    Ox.Element <f> Basic UI element object
        # Arguments -----------------------------------------------------------
        options <o|s> Options of the element, or just the `element` option
            element <s> Tagname or CSS selector
            tooltip <s|f> Tooltip title, or a function that returns one
                (e) -> <s> Tooltip title
                e <o> Mouse event
        self <o> Shared private variable
        # Usage ---------------------------------------------------------------
        ([options[, self]]) -> <o> Element object
            # Events ----------------------------------------------------------
            anyclick <!> anyclick
                Fires on mouseup, but not on any subsequent mouseup within 250
                ms (this is useful if one wants to listen for singleclicks, but
                not doubleclicks, since it will fire immediately, and won't
                fire again in case of a doubleclick)
                * <*> Original event properties
            doubleclick <!> doubleclick
                Fires on the second mousedown within 250 ms (this is useful if
                one wants to listen for both singleclicks and doubleclicks,
                since it will not trigger a singleclick event)
                * <*> Original event properties
            drag <!> drag
                Fires on mousemove after dragstart, stops firing on mouseup
                clientDX <n> Horizontal drag delta in px
                clientDY <n> Vertical drag delta in px
                * <*> Original event properties
            dragend <!> dragpause
                Fires on mouseup after dragstart
                clientDX <n> Horizontal drag delta in px
                clientDY <n> Vertical drag delta in px
                * <*> Original event properties
            dragenter <!> dragenter
                Fires when entering an element during drag (this fires on the
                element being dragged -- the target element is the event's
                target property)
                clientDX <n> Horizontal drag delta in px
                clientDY <n> Vertical drag delta in px
                * <*> Original event properties
            dragleave <!> dragleave
                Fires when leaving an element during drag (this fires on the
                element being dragged -- the target element is the event's
                target property)
                clientDX <n> Horizontal drag delta in px
                clientDY <n> Vertical drag delta in px
                * <*> Original event properties
            dragpause <!> dragpause
                Fires once when the mouse doesn't move for 250 ms during drag
                (this is useful in order to execute operations that are too
                expensive to be attached to the drag event)
                clientDX <n> Horizontal drag delta in px
                clientDY <n> Vertical drag delta in px
                * <*> Original event properties
            dragstart <!> dragstart
                Fires when the mouse is down for 250 ms
                * <*> Original event properties
            mousedown <!> mousedown
                Fires on mousedown (this is useful if one wants to listen for
                singleclicks, but not doubleclicks or drag events, and wants
                the event to fire as early as possible)
                * <*> Original event properties
            mouserepeat <!> mouserepeat
                Fires every 50 ms after the mouse was down for 250 ms, stops
                firing on mouseleave or mouseup (this fires like a key that is
                being pressed and held, and is useful for buttons like
                scrollbar arrows that need to react to both clicking and
                holding)
            mousewheel <!> mousewheel
                Fires on mousewheel scroll or trackpad swipe
                deltaFactor <n> Original delta = normalized delta * delta factor
                deltaX <n> Normalized horizontal scroll delta in px
                deltaY <n> Normalized vertical scroll delta in px
                * <*> Original event properties
            singleclick <!> singleclick
                Fires 250 ms after mouseup, if there was no subsequent
                mousedown (this is useful if one wants to listen for both
                singleclicks and doubleclicks, since it will not fire for
                doubleclicks)
                * <*> Original event properties
            touchend <!> touchend
                normalized version of touchend event
                * <*> Original event properties
            touchmove <!> touchmove
                normalized version of touchmove event
                * <*> Original event properties
            touchstart <!> touchstart
                normalized version of touchstart event
                * <*> Original event properties
    */

    Ox.Element = function Element(options, self) {

        // create private object
        self = self || {};
        self.boundTooltipEvents = noTooltipEvents;
        self.defaults = {};
        self.eventCallbacks = self.eventCallbacks || {};
        // allow for Ox.Element('<tagname>') or Ox.Element('cssSelector')
        self.options = Ox.isString(options) ? {element: options} : options || {};
        self.unbindKeyboard = function unbindKeyboard() {
            Object.keys(self.eventCallbacks).filter(function(event) {
                return /^key([\._][\w\.]+)?$/.test(event);
            }).forEach(function(event) {
                that.unbindEvent(event);
            });
        };
        self.update = function update(key, value) {
            // update is called whenever an option is modified or added
            Ox.loop(self.updateCallbacks.length - 1, -1, -1, function(index) {
                // break if the callback returns false
                return self.updateCallbacks[index](key, value) !== false;
            });
        };
        self.updateCallbacks = self.updateCallbacks || [];

        // create public object
        var that = Object.create(Ox.Element.prototype);
        that.oxid = Ox.uid();
        that.$element = $(self.options.element || '<div>')
            .addClass('OxElement')
            .data({oxid: that.oxid})
            .on({
                mousedown: onMousedown,
                mousewheel: onMousewheel,
                //touchend: onTouchend,
                //touchmove: onTouchmove,
                //touchstart: onTouchstart
            });

        that.$element[0].addEventListener('touchend', onTouchend, supportsPassive ? { passive: true } : false );
        that.$element[0].addEventListener('touchmove', onTouchmove, supportsPassive ? { passive: true } : false );
        that.$element[0].addEventListener('touchstart', onTouchstart, supportsPassive ? { passive: true } : false );

        that[0] = that.$element[0];
        that.length = 1;
        that.self = function _self() {
            return arguments[0] === _ ? self : {};
        };
        Ox.$elements[that.oxid] = that;

        if (self.options.element == '<iframe>') {
            self.messageCallbacks = self.messageCallbacks || {};
            that.on({
                load: function init() {
                    if (that.attr('src')) {
                        // send oxid to iframe
                        that.postMessage({init: {oxid: that.oxid}});
                        self.initTime = self.initTime || +new Date();
                        if (+new Date() < self.initTime + 60000) {
                            self.initTimeout = setTimeout(init, 250);
                        }
                    }
                }
            }).bindEvent({
                init: function() {
                    // iframe has received oxid
                    clearTimeout(self.initTimeout);
                }
            });
        }

        var constantTooltipEvents = {
                mouseenter: onMouseenter,
                mouseleave: onMouseleave
            },
            dynamicTooltipEvents = {
                mousemove: onMousemove,
                mouseleave: onMouseleave
            };

        setTooltip();

        function bindTooltipEvents(events) {
            if (self.boundTooltipEvents !== events) {
                that.off(self.boundTooltipEvents).on(events);
                self.boundTooltipEvents = events;
            }
        }

        function getTouchData(e) {
            var data = {};
            if (e && e.changedTouches && e.changedTouches.length) {
                data.clientX = e.changedTouches[0].clientX;
                data.clientY = e.changedTouches[0].clientY;
            } else {
                data.clientX = e.pageX;
                data.clientY = e.pageY;
            }
            return data;
        }

        function onMousedown(e) {
            /*
            better mouse events
            mousedown:
                trigger mousedown
            within 250 msec:
                mouseup: trigger anyclick
                mouseup + mousedown: trigger doubleclick
            after 250 msec:
                mouseup + no mousedown within 250 msec: trigger singleclick
                no mouseup within 250 msec:
                    trigger mouserepeat every 50 msec
                    trigger dragstart
                        mousemove: trigger drag
                        no mousemove for 250 msec:
                            trigger dragpause
                        mouseup: trigger dragend
            "anyclick" is not called "click" since this would collide with the click
            events of some widgets
            */
            var clientX, clientY,
                dragTimeout = 0,
                mouseInterval = 0;
            that.triggerEvent('mousedown', e);
            if (!self._mouseTimeout) {
                // first mousedown
                self._drag = false;
                self._mouseup = false;
                self._mouseTimeout = setTimeout(function() {
                    // 250 ms later, no subsequent click
                    self._mouseTimeout = 0;
                    if (self._mouseup) {
                        // mouse went up, trigger singleclick
                        that.triggerEvent('singleclick', e);
                    } else {
                        // mouse is still down, trigger mouserepeat
                        // every 50 ms until mouseleave or mouseup
                        mouserepeat();
                        mouseInterval = setInterval(mouserepeat, 50);
                        that.one('mouseleave', function() {
                            clearInterval(mouseInterval);
                        });
                        // trigger dragstart, set up drag events
                        that.triggerEvent('dragstart', e);
                        $('.OxElement').live({
                            mouseenter: dragenter,
                            mouseleave: dragleave
                        });
                        clientX = e.clientX;
                        clientY = e.clientY;
                        Ox.$window
                            .off('mouseup', mouseup)
                            .on({mousemove: mousemove})
                            .one('mouseup', function(e) {
                                // stop checking for mouserepeat
                                clearInterval(mouseInterval);
                                // stop checking for dragpause
                                clearTimeout(dragTimeout);
                                // stop checking for drag
                                Ox.$window.off({mousemove: mousemove});
                                // stop checking for dragenter and dragleave
                                $('.OxElement').off({
                                    mouseenter: dragenter,
                                    mouseleave: dragleave
                                });
                                // trigger dragend
                                that.triggerEvent('dragend', extend(e));
                            });
                        self._drag = true;
                    }
                }, 250);
            } else {
                // second mousedown within 250 ms, trigger doubleclick
                clearTimeout(self._mouseTimeout);
                self._mouseTimeout = 0;
                that.triggerEvent('doubleclick', e);
            }
            Ox.$window.one({mouseup: mouseup});
            function dragenter(e) {
                that.triggerEvent('dragenter', extend(e));
            }
            function dragleave(e) {
                that.triggerEvent('dragleave', extend(e));
            }
            function extend(e) {
                return Ox.extend({
                    clientDX: e.clientX - clientX,
                    clientDY: e.clientY - clientY
                }, e);
            }
            function mousemove(e) {
                e = extend(e);
                clearTimeout(dragTimeout);
                dragTimeout = setTimeout(function() {
                    // mouse did not move for 250 ms, trigger dragpause
                    that.triggerEvent('dragpause', e);
                }, 250);
                that.triggerEvent('drag', e);
            }
            function mouserepeat(e) {
                that.triggerEvent('mouserepeat', e);
            }
            function mouseup(e) {
                if (!self._mouseup && !self._drag) {
                    // mouse went up for the first time, trigger anyclick
                    that.triggerEvent('anyclick', e);
                    self._mouseup = true;
                }
            }
        }

        function onMouseenter(e) {
            if (!that.$tooltip) {
                that.$tooltip = Ox.Tooltip({title: self.options.tooltip});
            }
            that.$tooltip.show(e);
        }

        function onMouseleave(e) {
            that.$tooltip && that.$tooltip.hide();
        }

        function onMousemove(e) {
            that.$tooltip.options({title: self.options.tooltip(e)}).show(e);
        }

        function onMousewheel(e) {
            // see https://github.com/brandonaaron/jquery-mousewheel/blob/master/jquery.mousewheel.js
            e = e.originalEvent;
            var absDelta,
                deltaX = 'deltaX' in e ? e.deltaX
                    : 'wheelDeltaX' in e ? -e.wheelDeltaX
                    : 0,
                deltaY = 'deltaY' in e ? -e.deltaY
                    : 'wheelDeltaY' in e ? e.wheelDeltaY
                    : 'wheelDelta' in e ? e.wheelDelta
                    : 0;
            // Firefox < 17
            if ('axis' in e && e.axis === e.HORIZONTAL_AXIS) {
                deltaX = -deltaY;
                deltaY = 0;
            }
            if (deltaX || deltaY) {
                absDelta = Math.max(Math.abs(deltaY), Math.abs(deltaX));
                if (!self._deltaFactor || self._deltaFactor > absDelta) {
                    self._deltaFactor = absDelta;
                }
                that.triggerEvent('mousewheel', Ox.extend($.event.fix(e), {
                    deltaFactor: self._deltaFactor,
                    deltaX: Ox.trunc(deltaX / self._deltaFactor),
                    deltaY: Ox.trunc(deltaY / self._deltaFactor)
                }));
                clearTimeout(self._deltaTimeout)
                self._deltaTimeout = setTimeout(function() {
                    self._deltaFactor = null;
                }, 200);
            }
        }

        function onTouchend(e) {
            //var data = getTouchData(e.originalEvent);
            var data = getTouchData(e);
            that.triggerEvent('touchend', Ox.extend(e, data));
        }

        function onTouchmove(e) {
            //var data = getTouchData(e.originalEvent);
            var data = getTouchData(e);
            that.triggerEvent('touchmove', Ox.extend(e, data));
        }

        function onTouchstart(e) {
            //var data = getTouchData(e.originalEvent);
            var data = getTouchData(e);
            that.triggerEvent('touchstart', Ox.extend(e, data));
        }

        // TODO: in other widgets, use this,
        // rather than some self.$tooltip that
        // will not get garbage collected
        function setTooltip() {
            if (self.options.tooltip) {
                if (Ox.isString(self.options.tooltip)) {
                    bindTooltipEvents(constantTooltipEvents);
                    that.$tooltip && that.$tooltip.options({
                        title: self.options.tooltip,
                        animate: true
                    });
                } else {
                    that.$tooltip = Ox.Tooltip({animate: false});
                    bindTooltipEvents(dynamicTooltipEvents);
                }
            } else {
                if (that.$tooltip) {
                    that.$tooltip.remove();
                }
                bindTooltipEvents(noTooltipEvents);
            }
        }

        that.update({tooltip: setTooltip});

        return that;

    };

    // add all jQuery methods to the prototype of Ox.Element
    Ox.methods($('<div>'), true).forEach(function(method) {
        Ox.Element.prototype[method] = function() {
            var ret = this.$element[method].apply(this.$element, arguments),
                oxid;
            // If exactly one $element of an Ox Element was returned, then
            // return the Ox Element instead, so that we can do
            // oxObj.jqFn().oxFn()
            return ret && ret.jquery && ret.length == 1
                && Ox.$elements[oxid = ret.data('oxid')]
                ? Ox.$elements[oxid] : ret;
        };
    });

    /*@
    bindEvent <f> Adds event handler(s)
        (callback) -> <o> This element object
            Adds a catch-all handler
        (event, callback) -> <o> This element object
            Adds a handler for a single event
        ({event: callback, ...}) -> <o> This element object
            Adds handlers for one or more events
        callback <f> Callback function
            data <o> event data (key/value pairs)
        event <s> Event name
            Event names can be namespaced, like `'click.foo'`
        callback <f> Callback function
    @*/
    Ox.Element.prototype.bindEvent = function bindEvent() {
        Ox.Event.bind.apply(this, [this.self(_)].concat(Ox.slice(arguments)));
        return this;
    };

    /*@
    bindEventOnce <f> Adds event handler(s) that run(s) only once
        (callback) -> <o> This element
            Adds a catch-all handler
        (event, callback) -> <o> This element
            Adds a handler for a single event
        ({event: callback, ...}) -> <o> This element
            Adds handlers for one or more events
        callback <f> Callback function
            data <o> event data (key/value pairs)
        event <s> Event name
            Event names can be namespaced, like `'click.foo'`
        callback <f> Callback function
    @*/
    Ox.Element.prototype.bindEventOnce = function bindEventOnce() {
        Ox.Event.bindOnce.apply(
            this, [this.self(_)].concat(Ox.slice(arguments))
        );
        return this;
    };

    /*@
    bindMessage <f> Adds message handler(s) (if the element is an iframe)
        (callback) -> <o> This element object
            Adds a catch-all handler
        (message, callback) -> <o> This element object
            Adds a handler for a single message
        ({message: callback, ...}) -> <o> This element object
            Adds handlers for one or more messages
        message <s> Message name
        callback <f> Callback function
            data <o> Message data (key/value pairs)
            event <s> Event name
            element <o> Element object
    @*/
    Ox.Element.prototype.bindMessage = Ox.Element.prototype.onMessage = function bindMessage() {
        var self = this.self(_);
        if (self.options.element == '<iframe>') {
            Ox.Message.bind.apply(this, [self].concat(Ox.slice(arguments)));
        }
        return this;
    };

    /*@
    bindMessageOnce <f> Adds message handler(s) that run only once
        (callback) -> <o> This element object
            Adds a catch-all handler
        (message, callback) -> <o> This element object
            Adds a handler for a single message
        ({message: callback, ...}) -> <o> This element object
            Adds handlers for one or more messages
        event <s> Message name
        callback <f> Callback function
            data <o> Message data (key/value pairs)
            event <s> Event name
            element <o> Element object
    @*/
    Ox.Element.prototype.bindMessageOnce = Ox.Element.prototype.onMessageOnce = function bindMessageOnce() {
        var self = this.self(_);
        if (self.options.element == '<iframe>') {
            Ox.Message.bindOnce.apply(
                this, [self].concat(Ox.slice(arguments))
            );
        }
        return this;
    };

    /*@
    childrenElements <f> Gets all direct children element objects
        () -> <[o]> Array of element objects
    @*/
    Ox.Element.prototype.childrenElements = function childrenElements() {
        return Ox.compact(
            Ox.slice(this.children())
                .filter(Ox.UI.isElement)
                .map(Ox.UI.getElement)
        );
    };

    /*@
    defaults <function> Gets or sets the default options for an element object
        ({key: value, ...}) -> <obj> This element object
        key <str> The name of the default option
        value <*> The value of the default option
    @*/
    Ox.Element.prototype.defaults = function defaults() {
        var self = this.self(_);
        var ret;
        if (arguments.length == 0) {
            ret = self.defaults;
        } else if (Ox.isString(arguments[0])) {
            ret = self.defaults[arguments[0]];
        } else {
            self.defaults = Ox.makeObject(arguments);
            self.options = Ox.clone(self.defaults);
            ret = this;
        }
        return ret;
    };

    Ox.Element.prototype.empty = function empty() {
        this.childrenElements().forEach(function($element) {
            $element.removeElement();
        });
        this.$element.empty.apply(this, arguments);
        return this;
    };

    /*@
    findElements <f> Gets all descendant element objects
        () -> <[o]> Array of element objects
    @*/
    Ox.Element.prototype.findElements = function findElements() {
        return Ox.compact(
            Ox.slice(this.find('.OxElement')).map(Ox.UI.getElement)
        );
    };

    /*@
    gainFocus <function> Makes an element object gain focus
        () -> <obj> This element object
    @*/
    Ox.Element.prototype.gainFocus = function gainFocus() {
        Ox.Focus.gainFocus(this);
        return this;
    };

    /*@
    hasFocus <function> Returns true if an element object has focus
        () -> <boolean> True if the element has focus
    @*/
    Ox.Element.prototype.hasFocus = function hasFocus() {
        return Ox.Focus.focusedElement() === this;
    };

    Ox.Element.prototype.html = function html() {
        var ret;
        this.childrenElements().forEach(function($element) {
            $element.removeElement();
        });
        ret = this.$element.html.apply(this, arguments);
        return arguments.length == 0 ? ret : this;
    };

    /*@
    loseFocus <function> Makes an element object lose focus
        () -> <object> This element object
    @*/
    Ox.Element.prototype.loseFocus = function loseFocus() {
        Ox.Focus.loseFocus(this);
        return this;
    };

    /*@
    nextElement <f> Gets the closest following sibling element object
        () -> <o> Element object
    @*/
    Ox.Element.prototype.nextElement = function nextElement() {
        return this.nextElements()[0];
    };

    /*@
    nextElements <f> Gets all following sibling element objects
        () -> <[o]> Array of element objects
    @*/
    Ox.Element.prototype.nextElements = function nextElements() {
        return Ox.compact(
            this.nextAll().filter(Ox.UI.isElement).map(Ox.UI.getElement)
        );
    };

    /*@
    options <f> Gets or sets the options of an element object
        () -> <o> All options
        (key) -> <*> The value of option[key]
        (key, value) -> <o> This element
            Sets options[key] to value and calls update(key, value)
            if the key/value pair was added or modified
        ({key: value, ...}) -> <o> This element
            Sets one or more options and calls update(key, value)
            for every key/value pair that was added or modified
        key <s> The name of the option
        value <*> The value of the option
    @*/
    Ox.Element.prototype.options = function options() {
        var self = this.self(_);
        return Ox.getset(self.options, arguments, self.update, this);
    };

    /*@
    parentElement <f> Gets the closest parent element object
        () -> <o> Element object
    @*/
    Ox.Element.prototype.parentElement = function parentElement() {
        return Ox.last(this.parentElements());
    };

    /*@
    parentElements <f> Gets all parent element objects
        () -> <[o]> Array of element objects
    @*/
    Ox.Element.prototype.parentElements = function parentElements() {
        return Ox.compact(
            Ox.slice(this.parents())
                .filter(Ox.UI.isElement)
                .map(Ox.UI.getElement)
        );
    };

    /*@
    postMessage <f> Sends a message (if the element is an iframe)
        (event, data) -> This element object
        event <s> Event name
        data <o> Event data
    @*/
    Ox.Element.prototype.postMessage = function postMessage(event, data) {
        if (this.self(_).options.element == '<iframe>') {
            Ox.Message.post.apply(this, Ox.slice(arguments));
        }
        return this;
    };

    /*@
    prevElement <f> Gets the closest preceding sibling element object
        () -> <[o]> Array of element objects
    @*/
    Ox.Element.prototype.prevElement = function prevElement() {
        return Ox.last(this.prevElements());
    };

    /*@
    prevElements <f> Gets all preceding sibling element objects
        () -> <[o]> Array of element objects
    @*/
    Ox.Element.prototype.prevElements = function prevElements() {
        return Ox.compact(
            this.prevAll().filter(Ox.UI.isElement).map(Ox.UI.getElement)
        );
    };

    Ox.Element.prototype.remove = function remove() {
        var parent = this[0].parentNode;
        this.removeElement();
        parent && parent.removeChild(this[0]);
        return this;
    };

    /*@
    removeElement <f> Clean up after removal from DOM
        This gets invoked on .remove()
    @*/
    Ox.Element.prototype.removeElement = function removeElement(includeChildren) {
        if (includeChildren !== false) {
            this.findElements().forEach(function($element) {
                if (!$element) {
                    Ox.print(
                        '*** Found undefined descendant element,'
                        + ' this should never happen. ***'
                    );
                    return;
                }
                $element.removeElement(false);
            });
        }
        Ox.Focus.removeElement(this.oxid);
        this.self(_).unbindKeyboard();
        this.$tooltip && this.$tooltip.remove();
        delete Ox.$elements[this.oxid];
        // If setElement($element) was used, delete $element too
        delete Ox.$elements[this.$element.oxid];
        return this;
    };

    Ox.Element.prototype.replace = function replace() {
        arguments[0].removeElement();
        this.$element.replace.apply(this.$element, arguments);
        return this;
    };

    Ox.Element.prototype.replaceWith = function replaceWith() {
        this.removeElement();
        this.$element.replaceWith.apply(this.$element, arguments);
        return this;
    };

    /*@
    setElement <f> Sets the element to the element of another element object
        This is useful if an element has specific options, but uses another
        generic element as its DOM representation
        ($element) -> <o> This element object
    @*/
    Ox.Element.prototype.setElement = function setElement($element) {
        this.findElements().forEach(function($element) {
            $element.removeElement(false);
        });
        this.$element.replaceWith($element);
        if ($element.$element) { // $element is Ox.Element
            this.$element = $element.$element;
            this.$element.oxid = $element.oxid;
            this.$newElement = $element;
        } else { // $element is jQuery Element
            this.$element = $element;
        }
        this.$element.addClass('OxElement').data({oxid: this.oxid});
        this[0] = $element[0];
        return this;
    };

    /*@
    siblingElements <f> Gets all sibling element objects
        () -> <[o]> Array of element objects
    @*/
    Ox.Element.prototype.siblingElements = function siblingElements() {
        return Ox.compact(
            Ox.slice(this.siblings())
                .filter(Ox.UI.isElement)
                .map(Ox.UI.getElement)
        );
    };

    Ox.Element.prototype.text = function text() {
        var ret;
        this.childrenElements().forEach(function($element) {
            $element.removeElement();
        });
        ret = this.$element.text.apply(this, arguments);
        return arguments.length == 0 ? ret : this;
    };

    /*@
    toggleOption <f> Toggle boolean option(s)
        (key[, key[, ...]]) -> <o> This element object
    @*/
    Ox.Element.prototype.toggleOption = function toggleOption() {
        var options = {}, self = this.self(_);
        Ox.slice(arguments).forEach(function(key) {
            options[key] == !self.options[key];
        });
        return this.options(options);
    };

    /*@
    triggerEvent <f> Triggers all handlers for one or more events
        (event) -> <o> This element object
            Triggers an event
        (event, data) -> <o> This element object
            Triggers an event with data
        ({event: data, ...}) -> <o> This element object
            Triggers one or more events with data
        event <s> Event name
        data <o> Event data (key/value pairs)
    @*/
    Ox.Element.prototype.triggerEvent = function triggerEvent() {
        Ox.Event.trigger.apply(
            this, [this.self(_)].concat(Ox.slice(arguments))
        );
        return this;
    };

    /*@
    triggerMessage <f> Triggers all handlers for one or more messages
        (message) -> <o> This element object
            Triggers an event
        (message, data) -> <o> This element object
            Triggers a message with data
        ({message: data, ...}) -> <o> This element object
            Triggers one or more messages with data
        message <s> Message name
        data <o> Message data (key/value pairs)
    @*/
    Ox.Element.prototype.triggerMessage = function triggerMessage() {
        var self = this.self(_);
        if (self.options.element == '<iframe>') {
            Ox.Message.trigger.apply(this, [self].concat(Ox.slice(arguments)));
        }
        return this;
    };

    /*@
    unbindEvent <f> Removes event handler(s)
        () -> <o> This element object
            Removes all handlers.
        (callback) -> <o> This element object
            Removes a specific catch-all handler
        (event) -> <o> This element object
            Removes all handlers for a single event (to remove all catch-all
            handlers, pass '*' as event)
        (event, callback) -> <o> This element object
            Removes a specific handler for a single event
        ({event: callback}, ...) -> <o> This element object
            Removes specific handlers for one or more events
        event <s> Event name
        callback <f> Event handler
    @*/
    Ox.Element.prototype.unbindEvent = function unbindEvent() {
        Ox.Event.unbind.apply(this, [this.self(_)].concat(Ox.slice(arguments)));
        return this;
    };

    /*@
    unbindMessage <f> Removes message handler(s)
        () -> <o> This element
            Removes all handlers.
        (callback) -> <o> This element object
            Removes a specific catch-all handler
        (message) -> <o> This element object
            Removes all handlers for a single message (to remove all catch-all
            handlers, pass '*' as message)
        (message, callback) -> <o> This element object
            Removes a specific handler for a single event
        ({message: callback}, ...) -> <o> This element object
            Removes specific handlers for one or more messages
        message <s> Message name
        callback <f> Message handler
    @*/
    Ox.Element.prototype.unbindMessage = function unbindMessage() {
        var self = this.self(_);
        if (self.options.element == '<iframe>') {
            Ox.Message.unbind.apply(this, [self].concat(Ox.slice(arguments)));
        }
        return this;
    };

    /*@
    update <f> Adds one or more handlers for options updates
        (callback) -> <o> This element object
        (key, callback) -> <o> This element object
        ({key: callback, ...}) -> <o> This element object
    @*/
    Ox.Element.prototype.update = function update() {
        var callbacks, self = this.self(_);
        if (Ox.isFunction(arguments[0])) {
            self.updateCallbacks.push(arguments[0]);
        } else {
            callbacks = Ox.makeObject(arguments);
            self.updateCallbacks.push(function(key, value) {
                if (callbacks[key]) {
                    return callbacks[key](value);
                }
            });
        }
        return this;
    };

    /*@
    value <f> Shortcut to get or set self.options.value
        () -> <*> Value
        (value) -> <o> This element object
        value <*> Value
    @*/
    Ox.Element.prototype.value = function value() {
        return this.options(
            arguments.length == 0 ? 'value' : {value: arguments[0]}
        );
    };

}({}));
