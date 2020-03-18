'use strict';

/*@
Ox.formatArea <f> Formats a number of meters as square meters or kilometers
    > Ox.formatArea(1000)
    '1,000 m\u00B2'
    > Ox.formatArea(1000000)
    '1 km\u00B2'
@*/

Ox.formatArea = function(number, decimals) {
    var k = number >= 1000000 ? 'k' : '';
    decimals = Ox.isUndefined(decimals) ? 8 : decimals;
    return Ox.formatNumber(
        (k ? number / 1000000 : number).toPrecision(decimals)
    ) + ' ' + k + 'm\u00B2';
};

/*@
Ox.formatCount <f> Returns a string like "2 items", "1 item" or "no items".
    > Ox.formatCount(0, 'item')
    'no items'
    > Ox.formatCount(1, 'item')
    '1 item'
    > Ox.formatCount(1000, 'city', 'cities')
    '1,000 cities'
@*/
Ox.formatCount = function(number, singular, plural) {
    plural = (plural || singular + 's') + (number === 2 ? '{2}' : '');
    return (number === 0 ? Ox._('no') : Ox.formatNumber(number))
        + ' ' + Ox._(number === 1 ? singular : plural);
};

/*@
Ox.formatCurrency <f> Formats a number with a currency symbol
    > Ox.formatCurrency(1000, '$', 2)
    '$1,000.00'
@*/
Ox.formatCurrency = function(number, string, decimals) {
    return string + Ox.formatNumber(number, decimals);
};

/*@
Ox.formatDate <f> Formats a date according to a format string
    See 
    <a href="http://developer.apple.com/library/mac/#documentation/Darwin/Reference/ManPages/man3/strftime.3.html">strftime</a>
    and <a href="http://en.wikipedia.org/wiki/ISO_8601">ISO 8601</a>.
    'E*%' (localized date and time), %Q' (quarter) and '%X'/'%x'
    (year with 'BC'/'AD') are non-standard.
    (string) -> <s> formatted date
    (date, string) -> <s> formatted date
    (date, string, utc) -> <s> formatted date
    string <s> format string
    date <d|n|s> date
    utc <b> date is utc
    <script>
        Ox.test.date = new Date('2005/01/02 00:03:04');
        Ox.test.epoch = new Date('1970/01/01 00:00:00');
    </script>
    > Ox.formatDate(Ox.test.date, '%A') // Full weekday
    'Sunday'
    > Ox.formatDate(Ox.test.date, '%a') // Abbreviated weekday
    'Sun'
    > Ox.formatDate(Ox.test.date, '%B') // Full month
    'January'
    > Ox.formatDate(Ox.test.date, '%b') // Abbreviated month
    'Jan'
    > Ox.formatDate(Ox.test.date, '%C') // Century
    '20'
    > Ox.formatDate(Ox.test.date, '%c') // US time and date
    '01/02/05 12:03:04 AM'
    > Ox.formatDate(Ox.test.date, '%D') // US date
    '01/02/05'
    > Ox.formatDate(Ox.test.date, '%d') // Zero-padded day of the month
    '02'
    > Ox.formatDate(Ox.test.date, '%ED') // Localized date and time with seconds
    '01/02/2005 00:03:04'
    > Ox.formatDate(Ox.test.date, '%Ed') // Localized date and time without seconds
    '01/02/2005 00:03'
    > Ox.formatDate(Ox.test.date, '%EL') // Long localized date with weekday
    'Sunday, January  2, 2005'
    > Ox.formatDate(Ox.test.date, '%El') // Long localized date without weekday
    'January  2, 2005'
    > Ox.formatDate(Ox.test.date, '%EM') // Medium localized date with weekday
    'Sun, Jan  2, 2005'
    > Ox.formatDate(Ox.test.date, '%Em') // Medium localized date without weekday
    'Jan  2, 2005'
    > Ox.formatDate(Ox.test.date, '%ES') // Short localized date with century
    '01/02/2005'
    > Ox.formatDate(Ox.test.date, '%Es') // Short localized date without century
    '01/02/05'
    > Ox.formatDate(Ox.test.date, '%ET') // Localized time with seconds
    '12:03:04 AM'
    > Ox.formatDate(Ox.test.date, '%Et') // Localized time without seconds
    '12:03 AM'
    > Ox.formatDate(Ox.test.date, '%e') // Space-padded day of the month
    ' 2'
    > Ox.formatDate(Ox.test.date, '%F') // Date
    '2005-01-02'
    > Ox.formatDate(Ox.test.date, '%G') // Full ISO-8601 year
    '2004'
    > Ox.formatDate(Ox.test.date, '%g') // Abbreviated ISO-8601 year
    '04'
    > Ox.formatDate(Ox.test.date, '%H') // Zero-padded hour (24-hour clock)
    '00'
    > Ox.formatDate(Ox.test.date, '%h') // Abbreviated month
    'Jan'
    > Ox.formatDate(Ox.test.date, '%I') // Zero-padded hour (12-hour clock)
    '12'
    > Ox.formatDate(Ox.test.date, '%j') // Zero-padded day of the year
    '002'
    > Ox.formatDate(Ox.test.date, '%k') // Space-padded hour (24-hour clock)
    ' 0'
    > Ox.formatDate(Ox.test.date, '%l') // Space-padded hour (12-hour clock)
    '12'
    > Ox.formatDate(Ox.test.date, '%M') // Zero-padded minute
    '03'
    > Ox.formatDate(Ox.test.date, '%m') // Zero-padded month
    '01'
    > Ox.formatDate(Ox.test.date, '%n') // Newline
    '\n'
    > Ox.formatDate(Ox.test.date, '%p') // AM or PM
    'AM'
    > Ox.formatDate(Ox.test.date, '%Q') // Quarter of the year
    '1'
    > Ox.formatDate(Ox.test.date, '%R') // Zero-padded hour and minute
    '00:03'
    > Ox.formatDate(Ox.test.date, '%r') // US time
    '12:03:04 AM'
    > Ox.formatDate(Ox.test.date, '%S') // Zero-padded second
    '04'
    > Ox.formatDate(Ox.test.epoch, '%s', true) // Number of seconds since the Epoch
    '0'
    > Ox.formatDate(Ox.test.date, '%T') // Time
    '00:03:04'
    > Ox.formatDate(Ox.test.date, '%t') // Tab
    '\t'
    > Ox.formatDate(Ox.test.date, '%U') // Zero-padded week of the year (00-53, Sunday as first day)
    '01'
    > Ox.formatDate(Ox.test.date, '%u') // Decimal weekday (1-7, Monday as first day)
    '7'
    > Ox.formatDate(Ox.test.date, '%V') // Zero-padded ISO-8601 week of the year
    '53'
    > Ox.formatDate(Ox.test.date, '%v') // Formatted date
    ' 2-Jan-2005'
    > Ox.formatDate(Ox.test.date, '%W') // Zero-padded week of the year (00-53, Monday as first day)
    '00'
    > Ox.formatDate(Ox.test.date, '%w') // Decimal weekday (0-6, Sunday as first day)
    '0'
    > Ox.formatDate(Ox.test.date, '%X') // Full year with BC or AD
    '2005 AD'
    > Ox.formatDate(Ox.test.date, '%x') // Full year with BC or AD if year < 1000
    '2005'
    > Ox.formatDate(Ox.test.date, '%Y') // Full year
    '2005'
    > Ox.formatDate(Ox.test.date, '%y') // Abbreviated year
    '05'
    > Ox.formatDate(Ox.test.date, '%Z', true) // Time zone name
    'UTC'
    > Ox.formatDate(Ox.test.date, '%z', true) // Time zone offset
    '+0000'
    > Ox.formatDate(Ox.test.date, '%+').replace(/ [A-Z]+ /, ' XYZ ') // Formatted date and time
    'Sun Jan  2 00:03:04 XYZ 2005'
    > Ox.formatDate(Ox.test.date, '%%')
    '%'
@*/

(function() {

    var format = [
        ['%', function() {
            return '%{%}';
        }],
        ['c', function() {
            return '%D %r';
        }],
        ['D', function() {
            return '%m/%d/%y';
        }],
        ['ED', function() {
            return '%ES %T';
        }],
        ['Ed', function() {
            return '%ES %R';
        }],
        ['EL', function() {
            return Ox._('%A, %B %e, %Y');
        }],
        ['El', function() {
            return Ox._('%B %e, %Y');
        }],
        ['EM', function() {
            return Ox._('%a, %b %e, %Y');
        }],
        ['Em', function() {
            return Ox._('%b %e, %Y');
        }],
        ['ES', function() {
            return Ox._('%m/%d/%Y');
        }],
        ['Es', function() {
            return Ox._('%m/%d/%y');
        }],
        ['ET', function() {
            return Ox._('%I:%M:%S %p');
        }],
        ['Et', function() {
            return Ox._('%I:%M %p');
        }],
        ['F', function() {
            return '%Y-%m-%d';
        }],
        ['h', function() {
            return '%b';
        }],
        ['R', function() {
            return '%H:%M';
        }],
        ['r', function() {
            return '%I:%M:%S %p';
        }],
        ['T', function() {
            return '%H:%M:%S';
        }],
        ['v', function() {
            return '%e-%b-%Y';
        }],
        ['\\+', function() {
            return '%a %b %e %H:%M:%S %Z %Y';
        }],
        ['A', function(date, utc) {
            return Ox._(Ox.WEEKDAYS[(Ox.getDay(date, utc) + 6) % 7]);
        }],
        ['a', function(date, utc) {
            return Ox._(Ox.SHORT_WEEKDAYS[(Ox.getDay(date, utc) + 6) % 7]);
        }],
        ['B', function(date, utc) {
            return Ox._(Ox.MONTHS[Ox.getMonth(date, utc)]);
        }],
        ['b', function(date, utc) {
            return Ox._(Ox.SHORT_MONTHS[Ox.getMonth(date, utc)]);
        }],
        ['C', function(date, utc) {
            return Math.floor(Ox.getFullYear(date, utc) / 100).toString();
        }],
        ['d', function(date, utc) {
            return Ox.pad(Ox.getDate(date, utc), 2);
        }],
        ['e', function(date, utc) {
            return Ox.pad(Ox.getDate(date, utc), 2, ' ');
        }],
        ['G', function(date, utc) {
            return Ox.getISOYear(date, utc);
        }],
        ['g', function(date, utc) {
            return Ox.getISOYear(date, utc).toString().slice(-2);
        }],
        ['H', function(date, utc) {
            return Ox.pad(Ox.getHours(date, utc), 2);
        }],
        ['I', function(date, utc) {
            return Ox.pad((Ox.getHours(date, utc) + 11) % 12 + 1, 2);
        }],
        ['j', function(date, utc) {
            return Ox.pad(Ox.getDayOfTheYear(date, utc), 3);
        }],
        ['k', function(date, utc) {
            return Ox.pad(Ox.getHours(date, utc), 2, ' ');
        }],
        ['l', function(date, utc) {
            return Ox.pad(((Ox.getHours(date, utc) + 11) % 12 + 1), 2, ' ');
        }],
        ['M', function(date, utc) {
            return Ox.pad(Ox.getMinutes(date, utc), 2);
        }],
        ['m', function(date, utc) {
            return Ox.pad((Ox.getMonth(date, utc) + 1), 2);
        }],
        ['p', function(date, utc) {
            return Ox._(Ox.AMPM[Math.floor(Ox.getHours(date, utc) / 12)]);
        }],
        ['Q', function(date, utc) {
            return Math.floor(Ox.getMonth(date, utc) / 4) + 1;
        }],
        ['S', function(date, utc) {
            return Ox.pad(Ox.getSeconds(date, utc), 2);
        }],
        ['s', function(date, utc) {
            return Math.floor((+date - (
                utc ? Ox.getTimezoneOffset(date) : 0
            )) / 1000);
        }],
        ['U', function(date, utc) {
            return Ox.pad(Ox.getWeek(date, utc), 2);
        }],
        ['u', function(date, utc) {
            return Ox.getISODay(date, utc);
        }],
        ['V', function(date, utc) {
            return Ox.pad(Ox.getISOWeek(date, utc), 2);
        }],
        ['W', function(date, utc) {
            return Ox.pad(Math.floor((Ox.getDayOfTheYear(date, utc)
                + (Ox.getFirstDayOfTheYear(date, utc) || 7) - 2) / 7), 2);
        }],
        ['w', function(date, utc) {
            return Ox.getDay(date, utc);
        }],
        ['X', function(date, utc) {
            var y = Ox.getFullYear(date, utc);
            return Math.abs(y) + ' ' + Ox._(Ox.BCAD[y < 0 ? 0 : 1]);
        }],
        ['x', function(date, utc) {
            var y = Ox.getFullYear(date, utc);
            return Math.abs(y) + (
                y < 1000 ? ' ' + Ox._(Ox.BCAD[y < 0 ? 0 : 1]) : ''
            );
        }],
        ['Y', function(date, utc) {
            return Ox.getFullYear(date, utc);
        }],
        ['y', function(date, utc) {
            return Ox.getFullYear(date, utc).toString().slice(-2);
        }],
        ['Z', function(date, utc) {
            return utc ? 'UTC'
                : (date.toString().split('(')[1] || '').replace(')', '');
        }],
        ['z', function(date, utc) {
            return utc ? '+0000' : Ox.getTimezoneOffsetString(date);
        }],
        ['n', function() {
            return '\n';
        }],
        ['t', function() {
            return '\t';
        }],
        ['\\{%\\}', function() {
            return '%';
        }]
    ].map(function(value) {
        return [new RegExp('%' + value[0], 'g'), value[1]];
    });

    Ox.formatDate = function(date, string, utc) {
        if (date === '') {
            return '';
        }
        date = Ox.makeDate(date);
        format.forEach(function(value) {
            string = string.replace(value[0], function() {
                return value[1](date, utc);
            });
        });
        return string;
    };

}());

/*@
Ox.formatDateRange <f> Formats a date range as a string
    A date range is a pair of arbitrary-presicion date strings
    > Ox.formatDateRange('2000', '2001')
    '2000'
    > Ox.formatDateRange('2000', '2002')
    '2000 - 2002'
    > Ox.formatDateRange('2000-01', '2000-02')
    'January 2000'
    > Ox.formatDateRange('2000-01', '2000-03')
    'January - March 2000'
    > Ox.formatDateRange('2000-01-01', '2000-01-02')
    'Sat, Jan 1, 2000'
    > Ox.formatDateRange('2000-01-01', '2000-01-03')
    'Sat, Jan 1 - Mon, Jan 3, 2000'
    > Ox.formatDateRange('2000-01-01 00', '2000-01-01 01')
    'Sat, Jan 1, 2000, 00:00'
    > Ox.formatDateRange('2000-01-01 00', '2000-01-01 02')
    'Sat, Jan 1, 2000, 00:00 - 02:00'
    > Ox.formatDateRange('2000-01-01 00:00', '2000-01-01 00:01')
    'Sat, Jan 1, 2000, 00:00'
    > Ox.formatDateRange('2000-01-01 00:00', '2000-01-01 00:02')
    'Sat, Jan 1, 2000, 00:00 - 00:02'
    > Ox.formatDateRange('2000-01-01 00:00:00', '2000-01-01 00:00:01')
    'Sat, Jan 1, 2000, 00:00:00'
    > Ox.formatDateRange('2000-01-01 00:00:00', '2000-01-01 00:00:02')
    'Sat, Jan 1, 2000, 00:00:00 - 00:00:02'
    > Ox.formatDateRange('1999-12', '2000-01')
    'December 1999'
    > Ox.formatDateRange('1999-12-31', '2000-01-01')
    'Fri, Dec 31, 1999'
    > Ox.formatDateRange('1999-12-31 23:59', '2000-01-01 00:00')
    'Fri, Dec 31, 1999, 23:59'
    > Ox.formatDateRange('-50', '50')
    '50 BC - 50 AD'
    > Ox.formatDateRange('-50-01-01', '-50-12-31')
    'Sun, Jan 1 - Sun, Dec 31, 50 BC'
    > Ox.formatDateRange('-50-01-01 00:00:00', '-50-01-01 23:59:59')
    'Sun, Jan 1, 50 BC, 00:00:00 - 23:59:59'
@*/
Ox.formatDateRange = function(start, end, utc) {
    end = end || Ox.formatDate(new Date(), '%Y-%m-%d');
    var isOneUnit = false,
        range = [start, end],
        strings,
        dates = range.map(function(str){
            return Ox.parseDate(str, utc);
        }),
        parts = range.map(function(str) {
            var parts = Ox.compact(
                /(-?\d+)-?(\d+)?-?(\d+)? ?(\d+)?:?(\d+)?:?(\d+)?/.exec(str)
            );
            parts.shift();
            return parts.map(function(part) {
                return parseInt(part, 10);
            });
        }),
        precision = parts.map(function(parts) {
            return parts.length;
        }),
        y = parts[0][0] < 0 ? '%X' : '%Y',
        formats = [
            y,
            '%B ' + y,
            '%a, %b %e, ' + y,
            '%a, %b %e, ' + y + ', %H:%M',
            '%a, %b %e, ' + y + ', %H:%M',
            '%a, %b %e, ' + y + ', %H:%M:%S', 
        ];
    if (precision[0] == precision[1]) {
        isOneUnit = true;
        Ox.loop(precision[0], function(i) {
            if (
                (i < precision[0] - 1 && parts[0][i] != parts[1][i])
                || (i == precision[0] - 1 && parts[0][i] != parts[1][i] - 1)
            ) {
                isOneUnit = false;
                return false; // break
            }
        });
    }
    if (isOneUnit) {
        strings = [Ox.formatDate(dates[0], formats[precision[0] - 1], utc)];
    } else {
        strings = [
            Ox.formatDate(dates[0], formats[precision[0] - 1], utc),
            Ox.formatDate(dates[1], formats[precision[1] - 1], utc)
        ];
        // if same year, and neither date is more precise than day,
        // then omit first year
        if (
            parts[0][0] == parts[1][0]
            && precision[0] <= 3
            && precision[1] <= 3
        ) {
            strings[0] = Ox.formatDate(
                dates[0], formats[precision[0] - 1].replace(
                    new RegExp(',? ' + y), ''
                ), utc
            );
        }
        // if same day then omit second day
        if (
            parts[0][0] == parts[1][0]
            && parts[0][1] == parts[1][1]
            && parts[0][2] == parts[1][2]
        ) {
            strings[1] = strings[1].split(', ').pop();
        }
    }
    // %e is a space-padded day
    return strings.join(' - ').replace(/  /g, ' ');
};

/*@
Ox.formatDateRangeDuration <f> Formats the duration of a date range as a string
    A date range is a pair of arbitrary-presicion date strings
    > Ox.formatDateRangeDuration('2000-01-01 00:00:00', '2001-03-04 04:05:06')
    '1 year 2 months 3 days 4 hours 5 minutes 6 seconds'
    > Ox.formatDateRangeDuration('2000', '2001-01-01 00:00:01')
    '1 year 1 second'
    > Ox.formatDateRangeDuration('1999', '2000', true)
    '1 year'
    > Ox.formatDateRangeDuration('2000', '2001', true)
    '1 year'
    > Ox.formatDateRangeDuration('1999-02', '1999-03', true)
    '1 month'
    > Ox.formatDateRangeDuration('2000-02', '2000-03', true)
    '1 month'
@*/
Ox.formatDateRangeDuration = function(start, end, utc) {
    end = end || Ox.formatDate(new Date(), '%Y-%m-%d');
    var date = Ox.parseDate(start, utc),
        dates = [start, end].map(function(string) {
            return Ox.parseDate(string, utc);
        }),
        keys = ['year', 'month', 'day', 'hour', 'minute', 'second'],
        parts = ['FullYear', 'Month', 'Date', 'Hours', 'Minutes', 'Seconds'],
        values = [];
    date && keys.forEach(function(key, i) {
        while (true) {
            if (key == 'month') {
                // set the day to the same day in the next month,
                // or to its last day if the next month is shorter
                var day = Ox.getDate(date, utc);
                Ox.setDate(date, Math.min(
                    day,
                    Ox.getDaysInMonth(
                        Ox.getFullYear(date, utc),
                        Ox.getMonth(date, utc) + 2,
                        utc
                    )
                ), utc);
            }
            // advance the date by one unit
            Ox['set' + parts[i]](date, Ox['get' + parts[i]](date, utc) + 1, utc);
            if (date <= dates[1]) {
                // still within the range, add one unit
                values[i] = (values[i] || 0) + 1;
            } else {
                // outside the range, rewind the date by one unit
                Ox['set' + parts[i]](date, Ox['get' + parts[i]](date, utc) - 1, utc);
                // and revert to original day
                key == 'month' && Ox.setDate(date, day, utc);
                break;
            }
        }
    });
    return Ox.filter(Ox.map(values, function(value, i) {
        return value ? value + ' ' + keys[i] + (value > 1 ? 's' : '') : '';
    })).join(' ');
};

/*@
Ox.formatDegrees <f> Formats degrees as D°MM'SS"
    > Ox.formatDegrees(-111.11, 'lng')
    "111°06'36\"W"
@*/
Ox.formatDegrees = function(degrees, mode) {
    var days = 0,
        seconds = Math.round(Math.abs(degrees) * 3600),
        sign = degrees < 0 ? '-' : '',
        array = Ox.formatDuration(seconds).split(':');
    if (array.length == 4) {
        days = parseInt(array.shift(), 10);
    }
    array[0] = days * 24 + parseInt(array[0], 10);
    return (!mode ? sign : '')
        + array[0] + '°' + array[1] + "'" + array[2] + '"'
        + (
            mode == 'lat' ? (degrees < 0 ? 'S' : 'N')
            : mode == 'lng' ? (degrees < 0 ? 'W' : 'E')
            : ''
        );
};

/*@
Ox.formatDimensions <f> Formats valus as dimension
    > Ox.formatDimensions([1920, 1080], 'px')
    "1,920 × 1,080 px"
@*/
Ox.formatDimensions = Ox.formatResolution = function(array, string) {
    return array.map(function(value) {
        return Ox.formatNumber(value);
    }).join(' × ') + (string ? ' ' + string : '');
};

/*@
Ox.formatDuration <f> Formats a duration as a string
    > Ox.formatDuration(3599.999)
    '01:00:00'
    > Ox.formatDuration(3599.999, 2)
    '01:00:00.00'
    > Ox.formatDuration(3599.999, 3)
    '00:59:59.999'
    > Ox.formatDuration(3599.999, 'short')
    '1h'
    > Ox.formatDuration(3599.999, 3, 'short')
    '59m 59.999s'
    > Ox.formatDuration(3599.999, 'long')
    '1 hour'
    > Ox.formatDuration(3599.999, 3, 'long')
    '59 minutes 59.999 seconds'
    > Ox.formatDuration(1640673)
    '18:23:44:33'
    > Ox.formatDuration(86520, 2)
    '1:00:02:00.00'
    > Ox.formatDuration(86520, 'long')
    '1 day 2 minutes'
    > Ox.formatDuration(31543203, 2)
    '1:000:02:00:03.00'
    > Ox.formatDuration(31543203, 'long')
    '1 year 2 hours 3 seconds'
    > Ox.formatDuration(0, 2)
    '00:00:00.00'
    > Ox.formatDuration(0, 'long')
    ''
@*/
Ox.formatDuration = function(seconds/*, decimals, format*/) {
    var last = Ox.last(arguments),
        format = last == 'short' || last == 'long' ? last : 'none',
        decimals = Ox.isNumber(arguments[1]) ? arguments[1] : 0,
        seconds = Ox.round(Math.abs(seconds), decimals),
        values = [
            Math.floor(seconds / 31536000),
            Math.floor(seconds % 31536000 / 86400),
            Math.floor(seconds % 86400 / 3600),
            Math.floor(seconds % 3600 / 60),
            Ox.formatNumber(seconds % 60, decimals)
        ],
        string = format == 'short' ? ['y', 'd', 'h', 'm', 's']
            : format == 'long' ? ['year', 'day', 'hour', 'minute', 'second']
            : [],
        pad = [
            values[0].toString().length,
            values[0] ? 3 : values[1].toString().length,
            2,
            2,
            decimals ? decimals + 3 : 2
        ];
    while (!values[0] && values.length > (format == 'none' ? 3 : 1)) {
        values.shift();
        string.shift();
        pad.shift();
    }
    return Ox.filter(Ox.map(values, function(value, index) {
        var ret;
        if (format == 'none') {
            ret = Ox.pad(value, 'left', pad[index], '0');
        } else if (Ox.isNumber(value) ? value : parseFloat(value)) {
            ret = value + (format == 'long' ? ' ' : '') + Ox._(string[index] + (
                format == 'long'
                ? (value == 1 ? '' : value == 2 ? 's{2}' : 's')
                : ''
            ));
        } else {
            ret = '';
        }
        return ret;
    })).join(format == 'none' ? ':' : ' ');
};

/*@
Ox.formatISBN <f> Formats a string as an ISBN of a given length (10 or 13)
    (isbn, length) -> <s> ISBN
    isbn <s> ISBN
    length <n> length (10 or 13)
    > Ox.formatISBN('0-306-40615-2', 13, true)
    '978-0-306-40615-7'
    > Ox.formatISBN('978-0-306-40615-7', 10)
    '0306406152'
@*/
Ox.formatISBN = function(isbn, length, dashes) {
    var ret = '';
    function getCheckDigit(isbn) {
        var mod = isbn.length == 10 ? 11 : 10
        return (Ox.mod(mod - Ox.sum(
            isbn.slice(0, -1).split('').map(function(digit, index) {
                return isbn.length == 10
                    ? parseInt(digit) * (10 - index)
                    : parseInt(digit) * (index % 2 == 0 ? 1 : 3); 
            })
        ), mod) + '').replace('10', 'X');
    }
    isbn = isbn.toUpperCase().replace(/[^\dX]/g, '');
    if (isbn.length == 10) {
        isbn = isbn.slice(0, -1).replace(/\D/g, '') + isbn.slice(-1);
    }
    if (
        (isbn.length == 10 || isbn.length == 13)
        && isbn.slice(-1) == getCheckDigit(isbn)
    ) {
        if (isbn.length == length) {
            ret = isbn
        } else if (isbn.length == 10 || isbn.slice(0, 3) == '978') {
            isbn = isbn.length == 10 ? '978' + isbn : isbn.slice(3);
            ret = isbn.slice(0, -1) + getCheckDigit(isbn);
        }
    }
    return dashes ? [
        ret.slice(-13, -10),
        ret.slice(-10, -9),
        ret.slice(-9, -6),
        ret.slice(-6, -1),
        ret.slice(-1)
    ].join('-').replace(/^-+/, '') : ret;
};

/*@
Ox.formatNumber <f> Formats a number with thousands separators
    (num, dec) -> <s> format number to string
    num <n> number
    dec <n|0> number of decimals
    > Ox.formatNumber(123456789, 3)
    "123,456,789.000"
    > Ox.formatNumber(-2000000 / 3, 3)
    "-666,666.667"
    > Ox.formatNumber(666666.666)
    "666,667"
@*/
Ox.formatNumber = function(number, decimals) {
    var array = [],
        abs = Math.abs(number),
        split = abs.toFixed(decimals).split('.');
    while (split[0]) {
        array.unshift(split[0].slice(-3));
        split[0] = split[0].slice(0, -3);
    }
    split[0] = array.join(Ox._(','));
    return (number < 0 ? '-' : '') + split.join(Ox._('.'));
};

/*@
Ox.formatOrdinal <f> Formats a number as an ordinal
    > Ox.formatOrdinal(1)
    "1st"
    > Ox.formatOrdinal(2)
    "2nd"
    > Ox.formatOrdinal(3)
    "3rd"
    > Ox.formatOrdinal(4)
    "4th"
    > Ox.formatOrdinal(11)
    "11th"
    > Ox.formatOrdinal(12)
    "12th"
    > Ox.formatOrdinal(13)
    "13th"
@*/
Ox.formatOrdinal = function(number) {
    var string = Ox.formatNumber(number),
        length = string.length,
        last = string[length - 1],
        ten = length > 1 && string[length - 2] == '1',
        twenty = length > 1 && !ten;
    if (last == '1' && !ten) {
        string += Ox._('st' + (twenty ? '{21}' : ''));
    } else if (last == '2' && !ten) {
        string += Ox._('nd' + (twenty ? '{22}' : ''));
    } else if (last == '3' && !ten) {
        string += Ox._('rd' + (twenty ? '{23}' : ''));
    } else {
        string += Ox._(
            'th' + (Ox.contains('123', last) && ten ? '{1' + last + '}' : '')
        );
    }
    return string;
};

/*@
Ox.formatPercent <f> Formats the relation of two numbers as a percentage
    > Ox.formatPercent(1, 1000, 2)
    "0.10%"
@*/
Ox.formatPercent = function(number, total, decimals) {
    return Ox.formatNumber(number / total * 100, decimals) + Ox._('%');
};

/*@
Ox.formatRoman <f> Formats a number as a roman numeral
    > Ox.formatRoman(1888)
    'MDCCCLXXXVIII'
    > Ox.formatRoman(1999)
    'MCMXCIX'
    > Ox.formatRoman(2000)
    'MM'
    > Ox.formatRoman(-1)
    ''
    > Ox.formatRoman(0)
    ''
    > Ox.formatRoman(9.9)
    'IX'
    > Ox.formatRoman(10000)
    'MMMMMMMMMM'
@*/
Ox.formatRoman = function(number) {
    var string = '';
    Ox.forEach({
        M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90,
        L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1
    }, function(value, roman) {
        while (number >= value) {
            string += roman;
            number -= value;
        }
    });
    return string;
};

/*@
Ox.formatSRT <f> Formats subtitles as SRT
@*/
Ox.formatSRT = function(subtitles) {
    return  '\ufeff' + Ox.sortBy(subtitles, ['in', 'out']).map(function(subtitle, index) {
        return [
            index + 1,
            ['in', 'out'].map(function(key) {
                return Ox.formatDuration(subtitle[key], 3).replace('.', ',');
            }).join(' --> '),
            subtitle['text']
        ].join('\r\n')
    }).join('\r\n\r\n') + '\r\n\r\n';
};

/*@ 
Ox.formatString <f> Basic string formatting
    > Ox.formatString('{0}{1}', ['foo', 'bar'])
    'foobar'
    > Ox.formatString('{a}{b}', {a: 'foo', b: 'bar'})
    'foobar'
    > Ox.formatString('{a.x}{a.y}', {a: {x: 'foo', y: 'bar'}})
    'foobar'
    > Ox.formatString('{a\\.b}', {'a.b': 'foobar'})
    'foobar'
    > Ox.formatString('{1}', ['foobar'])
    ''
    > Ox.formatString('{b}', {a: 'foobar'}, true)
    '{b}'
@*/
Ox.formatString = function(string, collection, keepUnmatched) {
    return string.replace(/\{([^}]+)\}/g, function(string, match) {
        // make sure to not split at escaped dots ('\.')
        var key,
            keys = match.replace(/\\\./g, '\n').split('.').map(function(key) {
                return key.replace(/\n/g, '.');
            }),
            value = collection || {};
        while (keys.length) {
            key = keys.shift();
            if (value[key]) {
                value = value[key];
            } else {
                value = null;
                break;
            }
        }
        return value !== null ? value : keepUnmatched ? '{' + match + '}' : '';
    });
};

/*@
Ox.formatUnit <f> Formats a number with a unit
    > Ox.formatUnit(100/3, 'm', 2)
    '33.33 m'
    > Ox.formatUnit(100/3, '%')
    '33%'
@*/
Ox.formatUnit = function(number, string, decimals) {
    return Ox.formatNumber(number, decimals)
        + (/^[:%]/.test(string) ? '' : ' ') + string;
};

/*@
Ox.formatValue <f> Formats a numerical value
    > Ox.formatValue(0, "B")
    "0 B"
    > Ox.formatValue(123456789, "B")
    "123.5 MB"
    > Ox.formatValue(1234567890, "B", true)
    "1.15 GiB"
@*/
// fixme: is this the best name?
Ox.formatValue = function(number, string, bin) {
    var base = bin ? 1024 : 1000,
        length = Ox.PREFIXES.length,
        ret;
    Ox.forEach(Ox.PREFIXES, function(prefix, index) {
        if (number < Math.pow(base, index + 1) || index == length - 1) {
            ret = Ox.formatNumber(
                number / Math.pow(base, index), index ? index - 1 : 0
            ) + ' ' + prefix + (prefix && bin ? 'i' : '') + string;
            return false; // break
        }
    });
    return ret;
};
