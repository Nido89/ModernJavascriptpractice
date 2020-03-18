'use strict';

/*@
Ox.InsertHTMLDialog <f> Insert HTML Dialog
    options <o> Options
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.Dialog> Insert HTML Dialog
@*/
Ox.InsertHTMLDialog = function(options, self) {

    var that;

    self = self || {};
    self.options = Ox.extend({
        callback: void 0,
        end: 0,
        selection: '',
        start: 0
    }, options || {});

    self.type = self.options.selection.indexOf('\n') > -1
        ? 'textarea' : 'input';

    self.items = [
        {id: 'img', title: Ox._('Image')},
        {id: 'a', title: Ox._('Link')},
        {id: 'li', title: Ox._('List')},
        {},
        {id: 'blockquote', title: Ox._('Blockquote')},
        {id: 'h1', title: Ox._('Headline')},
        {id: 'p', title: Ox._('Paragraph')},
        {id: 'div', title: Ox._('Right-to-Left')},
        {},
        {id: 'b', title: Ox._('Bold')},
        {id: 'i', title: Ox._('Italic')},
        {id: 'code', title: Ox._('Monospace')},
        {id: 's', title: Ox._('Strike')},
        {id: 'sub', title: Ox._('Subscript')},
        {id: 'sup', title: Ox._('Superscript')},
        {id: 'u', title: Ox._('Underline')},
        {},
        {id: 'br', title: Ox._('Linebreak')}
    ].map(function(item, i) {
        var form, format;
        if (item.id == 'img') {
            form = [
                Ox.Input({
                    id: 'url',
                    label: 'URL',
                    labelWidth: 128,
                    width: 384
                })
            ];
            format = function(values) {
                return '<img src="' + values.url + '"/>';
            };
        } else if (item.id == 'a') {
            form = [
                Ox.Input({
                    height: 104,
                    id: 'text',
                    label: 'Text',
                    labelWidth: 128,
                    type: self.type,
                    width: 384,
                    value: self.options.selection
                })
                .css({background: 'transparent'}),
                Ox.Input({
                    id: 'url',
                    label: 'URL',
                    labelWidth: 128,
                    width: 384
                })
            ];
            format = function(values) {
                return '<a href="' + values.url + '">' + values.text + '</a>';
            };
         } else if (item.id == 'li') {
            form = [
                Ox.Select({
                    id: 'style',
                    items: [
                        {id: 'ul', title: Ox._('Bullets')},
                        {id: 'ol', title: Ox._('Numbers')}
                    ],
                    label: 'Style',
                    labelWidth: 128,
                    width: 384
                }),
                Ox.ArrayInput({
                    id: 'items',
                    label: 'Items',
                    max: 10,
                    value: self.options.selection.split('\n'),
                    width: 384
                })
            ];
            format = function(values) {
                return '<' + values.style + '>\n' + values.items.map(function(value) {
                    return '<li>' + value + '</li>\n';
                }).join('') + '</' + values.style + '>';
            };
        } else if (['p', 'blockquote', 'div'].indexOf(item.id) > -1) {
            form = [
                Ox.Input({
                    height: 128,
                    id: 'text',
                    label: 'Text',
                    labelWidth: 128,
                    type: 'textarea',
                    value: self.options.selection,
                    width: 384
                })
                .css({background: 'transparent'})
            ];
            format = function(values) {
                return '<' + item.id + (
                    item.id == 'div' ? ' style="direction: rtl"' : ''
                ) + '>' + values.text + '</' + item.id + '>';
            };
        } else if (['h1', 'b', 'i', 'code', 's', 'sub', 'sup', 'u'].indexOf(item.id) > -1) {
            form = [
                Ox.Input({
                    height: 128,
                    id: 'text',
                    label: 'Text',
                    labelWidth: 128,
                    type: self.type,
                    value: self.options.selection,
                    width: 384
                })
                .css({background: 'transparent'})
            ];
            format = function(values) {
                return '<' + item.id + '>' + values.text + '</' + item.id + '>';
            };
        } else if (item.id == 'br') {
            form = [];
            format = function() {
                return '<br/>';
            };
        }
        return item.id ? Ox.extend(item, {
            form: form,
            format: format
        }) : item;
    });

    self.$content = $('<div>')
        .css({padding: '16px'});

    self.$select = Ox.Select({
            items: self.items,
            label: Ox._('Insert'),
            labelWidth: 128,
            value: 'img',
            width: 384
        })
        .bindEvent({
            change: renderForm
        })
        .appendTo(self.$content);

    renderForm();

    that = Ox.Dialog({
        buttons: [
            Ox.Button({
                    id: 'cancel',
                    title: Ox._('Cancel'),
                    width: 64
                })
                .bindEvent({
                    click: function() {
                        that.close();
                    }
                }),
            Ox.Button({
                    id: 'insert',
                    title: Ox._('Insert'),
                    width: 64
                })
                .bindEvent({
                    click: function() {
                        var item = Ox.getObjectById(self.items, self.$select.value()),
                            value = item.format(
                                item.form.length ? self.$form.values() : void 0
                            );
                        self.options.callback({
                            position: self.options.start + value.length,
                            value: self.options.value.slice(0, self.options.start)
                                + value
                                + self.options.value.slice(self.options.end)
                        });
                        that.close();
                    }
                })
        ],
        closeButton: true,
        content: self.$content,
        height: 184,
        keys: {enter: 'insert', escape: 'cancel'},
        title: Ox._('Insert HTML'),
        width: 416 + Ox.UI.SCROLLBAR_SIZE
    });

    function renderForm() {
        var items = Ox.getObjectById(self.items, self.$select.value()).form;
        self.$form && self.$form.remove();
        if (items.length) {
            self.$form = Ox.Form({
                    items: items
                })
                .css({paddingTop: '8px'})
                .appendTo(self.$content);
        }
    }

    return that;

};
