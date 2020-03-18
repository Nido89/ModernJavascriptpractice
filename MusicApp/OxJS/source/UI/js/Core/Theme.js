'use strict';

/*@
Ox.Theme <f> get/set theme
    ()      -> <s>  Get current theme
    (theme) -> <s>  Set current theme
    theme <s>   name of theme
@*/

Ox.Theme = (function() {

    var localStorage = Ox.localStorage('Ox'),
        that = function(theme) {
            return theme ? setTheme(theme) : getTheme();
        };

    function getTheme() {
        var classNames = Ox.$body.attr('class'),
            theme = '';
        classNames && Ox.forEach(classNames.split(' '), function(className) {
            if (Ox.startsWith(className, 'OxTheme')) {
                theme = className.replace('OxTheme', '');
                theme = theme[0].toLowerCase() + theme.slice(1);
                return false; // break
            }
        });
        return theme;
    }

    function renderElement(value, type) {
        var $element, background, color, data = that.getThemeData(), saturation;
        if (type == 'hue') {
            background = Ox.rgb(value, 1, data.themeBackgroundLightness);
            color = Ox.rgb(value, 1, data.themeColorLightness);
        } else if (type == 'saturation') {
            background = Ox.range(7).map(function(i) {
                return Ox.rgb(i * 60, value, data.themeBackgroundLightness);
            });
            color = Ox.rgb(0, 0, data.themeColorLightness);
        } else if (type == 'lightness') {
            background = Ox.range(3).map(function() {
                return Math.round(value * 255);
            });
            color = Ox.range(3).map(function() {
                return Math.round(value * 255) + (value < 0.5 ? 128 : -128);
            });
        } else if (type == 'gradient') {
            saturation = value === null ? 0 : 1;
            background = Ox.range(2).map(function(i) {
                return Ox.rgb(value || 0, saturation, data.themeBackgroundLightness).map(function(value) {
                    return (value || 0) + (i == 0 ? 16 : -16);
                });
            });
            color = Ox.rgb(value || 0, saturation, data.themeColorLightness);
        }
        $element = $('<div>')
            .addClass(
                'OxColor'
                + (type == 'lightness' ? '' : ' OxColor' + Ox.toTitleCase(type))
            )
            .css({
                color: 'rgb(' + color.join(', ') + ')'
            })
            .data(type == 'lightness' ? {} : {OxColor: value});
        if (Ox.isNumber(background[0])) {
            $element.css({
                background: 'rgb(' + background.join(', ') + ')'
            });
        } else {
            ['moz', 'o', 'webkit'].forEach(function(browser) {
                $element.css({
                    background: '-' + browser + '-linear-gradient('
                        + (background.length == 2 ? 'top' : 'left') + ', '
                        + background.map(function(rgb, i) {
                            return 'rgb(' + rgb.join(', ') + ') '
                                + Math.round(i * 100 / (background.length - 1)) + '%';
                        }).join(', ')
                        + ')'
                });
            });
        }
        return $element;
    };

    function setTheme(theme) {
        var currentTheme = getTheme();
        if (theme != currentTheme && Ox.contains(that.getThemes(), theme)) {
            Ox.$body
                .addClass(
                    'OxTheme'
                    + theme[0].toUpperCase()
                    + theme.substr(1)
                )
                .removeClass(
                    'OxTheme'
                    + currentTheme[0].toUpperCase()
                    + currentTheme.substr(1)
                );
            $('.OxColor').each(function() {
                var $element = $(this);
                if ($element.hasClass('OxColorName')) {
                    $element.attr({src: Ox.UI.getImageURL(
                        $element.data('OxImage'), $element.data('OxColor'), theme
                    )});
                } else {
                    Ox.forEach(['hue', 'saturation', 'gradient'], function(type) {
                        if ($element.hasClass('OxColor' + Ox.toTitleCase(type))) {
                            var value = $element.data('OxColor'),
                                $element_ = renderElement(value, type);
                            $element.css({
                                background: $element_.css('background'),
                                color: $element_.css('color')
                            });
                            return false; // break
                        }
                    });
                }
            });
            $('img').add('input[type="image"]').not('.OxColor')
                .each(function(element) {
                    var $element = $(this),
                        data = Ox.UI.getImageData($element.attr('src'));
                    data && $element.attr({
                        src: Ox.UI.getImageURL(data.name, data.color, theme)
                    });
                });
        }
        localStorage({theme: theme});
        return that;
    }

    /*@
    getThemes <f> Returns the names of all available themes
        () -> <[s]> Theme names
    @*/
    that.getThemes = function() {
        return Object.keys(Ox.UI.THEMES);
    };

    /*@
    getThemeData <f> Returns data for a given theme, or for the current theme
        ([theme]) -> <o> Theme data
        theme <s> Theme name
    @*/
    that.getThemeData = function(theme) {
        return Ox.UI.THEMES[theme || Ox.Theme()];
    };

    /*@
    formatColor <f> Returns a themed colored element
    @*/
    that.formatColor = function(value, type) {
        return renderElement(value, type)
            .css({textAlign: 'center'})
            .html(value === null ? '' : Ox.formatNumber(value, 3));
    };

    /*@
    formatColorLevel <f> Returns a themed colored element
    @*/
    that.formatColorLevel = function(index, values, hueRange) {
        hueRange = hueRange || (Ox.isBoolean(index) ? [0, 120] : [120, 0]);
        var step = (hueRange[1] - hueRange[0]) / (values.length - 1),
            hue = hueRange[0] + index * step;
        return renderElement(hue, 'gradient')
            .css({textAlign: 'center'})
            .html(values[+index]);
    };

    /*@
    formatColorPercent <f> Returns a themed colored element
    @*/
    that.formatColorPercent = function(value, decimals, sqrt) {
        var hue = (sqrt ? Math.sqrt(value) * 10 : value) * 1.2;
        return renderElement(hue, 'gradient')
            .css({textAlign: 'center'})
            .html(Ox.formatNumber(value, decimals) + '%')
    };

    /*@
    getColorImage <f> Returns a themed colored image
    @*/
    that.getColorImage = function(name, value, tooltip) {
        return (tooltip ? Ox.Element({element: '<img>', tooltip: tooltip}) : $('<img>')) 
            .addClass('OxColor OxColorName')
            .attr({src: Ox.UI.getImageURL(name, value)})
            .data({OxColor: value, OxImage: name});
    };

    return that;

}());
