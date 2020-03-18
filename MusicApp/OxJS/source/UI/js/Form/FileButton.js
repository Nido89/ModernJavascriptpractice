'use strict';

/*@
Ox.FileButton <f> File Button
    options <o> Options
        disabled <b|false> If true, the button is disabled
        image <s|'file'> Symbol name (if type is 'image')
            The default value will be 'files' if maxFiles is not 1
        maxFiles <n|-1> Maximum number of files (or -1 for unlimited)
        maxSize <n|-1> Maximum total file size in bytes (or -1 for unlimited)
        title <s|''> Title of the button (and its tooltip)
        type <s|'text'> Type of the button ('text' or 'image')
        width <n|256> Width of the button in px
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.Element> File Button
        click <!> click
@*/
Ox.FileButton = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({
            disabled: false,
            image: options && options.maxFiles == 1 ? 'file' : 'files',
            maxFiles: -1,
            maxSize: -1,
            style: 'default',
            title: '',
            type: 'text',
            width: options.type == 'image' ? 16 : 256
        })
        .options(options || {})
        .update({
            disabled: function() {
                self.$button.options({disabled: self.options.disabled});
                self.$input[self.options.disabled ? 'hide' : 'show']();
            },
            title: function() {
                self.$button.options({title: self.options.title});
            }
        })
        .addClass('OxFileButton')
        .css({overflow: 'hidden'});

    self.files = [];
    self.multiple = self.options.maxFiles != 1;

    self.$button = Ox.Button({
            disabled: self.options.disabled,
            style: self.options.style,
            title: self.options.type == 'image'
                ? self.options.image
                : self.options.title,
            type: self.options.type,
            width: self.options.type == 'image'
                ? 'auto'
                : self.options.width
        })
        .css({
            float: 'left'
        })
        .appendTo(that);

    self.$input = renderInput();
    self.options.disabled && self.$input.hide();

    function selectFiles(e) {
        var filelist = e.target.files,
            files = [];
        self.files = [];
        Ox.loop(filelist.length, function(i) {
            files.push(filelist.item(i));
        });
        files.sort(self.options.maxSize == -1 ? function(a, b) {
            a = a.name.toLowerCase();
            b = b.name.toLowerCase();
            return a < b ? -1 : a > b ? 1 : 0;
        } : function(a, b) {
            // if there's a max size,
            // try to add small files first
            return a.size - b.size;
        }).forEach(function(file) {
            if ((
                self.options.maxFiles == -1
                || self.files.length < self.options.maxFiles
            ) && (
                self.options.maxSize == -1
                || self.size + file.size < self.options.maxSize
            )) {
                self.files.push(file);
                self.size += file.size;
            }
        });
        self.$input = renderInput();
        if (self.files.length) {
            that.triggerEvent('click', {files: self.files});
        }
    }

    function renderInput() {
        self.$input && self.$input.remove();
        return $('<input>')
            .attr(
                Ox.extend({
                    title: self.options.title,
                    type: 'file'
                }, self.multiple ? {
                    multiple: true
                } : {})
            )
            .css({
                float: 'left',
                width: self.options.width + 'px',
                height: '16px',
                marginLeft: -self.options.width + 'px',
                opacity: 0
            })
            .on({
                change: selectFiles
            })
            .appendTo(that);
    }

    /*@
    blurButton <f> blurButton
    @*/
    that.blurButton = function() {
        self.$input.blur();
    };

    /*@
    focusButton <f> focusButton
    @*/
    that.focusButton = function() {
        self.$input.focus();
    };

    return that;

}
