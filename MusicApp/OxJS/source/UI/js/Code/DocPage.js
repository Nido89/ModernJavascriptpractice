'use strict';

/*@
Ox.DocPage <f> DocPage
    options <o> Options object
        item <o> doc item
        replace <[[]]|[]> See Ox.SyntaxHighlighter
        stripComments <b|false> If true, strip comments in source code
    self    <o> Shared private variable
    ([options[, self]]) -> <o:Ox.SplitPanel> DocPage object
        example <!> Fires when an example was selected
            id <s> Id of the selected example
@*/
Ox.DocPage = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({
            item: {},
            replace: []
        })
        .options(options || {})
        .css({
            overflow: 'auto'
        });

    self.$toolbar = Ox.Bar({size: 24});

    self.$homeButton = Ox.Button({
            title: 'home',
            tooltip: Ox._('Home'),
            type: 'image'
        })
        .css({float: 'left', margin: '4px 2px 4px 4px'})
        .bindEvent({
            click: function() {
                that.triggerEvent('close');
            }
        })
        .appendTo(self.$toolbar);

    self.$title = Ox.Label({
            style: 'square',
            title: self.options.item.name
        })
        .addClass('OxMonospace')
        .css({
            float: 'left',
            height: '13px',
            paddingTop: '1px',
            borderRadius: '4px',
            margin: '4px 2px 4px 2px'
        })
        .appendTo(self.$toolbar)

    if (self.options.item.examples) {
        self.$examplesMenu = Ox.MenuButton({
                items: self.options.item.examples,
                title: Ox._('Examples...'),
            })
            .css({float: 'right', margin: '4px 4px 4px 2px'})
            .bindEvent({
                click: function(data) {
                    that.triggerEvent('example', {id: data.id});
                }
            })
            .appendTo(self.$toolbar);
    }

    self.$page = Ox.Container().addClass('OxDocPage OxDocument OxSelectable');

    that.setElement(
        Ox.SplitPanel({
            elements: [
                {element: self.$toolbar, size: 24},
                {element: self.$page}
            ],
            orientation: 'vertical'
        })
        .addClass('OxDocPage')
    );

    getItem(self.options.item, 0).forEach(function($element) {
        self.$page.append($element);
    });

    function getItem(item, level, name) {
        Ox.Log('Core', 'getItem', item, level, name);
        var $elements = [
                Ox.$('<div>')
                    .css({paddingLeft: (level ? level * 32 - 16 : 0) + 'px'})
                    .html(
                        '<code><b>' + (name || item.name) + '</b> '
                        + '&lt;' + item.types.join('&gt;</code> or <code>&lt;') + '&gt; </code>'
                        + (item['class'] ? '(class: <code>' + item['class'] + '</code>) ' : '')
                        + (item['default'] ? '(default: <code>' + item['default'] + '</code>) ' : '')
                        + Ox.sanitizeHTML(item.summary)
                    )
            ],
            sections = ['description'].concat(
                item.order || ['returns', 'arguments', 'properties']
            ).concat(['events', 'tests', 'source']),
            index = {
                events: sections.indexOf('events') + 1 + (
                    item.inheritedproperties ? item.inheritedproperties.length : 0
                ),
                properties: sections.indexOf('properties') + 1 || 1
            };
        ['properties', 'events'].forEach(function(key) {
            var key_ = 'inherited' + key;
            if (item[key_]) {
                Array.prototype.splice.apply(sections, [index[key], 0].concat(
                    item[key_].map(function(v, i) {
                        var section = key + ' inherited from <code>'
                            + v.name + '</code>';
                        item[section] = v[key];
                        return section;
                    })
                ));
            }
        });
        sections.forEach(function(section) {
            var className = 'OxLine' + Ox.uid(),
                isExpanded = !Ox.contains(section, 'inherited');
            if (item[section]) {
                if (section == 'description') {
                    $elements.push(Ox.$('<div>')
                        .css({
                            paddingTop: (level ? 0 : 8) + 'px',
                            borderTopWidth: level ? 0 : '1px',
                            marginTop: (level ? 0 : 8) + 'px',
                            marginLeft: (level * 32) + 'px'
                        })
                        .html(Ox.sanitizeHTML(item.description))
                    );
                } else {
                    $elements.push(Ox.$('<div>')
                        .css({
                            paddingTop: (level ? 0 : 8) + 'px',
                            borderTopWidth: level ? 0 : '1px',
                            marginTop: (level ? 0 : 8) + 'px',
                            marginLeft: (level * 32) + 'px'
                        })
                        .append(
                            Ox.$('<img>')
                                .attr({
                                    src: isExpanded
                                        ? Ox.UI.getImageURL('symbolDown')
                                        : Ox.UI.getImageURL('symbolRight')
                                })
                                .css({
                                    width: '12px',
                                    height: '12px',
                                    margin: '0 4px -1px 0'
                                })
                                .on({
                                    click: function() {
                                        var $this = $(this),
                                            isExpanded = $this.attr('src') == Ox.UI.getImageURL('symbolRight');
                                        $this.attr({
                                            src: isExpanded
                                                ? Ox.UI.getImageURL('symbolDown')
                                                : Ox.UI.getImageURL('symbolRight')
                                        });
                                        $('.' + className).each(function() {
                                            var $this = $(this), isHidden = false;
                                            $this[isExpanded ? 'removeClass' : 'addClass'](className + 'Hidden');
                                            if (isExpanded) {
                                                Ox.forEach(this.className.split(' '), function(v) {
                                                    if (/Hidden$/.test(v)) {
                                                        isHidden = true;
                                                        return false; // break
                                                    }
                                                });
                                                !isHidden && $this.show();
                                            } else {
                                                $this.hide();
                                            }
                                        });
                                    }
                                })
                        )
                        .append(
                            Ox.$('<span>')
                                .addClass('OxSection')
                                .html(
                                    Ox.contains(section, 'inherited')
                                        ? section[0].toUpperCase() + section.slice(1)
                                        : Ox.toTitleCase(
                                            section == 'returns' ? 'usage' : section
                                        )
                                )
                        )
                    );
                    if (section == 'tests') {
                        item.tests.forEach(function(test) {
                            var isAsync = test.expected && /(.+Ox\.test\()/.test(test.statement);
                            $elements.push(
                                Ox.$('<div>')
                                    .addClass(className)
                                    .css({marginLeft: (level * 32 + 16) + 'px'})
                                    .html(
                                        '<code><b>&gt;&nbsp;'
                                        + Ox.encodeHTMLEntities(test.statement)
                                            .replace(/ /g, '&nbsp;')
                                            .replace(/\n/g, '<br>\n&nbsp;&nbsp;')
                                        + '</b>'
                                        + (
                                            test.passed === false && isAsync
                                                ? ' <span class="OxFailed"> // actual: '
                                                    + Ox.encodeHTMLEntities(test.actual)
                                                    + '</span>'
                                                : ''
                                        )
                                        + '</code>'
                                    )
                            );
                            if (test.expected) {
                                $elements.push(
                                    Ox.$('<div>')
                                        .addClass(className)
                                        .css({marginLeft: (level * 32 + 16) + 'px'})
                                        .html(
                                            '<code>'
                                            + Ox.encodeHTMLEntities(
                                                test.passed === false && !isAsync
                                                    ? test.actual : test.expected
                                            )
                                            + (
                                                test.passed === false && !isAsync
                                                    ? ' <span class="OxFailed"> // expected: '
                                                        + Ox.encodeHTMLEntities(test.expected)
                                                        + '</span>'
                                                    : ''
                                            )
                                            + '</code>'
                                        )
                                );
                            }
                        });
                    } else if (section == 'source') {
                        // fixme: not the right place to fix path
                        $elements.push(Ox.$('<div>')
                            .addClass(className)
                            .css({marginLeft: 16 + 'px'})
                            .html(
                                '<code><b>'
                                + self.options.item.file.replace(Ox.PATH, '')
                                + '</b>:' + self.options.item.line + '</code>'
                            )
                        );
                        $elements.push(
                            Ox.SyntaxHighlighter({
                                replace: self.options.replace,
                                showLineNumbers: !self.options.stripComments,
                                source: item.source,
                                stripComments: self.options.stripComments,
                                offset: self.options.item.line
                            })
                            .addClass(className)
                            .css({
                                borderWidth: '1px',
                                marginTop: '8px'
                            })
                        );
                    } else {
                        item[section].forEach(function(v) {
                            var name = section == 'returns' ?
                                item.name + v.signature
                                + ' </b></code>returns<code> <b>'
                                + (v.name || '') : null;
                            $elements = $elements.concat(
                                Ox.map(getItem(v, level + 1, name), function($element) {
                                    $element.addClass(className);
                                    if (!isExpanded) {
                                        $element.addClass(className + 'Hidden').hide();
                                    }
                                    return $element;
                                })
                            );
                        });
                    }
                }
            }
        });
        return $elements;
    }

    return that;

};
