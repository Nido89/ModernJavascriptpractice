'use strict';

//@ Ox.getDate <f> Get the day of a date, optionally UTC
// see Ox.setSeconds for source code

/*@
Ox.getDateInWeek <f> Get the date that falls on a given weekday in the same week
    # Usage
    (date, weekday)      -> <d> Date
    (date, weekday, utc) -> <d> Date
    # Arguments
    date    <d> Date
    weekday <n|s> 1-7 (Monday-Sunday) or name, full ("Monday") or short ("Sun")
    utc     <b> If true, all dates are UTC
    # Examples
    > Ox.formatDate(Ox.getDateInWeek(new Date("January 1 2000"), "Sunday"), "%A, %B %e, %Y")
    "Sunday, January  2, 2000"
    > Ox.formatDate(Ox.getDateInWeek(new Date("Jan 1 2000"), "Fri"), "%A, %B %e, %Y")
    "Friday, December 31, 1999"
    > Ox.formatDate(Ox.getDateInWeek(new Date("1/1/2000"), 1), "%A, %B %e, %Y")
    "Monday, December 27, 1999"
@*/
// fixme: why is this Monday first? shouldn't it then be "getDateInISOWeek"??
Ox.getDateInWeek = function(date, weekday, utc) {
    date = Ox.makeDate(date);
    var sourceWeekday = Ox.getISODay(date, utc),
        targetWeekday = Ox.isNumber(weekday) ? weekday
            : Ox.indexOf(Ox.WEEKDAYS, function(v) {
                return v.slice(0, 3) == weekday.slice(0, 3);
            }) + 1;
    return Ox.setDate(date, Ox.getDate(date, utc) - sourceWeekday + targetWeekday, utc);
};

//@ Ox.getDay <f> Get the weekday of a date, optionally UTC
// see Ox.setSeconds for source code

/*@
Ox.getDayOfTheYear <f> Get the day of the year for a given date
    # Usage
    (date)      -> <d> Date
    (date, utc) -> <d> Date
    # Arguments
    date <d> Date
    utc  <b> If true, all dates are UTC
    # Examples
    > Ox.getDayOfTheYear(new Date("12/31/2000"))
    366
    > Ox.getDayOfTheYear(new Date("12/31/2002"))
    365
    > Ox.getDayOfTheYear(new Date("12/31/2004"))
    366
@*/
Ox.getDayOfTheYear = function(date, utc) {
    date = Ox.makeDate(date);
    var month = Ox.getMonth(date, utc),
        year = Ox.getFullYear(date, utc);
    return Ox.sum(Ox.range(month).map(function(i) {
        return Ox.getDaysInMonth(year, i + 1);
    })) + Ox.getDate(date, utc);
};

/*@
Ox.getDaysInMonth <f> Get the number of days in a given month
    > Ox.getDaysInMonth(2000, 2)
    29
    > Ox.getDaysInMonth("2002", "Feb")
    28
    > Ox.getDaysInMonth(new Date('01/01/2004'), "February")
    29
@*/
Ox.getDaysInMonth = function(year, month) {
    year = Ox.makeYear(year);
    month = Ox.isNumber(month) ? month
        : Ox.indexOf(Ox.MONTHS, function(v) {
            return v.slice(0, 3) == month.slice(0, 3);
        }) + 1;
    // Set to 1 AM since we may hit a DST change
    return new Date(year, month, 0, 1).getDate();
};

/*@
Ox.getDaysInYear <f> Get the number of days in a given year
    > Ox.getDaysInYear(1900)
    365
    > Ox.getDaysInYear('2000')
    366
    > Ox.getDaysInYear(new Date('01/01/2004'))
    366
@*/
Ox.getDaysInYear = function(year, utc) {
    return 365 + Ox.isLeapYear(Ox.makeYear(year, utc));
};

/*@
Ox.getFirstDayOfTheYear <f> Get the weekday of the first day of a given year
    Returns the decimal weekday of January 1 (0-6, Sunday as first day)
    > Ox.getFirstDayOfTheYear(new Date('01/01/2000'))
    6
@*/
Ox.getFirstDayOfTheYear = function(date, utc) {
    date = Ox.makeDate(date);
    date = Ox.setMonth(date, 0, utc);
    date = Ox.setDate(date, 1, utc);
    return Ox.getDay(date, utc);
};

//@ Ox.getFullYear <f> Get the year of a date, optionally UTC
// see Ox.setSeconds for source code
//@ Ox.getHours <f> Get the hours of a date, optionally UTC
// see Ox.setSeconds for source code

/*@
Ox.getISODate <f> Get the ISO date string for a given date
    > Ox.getISODate(new Date('01/01/2000'))
    '2000-01-01T00:00:00Z'
@*/
Ox.getISODate = function(date, utc) {
    return Ox.formatDate(Ox.makeDate(date), '%FT%TZ', utc);
};

/*@
Ox.getISODay <f> Get the ISO weekday of a given date
    Returns the decimal weekday (1-7, Monday as first day)
    > Ox.getISODay(new Date('01/01/2000'))
    6
    > Ox.getISODay(new Date('01/02/2000'))
    7
    > Ox.getISODay(new Date('01/03/2000'))
    1
@*/
Ox.getISODay = function(date, utc) {
    return Ox.getDay(Ox.makeDate(date), utc) || 7;
};

/*@
Ox.getISOWeek <f> Get the ISO week of a given date
    See <a href="http://en.wikipedia.org/wiki/ISO_8601">ISO 8601</a>
    > Ox.getISOWeek(new Date('01/01/2000'))
    52
    > Ox.getISOWeek(new Date('01/02/2000'))
    52
    > Ox.getISOWeek(new Date('01/03/2000'))
    1
@*/

Ox.getISOWeek = function(date, utc) {
    date = Ox.makeDate(date);
    // set date to Thursday of the same week
    return Math.floor((Ox.getDayOfTheYear(Ox.setDate(
        date, Ox.getDate(date, utc) - Ox.getISODay(date, utc) + 4, utc
    ), utc) - 1) / 7) + 1;
};

/*@
Ox.getISOYear <f> Get the ISO year of a given date
    See <a href="http://en.wikipedia.org/wiki/ISO_8601">ISO 8601</a>
    > Ox.getISOYear(new Date("01/01/2000"))
    1999
    > Ox.getISOYear(new Date("01/02/2000"))
    1999
    > Ox.getISOYear(new Date("01/03/2000"))
    2000
@*/

Ox.getISOYear = function(date, utc) {
    date = Ox.makeDate(date);
    // set date to Thursday of the same week
    return Ox.getFullYear(Ox.setDate(
        date, Ox.getDate(date, utc) - Ox.getISODay(date, utc) + 4, utc
    ));
};

//@ Ox.getMilliseconds <f> Get the milliseconds of a date
// see Ox.setSeconds for source code
//@ Ox.getMinutes <f> Get the minutes of a date, optionally UTC
// see Ox.setSeconds for source code
//@ Ox.getMonth <f> Get the month of a date, optionally UTC
// see Ox.setSeconds for source code
//@ Ox.getSeconds <f> Get the seconds of a date
// see Ox.setSeconds for source code

//@ Ox.getTime <f> Alias for `+new Date()`
Ox.getTime = function(utc) {
    return +new Date() - (utc ? Ox.getTimezoneOffset() : 0);
};

/*@
Ox.getTimezoneOffset <f> Get the local time zone offset in milliseconds
    ([date]) -> <n> Offset in milliseconds
    date <d|u> Return offset at this date (if undefined, return current offset)
@*/
Ox.getTimezoneOffset = function(date) {
    return Ox.makeDate(date).getTimezoneOffset() * 60000;
};

/*@
Ox.getTimezoneOffsetString <f> Get the local time zone offset as a string
    Returns a time zone offset string (from around '-1200' to around '+1200').
    ([date]) -> <s> Offset as a string
    date <d|u> Return offset at this date (if undefined, return current offset)
    > Ox.getTimezoneOffsetString(new Date('01/01/2000')).length
    5
@*/
Ox.getTimezoneOffsetString = function(date) {
    var offset = Ox.makeDate(date).getTimezoneOffset();
    return (offset <= 0 ? '+' : '-')
        + Ox.pad(Math.floor(Math.abs(offset) / 60), 2)
        + Ox.pad(Math.abs(offset) % 60, 2);
};

/*@
Ox.getWeek <f> Get the week of a given day
    Returns the week of the year (0-53, Sunday as first day)
    > Ox.getWeek(new Date('01/01/2000'))
    0
    > Ox.getWeek(new Date('01/02/2000'))
    1
    > Ox.getWeek(new Date('01/03/2000'))
    1
@*/
Ox.getWeek = function(date, utc) {
    date = Ox.makeDate(date);
    return Math.floor((Ox.getDayOfTheYear(date, utc)
        + Ox.getFirstDayOfTheYear(date, utc) - 1) / 7);
};

/*@
Ox.isLeapYear <f> Returns true if a given year is a leap year
    > Ox.isLeapYear(1900)
    false
    > Ox.isLeapYear('2000')
    true
    > Ox.isLeapYear(new Date('01/01/2004'))
    true
@*/
Ox.isLeapYear = function(year, utc) {
    year = Ox.makeYear(year, utc);
    return year % 4 == 0 && (year % 100 != 0 || year % 400 == 0);
};

/*@
Ox.makeDate <f> Takes a date, number or string, returns a date
    > Ox.formatDate(Ox.makeDate(0), '%m/%d/%Y', true)
    '01/01/1970'
    > Ox.formatDate(Ox.makeDate('01/01/1970'), '%m/%d/%Y')
    '01/01/1970'
    > Ox.formatDate(Ox.makeDate(new Date('01/01/1970')), '%m/%d/%Y')
    '01/01/1970'
    > Ox.formatDate(Ox.makeDate('1970-01-01'), '%Y-%m-%d')
    '1970-01-01'
    > Ox.formatDate(Ox.makeDate('1970'), '%Y')
    '1970'
    > Ox.formatDate(Ox.makeDate('1970-05'), '%Y-%m')
    '1970-05'
    > Ox.formatDate(Ox.makeDate(Ox.parseDate('-50')), '%Y')
    '-50'
@*/
Ox.makeDate = function(date) {
    // Safari 4/5 (<= 534.59.10) doesn't parse YYYY, YYYY-MM or YYYY-MM-DD
    if (Ox.isString(date) && Ox.isInvalidDate(new Date(date))) {
        if (/^\d{4}$/.test(date)) {
            date += '-01-01';
        } else if (/^\d{4}-\d{2}$/.test(date)) {
            date += '-01';
        } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(date)) {
            date = date.replace(/T/, ' ').replace(/Z/, '');
        }
        date = date.replace(/-/g, '/');
    }
    // If date is a date, new Date(date) makes a clone
    return Ox.isUndefined(date) ? new Date() : new Date(date);
};

/*@
Ox.makeYear <f> Takes a date, number or string, returns a year
    > Ox.makeYear(new Date('01/01/1970'))
    1970
    > Ox.makeYear(1970)
    1970
    > Ox.makeYear('1970')
    1970
@*/
Ox.makeYear = function(date, utc) {
    return Ox.isDate(date) ? Ox.getFullYear(date, utc) : parseInt(date, 10);
};

/*@
Ox.parseDate <f> Takes a string ('YYYY-MM-DD HH:MM:SS.MMM') and returns a date
    string <s> String
    utc <b|false> If true, date is UTC
    > +Ox.parseDate('1970-01-01 01:01:01.01', true)
    3661010
    > +Ox.parseDate('1970', true)
    0
    > Ox.parseDate('50', true).getUTCFullYear()
    50
@*/
Ox.parseDate = function(string, utc) {
    var date,
        defaults = [, 1, 1, 0, 0, 0, 0],
        values = /(-?\d+)-?(\d+)?-?(\d+)? ?(\d+)?:?(\d+)?:?(\d+)?\.?(\d+)?/
            .exec(string);
    if (values) {
        values.shift();
        date = new Date();
        values = values.map(function(v, i) {
            return v ? (i == 6 ? Ox.pad(v, 3, '0') : v) : defaults[i];
        });
        values[1]--;
        [
            'FullYear', 'Month', 'Date',
            'Hours', 'Minutes', 'Seconds', 'Milliseconds'
        ].forEach(function(part, i) {
            Ox['set' + part](date, values[i], utc);
        });
    } else {
        date = null;
    }
    return date;
};

/*
Ox.parseDateRange = function(start, end, utc) {
    var dates = [
            Ox.parseDate(start, utc),
            Ox.parseDate(end, utc)
        ],
        part = [
            'FullYear', 'Month', 'Date', 'Hours', 'Minutes', 'Seconds'
        ][
            Ox.compact(
                /(-?\d+)-?(\d+)?-?(\d+)? ?(\d+)?:?(\d+)?:?(\d+)?/.exec(end)
            ).length - 2
        ];
    Ox['set' + part](dates[1], Ox['get' + part](dates[1], utc) + 1, utc);
    return dates;
};
*/

//@ Ox.setDate <f> Set the day of a date, optionally UTC
// see Ox.setSeconds for source code
//@ Ox.setDay <f> Set the weekday of a date, optionally UTC
// see Ox.setSeconds for source code
//@ Ox.setFullYear <f> Set the year of a date, optionally UTC
// see Ox.setSeconds for source code
//@ Ox.setHours <f> Set the hours of a date, optionally UTC
// see Ox.setSeconds for source code
//@ Ox.setMilliseconds <f> Set the milliseconds of a date
// see Ox.setSeconds for source code
//@ Ox.setMinutes <f> Set the minutes of a date, optionally UTC
// see Ox.setSeconds for source code
//@ Ox.setMonth <f> Set the month of a date, optionally UTC
// see Ox.setSeconds for source code
//@ Ox.setSeconds <f> Set the seconds of a date
[
    'FullYear', 'Month', 'Date', 'Day',
    'Hours', 'Minutes', 'Seconds', 'Milliseconds'
].forEach(function(part) {
    Ox['get' + part] = function(date, utc) {
        return Ox.makeDate(date)['get' + (utc ? 'UTC' : '') + part]();
    };
    // Ox.setPart(date) modifies date
    Ox['set' + part] = function(date, num, utc) {
        return (
            Ox.isDate(date) ? date : new Date(date)
        )['set' + (utc ? 'UTC' : '') + part](num);
    };
});
