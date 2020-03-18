'use strict';

/*@
Ox.DateInput <f> DateInput Element
    options <o> Options object
        format <s|short> format can be short, medium, long
        value <d> date value, defaults to current date
        weekday <b|false> weekday
        width <o> width of individual input elements, in px
            day <n> width of day input element
            month <n> width of month input element
            weekday <n> width of weekday input element
            year <n> width of year input element
    self <o>    Shared private variable
    ([options[, self]]) -> <o:Ox.InputGroup> DateInput Element
        change <!> triggered on change of value
@*/
Ox.DateInput = function(options, self) {

    var that;
    self = Ox.extend(self || {}, {
        options: Ox.extend({
            format: 'short',
            value: Ox.formatDate(new Date(), '%F'),
            weekday: false,
            width: {
                day: 32,
                month: options && options.format == 'long' ? 80
                    : options && options.format == 'medium' ? 40 : 32,
                weekday: options && options.format == 'long' ? 80 : 40,
                year: 48
            }
        }, options || {})
    });

    self.formats = {
        day: '%d',
        month: self.options.format == 'short' ? '%m' :
                (self.options.format == 'medium' ? '%b' : '%B'),
        weekday: self.options.format == 'long' ? '%A' : '%a',
        year: '%Y'
    };
    self.months = self.options.format == 'long' ? Ox.MONTHS : Ox.SHORT_MONTHS;
    self.weekdays = self.options.format == 'long' ? Ox.WEEKDAYS : Ox.SHORT_WEEKDAYS;

    self.$input = Ox.extend(self.options.weekday ? {
        weekday: Ox.Input({
                autocomplete: self.weekdays,
                autocompleteReplace: true,
                autocompleteReplaceCorrect: true,
                id: 'weekday',
                width: self.options.width.weekday
            })
            .bindEvent('autocomplete', changeWeekday)
    } : {}, {
        day: Ox.Input({
                autocomplete: Ox.range(1, Ox.getDaysInMonth(
                    parseInt(Ox.formatDate(self.date, '%Y'), 10),
                    parseInt(Ox.formatDate(self.date, '%m'), 10)
                ) + 1).map(function(i) {
                    return self.options.format == 'short' ? Ox.pad(i, 2) : i.toString();
                }),
                autocompleteReplace: true,
                autocompleteReplaceCorrect: true,
                id: 'day',
                textAlign: 'right',
                width: self.options.width.day
            })
            .bindEvent('autocomplete', changeDay),
        month: Ox.Input({
                autocomplete: self.options.format == 'short' ? Ox.range(1, 13).map(function(i) {
                    return Ox.pad(i, 2);
                }) : self.months,
                autocompleteReplace: true,
                autocompleteReplaceCorrect: true,
                id: 'month',
                textAlign: self.options.format == 'short' ? 'right' : 'left',
                width: self.options.width.month
            })
            .bindEvent('autocomplete', changeMonthOrYear),
        year: Ox.Input({
                autocomplete: Ox.range(1900, 3000).concat(Ox.range(1000, 1900)).map(function(i) {
                    return i.toString();
                }),
                autocompleteReplace: true,
                autocompleteReplaceCorrect: true,
                id: 'year',
                textAlign: 'right',
                width: self.options.width.year
            })
            .bindEvent('autocomplete', changeMonthOrYear)
    });

    that = Ox.InputGroup(Ox.extend(self.options, {
        id: self.options.id,
        inputs: [].concat(self.options.weekday ? [
            self.$input.weekday
        ] : [], self.options.format == 'short' ? [
            self.$input.year, self.$input.month, self.$input.day
        ] : [
            self.$input.month, self.$input.day, self.$input.year
        ]),
        join: join,
        separators: [].concat(self.options.weekday ? [
            {title: self.options.format == 'short' ? '' : ',', width: 8},
        ] : [], self.options.format == 'short' ? [
            {title: '-', width: 8}, {title: '-', width: 8}
        ] : [
            {title: '', width: 8}, {title: ',', width: 8}
        ]),
        split: split,
        width: 0
    }), self);

    function changeDay() {
        self.options.weekday && self.$input.weekday.value(
            Ox.formatDate(new Date([
                self.$input.month.value(),
                self.$input.day.value(),
                self.$input.year.value()
            ].join(' ')), self.formats.weekday)
        );
        self.options.value = join();
    }

    function changeMonthOrYear() {
        var day = self.$input.day.value(),
            month = self.$input.month.value(),
            year = self.$input.year.value(),
            days = Ox.getDaysInMonth(year, self.options.format == 'short' ? parseInt(month, 10) : month);
        day = day <= days ? day : days;
        //Ox.Log('Form', year, month, 'day days', day, days)
        self.options.weekday && self.$input.weekday.value(
            Ox.formatDate(
                new Date([month, day, year].join(' ')),
                self.formats.weekday
            )
        );
        self.$input.day.options({
            autocomplete: Ox.range(1, days + 1).map(function(i) {
                return self.options.format == 'short' ? Ox.pad(i, 2) : i.toString();
            }),
            value: self.options.format == 'short' ? Ox.pad(parseInt(day, 10), 2) : day.toString()
        });
        self.options.value = join();
    }

    function changeWeekday() {
        var date = getDateInWeek(
            self.$input.weekday.value(),
            self.$input.month.value(),
            self.$input.day.value(),
            self.$input.year.value()
        );
        self.$input.month.value(date.month);
        self.$input.day.options({
            autocomplete: Ox.range(1, Ox.getDaysInMonth(date.year, date.month) + 1).map(function(i) {
                    return self.options.format == 'short' ? Ox.pad(i, 2) : i.toString();
                }),
            value: date.day
        });
        self.$input.year.value(date.year);
        self.options.value = join();
    }

    function getDate(value) {
        return new Date(self.options.value.replace(/-/g, '/'));
    }

    function getDateInWeek(weekday, month, day, year) {
        //Ox.Log('Form', [month, day, year].join(' '))
        var date = new Date([month, day, year].join(' '));
        date = Ox.getDateInWeek(date, weekday);
        return {
            day: Ox.formatDate(date, self.formats.day),
            month: Ox.formatDate(date, self.formats.month),
            year: Ox.formatDate(date, self.formats.year)
        };
    }

    function getValues() {
        var date = getDate();
        return {
            day: Ox.formatDate(date, self.formats.day),
            month: Ox.formatDate(date, self.formats.month),
            weekday: Ox.formatDate(date, self.formats.weekday),
            year: Ox.formatDate(date, self.formats.year)
        };
    }

    function join() {
        return Ox.formatDate(new Date(self.options.format == 'short' ? [
            self.$input.year.value(),
            self.$input.month.value(),
            self.$input.day.value()
        ].join('/') : [
            self.$input.month.value(),
            self.$input.day.value(),
            self.$input.year.value()
        ].join(' ')), '%F');
    }

    function split() {
        var values = getValues();
        return [].concat(self.options.weekday ? [
            values.weekday
        ] : [], self.options.format == 'short' ? [
            values.year, values.month, values.day
        ] : [
            values.month, values.day, values.year
        ]);
    }

    return that;

};
