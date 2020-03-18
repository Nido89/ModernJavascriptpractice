'use strict';

(function() {

    var log, translations = {};

    /*@
    Ox.getLocale <f> Returns locale
        () -> <s> Locale (like 'de' or 'fr')
    @*/
    Ox.getLocale = function() {
        return Ox.LOCALE;
    };

    /*@
    Ox.setLocale <f> Sets locale
        (locale[, url], callback)
        locale <s> Locale (like 'de' or 'fr')
        url <s|[s]> one or more URLs of JSON file with additional translations
        callback <f> Callback function
            success <b> If true, locale has been set
    @*/
    Ox.setLocale = function(locale, url, callback) {
        var isValidLocale = Ox.contains(Object.keys(Ox.LOCALE_NAMES), locale),
            urls = [];
        if (arguments.length == 2) {
            callback = arguments[1];
            url = null;
        }
        if (isValidLocale) {
            Ox.LOCALE = locale;
            if (locale == 'en') {
                translations = {};
                callback(true);
            } else {
                translations = {};
                Ox.forEach(Ox.LOCALES, function(locales, module) {
                    if (
                        (module == 'Ox' || Ox.load[module])
                        && Ox.contains(locales, locale)
                    ) {
                        urls.push([
                            Ox.PATH + module + '/json/locale.'
                            + locale + '.json'
                        ]);
                    }
                });
                url && Ox.makeArray(url).forEach(function(value) {
                    urls.push(Ox.makeArray(value));
                });
                Ox.getJSON(urls, function(data) {
                    Ox.forEach(data, function(values, url) {
                        Ox.extend(translations, values);
                    });
                    callback(true);
                });
            }
        } else {
            callback(false);
        }
    };

    /*@
    Ox._ <f> Localizes a string
        (string[, options]) -> <s> Localized string
        string <s> English string
        options <o> Options passed to Ox.formatString
    @*/
    Ox._ = function(value, options) {
        var translation = translations[value];
        log && log(value, translation);
        translation = translation || value || '';
        return Ox.formatString(translation, options);
    };

    /*@
    Ox._.log <f> Registers a logging function
        (callback) -> <u> undefined
        callback <f> Callback function
            english <s> English string
            translation <s> Translated string
    @*/
    Ox._.log = function(callback) {
        log = callback;
    };

})();
