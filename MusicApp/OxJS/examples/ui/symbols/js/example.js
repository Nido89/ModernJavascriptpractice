/*
This example shows the symbols that come with `Ox.UI`.
*/

'use strict';

Ox.load('UI', function() {

    var groups = [
            ['equal', 'add', 'remove', 'close', 'center', 'focus'],
            ['arrowLeft', 'arrowRight', 'arrowUp', 'arrowDown'],
            ['left', 'right', 'up', 'down'],
            [
                'play', 'pause', 'playPrevious', 'playNext',
                'playInToOut', 'goToIn', 'goToOut', 'setIn', 'setOut',
                'goToPoster', 'setPoster'
            ],
            ['open', 'grow', 'shrink', 'fill', 'fit'],
            [
                'repeatNone', 'repeatOne', 'repeatAll',
                'shuffleAll', 'shuffleNone'
            ],
            ['unmute', 'volumeUp', 'volumeDown', 'mute'],
            [
                'bookmark', 'chat', 'check', 'click', 'delete', 'edit', 'embed',
                'find', 'flag', 'like', 'locate', 'mail', 'map', 'publish',
                'star', 'tag', 'view'
            ],
            [
                'file', 'files', 'directory',
                'volume', 'mount', 'unmount', 'sync'
            ],
            ['audio', 'book', 'data', 'video'],
            [
                'list', 'playlist', 'columns',
                'grid', 'gridLandscape', 'gridPortrait',
                'gridLandscapePortrait', 'gridPortraitLandscape',
                'iconlist', 'iconlistLandscape', 'iconlistPortrait'
            ],
            ['info', 'warning', 'help'],
            ['select', 'set'],
            ['undo', 'redo'],
            ['upload', 'download'],
            ['unlock', 'lock'],
            ['copyright', 'noCopyright'],
            ['circle', 'square'],
            ['bracket', 'clock', 'home', 'icon', 'switch', 'user']
        ],
        symbols = Ox.flatten(groups),
        $menu = Ox.Bar({size: 48}),
        $main = Ox.Container(),
        $buttons = $('<div>').addClass('buttons').appendTo($menu),
        $symbols = $('<div>').addClass('symbols').appendTo($main);

    groups.forEach(function(symbols) {
        Ox.ButtonGroup({
                buttons: symbols.map(function(symbol) {
                    return {
                        id: symbol,
                        title: symbol,
                        tooltip: symbol
                    };
                }),
                type: 'image'
            })
            .appendTo($buttons);
    });
    symbols.forEach(function(symbol) {
        Ox.Element({tooltip: symbol})
            .addClass('OxGrid symbol')
            .append(
                $('<img>').attr({src: Ox.UI.getImageURL(
                    'symbol' + symbol[0].toUpperCase() + symbol.slice(1))
                })
            )
            .appendTo($symbols);
    });

    Ox.SplitPanel({
            elements: [
                {element: $menu, size: 48},
                {element: $main}
            ],
            orientation: 'vertical'
        })
        .appendTo(Ox.$body);

});
