'use strict';

/*@
Ox.URL <f> URL controller
    (options) -> <o> URL controller
    options <o> Options object
        findKeys <o> Find keys for all types
            typeA <o> Find keys for this type
                id <s> Find key id
                type <s> Value type (like "string" or "integer")
        getHash <f> Tests if a hash is valid
            May modify the state's hash property
            (state, callback) -> <u> undefined
            state <o> State object
            hash <o> The hash to be tested
            callback <f> callback function
        getItem <f> Tests if a string matches an item
            May modify the state's item property
            (state, string, callback) -> <u> undefined
            state <o> State object
            string <s> The string to be tested
            callback <f> callback function
        getPart <f> Tests if a string matches a part (page section)
            May modify the state's part property
            (state, string, callback) -> <u> undefined
            state <o> State object
            string <s> The string to be tested
            callback <f> callback function
        getSort <f> Tests if a sort object is valid (for the current item)
            May modify the state's sort properties
            (state, value, callback) -> <u> undefined
            state <o> State object
            value <o> The value to be tested
            callback <f> Callback function
        getSpan <f> Tests if a value matches a span
            May modify the state's view and span properties
            (state, value, callback) -> <u> undefined
            state <o> State object
            value <[n]|s> The value to be tested
            callback <f> Callback function
        pages <[s]> List of pages
        sortKeys <o> Sort keys for list and item views for all types
            typeA <o> Sort keys for this type
                list <o> Sort keys for list views for this type
                    viewA <[o]> Sort keys for this view
                        id <s> Sort key id
                        operator <s> Default sort operator ("+" or "-")
                item <o> Sort keys for item views for this type
                    viewA <[o]> Sort keys for this view
                        id <s> Sort key id
                        operator <s> Default sort operator ("+" or "-")
        spanType <o> Span types for list and item views for all types
            typeA <o> Span types for this type
                list <o> Span types for list views for this type
                    viewA <s> Span type for this view
                        Can be "date", "duration", "location" or "number"
                item <o> Span types for item views for this type
                    viewA <s> Span type for this view
                        Can be "date", "duration", "location" or "number"
        types <[s]> List of types
        views <o> List and item views for all types
            typeA <o> Views for type "typeA"
                list <[s]> List views for this type
                item <[s]> Item views for this type
    <script>
        Ox.test.url = Ox.URL({
            findKeys: {
                countries: [
                    {id: 'name', type: 'string'},
                    {id: 'population', type: 'integer'}
                ],
                cities: [
                    {id: 'name', type: 'string'},
                    {id: 'population', type: 'integer'}
                ]
            },
            getHash: function(state, callback) {
                if (state.hash) {
                    if (state.hash.anchor == 'invalid') {
                        delete state.hash.anchor;
                    }
                    if (state.hash.query) {
                        state.hash.query = state.hash.query.filter(function(v) {
                            return v.key != 'invalid'
                        });
                        if (Ox.isEmpty(state.hash.query)) {
                            delete state.hash.query;
                        }
                    }
                    if (Ox.isEmpty(state.hash)) {
                        delete state.hash;
                    }
                }
                callback();
            },
            getItem: function(state, str, callback) {
                state.item = /^\d+$/.test(str) ? str : '';
                callback();
            },
            getSpan: function(state, str, callback) {
                if (!state.item && (!state.view || state.view == 'map')) {
                    state.view = 'map';
                    state.span = str.replace(/^@/, '');
                }
                callback();
            },
            pages: ['about', 'faq', 'help'],
            sortKeys: {
                countries: {
                    list: {
                        grid: [
                            {id: 'name', operator: '+'},
                            {id: 'population', operator: '-'},
                            {id: 'cities', operator: '-'}
                        ]
                    },
                    item: {
                        cities: [
                            {id: 'name', operator: '+'},
                            {id: 'population', operator: '-'}
                        ]
                    }
                },
                cities: {
                    list: {
                        grid: [
                            {id: 'name', operator: '+'},
                            {id: 'population', operator: '-'}
                        ]
                    }
                }
            },
            spanType: {
                countries: {
                    list: {map: 'location'},
                    item: {map: 'location'}
                },
                cities: {
                    list: {map: 'location'},
                    item: {map: 'location'}
                }
            },
            types: ['countries', 'cities'],
            views: {
                countries: {
                    list: ['grid', 'map'],
                    item: ['info', 'map', 'cities']
                },
                cities: {
                    list: ['grid', 'map'],
                    item: ['info', 'map']
                }
            }
        });
        Ox.test.result = {
            '/': {},
            '/faq#1': {
                page: 'faq',
                hash: {anchor: '1'}
            },
            '/cities': {
                type: 'cities',
                item: '',
                view: 'grid'
            },
            '/map': {
                type: 'countries',
                item: '',
                view: 'map'
            },
            '/-45,-90,45,90': {
                type: 'countries',
                item: '',
                view: 'map',
                span: [[-45, -90], [45, 90]]
            },
            '/@New%20York': {
                type: 'countries',
                item: '',
                view: 'map',
                span: 'New York'
            },
            '/name': {
                type: 'countries',
                item: '',
                view: 'grid',
                sort: [{key: 'name', operator: '+'}]
            },
            '/-name,population': {
                type: 'countries',
                item: '',
                view: 'grid',
                sort: [
                    {key: 'name', operator: '-'},
                    {key: 'population', operator: '-'}
                ]
            },
            '/2342': {
                type: 'countries',
                item: '2342',
                view: 'info'
            },
            '/2342/map': {
                type: 'countries',
                item: '2342',
                view: 'map'
            },
            '/2342/name': {
                type: 'countries',
                item: '2342',
                view: 'cities',
                sort: [{key: 'name', operator: '+'}]
            },
            '/foo': {
                type: 'countries',
                item: '',
                view: 'grid',
                find: {
                    conditions: [
                        {key: '*', operator: '=', value: 'foo'}
                    ],
                    operator: '&'
                }
            },
            '/population=1000,2000': {
                type: 'countries',
                item: '',
                view: 'grid',
                find: {
                    conditions: [
                        {key: 'population', operator: '=', value: ['1000', '2000']}
                    ],
                    operator: '&'
                }
            },
            '/population>0&(name=a*|name=*z)': {
                type: 'countries',
                item: '',
                view: 'grid',
                find: {
                    conditions: [
                        {key: 'population', operator: '>', value: '0'},
                        {
                            conditions: [
                                {key: 'name', operator: '^', value: 'a'},
                                {key: 'name', operator: '$', value: 'z'}
                            ],
                            operator: '|'
                        }
                    ],
                    operator: '&'
                }
            },
            '/#a?k=v&l=w': {
                hash: {
                    anchor: 'a',
                    query: [
                        {key: 'k', value: 'v'},
                        {key: 'l', value: 'w'}
                    ]
                }
            },
            '/#?a=[1,2]&b=true&n=1.2&o={"k":"v"}&s1="foo"&s2=bar': {
                hash: {
                    query: [
                        {key: 'a', value: [1, 2]},
                        {key: 'b', value: true},
                        {key: 'n', value: 1.2},
                        {key: 'o', value: {k: 'v'}},
                        {key: 's1', value: 'foo'},
                        {key: 's2', value: 'bar'}
                    ]
                }
            },
            '/#invalid?invalid=true': {}
        };
    </script>
    > !!Ox.test.url.parse('/', function(o) { Ox.test(o, Ox.test.result['/']); })
    true
    > !!Ox.test.url.parse('/faq#1', function(o) { Ox.test(o, Ox.test.result['/faq#1']); })
    true
    > !!Ox.test.url.parse('/cities', function(o) { Ox.test(o, Ox.test.result['/cities']); })
    true
    > !!Ox.test.url.parse('/map', function(o) { Ox.test(o, Ox.test.result['/map']); })
    true
    > !!Ox.test.url.parse('/-45,-90,45,90', function(o) { Ox.test(o, Ox.test.result['/-45,-90,45,90']); })
    true
    > !!Ox.test.url.parse('/@New%20York', function(o) { Ox.test(o, Ox.test.result['/@New%20York']); })
    true
    > !!Ox.test.url.parse('/name', function(o) { Ox.test(o, Ox.test.result['/name']); })
    true
    > !!Ox.test.url.parse('/-name,population', function(o) { Ox.test(o, Ox.test.result['/-name,population']); })
    true
    > !!Ox.test.url.parse('/2342', function(o) { Ox.test(o, Ox.test.result['/2342']); })
    true
    > !!Ox.test.url.parse('/2342/map', function(o) { Ox.test(o, Ox.test.result['/2342/map']); })
    true
    > !!Ox.test.url.parse('/2342/name', function(o) { Ox.test(o, Ox.test.result['/2342/name']); })
    true
    > !!Ox.test.url.parse('/foo', function(o) { Ox.test(o, Ox.test.result['/foo']); })
    true
    > !!Ox.test.url.parse('/population=1000,2000', function(o) { Ox.test(o, Ox.test.result['/population=1000,2000']); })
    true
    > !!Ox.test.url.parse('/population>0&(name=a*|name=*z)', function(o) { Ox.test(o, Ox.test.result['/population>0&(name=a*|name=*z)']); })
    true
    > !!Ox.test.url.parse('/#a?k=v&l=w', function(o) { Ox.test(o, Ox.test.result['/#a?k=v&l=w']); })
    true
    > !!Ox.test.url.parse('/#?a=[1,2]&b=true&n=1.2&o={"k":"v"}&s1="foo"&s2=bar', function(o) { Ox.test(o, Ox.test.result['/#?a=[1,2]&b=true&n=1.2&o={"k":"v"}&s1="foo"&s2=bar']); })
    true
    > !!Ox.test.url.parse('/#invalid?invalid=true', function(o) { Ox.test(o, Ox.test.result['/#invalid?invalid=true']); })
    true
@*/

/*

example.com[/page][#hash]
or
example.com[/type][/item][/view][/sort][/span][/find][#hash]

page    Special page, like "about" or "contact".
part    Part (section) of a page, like in "help/accounts".
type    Section a.k.a. item type, like "movies", "edits", "texts" etc.
item    Item id or title, like in '/movies/0060304', '/movies/inception' or
        'texts/ABC'. Testing this is asynchonous.
view    List or item view, like "clips" or "map". Both list and item views are
        per type.
sort    Sort, like "title" or "-director" or "country,year,-language,+runtime"
span    Position or selection in a view, either one or two coordinates or one
        id, like in "video/01:00", "video/-01:00", "video/01:00,-01:00",
        "video/@annotationABC", "video/@subtitles:23", "text/@chapter42",
        "map/0,0", "map/-45,-90,45,90", "map/@barcelona", "image/100,100" etc.
        Testing id is asynchronous.
find    Query, like a=x or a=x&b=y or a=x&(b=y|c=z). A query object has the form
        {conditions: [], operator: ''} (logical operator), and a condition
        object has the form {key: '', value: '' or ['', ''], operator: ''}
        (comparison operator) or {conditions: [], operator: ''} (logical
        operator). Condition strings can be more than just "k=v", see below.
hash    Anchor and/or query, like 'a' or '?k=v' or 'a?k=v&l=w' or
        '?a=[1,2]&b=true&f=1.2&i=3&o={"k":"v"}&s="foo"'. Values are evaluated as
        JSON, and if that fails interpreted as a string. So strings (outside
        arrays or objects) work without quotes as well, unless their value is
        valid JSON, like 'true' or '1'.

String Key Value Operator
v      *   v     =        any text or string contains or any number is
!v     *   v     !=       no text or string contains and no number is
k=v    k   v     =        contains (text or string), is (number)
k!=v   k   v     !=       does not contain (text or string), is not (number)
k==v   k   v     ==       is (string)
k!==v  k   v     !==      is not (string)
k=v*   k   v     ^        starts with (string)
k!=v*  k   v     !^       does not start with (string)
k=*v   k   v     $        ends with (string)
k!=*v  k   v     !$       does not end with (string)
k<v    k   v     <        is less than (number)
k!<v   k   v     !<       is not less than (number)
k>v    k   v     >        is more than (number)
k!>v   k   v     !>       is not more than (number)
k=v,w  k   [v,w] =        is between (number), contains (string or text)
k!=v,w k   [v,w] !=       is not between (number), does not contain (string or text)

All parts of the URL can be omitted, as long as the order is preserved.

example.com/foo
    If "foo" is not a type, item (of the default type), list view (of the
    default type), span id (of any list view of the default type) or sort key
    (of any list view of the default type), then this means find *=foo
example.com/title, or example.com/+title or example.com/-title
    If this neither matches a type or default type item, then this will be sort
example.com/clip/+duration/title=foo
    If "clip" is a default type list view, this will show all clips of items
    that match title=foo, sorted by item duration in ascending order
example.com/clip/+clip.duration/subtitles=foo
    If "clip" is a default type list view and "subtitles" is an annotation type,
    this will show all clips that match subtitles=foo, sorted by clip duration
    in ascending order. (In pan.do/ra's clip view, annotation=foo is always per
    clip. There is no way to show all clips of all items where any clip matches
    subtitles=foo, this doesn't seem to be needed.)
example.com/map/duration/@paris/title!=london
    If "map" is a default type list view and "paris" is a place name, this will
    zoom the map to Paris, show all places of items that match title!=london,
    and when a place is selected sort matching clips by item duration in
    default order.
example.com/calendar/clip:duration/1900,2000/event=hiroshima
    If "calendar" is a default type list view, this will zoom the calendar to
    the 20th century, show all events of all items that match event=hiroshima,
    and when an event is selected sort matching clips by clip duration in
    default order. (In pan.do/ra's map and calendar view, annotation=foo is
    always per item. There is no way to show all events of all clips that match
    event=hiroshima, this doesn't seem to be needed.)

example.com/2001/2001 -> example.com/0062622/video/00:33:21
    2001 matches an item title (word match), the second 2001 is a valid duration
example.com/2002/2002 -> example.com/calendar/2002/2002
    2002 is a valid duration, but no list view supports durations. Then it is
    read as a year, and we get calendar view with find *=2002
example.com/@paris/london -> example.com/map/@paris/london
    paris matches place ABC (case-insensitive), but (assuming) find *=london
    does not match place ABC, "paris" becomes the map query
example.com/@paris/paris -> example.com/map/ABC/paris
    paris matches place ABC (case-insensitive), so we get map view, zoomed to
    ABC/Paris, which is selected, with find *=paris
example.com/@renaissance/renaissance -> example.com/calendar/ABC/renaissance
    renaissaince matches an event name (case-insensitive), so we get calendar
    view, zoomed to the Renaissance, with find *=renaissance
example.com/@foo/foo -> example.com/map/@foo/foo
    foo doesn't match a place or event name, but getSpan() sets the map query to
    foo and returns @foo, so we get map view, zoomed to Foo, with find *=foo
example.com/clip:duration -> example.com/clip/clip:duration
    clip:duration is not a sort key of the default view (grid), so the view is
    set to the first list view that accepts this sort key

*/

Ox.URL = function(options) {

    var self = {}, that = {};

    self.options = Ox.extend({
        // fixme: find keys are also per type/list|item/view
        // since one can search for layer properties in some item views
        findKeys: {},
        getHash: Ox.noop,
        getItem: Ox.noop,
        getPart: Ox.noop,
        getSort: Ox.noop,
        getSpan: Ox.noop,
        pages: [],
        spanType: {},
        sortKeys: {},
        types: [],
        views: {}
    }, options);

    Ox.forEach(self.options.findKeys, function(findKeys) {
        if (Ox.every(findKeys, function(findKey) {
            return findKey.id != '*';
        })) {
            findKeys.push({id: '*', type: 'string'});
        }
    });

    self.previousTitle = '';
    self.previousURL = '';

    window.addEventListener('popstate', function() {
        self.previousTitle = document.title;
        self.previousURL = document.location.pathname
            + document.location.search
            + document.location.hash;
    });

    function constructCondition(condition, state) {
        var key = condition.key == '*' ? '' : condition.key,
            operator = condition.operator,
            value = (
                Ox.isArray(condition.value) ? condition.value : [condition.value]
            ).map(function(value) {
                return encodeValue(constructValue(value, condition.key, state));
            }).join(',');
        if (!key) {
            operator = operator.replace('=', '');
        } else if (operator.indexOf('^') > -1) {
            operator = operator.replace('^', '=');
            value += '*';
        } else if (operator.indexOf('$') > -1) {
            operator = operator.replace('$', '=');
            value = '*' + value;
        }
        return [key, operator, value].join('');
    }

    function constructDate(date) {
        return Ox.formatDate(date, '%Y-%m-%d', true);
    }

    function constructDuration(duration) {
        return Ox.formatDuration(duration, 3).replace(/\.000$/, '');
    }

    function constructFind(find, state) {
        return find.conditions.map(function(condition) {
            return condition.conditions
                ? '(' + constructFind(condition, state) + ')'
                : constructCondition(condition, state);
        }).join(find.operator);
    }

    function constructHash(hash) {
        var obj = {};
        if (hash.query) {
            hash.query.forEach(function(condition) {
                obj[encodeValue(condition.key)] = Ox.isString(condition.value)
                    ? encodeValue(condition.value)
                    : condition.value;
            });
        }
        return hash.anchor || hash.query
            ? '#' + (
                hash.anchor || ''
            ) + (
                hash.query ? '?' + Ox.serialize(obj, true) : ''
            )
            : '';
    }

    function constructLocation(location) {
        return location.join(',');
    }

    function constructSort(sort, state) {
        var sortKeys = self.options.sortKeys[state.type][
            !state.item ? 'list' : 'item'
        ][state.view];
        return sortKeys ? sort.map(function(sort) {
            return (
                Ox.getObjectById(sortKeys, sort.key).operator == sort.operator
                    ? '' : sort.operator
            ) + sort.key;
        }).join(',') : '';
    }

    function constructSpan(span, state) {
        var view = state.view || self.options.views[state.type][
                !state.item ? 'list' : 'item'
            ][0],
            spanType = self.options.spanType[state.type][
                !state.item ? 'list' : 'item'
            ][view],
            points = Ox.contains(['date', 'duration'], spanType)
                && Ox.isArray(span) && span.length == 3 && span[0] == span[1]
                ? span.slice(1) : span;
        return Ox.makeArray(points).map(function(point) {
            return Ox.isNumber(point) ? (
                spanType == 'date' ? constructDate(point)
                : spanType == 'duration' ? constructDuration(point)
                : spanType == 'location' ? constructLocation(point)
                : point
            ) : encodeValue(point, true);
        }).join(',');
    }

    function constructURL(state) {
        var parts = [];
        if (state.page) {
            parts.push(state.page);
            if (state.part) {
                parts.push(encodeValue(state.part));
                if (state.span) {
                    parts.push(encodeValue(state.span));
                }
            }
        } else {
            if (self.options.types.indexOf(state.type) > 0) {
                parts.push(state.type);
            }
            if (state.item) {
                parts.push(encodeValue(state.item, true));
            }
            if (state.type && self.options.views[state.type][
                state.item ? 'item' : 'list'
            ].indexOf(state.view) > -1) {
                parts.push(state.view);
            }
            if (state.sort && state.sort.length) {
                parts.push(constructSort(state.sort, state));
            }
            if (state.span && state.span.length) {
                parts.push(constructSpan(state.span, state));
            }
            if (state.find) {
                parts.push(constructFind(state.find, state));
            }
        }
        return '/' + Ox.filter(parts).join('/') + (
            state.hash ? constructHash(state.hash) : ''
        );
    }

    function constructValue(str, key, state) {
        var findKey = Ox.getObjectById(self.options.findKeys[state.type], key),
            type = Ox.isArray(findKey.type) ? findKey.type[0] : findKey.type,
            value = str,
            values = findKey.values;
        return type == 'enum' ? values[value] : value;
    }

    function decodeValue(value) {
        return Ox.decodeURIComponent(value)
            .replace(/_/g, ' ').replace(/\t/g, '_')
            .replace(/\x0E/g, '<').replace(/\x0F/g, '>');
    }

    function encodeValue(value, isItem) {
        var chars = isItem ? '/?#%' : '*=&|()?#%',
            ret = '';
        value.toString().split('').forEach(function(char) {
            var index = chars.indexOf(char);
            ret += index > -1
                ? '%' + char.charCodeAt(0).toString(16).toUpperCase()
                : char;
        });
        ret = ret.replace(/_/g, '%09').replace(/\s/g, '_');
        if (!isItem) {
            ret = ret.replace(/</g, '%0E').replace(/>/g, '%0F');
        }
        return ret;
    }

    function hasOnlyStringType(spanTypes) {
        var types = Ox.unique(Ox.values(spanTypes));
        return types.length == 1 && types[0] == 'string';
    }

    function isNumericalSpan(str) {
        return str.split(',').every(function(str) {
            return /^[0-9-\.:]+$/.test(str);
        });
    }


    function getSpanType(str, types) {
        Ox.Log('Core', 'getSpanType', str, types)
        var canBeDate = types.indexOf('date') > -1,
            canBeDuration = types.indexOf('duration') > -1,
            canBeLocation = types.indexOf('location') > -1,
            canBeNumber = types.indexOf('number') > -1,
            canBeString = types.indexOf('string') > -1,
            length = str.split(',').length;
        // !/^\d{7}$/.test(str) avoids matching imdb ids
        return canBeDate && /\d-/.test(str) ? 'date'
            : canBeDuration && /:/.test(str) ? 'duration'
            : canBeLocation && length == 4 ? 'location'
            // leaves us with [-]D[.D][,[-]D[.D]]
            : canBeDuration ? 'duration'
            : canBeDate && !/\./.test(str) && !/^\d{7}$/.test(str) && !/^\d{8}$/.test(str) ? 'date'
            : canBeLocation && length == 2 ? 'location'
            : canBeNumber && /^\d+$/.test(str) ? 'number'
            : canBeString && str.length ? 'string'
            : '';
    }

    function parseCondition(str, state) {
        Ox.Log('Core', 'PARSE COND', str)
        var condition = {},
            operators = ['!==', '==', '!=', '=', '!<', '<', '!>', '>'],
            split;
        str = str.replace(/%3C/g, '<').replace(/%3E/g, '>');
        Ox.forEach(operators, function(operator) {
            if (str.indexOf(operator) > -1) {
                split = str.split(operator);
                condition = {
                    key: split.shift(),
                    value: split.join(operator),
                    operator: operator
                };
                return false; // break
            }
        });
        if (
            !condition.operator
            || Ox.getIndexById(self.options.findKeys[state.type], condition.key) == -1
        ) {
            // missing operator or unknown key
            condition = {key: '*', value: str, operator: '='};
        }
        if (['=', '!='].indexOf(condition.operator) > -1) {
            if (Ox.startsWith(condition.value, '*') && !Ox.endsWith(condition.value, '*')) {
                condition.value = condition.value.slice(1);
                condition.operator = condition.operator.replace('=', '$')
            } else if (Ox.endsWith(condition.value, '*') && !Ox.startsWith(condition.value, '*')) {
                condition.value = condition.value.slice(0, -1);
                condition.operator = condition.operator.replace('=', '^')
            }
        }
        if (
            ['date', 'enum', 'float', 'integer', 'time', 'year'].indexOf(
                Ox.getObjectById(self.options.findKeys[state.type], condition.key).type
            ) > -1
            && condition.value.indexOf(',') > -1
        ) {
            condition.value = condition.value.split(',').map(function(value) {
                return parseValue(decodeValue(value), condition.key, state);
            });
        } else {
            condition.value = parseValue(decodeValue(condition.value), condition.key, state);
        }
        Ox.Log('Core', 'PARSE COND', str, condition);
        return condition;
    }

    function parseDate(str) {
        return Ox.formatDate(Ox.parseDate(str, true), '%Y-%m-%d');
    }

    function parseDuration(str) {
        return Ox.parseDuration(str);
    }

    function parseFind(str, state) {
        str = (str || '').replace(/%7C/g, '|');
        var counter = 0,
            find = {conditions: [], operator: '&'},
            salt = Ox.range(16).map(function() {
                    return Ox.char(65 + Ox.random(26));
                }).join(''),
            regexp = new RegExp(salt + '(\\d+)'),
            subconditions = [];
        if (str.length) {
            // replace subconditions with placeholder,
            // so we can later split by main operator
            Ox.forEach(str, function(c, i) {
                if (c == ')') {
                    counter--;
                }
                if (counter >= 1) {
                    subconditions[subconditions.length - 1] += c;
                }
                if (c == '(') {
                    (++counter == 1) && subconditions.push('');
                }
            });
            subconditions = subconditions.filter(function(subcondition) {
                // make sure empty brackets don't throw errors
                return !!subcondition;
            });
            subconditions.forEach(function(subcondition, i) {
                str = str.replace(subcondition, salt + i);
            });
            find.operator = str.indexOf('|') > -1 ? '|' : '&'
            find.conditions = str.split(find.operator).map(function(condition, i) {
                condition = condition.replace(regexp, function(match) {
                    return subconditions[parseInt(arguments[1])];
                });
                return condition[0] == '('
                    ? parseFind(condition.slice(1, -1), state)
                    : parseCondition(condition, state);
            });
        }
        return find;
    }

    function parseHash(str) {
        var hash = {},
            split = str.split('?');
        if (split[0]) {
            hash.anchor = decodeValue(split[0]);
        }
        if (split[1]) {
            Ox.forEach(Ox.unserialize(Ox.decodeURIComponent(split[1]), true), function(value, key) {
                hash.query = hash.query || [];
                hash.query.push({
                    key: decodeValue(key),
                    value: Ox.isString(value) ? decodeValue(value) : value
                });
            });
        }
        return hash;
    }

    function parseLocation(str) {
        return str.split(',').map(function(str, i) {
            return Ox.limit(parseInt(str, 10), -90 * (i + 1), 90 * (i + 1));
        });
    }

    function parseNumber(str) {
        return parseInt(str);
    }

    function parseSort(str, state) {
        return str.split(',').map(function(str) {
            var hasOperator = /^[\+-]/.test(str);
            return {
                key: hasOperator ? str.slice(1) : str,
                operator: hasOperator
                    ? str[0]
                    : Ox.getObjectById(self.options.sortKeys[state.type][
                        !state.item ? 'list' : 'item'
                    ][state.view], str).operator
            };
        });
    }

    function parseSpan(str, type) {
        var split = str.split(',');
        if (type == 'string') {
            return str;
        }
        if (split.length == 4) {
            split = [split[0] + ',' + split[1], split[2] + ',' + split[3]];
        }
        return split.map(
            type == 'date' ? parseDate
            : type == 'duration' ? parseDuration
            : type == 'location' ? parseLocation
            : parseNumber
        );
    }

    function parseURL(str, callback) {
        // fixme: removing trailing slash makes it impossible to search for '/'
        var split = str.split('#'),
            parts = split.shift().replace(/(^\/|\/$)/g, '').split('/'),
            state = split.length && split[0].length
                ? {hash: parseHash(split.join('#'))}
                : {};
        if (parts[0] == '') {
            // empty URL
            getHash();
        } else if (self.options.pages.indexOf(parts[0]) > -1) {
            // page
            state.page = parts[0];
            parts.shift();
            if (parts.length) {
                // may modify state.part
                self.options.getPart(state, decodeValue(parts[0]), function() {
                    if (state.part) {
                        parts.shift();
                        if (parts.length) {
                            parsePartSpan();
                        } else {
                            getHash();
                        }
                    } else {
                        getHash();
                    }
                });
            } else {
                getHash();
            }
        } else {
            if (self.options.types.indexOf(parts[0]) > -1) {
                // type
                state.type = parts[0];
                parts.shift();
            } else {
                // set to default type
                state.type = self.options.types[0];
            }
            if (parts.length) {
                Ox.Log('Core', 'ST', state.type, self.options.views)
                if (self.options.views[state.type].list.indexOf(parts[0]) > -1) {
                    // list view
                    state.item = '';
                    state.view = parts[0];
                    parts.shift();
                    parseBeyondItem();
                } else {
                    // test for item id or name
                    self.options.getItem(state, decodeValue(parts[0]), function() {
                        // may have modified state.item
                        if (state.item) {
                            parts.shift();
                        }
                        parseBeyondItem();
                    });
                }
            } else {
                state.item = '';
                // set to default list view
                state.view = self.options.views[state.type].list[0];
                getHash();
            }
        }
        function parseBeyondItem() {
            Ox.Log('Core', 'pBI', state, parts.join('/'));
            var sortKeyIds, sortParts;
            if (
                parts.length && state.item
                && self.options.views[state.type].item.indexOf(parts[0]) > -1
            ) {
                // item view
                state.view = parts[0];
                parts.shift();
            } else if (state.item && self.options.views[state.type].item.length == 1) {
                state.view = self.options.views[state.type].item[0];
            }
            if (parts.length) {
                sortParts = parts[0].split(',');
                sortKeyIds = Ox.map(self.options.sortKeys[state.type][
                    !state.item ? 'list' : 'item'
                ], function(sortKeys) {
                    return sortKeys.map(function(sortKey) {
                        return sortKey.id;
                    });
                });
                // test if sort keys match the given view,
                // or any view if no view is given
                Ox.forEach(
                    state.view ? [state.view]
                    : self.options.views[state.type][!state.item ? 'list' : 'item'],
                    function(view) {
                        if (sortKeyIds[view] && sortParts.every(function(part) {
                            return sortKeyIds[view].indexOf(part.replace(/^[\+-]/, '')) > -1;
                        })) {
                            if (!state.view) {
                                // set list or item view
                                state.view = view;
                            }
                            // sort
                            state.sort = parseSort(parts[0], state);
                            parts.shift();
                            return false; // break
                        }
                    }
                );
                if (state.sort) {
                    // may modify state.sort
                    self.options.getSort(state, state.sort, parseBeyondSort);
                } else {
                    parseBeyondSort();
                }
            } else {
                if (!state.view) {
                    // set to default list or item view
                    state.view = self.options.views[state.type][
                        !state.item ? 'list' : 'item'
                    ][0];
                }
                getHash();
            }
        }
        function parseBeyondSort() {
            Ox.Log('Core', 'pBSo', state, parts.join('/'))
            var span, spanType, spanTypes;
            if (parts.length) {
                spanTypes = self.options.spanType[state.type][
                    !state.item ? 'list' : 'item'
                ];
                if (isNumericalSpan(parts[0]) || hasOnlyStringType(spanTypes)) {
                    // test for numerical span
                    // if no view is given then parse the span anyway,
                    // but make sure the span type could match a view
                    spanType = state.view
                        ? spanTypes[state.view]
                        : getSpanType(parts[0], Ox.unique(Ox.values(spanTypes)));
                    Ox.Log('URL', 'SPAN TYPE', spanType)
                    if (spanType) {
                        span = parseSpan(parts[0], spanType);
                        if (span) {
                            if (state.view) {
                                state.span = span;
                                parts.shift();
                            } else {
                                // if no view is given then switch to the first
                                // view that supports a span of this type
                                Ox.forEach(self.options.views[state.type][
                                    !state.item ? 'list' : 'item'
                                ], function(view) {
                                    if (spanTypes[view] == spanType) {
                                        state.view = view;
                                        state.span = span;
                                        parts.shift();
                                        return false; // break
                                    }
                                });
                            }
                        }
                    }
                }
                if (state.span && (spanType == 'duration' || spanType == 'string')) {
                    // test duration or numerical string, may modify state.span
                    self.options.getSpan(state, state.span, parseBeyondSpan);
                } else if (!state.span && (
                    spanTypes[state.view] == 'string' || /^[A-Z@]/.test(parts[0])
                )) {
                    // test for string or span id or name
                    self.options.getSpan(state, decodeValue(parts[0]), function() {
                        // may have modified state.view and state.span
                        if (state.span) {
                            parts.shift();
                        }
                        parseBeyondSpan();
                    });
                } else {
                    parseBeyondSpan();
                }
            } else {
                if (!state.view) {
                    // set to default list or item view
                    state.view = self.options.views[state.type][
                        !state.item ? 'list' : 'item'
                    ][0];
                }
                getHash();
            }
        }
        function parseBeyondSpan() {
            Ox.Log('Core', 'pBSp', state, parts.join('/'))
            if (!state.view) {
                // set to default list or item view
                state.view = self.options.views[state.type][
                    !state.item ? 'list' : 'item'
                ][0];
            }
            if (parts.length) {
                // find
                state.find = parseFind(parts.join('/'), state);
            }
            getHash();
        }
        function parsePartSpan() {
            options.getSpan(state, decodeValue(parts.join('/')), getHash);
        }
        function getHash() {
            self.options.getHash(state, function() {
                // may have modified state.hash
                callback(state);
            });
        }
    }

    function parseValue(str, key, state) {
        var findKey = Ox.getObjectById(self.options.findKeys[state.type], key),
            type = Ox.isArray(findKey.type) ? findKey.type[0] : findKey.type,
            value = str,
            values = findKey.values;
        if (type == 'boolean') {
            value = ['', 'false'].indexOf(str) == -1;
        } else if (type == 'date') {
            value = Ox.formatDate(Ox.parseDate(str, true), '%F', true);
        } else if (type == 'enum') {
            value = Math.max(values.map(function(value) {
                return value.toLowerCase();
            }).indexOf(str.toLowerCase()), 0);
        } else if (type == 'float') {
            value = parseFloat(str) || 0;
        } else if (type == 'integer') {
            value = Math.round(str) || 0;
        } else if (type == 'time') {
            value = Ox.formatDuration(Ox.parseDuration(value));
        } else if (type == 'year') {
            value = Math.round(str) || 1970;
        }
        return value.toString();
    }

    function saveURL() {

    }

    /*@
    options <f> Gets or sets the options of an element object
        () -> <o> All options
        (key) -> <*> The value of option[key]
        (key, value) -> <o> This element
            Sets options[key] to value and calls update(key, value)
            if the key/value pair was added or modified
        ({key: value, ...}) -> <o> This element
            Sets multiple options and calls update(key, value)
            for every key/value pair that was added or modified
        key <s> The name of the option
        value <*> The value of the option
    @*/
    that.options = function() {
        return Ox.getset(self.options, arguments, null, that);
    };

    /*@
    parse <f> parse
        (callback) -> <o> parse state from document.location
        (url, callback) -> <o> parse state from passed url
    @*/
    that.parse = function() {
        var str = arguments.length == 2 ? arguments[0]
                : document.location.pathname
                + document.location.search
                + document.location.hash,
            callback = arguments[arguments.length - 1];
        parseURL(str, callback);
        return that;
    };

    /*@
    pop <f> Sets the URL to the previous URL
    @*/
    that.pop = function() {
        if (self.previousURL) {
            history.pushState && !Ox.Fullscreen.getState() && history.pushState(
                {}, self.previousTitle, self.previousURL
            );
            document.title = self.previousTitle;
        }
        return !!self.previousURL;
    };

    /*@
    push <f> Pushes a new URL
        (state, title, url, callback) -> <o> URL controller
        state <o> State for the new URL
            If state is null, it will be derived from url
        title <s> Title for the new URL
        url <s|o> New URL
            If url is null, it will be derived from state
        callback <f> callback function
            state <o> New state
    @*/
    that.push = function(state, title, url, callback) {
        if (!state) {
            parseURL(url, function(state) {
                pushState(state, title, url);
            });
        } else {
            url = url || constructURL(state);
            pushState(state, title, url);
        }
        function pushState(state, title, url) {
            self.previousTitle = document.title;
            self.previousURL = document.location.pathname
                + document.location.search
                + document.location.hash;
            if (url != self.previousURL) {
                history.pushState && !Ox.Fullscreen.getState() && history.pushState(
                    Ox.extend(state, {title: title}), '', url
                );
                document.title = title;
                callback && callback(state);
            }
        }
    }

    /*@
    replace <f> Replaces the URL with a new URL
        (state, title, url, callback) -> <o> URL controller
        state <o> State for the new URL
            If state is null, it will be derived from url
        title <s> Title for the new URL
        url <s|o> New URL
            If url is null, it will be derived from state
        callback <f> callback function
            state <o> New state
    @*/
    that.replace = function(state, title, url, callback) {
        if (!state) {
            parseURL(url, function(state) {
                replaceState(state, title, url);
            });
        } else {
            url = url || constructURL(state);
            replaceState(state, title, url);
        }
        function replaceState(state, title, url) {
            history.replaceState && !Ox.Fullscreen.getState() && history.replaceState(
                Ox.extend(state, {title: title}), '', url
            );
            document.title = title;
            callback && callback(state);
        }
    }

    return that;

};
