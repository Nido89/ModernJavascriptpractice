'use strict';

/*@
Ox.SourceViewer <f> Source Viewer
    options <o> Options
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.Container> Source Viewer
@*/

Ox.SourceViewer = function(options, self) {

    self = self || {};
    var that = Ox.Container({}, self)
        .defaults({
            file: '',
            replaceCode: [],
            replaceComment: []
        })
        .options(options)
        .addClass('OxSourceViewer');

    self.options.replaceComment.unshift(
        // removes indentation inside <pre> tags
        [
            /<pre>([\s\S]+)<\/pre>/g,
            function(pre, text) {
                var lines = trim(text).split('\n'),
                    indent = Ox.min(lines.map(function(line) {
                        var match = line.match(/^\s+/);
                        return match ? match[0].length : 0;
                    }));
                return '<pre>' + lines.map(function(line) {
                    return line.slice(indent);
                }).join('\n') + '</pre>';
            }
        ]
    );

    self.$table = $('<table>').appendTo(that.$content);

    Ox.get(self.options.file, function(source) {
        var sections = [{comment: '', code: ''}];
        Ox.tokenize(source).forEach(function(token, i) {
            // treat doc comments as code
            var type = token.type == 'comment' && token.value[2] != '@'
                ? 'comment' : 'code';
            // remove '//' comments
            if (!/^\/\/[^@]/.test(token.value)) {
                if (type == 'comment' ) {
                    i && sections.push({comment: '', code: ''});
                    token.value = Ox.parseMarkdown(
                        trim(token.value.slice(2, -2))
                    );
                    self.options.replaceComment.forEach(function(replace) {
                        token.value = token.value.replace(
                            replace[0], replace[1]
                        );
                    });
                }
                Ox.last(sections)[type] += token.value;
            }
        });
        sections.forEach(function(section) {
            var $section = $('<tr>')
                    .appendTo(self.$table),
                $comment = $('<td>')
                    .addClass('OxComment OxSerif OxSelectable')
                    .html(Ox.addLinks(section.comment, true))
                    .appendTo($section),
                $code = $('<td>')
                    .addClass('OxCode')
                    .append(
                        Ox.SyntaxHighlighter({
                            replace: self.options.replaceCode,
                            source: trim(section.code)
                        })
                    )
                    .appendTo($section);
        });
        setTimeout(function() {
            var height = that.height();
            if (self.$table.height() < height) {
                self.$table.css({height: height + 'px'});
            }
        }, 100);
    });

    function trim(str) {
        // removes leading or trailing empty line
        return str.replace(/^\s*\n/, '').replace(/\n\s*$/, '');
    }

    return that;

};
