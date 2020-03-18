'use strict';

/*@
Ox.App <f> Basic application instance that communicates with a JSON API
    options <o> Options object
        name <s> App name
        timeout <n> Request timeout
        type <s> HTTP Request type, i.e. 'GET' or 'POST'
        url <s> JSON API URL
    ([options]) -> <o> App object
        load <!> App loaded
@*/

Ox.App = function(options) {

    var self = {
            options: Ox.extend({
                name: 'App',
                socket: '',
                timeout: 60000,
                type: 'POST',
                url: '/api/'
            }, options || {}),
            time: new Date()
        },
        that = Ox.Element({}, Ox.extend({}, self));

    //@ api <o> API endpoint
    that.api = Ox.API({
        type: self.options.type,
        timeout: self.options.timeout,
        url: self.options.url
    }, function() {
        that.api.init(getUserData(), function(result) {
            that.triggerEvent({load: result.data});
        });
    });

    self.options.socket && connectSocket();

    //@ localStorage <f> Ox.localStorage instance
    that.localStorage = Ox.localStorage(self.options.name);

    function connectSocket() {
        that.socket = new WebSocket(self.options.socket);
        that.socket.onopen = function(event) {
            that.triggerEvent('open', event);
        };
        that.socket.onmessage = function(event) {
            var data = JSON.parse(event.data);
            that.triggerEvent(data[0], data[1]);
        };
        that.socket.onerror = function(event) {
            that.triggerEvent('error', event);
            that.socket.close();
        };
        that.socket.onclose = function(event) {
            that.triggerEvent('close', event);
            setTimeout(connectSocket, 1000);
        };
    }

    function getUserData() {
        return {
            document: {referrer: document.referrer},
            history: {length: history.length},
            location: {href: location.href},
            navigator: {
                cookieEnabled: navigator.cookieEnabled,
                plugins: Ox.slice(navigator.plugins).map(function(plugin) {
                    return plugin.name;
                }),
                userAgent: navigator.userAgent
            },
            screen: screen,
            time: (+new Date() - self.time) / 1000,
            window: {
                innerHeight: window.innerHeight,
                innerWidth: window.innerWidth,
                outerHeight: window.outerHeight,
                outerWidth: window.outerWidth,
                screenLeft: window.screenLeft,
                screenTop: window.screenTop
            }
        };
    }

    function update() {
        // ...
    }

    /*@
    options <f> Gets or sets options (see Ox.getset)
        () -> <o> All options
        (key) -> <*> The value of option[key]
        (key, value) -> <o> Sets one option, returns App object
        ({key: value, ...}) -> <o> Sets multiple options, returns App object
        key <s> The name of the option
        value <*> The value of the option
    @*/
    that.options = function() {
        return Ox.getset(self.options, arguments, update, that);
    };

    return that;

};
