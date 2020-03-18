/*
This example shows elements that are editable inline &mdash; either a span or a
div.
*/
'use strict';

Ox.load('UI', function() {

    var $box = Ox.Element()
            .attr({id: 'box'})
            .appendTo(Ox.$body);

    Ox.loop(1, 4, function(i) {
        Ox.$('<span>')
            .addClass('label')
            .html((i > 1 ? '&nbsp;' : '') + 'SPAN #' + i + ':&nbsp;')
            .appendTo($box);
        Ox.EditableContent({
                editing: i == 1,
                placeholder: 'Placeholder',
                tooltip: 'Doubleclick to edit'
            })
            .bindEvent({
                submit: function(data) {
                    Ox.print(data.value);
                }
            })
            .appendTo($box);
    });
    
    Ox.$('<div>')
        .addClass('label')
        .html('DIV')
        .appendTo($box);
    Ox.EditableContent({
            placeholder: 'Placeholder',
            tooltip: function(e) {
                var $target = $(e.target);
                return $target.is('a') || $target.parents('a').length
                    ? 'Shift+doubleclick to edit' : 'Doubleclick to edit';
            },
            type: 'div',
            value: 'This is a <a href="http://google.com">link</a>.'
        })
        .css({width: '512px'})
        .bindEvent({
            submit: function(data) {
                Ox.print(data.value);
            }
        })
        .appendTo($box);

});
