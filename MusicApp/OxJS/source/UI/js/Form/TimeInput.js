'use strict';

/*@
Ox.TimeInput <f> TimeInput Object
    options <o> Options object
        ampm <b|false> 24h/ampm
        seconds <b|false> show seconds
        milliseconds <b|false> show milliseconds
        value <d> value, defaults to current time
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.InputGroup> TimeInput Object
@*/

Ox.TimeInput = function(options, self) {

    // fixme: seconds get set even if options.seconds is false
    var that;
    self = Ox.extend(self || {}, {
        options: Ox.extend({
            ampm: false,
            seconds: false,
            milliseconds: false,
            value: (function() {
                var date = new Date();
                return Ox.formatDate(
                    date,
                    options && (options.seconds || options.milliseconds) ? '%T' : '%H:%M'
                ) + (options && options.milliseconds ? '.' + Ox.pad(date % 1000, 3) : '');
            }()), 
            width: {
                hours: 32,
                minutes: 32,
                seconds: 32,
                milliseconds: 40,
                ampm: 32
            }
        }, options || {})
    });

    self.options.seconds = self.options.seconds || self.options.milliseconds;

    self.$input = {
        hours: Ox.Input({
            autocomplete: (self.options.ampm ? Ox.range(1, 13) : Ox.range(0, 24)).map(function(i) {
                return Ox.pad(i, 2);
            }),
            autocompleteReplace: true,
            autocompleteReplaceCorrect: true,
            id: 'hours',
            textAlign: 'right',
            width: self.options.width.hours
        }),
        minutes: Ox.Input({
            autocomplete: Ox.range(0, 60).map(function(i) {
                return Ox.pad(i, 2);
            }),
            autocompleteReplace: true,
            autocompleteReplaceCorrect: true,
            id: 'minutes',
            textAlign: 'right',
            width: self.options.width.minutes
        }),
        seconds: Ox.Input({
            autocomplete: Ox.range(0, 60).map(function(i) {
                return Ox.pad(i, 2);
            }),
            autocompleteReplace: true,
            autocompleteReplaceCorrect: true,
            id: 'seconds',
            textAlign: 'right',
            width: self.options.width.seconds
        }),
        milliseconds: Ox.Input({
            autocomplete: Ox.range(0, 1000).map(function(i) {
                return Ox.pad(i, 3);
            }),
            autocompleteReplace: true,
            autocompleteReplaceCorrect: true,
            id: 'milliseconds',
            textAlign: 'right',
            width: self.options.width.milliseconds
        }),
        ampm: Ox.Input({
            autocomplete: ['AM', 'PM'],
            autocompleteReplace: true,
            autocompleteReplaceCorrect: true,
            id: 'ampm',
            width: self.options.width.ampm
        })
    };

    that = Ox.InputGroup(Ox.extend(self.options, {
        id: self.options.id,
        inputs: [].concat([
            self.$input.hours,
            self.$input.minutes,
        ], self.options.seconds ? [
            self.$input.seconds
        ] : [], self.options.milliseconds ? [
            self.$input.milliseconds
        ] : [], self.options.ampm ? [
            self.$input.ampm
        ] : []),
        join: join,
        separators: [].concat([
            {title: ':', width: 8},
        ], self.options.seconds ? [
            {title: ':', width: 8}
        ] : [], self.options.milliseconds ? [
            {title: '.', width: 8}
        ] : [], self.options.ampm ? [
            {title: '', width: 8}
        ] : []),
        split: split,
        value: self.options.value,
        width: 0
    }), self);

    function getDate() {
        return new Date('1970/01/01 ' + (
            self.options.milliseconds
                ? self.options.value.slice(0, -4)
                : self.options.value
        ));
    }

    function getValues() {
        var date = getDate();
        return {
            ampm: Ox.formatDate(date, '%p'),
            hours: Ox.formatDate(date, self.options.ampm ? '%I' : '%H'),
            milliseconds: self.options.milliseconds ? self.options.value.slice(-3) : '000',
            minutes: Ox.formatDate(date, '%M'),
            seconds: Ox.formatDate(date, '%S')
        };
    }

    function join() {
        return Ox.formatDate(
            new Date(
                '1970/01/01 ' + [
                    self.$input.hours.value(),
                    self.$input.minutes.value(),
                    self.options.seconds ? self.$input.seconds.value() : '00'
                ].join(':') + (
                    self.options.ampm ? ' ' + self.$input.ampm.value() : ''
                )
            ),
            (
                self.options.seconds ? '%T' : '%H:%M'
            ) + (
                self.options.milliseconds ? '.' + self.$input.milliseconds.value() : ''
            )
        );
    }

    function split(value) {
        var values = getValues();
        return [].concat([
            values.hours,
            values.minutes,
        ], self.options.seconds ? [
            values.seconds
        ] : [], self.options.milliseconds ? [
            values.milliseconds
        ] : [], self.options.ampm ? [
            values.ampm
        ] : []);
    }

    return that;

};
