(function() {

    var chars = {
            comma: ',',
            dot: '.',
            minus: '-',
            quote: '\'',
            semicolon: ';',
            slash: '/',
            space: ' '
        },
        keyboardCallbacks = {},
        keyboardEventRegExp = /^key(\.[\w\d.]+)?$/,
        keys = '',
        keysEventRegExp = new RegExp(
            '^[\\w\\d](\\.numpad)?$|^(' + Object.keys(chars).join('|') + ')$'
        ),
        resetTimeout,
        triggerTimeout;

    function bind(options) {
        var args = Ox.slice(arguments, 1),
            callbacks = options.callbacks,
            that = this,
            oxid = that.oxid || 0;
        Ox.forEach(
            Ox.isFunction(args[0]) ? {'*': args[0]} : Ox.makeObject(args),
            function(originalCallback, event) {
                event = event.replace(/^key_/, 'key.');
                callbacks[event] = (callbacks[event] || []).concat(
                    options.once ? function callback() {
                        unbind.call(
                            that, {callbacks: callbacks}, event, callback
                        );
                        return originalCallback.apply(null, arguments);
                    }
                    : originalCallback
                );
                if (isKeyboardEvent(event)) {
                    keyboardCallbacks[oxid] = (
                        keyboardCallbacks[oxid] || []
                    ).concat(event);
                }
            }
        );
        return this;
    }

    function isKeyboardEvent(event) {
        return keyboardEventRegExp.test(event);
    }

    function isKeysEventKey(key) {
        return keysEventRegExp.test(key);
    }

    function onMessage(e) {
        var element, message = {};
        try {
            message = Ox.extend({data: {}}, JSON.parse(e.data));
        } catch (e) {}
        if (message.event == 'init') {
            if (message.data.oxid) {
                // The inner window receives the oxid of the outer iframe element
                Ox.oxid = message.data.oxid;
                Ox.$parent.postMessage('init', {})
            } else if (message.target) {
                // The outer window receives init from iframe
                Ox.$elements[message.target].triggerEvent('init');
            }
        } else {
            (message.target ? Ox.$elements[message.target] : Ox.$parent)
                .triggerMessage(message.event, message.data);
        }
    }

    function onKeydown(e) {
        var $element = Ox.Focus.focusedElement(),
            isInput = Ox.Focus.focusedElementIsInput(),
            keyName = Ox.KEYS[e.keyCode] || ('keyCode' + e.keyCode),
            keyBasename = keyName.split('.')[0],
            key = Object.keys(Ox.MODIFIER_KEYS).filter(function(key) {
                return e[key] && Ox.MODIFIER_KEYS[key] != keyBasename;
            }).map(function(key) {
                return Ox.MODIFIER_KEYS[key];
            }).concat(keyName).join('_'),
            event = 'key.' + key,
            triggerEvent = function() {
                if ($element) {
                    $element.triggerEvent.apply($element, arguments);
                } else if (!isInput) {
                    Ox.Event.trigger.apply(
                        Ox.$body, [{}].concat(Ox.slice(arguments))
                    );
                }
            };
        triggerEvent(event, e);
        if (!isInput) {
            if (isKeysEventKey(key)) {
                // don't register leading spaces or trailing double spaces
                if (keyName != 'space' || (
                    keys != '' && !Ox.endsWith(keys, ' ')
                )) {
                    keys += chars[keyName] || keyBasename;
                    // clear the trigger timeout only if the key registered
                    clearTimeout(triggerTimeout);
                    triggerTimeout = setTimeout(function() {
                        triggerEvent('keys', Ox.extend(e, {keys: keys}));
                    }, 250);
                }
            }
            // clear the reset timeout even if the key didn't register
            clearTimeout(resetTimeout);
            resetTimeout = setTimeout(function() {
                keys = '';
            }, 1000);
            if ((
                keyboardCallbacks[0]
                && Ox.contains(keyboardCallbacks[0], event)
            ) || (
                $element && keyboardCallbacks[$element.oxid]
                && Ox.contains(keyboardCallbacks[$element.oxid], event)
            )) {
                // if there is a global handler for this keyboard event, or a
                // handler on the focused element, then prevent default
                e.preventDefault();
            }
        }
    }

    function trigger(options) {
        var args = Ox.slice(arguments, 1),
            callbacks = options.callbacks,
            that = this;
        Ox.forEach(Ox.makeObject(args), function(data, originalEvent) {
            var events = originalEvent.split('.'),
                triggerGlobally = !isKeyboardEvent(originalEvent)
                    || !Ox.Focus.focusedElementIsInput();
            ['*'].concat(events.map(function(event, index) {
                return events.slice(0, index + 1).join('.');
            })).forEach(function(event) {
                (triggerGlobally ? callbacks[0][event] || [] : [])
                    .concat(callbacks[1][event] || [])
                    .forEach(function(callback) {
                        callback.call(that, data, originalEvent, that);
                    });
            });
        });
        return this;
    }

    function unbind(options) {
        var args = Ox.slice(arguments, 1),
            callbacks = options.callbacks,
            oxid = this.oxid || 0;
        if (args.length == 0) {
            // unbind all handlers for all events
            callbacks = [];
        } else {
            Ox.forEach(
                Ox.isFunction(args[0]) ? {'*': args[0]}
                    : Ox.makeObject(args),
                function(callback, event) {
                    if (!callback) {
                        // unbind all handlers for this event
                        delete callbacks[event];
                    } else if (callbacks[event]) {
                        // unbind this handler for this event
                        callbacks[event] = callbacks[event].filter(
                            function(eventCallback) {
                                return eventCallback !== callback;
                            }
                        );
                        if (callbacks[event].length == 0) {
                            delete callbacks[event];
                        }
                    }
                    if (isKeyboardEvent(event)) {
                        var index = keyboardCallbacks[oxid].indexOf(event);
                        keyboardCallbacks[oxid].splice(
                            keyboardCallbacks[oxid].indexOf(event), 1
                        )
                        if (keyboardCallbacks[oxid].length == 0) {
                            delete keyboardCallbacks[oxid];
                        }
                    }
                }
            );
        }
        return this;
    }

    /*@
    Ox.$parent <o> Proxy to be used by iframes for messaging with outer window
    @*/
    Ox.$parent = (function() {

        var self = {messageCallbacks: {}},
            that = {oxid: Ox.uid()};

        /*@
        bindMessage <f> Adds one or more message handlers
        @*/
        that.bindMessage = function() {
            return Ox.Message.bind.apply(
                this, [self].concat(Ox.slice(arguments))
            );
        };

        /*@
        bindMessageOnce <f> Adds one or more message handlers that run only once
        @*/
        that.bindMessageOnce = function() {
            return Ox.Message.bindOnce.apply(
                this, [self].concat(Ox.slice(arguments))
            );
        };

        /*@
        postMessage <f> Sends one or more messages
        @*/
        that.postMessage = function() {
            if (window !== window.top) {
                // There actually is an outer window
                if (!Ox.oxid) {
                    // Inner window has not received init message yet
                    self.initTime = self.initTime || new Date();
                    if (new Date() < self.initTime + 60000) {
                        setTimeout(function() {
                            that.postMessage.apply(that, arguments);
                        }, 250);
                    }
                } else {
                    return Ox.Message.post.apply(this, arguments);
                }
            }
        };

        /*@
        triggerMessage <f> Triggers all handlers for one or more messages
        @*/
        that.triggerMessage = function() {
            return Ox.Message.trigger.apply(
                this, [self].concat(Ox.slice(arguments))
            );
        };

        /*@
        unbindMessage <f> Removes one or more message handlers
        @*/
        that.unbindMessage = function() {
            return Ox.Message.unbind.apply(
                this, [self].concat(Ox.slice(arguments))
            );
        };

        return that;

    }());

    /*@
    Ox.Event <o> Event controller
    @*/
    Ox.Event = (function() {

        var callbacks = {},
            that = {};

        /*@
        bind <f> Adds one or more event handlers
            ([self, ]callback) -> <o> This method's `this` binding
                Adds a catch-all handler
            ([self, ]event, callback) -> <o> This method's `this` binding
                Adds a handler for a single event
            ([self, ]{event: callback, ...}) -> <o> This method's `this` binding
                Adds handlers for multiple events
            self <o> Object with `eventCallbacks` (`Ox.Element`'s `self`)
                If `self` is missing and this method is not rebound, then the
                handler is global and is not bound to a specific `Ox.Element`
            event <s> Event name
            callback <f> Callback function
                data <o> Event data (key/value pairs)
                event <s> Event name
                element <o> Element object (this method's `this` binding)
        @*/
        that.bind = function() {
            var isElement = this !== that;
            return bind.apply(this, [{
                callbacks: isElement ? arguments[0].eventCallbacks : callbacks
            }].concat(Ox.slice(arguments, isElement ? 1 : 0)));
        };

        /*@
        bindOnce <f> Adds one or more event handlers that run only once
            ([self, ]callback) -> <o> This method's `this` binding
                Adds a catch-all handler
            ([self, ]event, callback) -> <o> This method's `this` binding
                Adds a handler for a single event
            ([self, ]{event: callback, ...}) -> <o> This method's `this` binding
                Adds handlers for multiple events
            self <o> Object with `eventCallbacks` (`Ox.Element`'s `self`)
                If `self` is missing and this method is not rebound, then the
                handler is global and is not bound to a specific `Ox.Element`
            event <s> Event name
            callback <f> Callback function
                data <o> Event data (key/value pairs)
                event <s> Event name
                element <o> Element object (this method's `this` binding)
        @*/
        that.bindOnce = function() {
            var isElement = this !== that;
            return bind.apply(this, [{
                callbacks: isElement ? arguments[0].eventCallbacks : callbacks,
                once: true
            }].concat(Ox.slice(arguments, isElement ? 1 : 0)));
        };

        /*@
        trigger <f> Triggers all event handlers for one or more events
            ([self, ]event[, data]) -> <o> This method's `this` binding
                Triggers one event, with optional event data
            ([self, ]{event: data, ...}) -> <o> This method's `this` binding
                Triggers multiple events
            self <o> Object with `eventCallbacks` (`Ox.Element`'s `self`)
                If `self` is missing and this method is not rebound, then the
                handler is global and is not bound to a specific `Ox.Element`
            event <s> Event name
            data <o> Event data (key/value pairs)
        @*/
        that.trigger = function() {
            var isElement = this !== that;
            return trigger.apply(this, [{
                callbacks: [
                    callbacks,
                    isElement ? arguments[0].eventCallbacks || {} : {}
                ]
            }].concat(Ox.slice(arguments, isElement ? 1 : 0)));
        };

        /*@
        unbind <f> Removes one or more event handlers
            ([self]) -> <o> This method's `this` binding
                Unbinds all handlers
            ([self, ]callback) -> <o> This method's `this` binding
                Unbinds a catch-all handler
            ([self, ]event, callback) -> <o> This method's `this` binding
                Unbinds a handler for a single event
            ([self, ]{event: callback, ...}) -> <o> This method's `this` binding
                Unbinds handlers for multiple events
            self <o> Object with `eventCallbacks` (`Ox.Element`'s `self`)
                If `self` is missing and this method is not rebound, then the
                handler is global and is not bound to a specific `Ox.Element`
            event <s> Event name
            callback <f> Event handler
        @*/
        that.unbind = function() {
            var isElement = this !== that;
            return unbind.apply(this, [{
                callbacks: isElement ? arguments[0].eventCallbacks : callbacks
            }].concat(Ox.slice(arguments, isElement ? 1 : 0)));
        };

        return that;

    }());

    /*@
    Ox.Message <o> Message controller
    @*/
    Ox.Message = (function() {

        var callbacks = {},
            that = {};

        /*@
        bind <f> Adds one or more message handlers
            ([self, ]callback) -> <o> This method's `this` binding
                Adds a catch-all handler
            ([self, ]message, callback) -> <o> This method's `this` binding
                Adds a handler for a single message
            ([self, ]{message: callback, ...}) -> <o> This method's `this` binding
                Adds handlers for multiple messages
            self <o> Object with `messageCallbacks` (`Ox.Element`'s `self`)
                If `self` is missing and this method is not rebound, then the
                handler is bound to the outer window (via `Ox.$parent`)
            message <s> Message name
            callback <f> Callback function
                data <o> Message data (key/value pairs)
                message <s> Message name
                element <o> Element object (this method's `this` binding)
        @*/
        that.bind = function() {
            var isElement = this !== that;
            return bind.apply(this, [{
                callbacks: isElement ? arguments[0].messageCallbacks
                    : callbacks
            }].concat(Ox.slice(arguments, isElement ? 1 : 0)));
        };

        /*@
        bindOnce <f> Adds one or more message handlers that run only once
            ([self, ]callback) -> <o> This method's `this` binding
                Adds a catch-all handler
            ([self, ]message, callback) -> <o> This method's `this` binding
                Adds a handler for a single message
            ([self, ]{message: callback, ...}) -> <o> This method's `this` binding
                Adds handlers for multiple messages
            self <o> Object with `messageCallbacks` (`Ox.Element`'s `self`)
                If `self` is missing and this method is not rebound, then the
                handler is bound to the outer window (via `Ox.$parent`)
            message <s> Message name
            callback <f> Callback function
                data <o> Message data (key/value pairs)
                message <s> Message name
                element <o> Element object (this method's `this` binding)
        @*/
        that.bindOnce = function() {
            var isElement = this !== that;
            return bind.apply(this, [{
                callbacks: isElement ? arguments[0].messageCallbacks
                    : callbacks,
                once: true
            }].concat(Ox.slice(arguments, isElement ? 1 : 0)));
        };

        /*@
        post <f> Post a message into or out of an iframe
            (message[, data]) -> <o> This method's `this` binding
                Posts one message, with optional message data
            ({message: data, ...}) -> <o> This method's `this` binding
                Posts multiple messages
            message <s> Message name
            data <o> Message data (key/value pairs)
        @*/
        that.post = function() {
            var isParent = this == Ox.$parent,
                target = isParent ? window.parent : this[0].contentWindow;
            Ox.forEach(
                Ox.makeObject(Ox.slice(arguments)),
                function(data, event) {
                    target.postMessage(JSON.stringify({
                        data: data,
                        event: event,
                        target: isParent ? Ox.oxid : null
                    }), '*');
                }
            );
            return this;
        };

        /*@
        trigger <f> Triggers all message handlers for one or more messages
            ([self, ]message[, data]) -> <o> This method's `this` binding
                Triggers one message, with optional message data
            ([self, ]{message: data, ...}) -> <o> This method's `this` binding
                Triggers multiple messages
            self <o> Object with `eventCallbacks` (`Ox.Element`'s `self`)
                If `self` is missing and this method is not rebound, then the
                handler is global and is not bound to a specific `Ox.Element`
            message <s> Message name
            data <o> Message data (key/value pairs)
        @*/
        that.trigger = function() {
            var isElement = this !== that;
            return trigger.apply(this, [{
                callbacks: [
                    callbacks,
                    isElement ? arguments[0].messageCallbacks || {} : {}
                ]
            }].concat(Ox.slice(arguments, isElement ? 1 : 0)));
        };

        /*@
        unbind <f> Removes one or more message handlers
            ([self, ]callback) -> <o> This method's `this` binding
                Removes a catch-all handler
            ([self, ]message, callback) -> <o> This method's `this` binding
                Removes a handler for a single message
            ([self, ]{message: callback, ...}) -> <o> This method's `this` binding
                Removes handlers for multiple messages
            self <o> Object with `messageCallbacks` (`Ox.Element`'s `self`)
                If `self` is missing and this method is not rebound, then the
                handler is bound to the outer window (via `Ox.$parent`)
            message <s> Message name
            callback <f> Message handler
        @*/
        that.unbind = function() {
            var isElement = this !== that;
            return unbind.apply(this, [{
                callbacks: isElement ? arguments[0].messageCallbacks
                    : callbacks
            }].concat(Ox.slice(arguments, isElement ? 1 : 0)));
        };

        return that;

    }());

    document.addEventListener('keydown', onKeydown);
    window.addEventListener('message', onMessage);

}());
