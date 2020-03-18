'use strict';

/*@
Ox.Spreadsheet <f> Spreadsheet
    options <o> Options
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.Element> Spreadsheet
        change <!> change
@*/
Ox.Spreadsheet = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({
            columnPlaceholder: '',
            columns: [],
            columnTitleType: 'str',
            columnWidth: 64,
            rowPlaceholder: '',
            rows: [],
            rowTitleType: 'str',
            rowTitleWidth: 128,
            title: '',
            value: {}
        })
        .options(options || {})
        .addClass('OxSpreadsheet');

    if (Ox.isEmpty(self.options.value)) {
        self.options.value = {
            columns: [],
            rows: [],
            values: []
        }
        Ox.loop(4, function(i) {
            self.options.value.columns.push('');
            self.options.value.rows.push('');
            self.options.value.values.push([0, 0, 0, 0]);
        });
    } else {
        self.options.value.values = self.options.value.values || [];
        if (Ox.isEmpty(self.options.value.values)) {
            self.options.value.values = [];
            self.options.value.rows.forEach(function(row, r) {
                self.options.value.values.push([]);
                self.options.value.columns.forEach(function(column, c) {
                    self.options.value.values[r].push(0);
                });
            });
        }
    }

    renderSpreadsheet();

    function addColumn(index) {
        self.options.value.columns.splice(index, 0, '');
        self.options.value.values.forEach(function(columns) {
            columns.splice(index, 0, 0);
        });
        renderSpreadsheet();
    }

    function addRow(index) {
        self.options.value.rows.splice(index, 0, '');
        self.options.value.values.splice(index, 0, Ox.repeat([0], self.columns));
        renderSpreadsheet();
    }

    function getSums() {
        var sums = {
            column: Ox.repeat([0], self.columns),
            row: Ox.repeat([0], self.rows),
            sheet: 0
        };
        self.options.value.values.forEach(function(columns, r) {
            columns.forEach(function(value, c) {
                sums.column[c] += value;
                sums.row[r] += value;
                sums.sheet += value;
            });
        });
        return sums;
    }

    function removeColumn(index) {
        self.options.value.columns.splice(index, 1);
        self.options.value.values.forEach(function(columns) {
            columns.splice(index, 1);
        });
        renderSpreadsheet();
    }

    function removeRow(index) {
        self.options.value.rows.splice(index, 1);
        self.options.value.values.splice(index, 1);
        renderSpreadsheet();
    }

    function renderSpreadsheet() {

        self.columns = self.options.value.columns.length;
        self.rows = self.options.value.rows.length;
        self.sums = getSums();
        self.$input = {};

        that.empty()
            .css({
                width: self.options.rowTitleWidth
                    + self.options.columnWidth * (self.columns + 1) + 'px',
                height: 16 * (self.rows + 2) + 'px'
            });

        [self.options.title].concat(Ox.clone(self.options.value.rows), ['Total']).forEach(function(row, r) {
            r--;
            [''].concat(Ox.clone(self.options.value.columns), ['Total']).forEach(function(column, c) {
                c--;
                if (r == -1) {
                    if (c == -1 || c == self.columns) {
                        Ox.Label({
                                style: 'square',
                                textAlign: c == -1 ? 'left' : 'right',
                                title: c == -1 ? self.options.title : 'Total',
                                width: c == -1 ? self.options.rowTitleWidth : self.options.columnWidth
                            })
                            .appendTo(that);
                    } else {
                        Ox.MenuButton({
                                style: 'square',
                                type: 'image',
                                items: [
                                    {id: 'before', title: Ox._('Add column before')},
                                    {id: 'after', title: Ox._('Add column after')},
                                    {id: 'remove', title: Ox._('Remove this column'), disabled: self.columns == 1}
                                ]
                            })
                            .bindEvent({
                                click: function(data) {
                                    if (data.id == 'remove') {
                                        removeColumn(c);
                                    } else {
                                        addColumn(c + (data.id == 'after'));
                                    }
                                    triggerChangeEvent();
                                }
                            })
                            .appendTo(that);
                        Ox.Input({
                                placeholder: self.options.columnPlaceholder,
                                style: 'square',
                                type: self.options.columnTitleType,
                                value: column,
                                width: self.options.columnWidth - 16
                            })
                            .bindEvent({
                                change: function(data) {
                                    self.options.value.columns[c] = data.value;
                                    triggerChangeEvent();
                                }
                            })
                            .appendTo(that);
                    }
                } else {
                    if (c == -1) {
                        if (r < self.rows) {
                            Ox.MenuButton({
                                    style: 'square',
                                    type: 'image',
                                    items: [
                                        {id: 'before', title: Ox._('Add row above')},
                                        {id: 'after', title: Ox._('Add row below')},
                                        {id: 'remove', title: Ox._('Remove this row'), disabled: self.rows == 1}
                                    ]
                                })
                                .bindEvent({
                                    click: function(data) {
                                        if (data.id == 'remove') {
                                            removeRow(r);
                                        } else {
                                            addRow(r + (data.id == 'after'));
                                        }
                                        triggerChangeEvent();
                                    }
                                })
                                .appendTo(that);
                            Ox.Input({
                                    placeholder: self.options.rowPlaceholder,
                                    style: 'square',
                                    type: self.options.rowTitleType,
                                    value: row,
                                    width: self.options.rowTitleWidth - 16
                                })
                                .bindEvent({
                                    change: function(data) {
                                        self.options.value.rows[r] = data.value;
                                        triggerChangeEvent();
                                    }
                                })
                                .appendTo(that);
                        } else {
                            Ox.Label({
                                    style: 'square',
                                    textAlign: 'right',
                                    title: row,
                                    width: self.options.rowTitleWidth
                                })
                                .appendTo(that);
                        }
                    } else {
                        var id = c + ',' + r,
                            isColumnSum = r == self.rows,
                            isRowSum = c == self.columns,
                            isSheetSum = isColumnSum && isRowSum,
                            isSum = isColumnSum || isRowSum;
                        self.$input[id] = Ox.Input({
                                //changeOnKeypress: true,
                                disabled: isSum,
                                style: 'square',
                                type: 'int',
                                value: isSheetSum ? self.sums.sheet
                                    : isColumnSum ? self.sums.column[c]
                                    : isRowSum ? self.sums.row[r]
                                    : self.options.value.values[r][c],
                                width: self.options.columnWidth
                            })
                            .appendTo(that);
                        !isSum && self.$input[id].bindEvent({
                            change: function(data) {
                                self.options.value.values[r][c] = parseInt(data.value, 10);
                                self.sums = getSums();
                                self.$input[c + ',' + self.rows].value(self.sums.column[c]);
                                self.$input[self.columns + ',' + r].value(self.sums.row[r]);
                                self.$input[self.columns + ',' + self.rows].value(self.sums.sheet);
                                triggerChangeEvent();
                            }
                        });                    
                    }
                }
            });
        });

    }

    function triggerChangeEvent() {
        that.triggerEvent('change', {
            value: self.options.value
        });
    }

    return that;

};
