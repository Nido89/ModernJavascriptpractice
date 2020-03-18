/*
This example demonstrates the mouse events that any Ox.Element fires.
*/

Ox.load('UI', function() {

    var $target = Ox.Element()
            .addClass('OxMonospace')
            .attr({id: 'target'})
            .html('click/hold/drag/scroll/swipe')
            .appendTo(Ox.$body),
        $log = Ox.Element()
            .attr({id: 'log'})
            .appendTo(Ox.$body),
        $clear = Ox.Element()
            .addClass('OxMonospace')
            .attr({id: 'clear'})
            .html('clear log')
            .bind({click: function() {
                $log.empty();
            }})
            .appendTo(Ox.$body);
    [
        'anyclick', 'singleclick', 'doubleclick', 'mousedown', 'mouserepeat',
        'dragstart', 'drag', 'dragenter', 'dragleave', 'dragpause', 'dragend',
        'mousewheel'
    ].forEach(function(event) {
        $target.bindEvent(event, function(e) {
            var date = new Date();
            $('<div>')
                .addClass('OxMonospace')
                .html(
                    Ox.formatDate(date, '%H:%M:%S')
                    + '.' + (Ox.pad(date % 1000, 3))
                    + ' <span style="font-weight: bold">' + event + '</span> '
                    + JSON.stringify(
                        Ox.extend('clientX' in e ? {
                            clientX: e.clientX,
                            clientY: e.clientY,
                        } : {}, 'clientDX' in e ? {
                            clientDX: e.clientDX,
                            clientDY: e.clientDY
                        } : {}, 'deltaX' in e ? {
                            deltaX: e.deltaX,
                            deltaY: e.deltaY,
                            deltaFactor: e.deltaFactor
                        } : {})
                    )
                    .replace(/"/g, '')
                    .replace(/,/g, ', ')
                    .replace(/:/g, ': ')
                )
                .prependTo($log);
        });
    });
});
