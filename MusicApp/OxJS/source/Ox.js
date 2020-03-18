'use strict';

(function(global) {

    global.Ox = {

        load: function() {

            var args = arguments,
                callback = args[args.length - 1],
                path = getPath(),
                regexp = /dev\/$/,
                version = +new Date();

            if (args[0] === true && regexp.test(path)) {
                path = path.replace(regexp, 'min/');
                loadScript('Ox.js', function() {
                    Ox.MODE = 'min';
                    Ox.PATH = path;
                    Ox.load.apply(null, Ox.slice(args, 1));
                });
            } else {
                loadJSON(function(data) {
                    var previousOx = global.Ox;
                    version = data.version;
                    loadScriptsSerial(data.files, function() {
                        Ox.LOCALES = data.locales;
                        Ox.VERSION = data.version;
                        Ox.forEach(previousOx, function(value, key) {
                            if (Ox.isUndefined(Ox[key])) {
                                Ox[key] = value;
                            }
                        });
                        Ox.load.apply(null, args);
                    });
                });
            }

            function getPath() {
                var index, regexp = /Ox\.js(\?\d+|)$/,
                    scripts = document.getElementsByTagName('script'), src;
                for (index = scripts.length - 1; index >= 0; index--) {
                    src = scripts[index].src;
                    if (regexp.test(src)) {
                        return src.replace(regexp, '');
                    }
                }
            }

            function loadJSON(callback) {
                var request = new XMLHttpRequest(),
                    time = +new Date();
                request.open('GET', path + 'Ox/json/Ox.json?' + time, true);
                request.onreadystatechange = function() {
                    if (request.readyState == 4) {
                        if (request.status == 200) {
                            callback(JSON.parse(request.responseText));
                        }
                    }
                };
                request.send();
            }

            function loadScript(script, callback) {
                var element = document.createElement('script'),
                    head = document.head
                        || document.getElementsByTagName('head')[0]
                        || document.documentElement;
                element.onload = element.onreadystatechange = function() {
                    if (
                        !this.readyState
                        || this.readyState == 'loaded'
                        || this.readyState == 'complete'
                    ) {
                        callback();
                    }
                }
                element.src = path + script + '?' + version;
                element.type = 'text/javascript';
                head.appendChild(element);
            }

            function loadScriptsParallel(scripts, callback) {
                var i = 0, n = scripts.length;
                while (scripts.length) {
                    loadScript(scripts.shift(), function() {
                        ++i == n && callback();
                    });
                }
            }

            function loadScriptsSerial(scripts, callback) {
                loadScriptsParallel(scripts.shift(), function() {
                    if (scripts.length) {
                        loadScriptsSerial(scripts, callback);
                    } else {
                        callback();
                    }
                });
            }

        }

    };

}(this));
