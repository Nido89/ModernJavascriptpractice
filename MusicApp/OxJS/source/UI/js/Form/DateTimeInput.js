'use strict';

/*@
Ox.DateTimeInput <f> DateTimeInput Element
    options <o> Options object
        ampm <b|false> false is 24h true is am/pm
        format <s|short> options are short, medium, long
        seconds <b|false> show seconds
        value <d> defautls to now
        weekday <b|false> weekday
    self <o>    Shared private variable
    ([options[, self]]) -> <o:Ox.InputGroup> DateTimeInput Element
        change <!> triggered on change of value
@*/

Ox.DateTimeInput = function(options, self) {

    var that;
    self = Ox.extend(self || {}, {
        options: Ox.extend({
            ampm: false,
            format: 'short',
            milliseconds: false,
            seconds: false,
            value: (function() {
                var date = new Date();
                return Ox.formatDate(
                    date,
                    '%F ' + (options && (options.seconds || options.milliseconds) ? '%T' : '%H:%M')
                ) + (options && options.milliseconds ? '.' + Ox.pad(date % 1000, 3) : '');
            }()),            
            weekday: false
        }, options || {})
    });

    self.options.seconds = self.options.seconds || self.options.milliseconds;

    that = Ox.InputGroup(Ox.extend(self.options, {
        inputs: [
            Ox.DateInput({
                format: self.options.format,
                id: 'date',
                weekday: self.options.weekday
            }),
            Ox.TimeInput({
                ampm: self.options.ampm,
                id: 'time',
                seconds: self.options.seconds
            })
        ],
        join: join,
        separators: [
            {title: '', width: 8}
        ],
        split: split
    }), self);

    function join() {
        return that.options('inputs').map(function($input) {
            return $input.value();
        }).join(' ');
    }

    function split() {
        return self.options.value.split(' ');
    }

    return that;

};
