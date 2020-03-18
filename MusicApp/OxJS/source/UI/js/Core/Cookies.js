Ox.Cookies = function() {
    var name, value, cookies;
    if (arguments.length == 1) {
        name = arguments[0];
        return Ox.Cookies()[name];
    } else if (arguments.length == 2) {
        name = arguments[0];
        value = arguments[1];
        document.cookie = name + '=' + encodeURIComponent(value);
    } else {
        value = {}
        if (document.cookie && document.cookie != '') {
            document.cookie.split('; ').forEach(function(cookie) {
                name = cookie.split('=')[0];
                value[name] = Ox.decodeURIComponent(cookie.substring(name.length + 1));
            });
        }
        return value;
    }
}
