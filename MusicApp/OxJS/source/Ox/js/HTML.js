'use strict';

(function() {

    var defaultTags = [
            // inline formatting
             {'name': 'b'},
             {'name': 'bdi'},
             {'name': 'code'},
             {'name': 'em'},
             {'name': 'i'},
             {'name': 'q'},
             {'name': 's'},
             {'name': 'span'},
             {'name': 'strong'},
             {'name': 'sub'},
             {'name': 'sup'},
             {'name': 'u'},
            // block formatting
             {'name': 'blockquote'},
             {'name': 'cite'},
             {
                'name': 'div',
                'optional': ['style'],
                'validate': {
                    'style': /^direction: rtl$/
                }
             },
             {'name': 'h1'},
             {'name': 'h2'},
             {'name': 'h3'},
             {'name': 'h4'},
             {'name': 'h5'},
             {'name': 'h6'},
             {'name': 'p'},
             {'name': 'pre'},
            // lists
             {'name': 'li'},
             {'name': 'ol'},
             {'name': 'ul'},
            // definition lists
             {'name': 'dl'},
             {'name': 'dt'},
             {'name': 'dd'},
            // tables
             {'name': 'table'},
             {'name': 'tbody'},
             {'name': 'td'},
             {'name': 'tfoot'},
             {'name': 'th'},
             {'name': 'thead'},
             {'name': 'tr'},
            // other
             {'name': '[]'},
             {
                'name': 'a',
                'required': ['href'],
                'validate': {
                    'href': /^((https?:\/\/|\/|mailto:).*?)/
                }
             },
             {'name': 'br'},
             {
                'name': 'iframe',
                'optional': ['width', 'height'],
                'required': ['src'],
                'validate': {
                    'width': /^\d+$/,
                    'height': /^\d+$/,
                    'src': /^((https?:\/\/|\/).*?)/
                }
             },
             {
                'name': 'img',
                'optional': ['width', 'height'],
                'required': ['src'],
                'validate': {
                    'width': /^\d+$/,
                    'height': /^\d+$/,
                    'src': /^((https?:\/\/|\/).*?)/
                },
             },
             {'name': 'figure'},
             {'name': 'figcaption'}
        ],
        htmlEntities = {
            '"': '&quot;', '&': '&amp;', "'": '&apos;', '<': '&lt;', '>': '&gt;'
        },
        regexp = {
            entity: /&[^\s]+?;/g,
            html: /[<&]/,
            tag: new RegExp('<\\/?(' + [
                'a', 'b', 'br', 'code', 'i', 's', 'span', 'u'
            ].join('|') + ')\\/?>', 'gi')
        },
        salt = Ox.range(2).map(function(){
            return Ox.range(16).map(function() {
                return Ox.char(65 + Ox.random(26));
            }).join('');
        });

    function addLinks(string, obfuscate) {
        return string
            .replace(
                /\b((https?:\/\/|www\.).+?)([.,:;!?)\]]*?(\s|$))/gi,
                function(match, url, prefix, end) {
                    prefix = prefix.toLowerCase() == 'www.' ? 'http://' : '';
                    return Ox.formatString(
                        '<a href="{prefix}{url}">{url}</a>{end}',
                        {end: end, prefix: prefix, url: url}
                    );
                }
            )
            .replace(
                /\b([0-9A-Z.+\-_]+@(?:[0-9A-Z\-]+\.)+[A-Z]{2,6})\b/gi,
                obfuscate ? function(match, mail) {
                    return Ox.encodeEmailAddress(mail);
                } : '<a href="mailto:$1">$1</a>'
            );
    }

    function decodeHTMLEntities(string) {
        return string
            .replace(
                new RegExp('(' + Ox.values(htmlEntities).join('|') + ')', 'g'),
                function(match) {
                    return Ox.keyOf(htmlEntities, match);
                }
            )
            .replace(
                /&#([0-9A-FX]+);/gi,
                function(match, code) {
                    return Ox.char(
                        /^X/i.test(code)
                            ? parseInt(code.slice(1), 16)
                            : parseInt(code, 10)
                    );
                }
            );
    }   

    // Splits a string into text (even indices) and tags (odd indices), ignoring
    // tags with starting positions that are included in the ignore array
    function splitHTMLTags(string, ignore) {
        var isTag = false, ret = [''];
        ignore = ignore || [];
        Ox.forEach(string, function(char, i) {
            if (!isTag && char == '<' && ignore.indexOf(i) == -1) {
                isTag = true;
                ret.push('');
            }
            ret[ret.length - 1] += char;
            if (isTag && char == '>') {
                isTag = false;
                ret.push('');
            }
        });
        return ret;
    }

    /*@
    Ox.addLinks <f> Takes a string and adds links for e-mail addresses and URLs
        (string[, isHTML]) -> <s> Formatted string
        string <s> String
        isHTML <b|false> If true, ignore matches in tags or enclosed by links
        > Ox.addLinks('foo bar <foo@bar.com>')
        'foo bar &lt;<a href="mailto:foo@bar.com">foo@bar.com</a>&gt;'
        > Ox.addLinks('www.foo.com/bar#baz, etc.')
        '<a href="http://www.foo.com/bar#baz">www.foo.com/bar#baz</a>, etc.'
        > Ox.addLinks('<a href="http://www.foo.com">www.foo.com</a>', true)
        '<a href="http://www.foo.com">www.foo.com</a>'
    @*/
    Ox.addLinks = function(string, isHTML) {
        var isLink = false;
        return isHTML
            ? splitHTMLTags(string).map(function(string, i) {
                var isTag = i % 2;
                if (isTag) {
                    if (/^<a/.test(string)) {
                        isLink = true;
                    } else if (/^<\/a/.test(string)) {
                        isLink = false;
                    }
                }
                return isTag || isLink ? string : addLinks(string); 
            }).join('')
            : Ox.normalizeHTML(addLinks(string));
    };

    /*@
    Ox.encodeEmailAddress <f> Returns obfuscated mailto: link
        > Ox.encodeEmailAddress('mailto:foo@bar.com').indexOf(':') > -1
        true
    @*/
    Ox.encodeEmailAddress = function(address, text) {
        var parts = ['mailto:' + address, text || address].map(function(part) {
            return Ox.map(part, function(char) {
                var code = char.charCodeAt(0);
                return char == ':' ? ':'
                    : '&#'
                    + (Math.random() < 0.5 ? code : 'x' + code.toString(16))
                    + ';';
            });
        });
        return '<a href="' + parts[0] + '">' + parts[1] + '</a>';
    };

    /*@
    Ox.encodeHTMLEntities <f> Encodes HTML entities
        (string[, encodeAll]) -> <s> String
        string <s> String
        encodeAll <b|false> If true, encode characters > 127 as numeric entities
        > Ox.encodeHTMLEntities('<\'&"> äbçdê')
        '&lt;&apos;&amp;&quot;&gt; äbçdê'
        > Ox.encodeHTMLEntities('<\'&"> äbçdê', true)
        '&lt;&apos;&amp;&quot;&gt; &#x00E4;b&#x00E7;d&#x00EA;'
    @*/
    Ox.encodeHTMLEntities = function(string, encodeAll) {
        return Ox.map(String(string), function(char) {
            var code = char.charCodeAt(0);
            if (code < 128) {
                char = char in htmlEntities ? htmlEntities[char] : char;
            } else if (encodeAll) {
                char = '&#x'
                    + Ox.pad(code.toString(16).toUpperCase(), 'left', 4, '0')
                    + ';';
            }
            return char;
        });
    };

    /*@
    Ox.decodeHTMLEntities <f> Decodes HTML entities
        (string[, decodeAll]) -> <s> String
        string <s> String
        decodeAll <b|false> If true, decode named entities for characters > 127
            Note that `decodeAll` relies on `Ox.normalizeHTML`, which uses the
            DOM and may transform the string
        > Ox.decodeHTMLEntities('&#x003C;&#x0027;&#x0026;&#x0022;&#x003E;')
        '<\'&">'
        > Ox.decodeHTMLEntities('&lt;&apos;&amp;&quot;&gt;')
        '<\'&">'
        > Ox.decodeHTMLEntities('&#x00E4;b&#x00E7;d&#x00EA;')
        'äbçdê'
        > Ox.decodeHTMLEntities('&auml;b&ccedil;d&ecirc;')
        '&auml;b&ccedil;d&ecirc;'
        > Ox.decodeHTMLEntities('&auml;b&ccedil;d&ecirc;', true)
        'äbçdê'
        > Ox.decodeHTMLEntities('<b>&beta;')
        '<b>&beta;'
        > Ox.decodeHTMLEntities('<b>&beta;', true)
        '<b>β</b>'
        > Ox.decodeHTMLEntities('&lt;b&gt;')
        '<b>'
    @*/
    Ox.decodeHTMLEntities = function(string, decodeAll) {
        return decodeAll
            ? Ox.decodeHTMLEntities(Ox.normalizeHTML(string))
            : decodeHTMLEntities(string);
    };

    /*@
    Ox.highlight <f> Highlight matches in string
        (string, query, classname[, isHTML]) -> Output string
        string <s> Input string
        query <r|s> Case-insentitive query string, or regular expression
        classname <s> Class name for matches
        isHTML <b|false> If true, the input string is treated as HTML
        > Ox.highlight('<foo><bar>', 'foo', 'c')
        '&lt;<span class="c">foo</span>&gt;&lt;bar&gt;'
        > Ox.highlight('&amp;', '&amp;', 'c')
        '<span class="c">&amp;amp;</span>'
        > Ox.highlight('&', '&amp;', 'c')
        '&amp;'
        > Ox.highlight('&lt;foo&gt; &lt;foo&gt;', '<foo>', 'c', true)
        '<span class="c">&lt;foo&gt;</span> <span class="c">&lt;foo&gt;</span>'
        > Ox.highlight('<span class="name">name</span>', 'name', 'c', true)
        '<span class="name"><span class="c">name</span></span>'
        > Ox.highlight('amp &amp; amp', 'amp', 'c', true)
        '<span class="c">amp</span> &amp; <span class="c">amp</span>'
        > Ox.highlight('amp &amp; amp', 'amp & amp', 'c', true)
        '<span class="c">amp &amp; amp</span>'
        > Ox.highlight('<b>&lt;b&gt;</b>', '<b>', 'c', true)
        '<span class="c"><b>&lt;b&gt;</b></span>'
        > Ox.highlight('<b>&lt;b&gt;</b>', '&lt;b&gt;', 'c', true)
        '<b>&lt;b&gt;</b>'
        > Ox.highlight('foo<b>bar</b>baz', 'foobar', 'c', true)
        '<span class="c">foo<b>bar</b></span>baz'
        > Ox.highlight('foo<p>bar</p>baz', 'foobar', 'c', true)
        'foo<p>bar</p>baz'
        > Ox.highlight('foo <br/>bar baz', 'foo bar', 'c', true)
        '<span class="c">foo <br>bar</span> baz'
    @*/
    Ox.highlight = function(string, query, classname, isHTML) {
        if (!query) {
            return string;
        }
        var cursor = 0,
            entities = [],
            matches = [],
            offset = 0,
            re = Ox.isRegExp(query) ? query
                : new RegExp(Ox.escapeRegExp(query), 'gi'),
            span = ['<span class="' + classname + '">', '</span>'],
            tags = [];
        function insert(array) {
            // for each replacement
            array.forEach(function(v) {
                // replace the modified value with the original value
                string = Ox.splice(string, v.position, v.length, v.value);
                // for each match
                matches.forEach(function(match) {
                    if (v.position < match.position) {
                        // replacement is before match, update match position
                        match.position += v.value.length - v.length;
                    } else if (
                        v.position < match.position + match.value.length
                    ) {
                        // replacement is inside match, update match value
                        match.value = Ox.splice(
                            match.value, v.position - match.position, v.length,
                            v.value
                        );
                    }
                });
            });
        }
        if (isHTML && regexp.html.test(string)) {
            string = string // Ox.normalizeHTML(string)
                // remove inline tags
                .replace(regexp.tag, function(value, tag, position) {
                    tags.push({
                        length: 0, position: position, value: value
                    });
                    return '';
                })
                // decode html entities
                .replace(regexp.entity, function(value, position) {
                    var ret = Ox.decodeHTMLEntities(value, true);
                    entities.push({
                        length: ret.length, position: position, value: value
                    });
                    return ret;
                });
            // if decoding entities has created new tags, ignore them
            splitHTMLTags(string, entities.map(function(entity) {
                var ret = entity.position + offset;
                offset += entity.length - entity.value.length;
                return ret;
            })).forEach(function(v, i) {
                if (i % 2 == 0) {
                    // outside tags, find matches and save position and value
                    v.replace(re, function(value, position) {
                        matches.push(
                            {position: cursor + position, value: value}
                        );
                    });
                }
                cursor += v.length;
            });
            insert(entities);
            insert(tags);
            // for each match (in reverse order, so that positions are correct)
            matches.reverse().forEach(function(match) {
                // wrap it in a span
                string = Ox.splice(
                    string, match.position, match.value.length,
                    span.join(match.value)
                );
            });
            // we may have enclosed single opening or closing tags in a span
            if (matches.length && tags.length) {
                string = Ox.normalizeHTML(string);
            }
        } else {
            string = Ox.encodeHTMLEntities(
                string.replace(re, function(value) {
                    matches.push(span.join(Ox.encodeHTMLEntities(value)));
                    return salt.join(matches.length - 1);
                })
            );
            matches.forEach(function(match, i) {
                string = string.replace(new RegExp(salt.join(i)), match);
            });
        }
        return string;
    };

    /*@
    Ox.normalizeHTML <f> Normalize HTML (using the DOM)
        > Ox.normalizeHTML('<b>foo')
        '<b>foo</b>'
        > Ox.normalizeHTML('<b>foo</b></b>')
        '<b>foo</b>'
        > Ox.normalizeHTML('&lt;&apos;&amp;&quot;&gt; &#x00E4;b&#x00E7;d&#x00EA;')
        '&lt;\'&amp;"&gt; äbçdê'
    @*/
    Ox.normalizeHTML = function(html) {
        return regexp.html.test(html) ? Ox.$('<div>').html(html).html() : html;
    };

    /*@
    Ox.parseMarkdown <f> Parses (a tiny subset of) Markdown.
        Supports `*emphasis*`, `_emphasis_`, `**strong**`, `__strong__`,
        `` `code` ``, ``` ``code with backtick (`)`` ```,
        ```` ```classname\ngithub-style\ncode blocks\n``` ````,
        `<mail@example.com>`, `<http://example.com>` and
        `[text](http://example.com "title")`.
        > Ox.parseMarkdown('*foo* **bar** `baz` ``back`tick``')
        '<em>foo</em> <strong>bar</strong> <code>baz</code> <code>back`tick</code>'
        > Ox.parseMarkdown('foo\n\nbar\n\nbaz')
        'foo<br><br>bar<br><br>baz'
        > Ox.parseMarkdown('```foo\n\nbar\n\nbaz\n```')
        '<pre><code class="foo">bar\n\nbaz\n</code></pre>'
        > Ox.parseMarkdown('<http://example.com>')
        '<a href="http://example.com">http://example.com</a>'
        > Ox.parseMarkdown('`<http://example.com>`')
        '<code>&lt;http://example.com></code>'
        > Ox.parseMarkdown('[example](http://example.com "example.com")')
        '<a href="http://example.com" title="example.com">example</a>'
        > Ox.parseMarkdown('[example](http://example.com?foo=bar&bar=baz)')
        '<a href="http://example.com?foo=bar&amp;bar=baz">example</a>'
        > Ox(Ox.parseMarkdown('<mail@example.com>')).startsWith('<a href="')
        true
        > Ox(Ox.parseMarkdown('<mail@example.com>')).endsWith('</a>')
        true
        > Ox(Ox.parseMarkdown('<mail@example.com>')).count(':')
        1
        > Ox(Ox.parseMarkdown('<mail@example.com>')).decodeHTMLEntities()
        '<a href="mailto:mail@example.com">mail@example.com</a>'
    */
    Ox.parseMarkdown = function(string) {
        // see https://github.com/coreyti/showdown/blob/master/src/showdown.js
        var array = [];
        return string.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
            .replace(
                /(?:^|\n)```(.*)\n([^`]+)\n```/g,
                function(match, classname, code) {
                    array.push(
                        '<pre><code'
                        + (classname ? ' class="' + classname + '"' : '') + '>'
                        + code.trim().replace(/</g, '&lt;') + '\n</code></pre>'
                    );
                    return salt.join(array.length - 1);
                }
            )
            .replace(
                /(^|[^\\])(`+)([^\r]*?[^`])\2(?!`)/gm,
                function(match, prev, backticks, code, next) {
                    array.push(
                        prev + '<code>'
                        + code.trim().replace(/</g, '&lt;') + '</code>'
                    );
                    return salt.join(array.length - 1);
                }
            )
            .replace(
                /(\*\*|__)(?=\S)([^\r]*?\S[*_]*)\1/g,
                '<strong>$2</strong>'
            )
            .replace(
                /(\*|_)(?=\S)([^\r]*?\S)\1/g,
                '<em>$2</em>'
            )
            .replace(
                /(\[((?:\[[^\]]*\]|[^\[\]])*)\]\([ \t]*()<?(.*?)>?[ \t]*((['"])(.*?)\6[ \t]*)?\))/g,
                function(match, all, text, id, url, rest, quote, title) {
                    return '<a href="' + Ox.encodeHTMLEntities(url) + '"' + (
                        title ? ' title="' + Ox.encodeHTMLEntities(title) + '"' : ''
                    ) + '>' + text + '</a>';
                }
            )
            .replace(
                /<((https?|ftp|dict):[^'">\s]+)>/gi,
                '<a href=\"$1\">$1</a>'
            )
            .replace(
                /<(?:mailto:)?([-.\w]+\@[-a-z0-9]+(\.[-a-z0-9]+)*\.[a-z]+)>/gi,
                function(match, mail) {
                    return Ox.encodeEmailAddress(mail);
                }
            )
            .replace(/\n\n/g, '<br><br>')
            .replace(
                new RegExp(salt.join('(\\d+)'), 'g'),
                function(match, index) {
                    return array[parseInt(index)];
                }
            );
    };

    /*@
    Ox.sanitizeHTML <f> Takes untrusted HTML and returns something trustworthy
        > Ox.sanitizeHTML('http://foo.com, ...')
        '<a href="http://foo.com">http://foo.com</a>, ...'
        > Ox.sanitizeHTML('http://foo.com/foo?bar&baz, ...')
        '<a href="http://foo.com/foo?bar&amp;baz">http://foo.com/foo?bar&amp;baz</a>, ...'
        > Ox.sanitizeHTML('(see: www.foo.com)')
        '(see: <a href="http://www.foo.com">www.foo.com</a>)'
        > Ox.sanitizeHTML('foo@bar.com')
        '<a href="mailto:foo@bar.com">foo@bar.com</a>'
        > Ox.sanitizeHTML('<a href="mailto:foo@bar.com">foo</a>')
        '<a href="mailto:foo@bar.com">foo</a>'
        > Ox.sanitizeHTML('<a href="http://foo.com">foo</a>')
        '<a href="http://foo.com">foo</a>'
        > Ox.sanitizeHTML('<a href="http://www.foo.com/">http://www.foo.com/</a>')
        '<a href="http://www.foo.com/">http://www.foo.com/</a>'
        > Ox.sanitizeHTML('<a href="http://foo.com" onclick="alert()">foo</a>')
        '<a href="http://foo.com">foo</a>'
        > Ox.sanitizeHTML('<a href="javascript:alert()">foo</a>')
        '&lt;a href="javascript:alert()"&gt;foo&lt;/a&gt;'
        > Ox.sanitizeHTML('<a href="foo">foo</a>')
        '&lt;a href="foo"&gt;foo&lt;/a&gt;'
        > Ox.sanitizeHTML('<a href="/foo">foo</a>')
        '<a href="/foo">foo</a>'
        > Ox.sanitizeHTML('<a href="/">foo</a>')
        '<a href="/">foo</a>'
        > Ox.sanitizeHTML('[http://foo.com foo]')
        '<a href="http://foo.com">foo</a>'
        > Ox.sanitizeHTML('<div style="direction: rtl">foo</div>')
        '<div style="direction: rtl">foo</div>'
        > Ox.sanitizeHTML('<script>alert()</script>')
        '&lt;script&gt;alert()&lt;/script&gt;'
        > Ox.sanitizeHTML('\'foo\' < \'bar\' && "foo" > "bar"')
        '\'foo\' &lt; \'bar\' &amp;&amp; "foo" &gt; "bar"'
        > Ox.sanitizeHTML('<b>foo')
        '<b>foo</b>'
        > Ox.sanitizeHTML('<b>foo</b></b>')
        '<b>foo</b>'
        > Ox.sanitizeHTML('&&amp;')
        '&amp;&amp;'
        > Ox.sanitizeHTML('<http://foo.com>')
        '&lt;<a href="http://foo.com">http://foo.com</a>&gt;'
        > Ox.sanitizeHTML('<foo value="http://foo.com"></foo>')
        '"&lt;foo value="http://foo.com"&gt;&lt;/foo&gt;"'
    @*/
    Ox.sanitizeHTML = function(html, tags, globalAttributes) {

        tags = tags || defaultTags;
        globalAttributes = globalAttributes || [];

        var escaped = {},
            level = 0,
            matches = [],
            selfClosingTags = ['img', 'br'],
            validAttributes = {}, requiredAttributes = {}, validate = {},
            validTags = tags.map(function(tag) {
                validAttributes[tag.name]  = globalAttributes
                    .concat(tag.required || [])
                    .concat(tag.optional || []);
                requiredAttributes[tag.name] = tag.required || [];
                validate[tag.name] = tag.validate || {};
                return tag.name;
            });

        // html = Ox.clean(html); fixme: can this be a parameter?
        if (Ox.contains(validTags, '[]')) {
            html = html.replace(
                /\[((\/|https?:\/\/|mailto:).+?) (.+?)\]/gi,
                '<a href="$1">$3</a>'
            );
            validTags = validTags.filter(function(tag) {
                return tag != '[]';
            });
        }

        html = splitHTMLTags(html).map(function(string, i) {

            var attrs = {},
                attrMatch,
                attrRegexp = /([^=\ ]+)="([^"]+)"/g,
                attrString,
                isClosing,
                isTag = i % 2,
                isValid = true,
                tag,
                tagMatch,
                tagRegexp = /<(\/)?([^\ \/]+)(.*?)(\/)?>/g;

            if (isTag) {
                tagMatch = tagRegexp.exec(string);
                if (tagMatch) {
                    isClosing = !Ox.isUndefined(tagMatch[1]);
                    tag = tagMatch[2];
                    attrString = tagMatch[3].trim();
                    while (attrMatch = attrRegexp.exec(attrString)) {
                        if (
                            validAttributes[tag]
                            && Ox.contains(validAttributes[tag], attrMatch[1])
                        ) {
                            attrs[attrMatch[1]] = attrMatch[2];
                        }
                    }
                    if (!isClosing && !Ox.contains(selfClosingTags, tag)) {
                        level++;
                    }
                    if (
                        !Ox.contains(validTags, tag)
                        || (attrString.length && Ox.isEmpty(attrs))
                    ) {
                        isValid = false;
                    } else if (!isClosing && requiredAttributes[tag]) {
                        requiredAttributes[tag].forEach(function(attr) {
                            if (Ox.isUndefined(attrs[attr])) {
                                isValid = false;
                            }
                        });
                    }
                    if (isValid && !Ox.isEmpty(attrs)) {
                        Ox.forEach(attrs, function(value, key) {
                            if (
                                !Ox.isUndefined(validate[tag][key])
                                && !validate[tag][key].exec(value)
                            ) {
                                isValid = false;
                                return false; // break
                            }
                        });
                    }
                    if (isValid && isClosing) {
                        isValid = !escaped[level];
                    } else {
                        escaped[level] = !isValid;
                    }
                    if (isClosing) {
                        level--;
                    }
                    if (isValid) {
                        return '<'
                            + (isClosing ? '/' : '')
                            + tag
                            + (!isClosing && !Ox.isEmpty(attrs)
                                ? ' ' + Ox.values(Ox.map(attrs, function(value, key) {
                                    return key + '="' + value + '"';
                                })).join(' ')
                                : '')
                            + '>';
                    }
                }
            }

            return Ox.encodeHTMLEntities(Ox.decodeHTMLEntities(string));

        }).join('');

        //FIXME: dont add links to urls inside of escaped tags
        html = Ox.addLinks(html, true);
        html = html.replace(/\n\n/g, '<br/><br/>');
        // Close extra opening and remove extra closing tags.
        // Note: this converts '&apos;' to "'" and '&quot;' to '"'
        return Ox.normalizeHTML(html);

    };

    /*@
    Ox.stripTags <f> Strips HTML tags from a string
        > Ox.stripTags('f<span>o</span>o')
        'foo'
    @*/
    Ox.stripTags = function(string) {
        return string.replace(/<.*?>/g, '');
    };

}());
