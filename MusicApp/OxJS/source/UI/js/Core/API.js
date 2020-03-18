'use strict';

/*@
Ox.API <f> Remote API controller
    options <o> Options object
        timeout  <n|60000>   request timeout
        url      <s>         request url
    callback <f> called once api discover is done
    ([options, ] callback) -> <o> API controller
        api <f> Remote API discovery (calls the API's `api` method)
            (callback) -> <n> Request id
            callback <f> Callback functions
            .* <f> Remote API method call
                ([data, [age, ]]callback) -> <n> Request id
                data <o> Request data
                age <n|-1> Max-age in ms (0: not from cache, -1: from cache)
                callback <f> Callback function
        cancel <f> Cancels a request
            (id) -> <u> undefined
            id <n> Request id
@*/

Ox.API = function(options, callback) {

    var self = {
            options: Ox.extend({
                timeout: 60000,
                type: 'POST',
                url: '/api/'
            }, options || {}),
            time: new Date()
        },
        that = {
            api: function(callback) {
                return Ox.Request.send({
                    url: self.options.url,
                    data: {action: 'api'},
                    callback: callback
                });
            },
            cancel: function(id) {
                Ox.Request.cancel(id);
            }
        };

    $.ajaxSetup({
        timeout: self.options.timeout,
        type: self.options.type,
        url: self.options.url
    });

    that.api(function(result) {
        Ox.forEach(result.data.actions, function(val, key) {
            that[key] = function(/*data, age, callback*/) {
                var data = {}, age = -1, callback = null;
                Ox.forEach(arguments, function(argument) {
                    var type = Ox.typeOf(argument);
                    if (type == 'object') {
                        data = argument;
                    } else if (type == 'number') {
                        age = argument;
                    } else if (type == 'function') {
                        callback = argument;
                    }
                });
                return Ox.Request.send(Ox.extend({
                    age: age,
                    callback: callback,
                    data: {
                        action: key,
                        data: JSON.stringify(data)
                    },
                    url: self.options.url
                }, !val.cache ? {age: 0} : {}));
            };
        });
        callback && callback(that);
    });

    return that;

};
