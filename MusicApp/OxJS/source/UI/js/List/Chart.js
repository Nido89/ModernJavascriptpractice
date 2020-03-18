'use strict';

/*@
Ox.Chart <f> Bar Chart
    options <o> Options
        color <[n]|[[n]]|[128, 128, 128]> Bar color
        data <o> {k: v, ...} or {k: {k: v, ...}, ...}
        formatKey <f|null> Format function for keys
        keyAlign <s|'right'> Alignment of keys
        keyWidth <n|128> Width of keys
        limit <n|0> Number of items, or 0 for all
        rows <n|1> undocumented
        sort <o|{key: 'value', operator: '-'}> Sort
        title <s|''> Chart title
        width <n|512> Chart width
    self <o> shared private variable
    ([options[, self]]) -> <o:Ox.Element> Chart object
@*/

Ox.Chart = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({
            color: [128, 128, 128],
            data: {},
            formatKey: null,
            keyAlign: 'right',
            keyWidth: 128,
            limit: 0,
            rows: 1,
            sort: {key: 'value', operator: '-'},
            sortKey: null,
            title: '',
            width: 512
        })
        .options(options || {})
        .update({
            width: function() {
                self.$chart.empty();
                renderChart();
            }
        })
        .addClass('OxChart');

    self.valueWidth = self.options.width - self.options.keyWidth;

    self.keys = Object.keys(self.options.data);
    if (Ox.isObject(self.options.data[self.keys[0]])) {
        if (Ox.isUndefined(options.color)) {
            self.options.color = [
                [192,  64,  64], [ 64, 192,  64], [ 64,  64, 192],
                [192, 192,  64], [ 64, 192, 192], [192,  64, 192],
                [192, 128,  64], [ 64, 192, 128], [128,  64, 192],
                [192,  64, 128], [128, 192,  64], [ 64, 128, 192]
            ];
        }
        self.subData = {};
    }

    self.sort = {};
    self.totals = {};
    Ox.forEach(self.options.data, function(value, key) {
        self.totals[key] = self.subData ? Ox.sum(value) : value;
        if (self.subData) {
            Object.keys(value).forEach(function(subKey) {
                self.subData[subKey] = (self.subData[subKey] || 0) + value[subKey];
            });
        }
        self.sort[key] = key.replace(/(\d+)/g, function(number) {
            return Ox.pad(parseInt(number, 10), 16);
        });
    });
    self.max = Ox.max(self.totals);
    self.sum = Ox.sum(self.totals);

    if (self.subData) {
        Ox.forEach(self.subData, function(subValue, subKey) {
            self.sort[subKey] = subKey.replace(/(\d+)/g, function(number) {
                return Ox.pad(parseInt(number, 10), 16);
            });
        });
        self.subKeys = Object.keys(self.subData).sort(function(a, b) {
            var aValue = self.subData[a],
                bValue = self.subData[b];
            return a === '' ? 1
                : b === '' ? -1
                : self.sort[a] < self.sort[b] ? -1
                : self.sort[a] > self.sort[b] ? 1
                : 0;
        });
    }

    self.items = self.keys.map(function(key) {
        return {
            key: key,
            keySort: self.sort[key],
            value: self.options.data[key],
            valueSort: self.subData ? self.totals[key] : self.options.data[key]
        };
    });
    self.sortBy = self.options.sort.key == 'key'
        ? [
            {key: 'keySort', operator: self.options.sort.operator}
        ]
        : [
            {key: 'valueSort', operator: self.options.sort.operator},
            {key: 'keySort', operator: '+'}
        ]
    if (self.options.limit) {
        self.items = Ox.sortBy(
            self.items, self.sortBy
        ).slice(0, self.options.limit);
        self.max = Ox.max(self.items.map(function(item) {
            return self.subData ? Ox.sum(item.value) : item.value;
        }));
    }
    self.max = self.max || 1;

    if (self.options.rows == 2) {
        self.row = 0;
    }

    self.$title = Ox.Bar({size: 16})
        .append(
            $('<div>')
                .css({margin: '1px 0 0 4px'})
                .html(self.options.title)
        )
        .appendTo(that);

    self.$chart = $('<div>')
        .css({position: 'absolute', top: '16px'})
        .append(renderChart())
        .appendTo(that);

    function getColumns() {
        return [
            {
                align: self.options.keyAlign,
                format: self.options.formatKey,
                id: 'key',
                width: self.options.keyWidth,
                visible: true
            },
            {
                format: renderValue,
                id: 'value',
                width: self.valueWidth,
                visible: true
            }
        ];
    }

    function getWidths(values) {
        var max, maxKeys,
            total = Ox.sum(values),
            totalWidth = Math.ceil(total / self.max * self.valueWidth),
            widths = {};
        Ox.forEach(values, function(value, key) {
            widths[key] = Math.round(value / total * totalWidth);
        });
        while (Ox.sum(widths) != totalWidth) {
            max = Ox.max(widths);
            maxKeys = Object.keys(widths).filter(function(key) {
                return widths[key] == max;
            });
            widths[maxKeys[0]] += Ox.sum(widths) < totalWidth ? 1 : -1;
        }
        return widths;
    }

    function renderChart() {
        that.css({
            width: self.options.width + 'px',
            height: 16 + self.items.length * 16 + 'px',
            overflowY: 'hidden'
        });
        return Ox.TableList({
                columns: getColumns(),
                items: self.items,
                max: 0,
                min: 0,
                pageLength: self.items.length,
                sort: self.sortBy,
                width: self.options.width,
                unique: 'key'
            })
            .css({
                left: 0,
                top: 0,
                width: self.options.width + 'px',
                height: self.items.length * 16 + 'px'
            });
    }

    function renderValue(value, data) {
        var $bars = [],
            $element,
            colors = [], len, widths;
        if (!self.subData) {
            $element = $bars[0] = Ox.Element({
                    element: '<div>',
                    tooltip: Ox.formatNumber(value)
                        + ' (' + Ox.formatPercent(value * self.options.rows, self.sum, 2) + ')'
                })
                .css({
                    width: Math.ceil(value / self.max * self.valueWidth) + 'px',
                    height: '14px',
                    borderRadius: '4px',
                    marginLeft: '-4px'
                });
            colors[0] = Ox.isFunction(self.options.color)
                ? self.options.color(data.key) : self.options.color;
        } else {
            $element = $('<div>')
                .css({
                    width: Math.ceil(self.totals[data.key] / self.max * self.valueWidth) + 'px',
                    height: '14px',
                    marginLeft: '-4px'
                });
            len = Ox.len(value);
            widths = getWidths(value);
            self.subKeys.forEach(function(subKey, subKeyIndex) {
                var i = $bars.length,
                    subValue = value[subKey];
                if (subValue) {
                    $bars[i] = Ox.Element({
                            element: '<div>',
                            /*
                            tooltip: Ox.formatNumber(self.totals[data.key])
                                + ' (' + Ox.formatPercent(self.totals[data.key] * self.options.rows, self.sum, 2) + ')'
                                + '<br>' + subKey + ': ' + Ox.formatNumber(subValue)
                                + ' (' + Ox.formatPercent(subValue, self.totals[data.key], 2) + ')'
                            */
                            tooltip: Ox.formatNumber(self.totals[data.key])
                                + ' (' + Ox.formatPercent(self.totals[data.key] * self.options.rows, self.sum, 2) + ')'
                        })
                        .css({
                            float: 'left',
                            width: widths[subKey] + 'px',
                            height: '14px',
                            borderTopLeftRadius: i == 0 ? '4px' : 0,
                            borderBottomLeftRadius: i == 0 ? '4px' : 0,
                            borderTopRightRadius: i == len - 1 ? '4px' : 0,
                            borderBottomRightRadius: i == len - 1 ? '4px' : 0
                        })
                        .appendTo($element);
                    colors[i] = subKey == '' ? [128, 128, 128]
                        : Ox.isArray(self.options.color)
                        ? self.options.color[subKeyIndex % self.options.color.length]
                        : Ox.isObject(self.options.color)
                        ? self.options.color[subKey]
                        : self.options.color(subKey);
                }
            });
        }
        $bars.forEach(function($bar, i) {
            /*
            if (self.options.rows == 2) {
                colors[i] = colors[i].map(function(v) {
                    return v + (self.row % 2 == 0 ? 16 : -16);
                });
            }
            */
            ['moz', 'o', 'webkit'].forEach(function(browser) {
                $bar.css({
                    backgroundImage: '-' + browser
                        + '-linear-gradient(top, rgb(' + colors[i].map(function(v) {
                            return Ox.limit(v + 16, 0, 255);
                        }).join(', ') + '), rgb(' + colors[i].map(function(v) {
                            return Ox.limit(v - 16, 0, 255);
                        }) + '))'
                });
            });
        });
        if (self.options.rows == 2) {
            self.row++;
        }
        return $element;
    }

    return that;

};
