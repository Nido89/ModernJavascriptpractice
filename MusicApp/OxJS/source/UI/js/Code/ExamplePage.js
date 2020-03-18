'use strict'

/*@
Ox.ExamplePage <f> Example Page
    options <o> Options
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.SplitPanel> Example Page
        change <!> Change event 
        close <!> Close event
@*/

Ox.ExamplePage = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({
            html: '',
            js: '',
            references: [],
            replaceCode: [],
            replaceComment: [],
            selected: 'source',
            title: ''
        })
        .options(options || {})
        .update({
            selected: function() {
                self.$tabs.options({value: self.options.selected});
            }
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
        .appendTo(self.$toolbar)

    self.$title = Ox.Label({
            style: 'square',
            title: self.options.title
        })
        .css({float: 'left', borderRadius: '4px', margin: '4px 2px 4px 2px'})
        .appendTo(self.$toolbar);

    self.$openButton = Ox.Button({
            disabled: self.options.selected == 'source',
            title: 'open',
            tooltip: Ox._('Open in New Tab'),
            type: 'image'
        })
        .css({float: 'right', margin: '4px 4px 4px 2px'})
        .bindEvent({
            click: function() {
                window.open(self.options.html);
            }
        })
        .appendTo(self.$toolbar);

    self.$reloadButton = Ox.Button({
            disabled: self.options.selected == 'source',
            title: 'redo',
            tooltip: Ox._('Reload'),
            type: 'image'
        })
        .css({float: 'right', margin: '4px 2px 4px 2px'})
        .bindEvent({
            click: function() {
                self.$frame.attr({src: self.options.html});
            }
        })
        .appendTo(self.$toolbar);

    self.$switchButton = Ox.Button({
            disabled: self.options.selected == 'source',
            title: 'switch',
            tooltip: Ox._('Switch Theme'),
            type: 'image'
        })
        .css({float: 'right', margin: '4px 2px 4px 2px'})
        .bindEvent({
            click: function() {
                self.$frame[0].contentWindow.postMessage(
                    'Ox && Ox.Theme && Ox.Theme('
                    + 'Ox.Theme() == "oxlight" ? "oxmedium"'
                    + ' : Ox.Theme() == "oxmedium" ? "oxdark"'
                    + ' : "oxlight"'
                    + ')',
                    '*'
                );
            }
        })
        .appendTo(self.$toolbar);

    self.$tabs = Ox.ButtonGroup({
            buttons: [
                {
                    id: 'source',
                    title: Ox._('View Source'),
                    width: 80
                },
                {
                    id: 'live',
                    title: Ox._('View Live'),
                    width: 80
                }
            ],
            selectable: true,
            value: self.options.selected
        })
        .css({float: 'right', margin: '4px 2px 4px 2px'})
        .bindEvent({
            change: function(data) {
                var disabled = data.value == 'source';
                self.options.selected = data.value;
                self.hasUI && self.$switchButton.options({disabled: disabled});
                self.$reloadButton.options({disabled: disabled});
                self.$openButton.options({disabled: disabled});
                self.$content.animate({
                    marginLeft: self.options.selected == 'source'
                        ? 0 : -self.options.width + 'px'
                }, 250, function() {
                    if (
                        self.options.selected == 'live'
                        && !self.$frame.attr('src')
                    ) {
                        self.$frame.attr({src: self.options.html});
                    }
                });
                that.triggerEvent('change', data);
            }
        })
        .appendTo(self.$toolbar);

    self.$viewer = Ox.SourceViewer({
            file: self.options.js,
            replaceCode: self.options.replaceCode,
            replaceComment: self.options.replaceComment
        })
        .css({
            position: 'absolute',
            left: 0,
            top: 0,
            width: self.options.width + 'px',
            height: self.options.height - 24 + 'px'
        });
    self.$frame = Ox.Element('<iframe>')
        .css({
            position: 'absolute',
            left: self.options.width + 'px',
            top: 0,
            border: 0
        })
        .attr({
            width: self.options.width,
            height: self.options.height
        });
    self.$content = Ox.Element()
        .css({
            position: 'absolute',
            width: self.options.width * 2 + 'px',
            marginLeft: self.options.selected == 'source'
                ? 0 : -self.options.width + 'px'
        })
        .append(self.$viewer)
        .append(self.$frame);
    self.$container = Ox.Element()
        .append(self.$content);

    that.setElement(
        Ox.SplitPanel({
            elements: [
                {element: self.$toolbar, size: 24},
                {element: self.$container}
            ],
            orientation: 'vertical'
        })
        .addClass('OxExamplePage')
    );

    Ox.get(self.options.js, function(js) {
        self.hasUI = /Ox\.load\(.+UI.+,/.test(js);
        !self.hasUI && self.$switchButton.options({disabled: true});
    });

    Ox.$window.on({
        resize: function() {
            setSize();
        }
    });

    setTimeout(function() {
        setSize();
        if (self.options.selected == 'live') {
            self.$frame.attr({src: self.options.html});
        }
    }, 100);

    function setSize() {
        self.options.width = that.width();
        self.options.height = that.height();
        self.$content.css({
            width: self.options.width * 2 + 'px'
        })
        self.$viewer.css({
            width: self.options.width + 'px',
            height: self.options.height - 24 + 'px'
        })
        self.$frame.attr({
            width: self.options.width,
            height: self.options.height - 24
        });
    }

    return that;

};
