'use strict';

/*@
Ox.SyntaxHighlighter <f> Syntax Highlighter
    options <o> Options
        file <s|''> JavaScript file (alternative to `source` option)
        lineLength <n|0> If larger than zero, show edge of page
        offset <n|1> First line number
        replace <[[]]|[]> Array of replacements
            Each array element is an array of two arguments to be passed to the
            replace function, like [str, str], [regexp, str] or [regexp, fn]
        showLinebreaks <b|false> If true, show linebreaks
        showLineNumbers <b|false> If true, show line numbers
        showWhitespace <b|false> If true, show whitespace
        showTabs <b|false> If true, show tabs
        source <s|[o]|''> JavaScript source, or array of tokens
        stripComments <b|false> If true, strip comments
        tabSize <n|4> Number of spaces per tab
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.Element> Syntax Highlighter
@*/

Ox.SyntaxHighlighter = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
            .defaults({
                file: '',
                lineLength: 0,
                offset: 1,
                replace: [],
                showLinebreaks: false,
                showLineNumbers: false,
                showTabs: false,
                showWhitespace: false,
                source: '',
                stripComments: false,
                tabSize: 4
            })
            .options(options || {})
            .update(renderSource)
            .addClass('OxSyntaxHighlighter');

    if (self.options.file) {
        Ox.get(self.options.file, function(source) {
           self.options.source = source;
           renderSource(); 
        });
    } else {
        renderSource();
    }

    function renderSource() {
        var $lineNumbers, $line, $source, width,
            lines, source = '', tokens,
            linebreak = (
                self.options.showLinebreaks
                ? '<span class="OxLinebreak">\u21A9</span>' : ''
            ) + '<br/>',
            tab = (
                self.options.showTabs ?
                '<span class="OxTab">\u2192</span>' : ''
            ) + Ox.repeat('&nbsp;', self.options.tabSize - self.options.showTabs),
            whitespace = self.options.showWhitespace ? '\u00B7' : '&nbsp;';
        tokens = Ox.isArray(self.options.source)
            ? self.options.source
            : Ox.tokenize(self.options.source);
        tokens.forEach(function(token, i) {
            var classNames,
                type = token.type == 'identifier'
                    ? Ox.identify(token.value) : token.type;
            if (
                !(self.options.stripComments && type == 'comment')
            ) {
                classNames = 'Ox' + Ox.toTitleCase(type);
                if (self.options.showWhitespace && type == 'whitespace') {
                    if (isAfterLinebreak() && hasIrregularSpaces()) {
                        classNames += ' OxLeading';
                    } else if (isBeforeLinebreak()) {
                        classNames += ' OxTrailing';
                    }
                }
                source += '<span class="' + classNames + '">' +
                    Ox.encodeHTMLEntities(token.value)
                    .replace(/ /g, whitespace)
                    .replace(/\t/g, tab)
                    .replace(/\n/g, linebreak) + '</span>';
            }
            function isAfterLinebreak() {
                return i == 0 ||
                    tokens[i - 1].type == 'linebreak';
            }
            function isBeforeLinebreak() {
                return i == tokens.length - 1 ||
                    tokens[i + 1].type == 'linebreak';
            }
            function hasIrregularSpaces() {
                return token.value.split('').reduce(function(prev, curr) {
                    return prev + (curr == ' ' ? 1 : 0);
                }, 0) % self.options.tabSize;
            }
        });
        lines = source.split('<br/>');
        that.empty();
        if (self.options.showLineNumbers) {
            $lineNumbers = Ox.Element()
                .addClass('OxLineNumbers')
                .html(
                    Ox.range(lines.length).map(function(line) {
                        return (line + self.options.offset);
                    }).join('<br/>')
                )
                .appendTo(that);
        }

        self.options.replace.forEach(function(replace) {
            source = source.replace(replace[0], replace[1])
        });
        
        $source = Ox.Element()
            .addClass('OxSourceCode OxSelectable')
            .html(source)
            .appendTo(that);
        if (self.options.lineLength) {
            $line = Ox.Element()
                .css({
                    position: 'absolute',
                    top: '-1000px'
                })
                .html(Ox.repeat('&nbsp;', self.options.lineLength))
                .appendTo(that);
            width = $line.width() + 4; // add padding
            $line.remove();
            ['moz', 'webkit'].forEach(function(browser) {
                $source.css({
                    background: '-' + browser +
                        '-linear-gradient(left, rgb(255, 255, 255) ' +
                        width + 'px, rgb(192, 192, 192) ' + width +
                        'px, rgb(255, 255, 255) ' + (width + 1) + 'px)'
                });
            });
        }
    }

    return that;

};
