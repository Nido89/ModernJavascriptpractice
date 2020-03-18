'use strict';

Ox.documentReady(function() {
    // FIXME: use Ox.$foo everywhere!
    //@ Ox.$body <o> jQuery-wrapped body
    Ox.$body = $('body');
    //@ Ox.$document <o> jQuery-wrapped document
    Ox.$document = $(document);
    //@ Ox.$head <o> jQuery-wrapped head
    Ox.$head = $('head');
    //@ Ox.$window <o> jQuery-wrapped window
    Ox.$window = $(window);
});

//@ Ox.$elements <o> Reference to all Ox Elements
Ox.$elements = {};

//@ Ox.UI.DIMENSIONS <o> Names of horizontal and vertical dimensions
Ox.DIMENSIONS = Ox.UI.DIMENSIONS = {
    horizontal: ['width', 'height'],
    vertical: ['height', 'width']
};

//@ Ox.UI.EDGES <o> Names of horizontal and vertical edges
Ox.EDGES = Ox.UI.EDGES = {
    horizontal: ['left', 'right', 'top', 'bottom'],
    vertical: ['top', 'bottom', 'left', 'right']
};

//@ Ox.UI.SCROLLBAR_SIZE <n> Size of scrollbars
Ox.SCROLLBAR_SIZE = Ox.UI.SCROLLBAR_SIZE = $.browser.webkit ? 8 : (function() {
    var inner = Ox.$('<p>').css({
            height: '200px',
            width: '100%'
        }),
        outer = Ox.$('<div>').css({
            height: '150px',
            left: 0,
            overflow: 'hidden',
            position: 'absolute',
            top: 0,
            visibility: 'hidden',
            width: '200px'
        }).append(inner).appendTo($('body')),
        width = inner[0].offsetWidth;
    outer.css({overflow: 'scroll'});
    width = 1 + width - (inner[0].offsetWidth == width
        ? outer[0].clientWidth : inner[0].offsetWidth);
    outer.remove();
    return Math.max(width + width % 2, 8);
})();

//@ Ox.UI.PATH <str> Path of Ox UI
Ox.UI.PATH = Ox.PATH + 'UI/';

/*@
Ox.UI.getImageData <f> Returns properties of an Ox UI image
    (url) -> <s> Image Name
@*/
Ox.UI.getImageData = Ox.cache(function(url) {
    var str = 'data:image/svg+xml;base64,';
    return Ox.startsWith(url, str)
        ? JSON.parse(atob(url.split(',')[1]).match(/<!--(.+?)-->/)[1])
        : null;
});

/*@
Ox.UI.getImageURL <f> Returns the URL of an Ox UI image
    (name[, color[, theme]]) -> <s> Image URL
    name <s> Image name
    color <s|[n]> Color name or RGB values
    theme <s> Theme name
@*/
Ox.UI.getImageURL = Ox.cache(function(name, color, theme) {
    var colorName,
        colors = {
            marker: {
                '#000000': 'videoMarkerBorder',
                '#FFFFFF': 'videoMarkerBackground'
            },
            symbol: {
                '#FF0000': 'symbolWarningColor'
            }
        },
        image = Ox.UI.IMAGES[name],
        themeData,
        type = Ox.toDashes(name).split('-')[0];
    color = color || 'default';
    theme = theme || Ox.Theme();
    themeData = Ox.Theme.getThemeData(theme);
    if (type == 'symbol') {
        if (Ox.isString(color)) {
            colorName = color;
            color = themeData[
                'symbol' + color[0].toUpperCase() + color.slice(1) + 'Color'
            ];
        }
        image = image.replace(/#808080/g, '#' + Ox.toHex(color));
    }
    Ox.forEach(colors[type], function(name, hex) {
        image = image.replace(
            new RegExp(hex, 'g'),
            '$' + Ox.toHex(themeData[name])
        );
    });
    image = image.replace(/\$/g, '#');
    return 'data:image/svg+xml;base64,' + btoa(
        image + '<!--' + JSON.stringify(Ox.extend(color ? {
            color: colorName
        } : {}, {
            name: name, theme: theme
        })) + '-->'
    );
}, {
    key: function(args) {
        args[1] = args[1] || 'default';
        args[2] = args[2] || Ox.Theme();
        return JSON.stringify(args);
    }
});

//@ Ox.UI.getElement <f> Returns the Ox.Element of a DOM element, or `undefined`
Ox.UI.getElement = function(element) {
    return Ox.$elements[$(element).data('oxid')];
};

/*@
Ox.UI.hideScreen <f> Hide and remove Ox UI loading screen
@*/
Ox.UI.hideScreen = function() {
    Ox.UI.LoadingScreen.hide();
};

//@ Ox.UI.isElement <f> Returns `true` if a DOM element is an Ox.Element
Ox.UI.isElement = function(element) {
    return !!$(element).data('oxid');
};
