'use strict';

/*@
Ox.Fullscreen <o> Fullscreen controller
    bind <f> Add a fullscreen event handler
        event <s> Event name ('change', 'enter' or 'exit')
        handler <f> Event handler
            state <b> Fullscreen state (present in case of a 'change' event)
    bindOnce <f> Add a fullscreen event handler that will run only once
        event <s> Event name ('change', 'enter' or 'exit')
        handler <f> Event handler
            state <b> Fullscreen state (present in case of a 'change' event)
    enter <f> Enter fullscreen
    exit <f> Exit fullscreen
    getState <f> Get fullscreen state (true, false or undefined)
    toggle <f> Toggle fullscreen
    unbind <f> Remove a fullscreen event handler
        event <s> Event name ('change', 'enter' or 'exit')
        handler <f> Event handler
@*/

Ox.Fullscreen = (function() {

    var documentElement = document.body,
        enter = document.body.requestFullscreen
            || document.body.mozRequestFullScreen
            || document.body.webkitRequestFullscreen,
        exit = document.exitFullscreen
            || document.mozCancelFullScreen
            || document.webkitExitFullscreen,
        state = 'fullscreen' in document ? 'fullscreen'
            : 'mozFullScreen' in document ? 'mozFullScreen'
            : 'webkitIsFullScreen' in document ? 'webkitIsFullScreen'
            : void 0,
        handlers = {
            '': {'change': [], 'enter': [], 'exit': []},
            'once': {'change': [], 'enter': [], 'exit': []}
        },
        types = Object.keys(handlers),
        that = {};

    [
        'fullscreenchange', 'mozfullscreenchange', 'webkitfullscreenchange'
    ].forEach(function(originalEvent) {
        document.addEventListener(originalEvent, change);
    });

    function bind(event, handler, once) {
        var type = once ? 'once' : '';
        if (
            handlers[type][event]
            && handlers[type][event].indexOf(handler) == -1
        ) {
            handlers[type][event].push(handler);
        }
    }

    function change() {
        var state = that.getState(),
            events = ['change'].concat(state ? 'enter' : 'exit'),
            unbind = [];
        types.forEach(function(type) {
            events.forEach(function(event) {
                handlers[type][event].forEach(function(handler) {
                    event == 'change' ? handler(state) : handler();
                    type == 'once' && unbind.push(
                        {event: event, handler: handler}
                    );
                });
            });
        });
        unbind.forEach(function(value) {
            that.unbind(value.event, value.handler, true);
        });
    };

    function unbind(event, handler, once) {
        var index;
        [once ? ['once'] : types].forEach(function(type) {
            if (handlers[type][event]) {
                while ((index = handlers[type][event].indexOf(handler)) > -1) {
                    handlers[type][event].splice(index, 1);
                }
            }
        });        
    }

    that.available = document.fullscreenEnabled
        || document.webkitFullscreenEnabled
        || document.mozFullScreenEnabled
        || false;

    that.bind = function(event, handler) {
        bind(event, handler);
    };

    that.bindOnce = function(event, handler) {
        bind(event, handler, true);
    };

    that.enter = function(element) {
        var element = element || document.body;
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
        }
        // FIXME: Why does storing the function in a variable not work?
        // enter && enter();
        // ^ Missing `this` binding
        that.element = element
    };

    that.exit = function() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen()
        }
        // FIXME: Why does storing the function in a variable not work?
        // exit && exit();
        // ^ Missing `this` binding
        delete that.element
    };

    that.getState = function() {
        return document[state];
    };

    that.toggle = function() {
        var state = that.getState();
        if (state === false) {
            that.enter();
        } else if (state === true) {
            that.exit();
        }
    };

    that.unbind = function(event, handler) {
        unbind(event, handler);
    };

    return that;

}());
