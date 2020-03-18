'use strict';

/*@
Ox.get <f> Get a remote resource
    (url, callback) -> <u> undefined
    url <s> Remote URL
    callback <f> Callback function
        data <s|null> The contents of the remote resource, or `null` on error
        error <o|null> Error, or `null` on success
            code <n> Status code
            text <s> Status text
@*/
Ox.get = function(url, callback) {
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
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

/*@
Ox.getAsync <f> Runs an asynchonous loader for an array of URLs
    (urls, get, callback) -> <u> undefined
    urls <s|[s]> URL or array of URLs or array of such arrays 
        Multiple URLs in the same array will be processed simultaneously, but
        multiple arrays of URLs will be processed sequentially
    get <f> Asynchronous function that loads a URL (for example Ox.get)
        url <s> URL
        callback <f> Callback function
            result <s|null> Result, or `null` on error
            error <o|null> Error, or `null` on success
                code <n> Status code
                text <s> Status text
    callback <f> Callback function
        result <*|o|null> Result(s), or `null` on error
            For multiple URLs, keys are URLs, values are results, `{}` on error
        error <o|null> Error(s), or `null` on success
            For multiple URLs, keys are URLs, values are errors, `{}` on success
            code <n> Error code (like `404`)
            text <s> Error text (like `'Not Found'`)
@*/
Ox.getAsync = function(urls, get, callback) {
    urls = Ox.makeArray(urls);
    var errors = {}, i = 0, n = urls.length, results = {};
    function done() {
        callback && callback(filter(results), filter(errors));
    }
    function extend(object, value, urls) {
        value !== null && Ox.extend.apply(null, [object].concat(
            urls.length === 1 ? [urls[0], value] : [value]
        ));
    }
    function filter(object) {
        return n == 1 ? object[urls[0]] : Ox.filter(object, function(value) {
            return value !== null;
        });
    }
    function getParallel() {
        urls.forEach(function(url) {
            get(url, function(result, error) {
                results[url] = result;
                errors[url] = error;
                ++i == n && done();
            });
        });
    }
    function getSerial() {
        var url = urls.shift();
        Ox.getAsync(url, get, function(result, error) {
            extend(results, result, url);
            extend(errors, error, url);
            urls.length ? getSerial() : done();
        });
    }
    urls.some(Ox.isArray) ? getSerial() : getParallel();
};

(function() {

    var cache = {},
        head = document.head
            || document.getElementsByTagName('head')[0]
            || document.documentElement;

    function getFile(type, url, callback) {
        var element, tagValue, typeValue, urlKey;
        if (!cache[url]) {
            if (!type) {
                type = Ox.parseURL(url).pathname.split('.').pop();
                type = type == 'css' ? 'stylesheet'
                    : type == 'js' ? 'script' : 'image';
            }
            if (type == 'image') {
                element = new Image();
                element.onerror = onError;
                element.onload = onLoad;
                element.src = url;
            } else {
                tagValue = type == 'script' ? 'script' : 'link';
                typeValue = type == 'script' ? 'text/javascript' : 'text/css';
                urlKey = type == 'script' ? 'src' : 'href';
                if (Ox.some(
                    document.getElementsByTagName(tagValue),
                    function(element) {
                        return element[urlKey] == url;
                    }
                )) {
                    onLoad();
                } else {
                    element = document.createElement(tagValue);
                    element.onerror = onError;
                    element.onload = element.onreadystatechange = onLoad;
                    element.type = typeValue;
                    element[urlKey] = url;
                    if (type == 'stylesheet') {
                        element.rel = 'stylesheet';
                    }
                    head.appendChild(element);
                }
                if (type == 'stylesheet') {
                    //fixme only call if browser does not support onload
                    // Safari 5 does not fire onload
                    waitForCSS();
                }
            }
        } else {
            callback(cache[url], null);
        }
        function onError() {
            callback(null, {code: 404, text: 'Not Found'});
        }
        function onLoad() {
            if (
                !this || !this.readyState
                || this.readyState == 'loaded' || this.readyState == 'complete'
            ) {
                // for an image, keep a reference to the element
                // to keep the image in the browser cache
                cache[url] = type == 'image' ? this : true;
                callback(cache[url], null);
            }
        }
        function waitForCSS() {
            var error = false;
            try {
                element.sheet.cssRule;
            } catch (e) {
                error = true;
                setTimeout(function() {
                    waitForCSS();
                }, 25);
            }
            !error && onLoad();
        }
    }

    function getFiles(type, urls, callback) {
        Ox.getAsync(urls, function(url, callback) {
            getFile(type, url, callback);
        }, callback);
    }

    /*@
    Ox.getFile <f> Loads a file (image, script or stylesheet)
        (file, callback) -> <u> undefined
        file <s|[s]> Local path or remote URL, or array of those, or array of such arrays
            Multiple files in the same array will be processed simultaneously,
            but multiple arrays of files will be processed in that order.
        callback <f> Callback function
            image <h> DOM element (if the file is an image)
    @*/
    Ox.getFile = function(url, callback) {
        getFiles(null, url, callback);
    };

    /*@
    Ox.getImage <f> Loads an image
        (file, callback) -> <u> undefined
        file <s|[s]> Local path or remote URL, or array of those, or array of such arrays
            Multiple files in the same array will be processed simultaneously,
            but multiple arrays of files will be processed in that order.
        callback <f> Callback function
            image <h> DOM element
    @*/
    Ox.getImage = function(url, callback) {
        getFiles('image', url, callback);
    };

    /*@
    Ox.getScript <f> Loads a script
        (file, callback) -> <u> undefined
        file <s|[s]> Local path or remote URL, or array of those, or array of such arrays
            Multiple files in the same array will be processed simultaneously,
            but multiple arrays of files will be processed in that order.
        callback <f> Callback function
    @*/
    Ox.getScript = function(url, callback) {
        getFiles('script', url, callback);
    };

    /*@
    Ox.getStylesheet <f> Loads a stylesheet
        (file, callback) -> <u> undefined
        file <s|[s]> Local path or remote URL, or array of those, or array of such arrays
            Multiple files in the same array will be processed simultaneously,
            but multiple arrays of files will be processed in that order.
        callback <f> Callback function
    @*/
    Ox.getStylesheet = function(url, callback) {
        getFiles('stylesheet', url, callback);
    };

}());

/*@
Ox.getJSON <f> Get and parse one or more remote JSON files
    (url, callback) -> <u> undefined
    url <s|[s]> One or more remote URLs
    callback <f> Callback function
        data <*|o|null> Parsed contents, or `null` on error
            For multiple URLs, keys are URLs, values are data, `{}` on error
        error <o|null> Error(s), or `null` on success
            For multiple URLs, keys are URLs, values are errors, `{}` on success
            code <n> Error code (like `404`)
            text <s> Error text (like `'Not Found'`)
@*/
Ox.getJSON = function(url, callback, isJSONC) {
    var urls = Ox.makeArray(url);
    Ox.getAsync(urls, function(url, callback) {
        Ox.get(url, function(data, error) {
            callback(JSON.parse(
                isJSONC ? Ox.minify(data || '') : data
            ), error);
        });
    }, callback);
};

/*@
Ox.getJSONC <f> Get and parse a remote JSONC file
    JSONC is JSON with JavaScript line or block comments
    (url, callback) -> <u> undefined
    url <s|[s]> One or more remote URLs
    callback <f> Callback function
        data <*|o|null> Parsed contents, or `null` on error
            For multiple URLs, keys are URLs, values are data, `{}` on error
        error <o|null> Error(s), or `null` on success
            For multiple URLs, keys are URLs, values are errors, `{}` on success
            code <n> Error code (like `404`)
            text <s> Error text (like `'Not Found'`)
@*/
Ox.getJSONC = function(url, callback) {
    Ox.getJSON(url, callback, true);
};

/*@
Ox.getJSONP <f> Get and parse one or more remote JSONP files
    (url, callback) -> <u> undefined
    url <s|[s]> One or more remote URLs
        {callback} gets replaced with jsonp callback function name
    callback <f> Callback function
        data <*|o|null> Parsed contents, or `null` on error
            For multiple URLs, keys are URLs, values are data, `{}` on error
        error <o|null> Error(s), or `null` on success
            For multiple URLs, keys are URLs, values are errors, `{}` on success
            code <n> Error code (like `404`)
            text <s> Error text (like `'Not Found'`)
@*/
Ox.getJSONP = function(url, callback) {
    var urls = Ox.makeArray(url);
    Ox.getAsync(urls, function(url, callback) {
        var id = 'callback' + Ox.uid();
        Ox.getJSONP[id] = function(data) {
            delete Ox.getJSONP[id];
            callback(data, null);
        };
        Ox.$('body').append(Ox.$('<script>').attr({
            'src': url.replace('{callback}', 'Ox.getJSONP.' + id),
            'type': 'text/javascript'
        }));
    }, callback);
};

/*@
Ox.post <f> post to a remote resource
    (url, data, callback) -> <u> undefined
    url <s> Remote URL
    data <s> data to send in post request
    callback <f> Callback function
        data <s|null> The contents of the remote resource, or `null` on error
        error <o|null> Error, or `null` on success
            code <n> Status code
            text <s> Status text
@*/
Ox.post = function(url, data, callback) {
    var request = new XMLHttpRequest();
    request.open('post', url, true);
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
    request.send(data);
};
