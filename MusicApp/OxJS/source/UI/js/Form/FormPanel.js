'use strict';

/*@
Ox.FormPanel <f> Form Panel
    options <o> Options
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.Element> Form Panel
        change <!> Fires when a value changed
        select <!> Fires when a section gets selected
        validate <!> Fires when the form becomes valid or invalid
@*/
Ox.FormPanel = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({
            form: [],
            listSize: 256
        })
        .options(options || {});

    self.section = 0;
    self.sectionTitle = self.options.form[self.section].title;
    self.$list = Ox.TableList({
        columns: [
            {
                id: 'id',
                visible: false
            },
            {
                format: function(value) {
                    return $('<img>')
                        .attr({
                            src: Ox.UI.getImageURL('symbolCheck')
                        })
                        .css({
                            width: '10px',
                            height: '10px',
                            margin: '2px 2px 2px 0',
                            opacity: value ? 1 : 0.1
                        })
                },
                id: 'valid',
                title: Ox._('Valid'),
                visible: true,
                width: 16
            },
            {
                format: function(value) {
                    return (Ox.indexOf(self.options.form, function(section) {
                        return section.title == value;
                    }) + 1) + '. ' + value;
                },
                id: 'title',
                title: Ox._('Title'),
                visible: true,
                width: self.options.listSize - 16
            }
        ],
        items: self.options.form.map(function(section) {
            return {id: section.id, title: section.title, valid: false};
        }),
        max: 1,
        min: 1,
        selected: [self.options.form[0].id],
        sort: [{key: 'id', operator: '+'}],
        unique: 'id',
        width: self.options.listSize
    }).bindEvent({
        select: function(data) {
            self.$sections[self.section].hide();
            self.section = Ox.getIndexById(self.options.form, data.ids[0]);
            self.$sections[self.section].show();
            that.triggerEvent('select', {section: data.ids[0]});
        }
    });

    self.$section = $('<div>')
        .css({overflowY: 'auto'});
    self.$forms = [];
    self.$sections = self.options.form.map(function(section, i) {
        return $('<div>')
            .css({
                width: (
                    section.descriptionWidth || section.items[0].options('width')
                ) + 'px',
                margin: '16px'
            })
            .append(
                $('<div>')
                    .addClass('OxSelectable')
                    .css({marginBottom: '8px', fontWeight: 'bold'})
                    .html((i + 1) + '. ' + section.title)
            )
            .append(
                $('<div>')
                    .addClass('OxSelectable')
                    .css({marginBottom: '16px'})
                    .html(section.description)
            )
            .append(
                self.$forms[i] = Ox.Form({
                    items: section.items,
                    validate: section.validate
                })
                .bindEvent({
                    change: function(data) {
                        self.$list.value(section.id, 'valid', self.$forms[i].valid());
                        that.triggerEvent('change', {
                            section: section.id,
                            data: data
                        });
                    },
                    validate: function(data) {
                        self.$list.value(section.id, 'valid', data.valid);
                        that.triggerEvent('validate', {
                            section: section.id,
                            data: data
                        });
                    }
                })
            )
            .hide()
            .appendTo(self.$section);
    });

    self.$list.bindEvent('load', function() { 
        self.$forms.forEach(function($form, i) {
            self.$list.value(self.options.form[i].id, 'valid', $form.valid());        
        });
    });

    self.$sections[0].show();

    that.setElement(Ox.SplitPanel({
        elements: [
            {
                element: self.$list,
                size: self.options.listSize
            },
            {
                element: self.$section
            }
        ],
        orientation: 'horizontal'
    }));

    /*@
    renderPrintVersion <f> renderPrintVersion
        (title) -> <s>
    @*/
    that.renderPrintVersion = function(title) {
        var $printVersion = $('<div>').css({overflowY: 'auto'});
        $printVersion.append(
            $('<div>')
                .addClass('OxFormSectionTitle')
                .css({
                    height: '16px',
                    padding: '16px 16px 8px 16px',
                    fontWeight: 'bold'
                })
                .html(title)
        );
        self.$sections.forEach(function($section, i) {
            // jQuery bug: textarea html/val does not survive cloning
            // http://bugs.jquery.com/ticket/3016
            var $clone = $section.clone(true),
                textareas = {
                    section: $section.find('textarea'),
                    clone: $clone.find('textarea')
                };
            textareas.section.each(function(i) {
                $(textareas.clone[i]).val($(this).val());
            });
            $printVersion
                .append(
                    $('<div>').css({
                        height: '1px',
                        margin: '8px 0 8px 0',
                        background: 'rgb(128, 128, 128)'
                    })
                )
                .append(
                    $clone.show()
                );
        });
        return $printVersion;
    };

    /*@
    values <f> values
    @*/
    that.values = function() {
        var values = {};
        self.options.form.forEach(function(section, i) {
            values[section.id] = self.$forms[i].values();
        });
        return values;
    };

    return that;
    
};
