'use strict';

/*@
Ox.IconItem <f> IconItem Object
    options <o> Options object
        borderRadius <n|0> Border radius for icon images
        find <s|''> String to be highlighted
        iconHeight <n|128> Icon height
        iconWidth <n|128> Icon width
        imageHeight <n|128> Icon image height
        imageWidth <n|128> Icon image width
        id <s> Element id
        info <s> Icon info
        size <n|128> Icon size
        title <s> Title
        url <s> Icon url
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.Element> IconItem Object
@*/

Ox.IconItem = function(options, self) {

    //Ox.Log('List', 'IconItem', options, self)

    self = self || {};
    var that = Ox.Element({}, self)
            .defaults({
                borderRadius: 0,
                extra: null,
                find: '',
                iconHeight: 128,
                iconWidth: 128,
                imageHeight: 128,
                imageWidth: 128,
                itemHeight: 192,
                itemWidth: 128,
                id: '',
                info: '',
                title: '',
                url: ''
            })
            .options(options || {});

    Ox.extend(self, {
        fontSize: self.options.itemWidth == 64 ? 6 : 9,
        infoIsObject: Ox.isObject(self.options.info),
        lineLength: self.options.itemWidth == 64 ? 15 : 23,
        lines: self.options.itemWidth == 64 ? 4 : 5,
        url: Ox.UI.PATH + 'png/transparent.png'
    });

    self.title = formatText(self.options.title, self.lines - 1 - self.infoIsObject, self.lineLength);
    if (!self.infoIsObject) {
        self.info = formatText(self.options.info, 5 - self.title.split('<br/>').length, self.lineLength);
    } else {
        self.title = $('<div>').css({fontSize: self.fontSize + 'px'}).html(self.title);
        self.info = $('<div>').append(
            self.options.info.css(Ox.extend(self.options.info.css('width') == '0px' ? {
                width: Math.round(self.options.itemWidth / 2) + 'px'
            } : {}, {
                padding: 0,
                margin: '1px auto',
                fontSize: self.fontSize + 'px',
                textShadow: 'none'
            }))
        );
    }

    that.css({
        // 2 * 2 px margin (.css), 2 * 2 px border (here)
        width: self.options.itemWidth + 4 + 'px',
        height: self.options.itemHeight + + 4 + 'px'
    });
    that.$icon = $('<div>')
        .addClass('OxIcon')
        .css({
            top: (self.options.iconWidth == 64 ? -64 : -122) + 'px',
            width: self.options.iconWidth + 4 + 'px',
            height: self.options.iconHeight + 4 + 'px'
        });
    that.$iconImage = $('<img>')
        .addClass('OxLoading OxTarget')
        .attr({
            src: self.url
        })
        .css({
            width: self.options.imageWidth + 'px',
            height: self.options.imageHeight + 'px',
            borderRadius: self.options.borderRadius + 4 + 'px'
        })
        .mousedown(mousedown)
        .mouseenter(mouseenter)
        .mouseleave(mouseleave);
    self.options.url && that.$iconImage.one('load', load);
    that.$textBox = $('<div>')
        .addClass('OxText')
        .css({
            top: self.options.iconHeight - (self.options.itemWidth == 64 ? 32 : 62) + 'px',
            width: self.options.itemWidth + 4 + 'px',
            height: (self.options.itemWidth == 64 ? 30 : 58) + 'px'
        });
    that.$text = $('<div>')
        .addClass('OxTarget')
        .css({
            fontSize: self.fontSize + 'px'
        })
        .mouseenter(mouseenter)
        .mouseleave(mouseleave);
    if (!self.infoIsObject) {
        that.$text.html(
            (self.title ? self.title + '<br/>' : '')
            + '<span class="OxInfo">' + self.info + '</span>'
        );
    } else {
        that.$text.append(self.title).append(self.info);
    }
    that.$reflection = $('<div>')
        .addClass('OxReflection')
        .css({
            top: self.options.iconHeight + (self.options.itemWidth == 64 ? 0 : 2) + 'px',
            width: self.options.itemWidth + 4 + 'px',
            height: self.options.itemHeight - self.options.iconHeight + 'px'
        });
    that.$reflectionImage = $('<img>')
        .addClass('OxLoading')
        .attr({
            src: self.url
        })
        .css({
            width: self.options.imageWidth + 'px',
            height: self.options.imageHeight + 'px',
            // firefox is 1px off when centering images with odd width and scaleY(-1)
            paddingLeft: ($.browser.mozilla && self.options.imageWidth % 2 ? 1 : 0) + 'px',
            borderRadius: self.options.borderRadius + 'px'
        });
    that.$gradient = $('<div>')
        .css({
            // `+2` is a temporary fix for https://code.google.com/p/chromium/issues/detail?id=167198
            width: self.options.itemWidth + 2 + 'px',
            height: self.options.itemWidth / 2 + 'px'
        });

    that.append(
        that.$reflection.append(
            that.$reflectionImage
        ).append(
            that.$gradient
        )
    ).append(
        that.$textBox.append(
            that.$text
        )
    ).append(
        that.$icon.append(
            that.$iconImage
        )
    );

    if (self.options.extra) {
        that.$extra = $('<div>')
            .addClass('OxTarget')
            .css({
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                width: self.options.imageWidth + 'px',
                height: self.options.imageHeight + 'px',
                border: '2px solid transparent',
                margin: 'auto',
                cursor: 'pointer',
                overflow: 'hidden'
            })
        that.$icon.append(
            that.$extra.append(
                self.options.extra
            )
        );
    }

    function formatText(text, maxLines, maxLength) {
        text = Ox.isArray(text) ? text.join(', ') : text;
        var lines = Ox.wordwrap(text, maxLength, true).split('\n');
        // if the text has too many lines, replace the last line with the
        // truncated rest (including the last line) and discard all extra lines
        if (lines.length > maxLines) {
            lines[maxLines - 1] = Ox.truncate(
                lines.slice(maxLines - 1).join(''), 'center', maxLength
            ).replace('…', '<span class="OxLight">…</span>');
            lines = lines.slice(0, maxLines);
        }
        return Ox.highlight(
            lines.join('<br/>'), self.options.find, 'OxHighlight', true
        );
    }

    function load() {
        that.$iconImage.attr({
                src: self.options.url
            })
            .one('load', function() {
                that.$iconImage.removeClass('OxLoading');
                that.$reflectionImage
                    .attr({
                        src: self.options.url
                    })
                    .removeClass('OxLoading');
            });
    }

    function mousedown(e) {
        // fixme: preventDefault keeps image from being draggable in safari - but also keeps the list from getting focus
        // e.preventDefault();
    }

    function mouseenter() {
        that.addClass('OxHover');
    }

    function mouseleave() {
        that.removeClass('OxHover');
    }

    return that;

};
