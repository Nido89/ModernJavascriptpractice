'use strict';

/*@
Ox.FileInput <f> File Input
    options <o> Options
        disabled <b|false> If true, the element is disabled
        maxFiles <n|-1> Maximum number of files (or -1 for unlimited)
        maxLines <n|-1> Maximum number of lines to display (or -1 for unlimited)
        maxSize <n|-1> Maximum total file size in bytes (or -1 for unlimited)
        value <a|[]> Value (array of file objects)
        width <w|256> Width in px
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.Element> File Input
        change <!> change
@*/

Ox.FileInput = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({
            disabled: false,
            label: '',
            labelWidth: 128,
            maxFiles: -1,
            maxLines: -1,
            maxSize: -1,
            value: [],
            width: 256
        })
        .options(options || {})
        .update({
            disabled: function() {
                that[self.options.disabled ? 'addClass' : 'removeClass']('OxDisabled');
                self.$button.options({disabled: self.options.disabled});
                self.$input && self.$input[self.options.disabled ? 'hide' : 'show']();
            },
            label: function() {
                self.$label && self.$label.options({title: self.options.label});
            }
        })
        .addClass('OxFileInput' + (self.options.disabled ? ' OxDisabled' : ''))
        .css({width: self.options.width + 'px'});

    self.multiple = self.options.maxFiles != 1;
    self.size = getSize();

    if (self.options.label) {
        self.$label = Ox.Label({
            overlap: 'right',
            textAlign: 'right',
            title: self.options.label,
            width: self.options.labelWidth
        })
        .appendTo(that);
    }

    self.$bar = Ox.Bar({size: 14})
        .css(
            Ox.extend({
                width: getWidth() - 2 + 'px'
            }, self.multiple && self.options.value.length ? {
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0
            } : {})
        )
        .appendTo(that);

    self.$title = $('<div>')
        .css({
            float: 'left',
            width: getWidth() - 104 + 'px',
            paddingLeft: '6px',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
        })
        .html(getTitleText())
        .appendTo(self.$bar);

    self.$size = $('<div>')
        .css({
            float: 'left',
            width: '64px',
            height: '14px',
            paddingRight: '16px',
            textAlign: 'right'
        })
        .html(getSizeText())
        .appendTo(self.$bar);

    self.$button = Ox.Button({
            disabled: self.options.disabled,
            style: 'symbol',
            title: self.multiple || self.options.value.length == 0
                ? 'add' : 'close',
            type: 'image'
        })
        .attr({
            title: self.multiple || self.options.value.length == 0
                ? '' : 'Clear'
        })
        .css({
            float: 'left',
            marginTop: '-1px'
        })
        .bindEvent({
            click: clearFile
        })
        .appendTo(self.$bar);

    if (self.multiple || self.options.value.length == 0) {
        self.$input = renderInput();
        self.options.disabled && self.$input.hide();
    }

    if (self.multiple) {
        self.$files = $('<div>')
            .addClass('OxFiles')
            .css({
                width: getWidth() - 2 + 'px',
                height: getHeight()
            })
            .appendTo(that);
        self.options.value.length == 0 && self.$files.hide();
        self.$list = Ox.TableList({
                columns: [
                    {
                        id: 'name',
                        visible: true,
                        width: getWidth() - 94
                    },
                    {
                        align: 'right',
                        format: function(value) {
                            return Ox.formatValue(value, 'B');
                        },
                        id: 'size',
                        visible: true,
                        width: 64
                    },
                    {
                        align: 'right',
                        format: function(value, data) {
                            return Ox.Button({
                                    style: 'symbol',
                                    title: 'close',
                                    type: 'image'
                                })
                                .attr({title: Ox._('Remove File')})
                                .css({margin: '-1px -4px 0 0'})
                                .bindEvent({
                                    click: function() {
                                        self.$list.options({selected: [value]});
                                        removeFiles([value]);
                                    }
                                });
                        },
                        id: 'id',
                        visible: true,
                        width: 28
                    }
                ],
                items: getItems(),
                sort: [{key: 'name', operator: '+'}],
                unique: 'id'
            })
            .css({
                left: 0,
                top: 0,
                width: getWidth() - 2 + 'px',
                height: '64px'
            })
            .bindEvent({
                'delete': function(data) {
                    removeFiles(data.ids);
                }
            })
            .appendTo(self.$files);
    }

    function addFiles(e) {
        var filelist = e.target.files,
            files = [];
        Ox.loop(filelist.length, function(i) {
            files.push(filelist.item(i));
        });
        files.sort(self.options.maxSize == -1 ? function(a, b) {
            a = a.name.toLowerCase();
            b = b.name.toLowerCase();
            return a < b ? -1 : a > b ? 1 : 0;
        } : function(a, b) {
            // if there is a max size,
            // try to add small files first
            return a.size - b.size;
        }).forEach(function(file) {
            if (!exists(file) && (
                self.options.maxFiles == -1
                || self.options.value.length < self.options.maxFiles
            ) && (
                self.options.maxSize == -1
                || self.size + file.size < self.options.maxSize
            )) {
                self.options.value.push(file);
                self.size += file.size;
            }
        });
        self.$title.html(getTitleText());
        self.$size.html(getSizeText());
        if (self.multiple) {
            self.$bar.css({
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 1
            });
            self.$files.css({height: getHeight()}).show();
            self.$list.options({items: getItems()});
            if (
                self.options.value.length == self.options.maxFiles
                || self.size == self.options.maxSize
            ) {
                self.$button.options({disabled: true});
            }
            self.$input = renderInput();
        } else {
            self.$button.options({title: 'close'}).attr({title: Ox._('Clear')});
            self.$input.remove();
        }
        that.triggerEvent('change', {value: self.options.value});
    }

    function clearFile() {
        self.options.value = [];
        self.size = 0;
        self.$title.html(getTitleText());
        self.$size.html(getSizeText());
        self.$button.options({title: 'add'}).attr({title: ''});
        self.$input = renderInput();
        that.triggerEvent('change', {value: self.options.value});
    }

    function exists(file) {
        return self.options.value.some(function(f) {
            return f.name == file.name
                && f.size == file.size
                && Ox.isEqual(f.lastModifiedDate, file.lastModifiedDate);
        });
    }

    function getHeight() {
        return (
            self.options.maxLines == -1
                ? self.options.value.length
                : Math.min(self.options.value.length, self.options.maxLines)
        ) * 16 + 'px';
    }

    function getItems() {
        return self.options.value.map(function(file, i) {
            return {name: file.name, size: file.size, id: i};
        });
    }

    function getSize() {
        return self.options.value.reduce(function(prev, curr) {
            return prev + curr.size;
        }, 0);
    }

    function getSizeText() {
        return self.size ? Ox.formatValue(self.size, 'B') : '';
    }

    function getTitleText() {
        var length = self.options.value.length
        return length == 0
            ? Ox._('No file' + (self.multiple ? 's' : '') + ' selected')
            : self.multiple
            ? Ox.formatCount(length, 'file')
            : self.options.value[0].name;
    }

    function getWidth() {
        return self.options.width - (
            self.options.label ? self.options.labelWidth : 0
        );
    }

    function removeFiles(ids) {
        self.options.value = self.options.value.filter(function(v, i) {
            return ids.indexOf(i) == -1;
        });
        self.size = getSize();
        if (self.options.value.length == 0) {
            self.$bar.css({
                borderBottomLeftRadius: '8px',
                borderBottomRightRadius: '8px'
            });
            self.$files.hide();
        }
        self.$title.html(getTitleText());
        self.$size.html(getSizeText());
        self.$list.options({items: getItems(), selected: []});
        self.$files.css({height: getHeight()});
        that.triggerEvent('change', {value: self.options.value});
    }

    function renderInput() {
        self.$input && self.$input.remove();
        return $('<input>')
            .attr(
                Ox.extend({
                    title: self.multiple ? Ox._('Add Files') : Ox._('Select File'),
                    type: 'file'
                }, self.multiple ? {
                    multiple: true
                } : {})
            )
            .css({
                float: 'left',
                width: '16px',
                height: '14px',
                margin: '-1px -7px 0 -16px',
                opacity: 0
            })
            .on({
                change: addFiles
            })
            .appendTo(self.$bar);
    }

    that.clear = function() {
        clearFile();
        return that;
    };

    return that;

};
