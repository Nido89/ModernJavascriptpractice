'use strict';

Ox.load.UI = function(options, callback) {

    options = Ox.extend({
        hideScreen: true,
        loadCSS: true,
        loadThemes: true,
        showScreen: false,
        theme: 'oxlight'
    }, options);

    var browsers = [
            {
                name: 'Chrome Frame',
                url: 'http://www.google.com/chromeframe/'
            },
            {
                name: 'Chrome',
                regexp: /Chrome\/(\d+)\./,
                url: 'http://www.google.com/chrome/',
                version: 10
            },
            {
                name: 'Firefox',
                regexp: /Firefox\/(\d+)\./,
                url: 'http://www.mozilla.org/firefox/',
                version: 4
            },
            {
                name: 'Safari',
                regexp: /Version\/(\d+).*? Safari/,
                url: 'http://www.apple.com/safari/',
                version: 5
            },
            {
                name: 'WebKit',
                regexp: /AppleWebKit\/(\d+)\./,
                version: 534
            },
            {
                name: 'Googlebot',
                regexp: /Googlebot\/(\d+)\./,
                version: 2
            },
            {
                name: 'YandexBot',
                regexp: /YandexBot\/(\d+)\./,
                version: 3
            },
            {
                name: 'YandexMobileBot',
                regexp: /YandexMobileBot\/(\d+)\./,
                version: 3
            },
            {
                name: 'Internet Explorer',
                url: 'http://windows.microsoft.com/en-US/internet-explorer/products/ie/home',
                version: 9
            }
        ],
        browserSupported = false,
        isInternetExplorer = /MSIE/.test(navigator.userAgent);

    browsers.forEach(function(browser) {
        var match = browser.regexp && browser.regexp.exec(navigator.userAgent);
        if (match && match[1] >= browser.version) {
            browserSupported = true;
        }
    });

    Ox.UI = {};

    Ox.UI.LoadingScreen = (function() {

        var $body = Ox.$('body'),
            $screen = Ox.$('<div>')
                .addClass('OxLoadingScreen')
                .css({
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    right: 0,
                    bottom: 0,
                    padding: '4px',
                    background: 'rgb(' + (
                        options.theme == 'oxlight' ? '240, 240, 240'
                            : options.theme == 'oxmedium' ? '144, 144, 144'
                            : '16, 16, 16'
                    ) + ')',
                    opacity: 1,
                    zIndex: 1000
                }),
            css = {
                position: 'absolute',
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
                margin: 'auto',
                MozUserSelect: 'none',
                WebkitUserSelect: 'none'
            },
            loadingInterval,
            $icon,
            deg = 0;

        browserSupported ? showIcon() : showWarning();

        function showIcon() {
            /*
            // SVG transform performs worse than CSS transform
            var src = Ox.PATH + 'UI/themes/' + options.theme + '/svg/symbolLoadingAnimated.svg'
            Ox.getFile(src, function() {
                Ox.$('<img>')
                    .attr({
                        src: src
                    })
                    .css(Ox.extend({
                        width: '32px',
                        height: '32px'
                    }, css))
                    .on({
                        mousedown: function(e) {
                            e.preventDefault();
                        }
                    })
                    .appendTo(div);
            });
            */
            var src = Ox.PATH + 'UI/themes/' + options.theme + '/svg/symbolLoading.svg'
            Ox.getFile(src, function() {
                $icon = Ox.$('<img>')
                    .attr({
                        src: src
                    })
                    .css(Ox.extend({
                        width: '32px',
                        height: '32px'
                    }, css))
                    .on({
                        mousedown: function(e) {
                            e.preventDefault()
                        }
                    })
                    .appendTo($screen);
            });
        }

        function showWarning() {
            var counter = 0;
            browsers = browsers.filter(function(browser) {
                return browser.url;
            });
            isInternetExplorer ? browsers.pop() : browsers.shift();
            browsers.forEach(function(browser) {
                browser.src = Ox.PATH + 'UI/png/browser' + browser.name.replace(' ', '') + '128.png';
                Ox.getFile(browser.src, function() {
                    ++counter == browsers.length && showIcons();
                });
            });
            function showIcons() {
                var $box = Ox.$('<div>')
                    .css(Ox.extend({
                        width: (browsers.length * 72) + 'px',
                        height: '72px'
                    }, css))
                    .appendTo($screen);
                browsers.forEach(function(browser, i) {
                    Ox.$('<a>')
                        .attr({
                            href: browser.url,
                            title: (
                                browser.name == 'Chrome Frame'
                                ? Ox._('Install') : Ox._('Download')
                            ) + ' ' + browser.name
                        })
                        .css({
                            position: 'absolute',
                            left: (i * 72) + 'px',
                            width: '72px',
                            height: '72px'
                        })
                        .append(
                            Ox.$('<img>')
                                .attr({
                                    src: browser.src
                                })
                                .css(Ox.extend({
                                    width: '64px',
                                    height: '64px',
                                    border: 0,
                                    cursor: 'pointer'
                                }, css))
                                .on({
                                    mousedown: function(e) {
                                        e.preventDefault();
                                    }
                                })
                        )
                        .appendTo($box);
                });
            }
        }

        return {
            hide: function() {
                $('.OxLoadingScreen').animate({
                    opacity: browserSupported ? 0 : 0.9
                }, 1000, function() {
                    if (browserSupported) {
                        clearInterval(loadingInterval);
                        loadingInterval = null;
                        $screen.remove();
                    } else {
                        $screen.on({
                            click: function() {
                                $screen.remove();
                            }
                        });
                    }
                });
            },
            show: function() {
                if (!loadingInterval) {
                    loadingInterval = setInterval(function() {
                        if ($icon) {
                            deg = (deg + 30) % 360;
                            $icon.css({
                                MozTransform: 'rotate(' + deg + 'deg)',
                                OTransform: 'rotate(' + deg + 'deg)',
                                WebkitTransform: 'rotate(' + deg + 'deg)',
                                transform: 'rotate(' + deg + 'deg)'
                            });
                        }
                    }, 83);
                }
                $screen.appendTo($body);
            }
        };

    }());

    Ox.documentReady(function() {
        Ox.$('body').addClass('OxTheme' + Ox.toTitleCase(options.theme));
        options.showScreen && Ox.UI.LoadingScreen.show();
    });

    loadUI();

    function loadUI() {

        var path = Ox.PATH + 'UI/jquery/jquery.js?' + Ox.VERSION;
        Ox.getFile(path, function() {
            path = Ox.PATH + 'UI/json/UI.json?' + Ox.VERSION;
            Ox.getJSON(path, function(data) {
                var counter = 0, length;
                if (!options.loadCSS) {
                    data.files = data.files.filter(function(file) {
                        return !Ox.endsWith(file, '.css');
                    });
                }
                if (!options.loadThemes) {
                    data.files = data.files.filter(function(file) {
                        return !Ox.contains(file, '/themes/');
                    });
                }
                length = data.files.length;
                Ox.UI.IMAGES = data.images;
                Ox.UI.THEMES = {};
                data.files.forEach(function(file) {
                    path = Ox.PATH + file + '?' + Ox.VERSION;
                    if (/\.jsonc$/.test(file)) {
                        Ox.getJSONC(path, function(data) {
                            var theme = /\/themes\/(\w+)\/json\//.exec(file)[1];
                            Ox.UI.THEMES[theme] = data;
                            ++counter == length && initUI();
                        });
                    } else {
                        Ox.getFile(path, function() {
                            ++counter == length && initUI();
                        });
                    }
                });
            });
        });

    }

    function initUI() {

        Ox.documentReady(function() {
            // fixme: is this the right place to do this?
            $.browser.mozilla && Ox.$document.on('dragstart', function() {
                 return false;
            });
            if (options.showScreen && options.hideScreen) {
                Ox.UI.LoadingScreen.hide();
            }
            callback(browserSupported);
        });

    }

};
