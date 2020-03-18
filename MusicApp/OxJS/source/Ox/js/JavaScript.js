'use strict';

/*@
Ox.doc <f> Generates documentation for annotated JavaScript
    (source) -> <[o]> Array of doc objects
    (file, callback) -> <u> undefined
    (files, callback) -> <u> undefined
    source <s> JavaScript source code
    file <s> JavaScript file
    files <[s]> Array of JavaScript files
    callback <f> Callback function
        doc <[o]> Array of doc objects
            arguments <[o]|u> Arguments (array of doc objects)
                Present if the `type` of the item is `"function"`.
            class <s|u> Class of the item
            default <s|u> Default value of the item
            description <s|u> Multi-line description with some Markdown
                See Ox.parseMarkdown for details
            events <[o]|u> Events (array of doc objects)
                Present if the item fires any events
            file <s> File name
            inheritedevents <[o]|u> Inherited events (array of doc objects)
                Present if the item has a class, and any item in its inheritance
                chain fires events
            inheritedproperties <[o]|u> Inherited properties (array of doc objects)
                Present if the item has a class, and any item in its inheritance
                chain has (unshadowed) properties
            line <n> Line number
            name <s> Name of the item
            order <[s]> Order of returns, arguments, properties
                Present if the type of the item is "function"
            properties <[o]|u> Properties (array of doc objects)
                May be present if the `type` of the item is `"event"`,
                `"function"` or `"object"`.
            section <s|u> Section in the file
            source <[o]> Source code (array of tokens)
                column <n> Column
                line <n> Line
                type <s> Type (see Ox.tokenize for a list of types)
                value <s> Value
            returns <[o]> Return values (array of doc objects)
                Present if the `type` of the item is `"function"`.
            summary <s> One-line summary, with some Markdown
                See Ox.parseMarkdown for details
            tests <[o]|u> Tests (array of test objects)
                expected <s> Expected result
                statement <s> Statement
            types <[s]> Types of the item
    <script>
        Ox.test.doc = Ox.doc([
            '//@ My.FOO <n> Magic constant',
            'My.FOO = 23;',
            '',
            '/*@',
            'My.foo <f> Returns an items\'s bar per baz',
            '    Bar per baz is a good indicator of an item\'s foo-ness.',
            '    (item) -> <n> Bar per baz, or NaN',
            '    item <o> Any item',
            '    > My.foo({bar: 1, baz: 10})',
            '    0.1',
            '    > My.foo({})',
            '    NaN',
            '@*' + '/',
            'My.foo = function(item) {',
            '    return item.bar / item.baz;',
            '};'
        ].join('\n'));
    </script>
    > Ox.test.doc[0].name
    'My.FOO'
    > Ox.test.doc[0].types
    ['number']
    > Ox.test.doc[0].summary
    'Magic constant'
    > Ox.test.doc[1].description
    'Bar per baz is a good indicator of an item\'s foo-ness.'
    > Ox.test.doc[1].returns[0].types
    ['number']
    > Ox.test.doc[1].returns[0].summary
    'Bar per baz, or NaN'
    > Ox.test.doc[1].tests[1]
    {expected: 'NaN', statement: 'My.foo({})'}
@*/
Ox.doc = (function() {
    var re = {
            item: /^(.+?)\s+<(.+?)>\s+(.+?)$/,
            multiline: /^\/\*\@.*?\n([\w\W]+)\n.*?\@?\*\/$/,
            script: /\n(\s*<script>s*\n[\w\W]+\n\s*<\/script>s*)/g,
            signature: /^(\(.*?\))\s+\->(.*)/,
            singleline: /^\/\/@\s*(.*?)\s*$/,
            test: /\n(\s*> .+\n.+?)/g,
        },
        types = {
            a: 'array', b: 'boolean', d: 'date', e: 'error', f: 'function',
            g: 'arguments', h: 'htmlelement', 'l': 'nodelist', n: 'number',
            o: 'object', r: 'regexp', s: 'string', u: 'undefined',
            'w': 'window', '*': 'any', '+': 'other', '!': 'event'
        };
    function addInheritedProperties(items) {
        var constructors = getConstructors(items), instances = {}, nodes = {};
        function hasProperty(item, property) {
            var properties = item.properties || [],
                inheritedproperties = item.inheritedproperties
                    ? item.inheritedproperties.map(function(v) {
                        return v.properties;
                    })
                    : [];
            return Ox.contains(
                properties.concat(inheritedproperties).map(function(property) {
                    return property.name;
                }),
                property.name
            );
        }
        constructors.forEach(function(constructor) {
            var instance = Ox.last(constructor.returns);
            instances[constructor.name] = instance;
            nodes[constructor.name] = instance['class'];
        });
        Ox.forEach(getChains(nodes), function(chain, childName) {
            var child = instances[childName];
            chain.forEach(function(parentName) {
                var parent = instances[parentName]
                    || Ox.last(items[Ox.indexOf(items, function(item) {
                        return item.name == parentName;
                    })].returns);
                ['properties', 'events'].forEach(function(key) {
                    parent[key] && parent[key].forEach(function(value) {
                        var key_ = 'inherited' + key;
                        if (key == 'events' || !hasProperty(child, value)) {
                            if (!child[key_]) {
                                child[key_] = [];
                            }
                            if (!child[key_].some(function(v) {
                                return v.name == parentName;
                            })) {
                                child[key_].push(
                                    Ox.extend({name: parentName}, key, [])
                                );
                            }
                            Ox.last(child[key_])[key].push(value);
                        }
                    });
                });
            });
        });
        return items;
    }
    function decodeLinebreaks(match, submatch) {
        return (submatch || match).replace(/\u21A9/g, '\n');
    }
    function encodeLinebreaks(match, submatch) {
        return '\n' + (submatch || match).replace(/\n/g, '\u21A9');
    }
    function getChains(nodes) {
        var chains = {}, sorted = [], visited = [];
        function visit(name, stack) {
            stack = stack || [];
            if (Ox.contains(stack, name)) {
                throw new Error(
                    'Circular dependency: ' + name + ' <-> ' + Ox.last(stack)
                );
            }
            if (!Ox.contains(visited, name)) {
                visited.push(name);
                stack.push(name);
                Ox.forEach(nodes, function(parent, name_) {
                    parent == name && visit(name_, stack);
                });
                sorted.unshift(name);
            }
        }
        Ox.forEach(nodes, function(parent, name) {
            visit(name);
        });
        sorted.forEach(function(name) {
            chains[name] = [nodes[name]].concat(chains[nodes[name]] || []);
        });
        return chains;
    }
    function getConstructors(items) {
        var constructors = [];
        items.forEach(function(item) {
            if (item.returns) {
                Ox.forEach(item.returns, function(v) {
                    if (v['class']) {
                        constructors.push(item);
                        return false; // break
                    }
                });
            }
            ['arguments', 'properties', 'returns'].forEach(function(key) {
                if (item[key]) {
                    constructors.concat(getConstructors(item[key]));
                }
            });
        });
        return constructors;
    }
    function getIndent(string) {
        var indent = -1;
        while (string[++indent] == ' ') {}
        return indent;
    }
    function parseItem(string) {
        var matches = re.item.exec(string);
        // to tell a variable with default value, like
        //     name <string|'<a href="...">foo</a>'> summary
        // from a line of description with tags, like
        //     some <a href="...">description</a> text
        // we need to check if there is either no forward slash
        // or if the second last char is a single or double quote
        return matches && (
            matches[2].indexOf('/') == -1 ||
            '\'"'.indexOf(matches[2].slice(-2, -1)) > -1
        ) ? Ox.extend(
            parseName(matches[1]),
            parseTypes(matches[2]),
            {summary: matches[3].trim()}
        ) : null;
    }
    function parseName(string) {
        var matches = re.signature.exec(string);
        return matches
            ? {signature: matches[1], name: matches[2].trim()}
            : {name: string};
    }
    function parseNode(node) {
        var item = parseItem(node.line), order = [];
        item.name = item.name.replace(/^\./, '');
        node.nodes && node.nodes.forEach(function(node) {
            var key, line = node.line, subitem;
            if (!/^#/.test(node.line)) {
                if (/^<script>/.test(line)) {
                    item.tests = [parseScript(line)];
                } else if (/^>/.test(line)) {
                    item.tests = item.tests || [];
                    item.tests.push(parseTest(line));
                } else if ((subitem = parseItem(line))) {
                    if (subitem.signature) {
                        item.returns = item.returns || [];
                        item.returns.push(parseNode(node));
                        order.push('returns');
                    } else if (subitem.types[0] == 'event') {
                        item.events = item.events || [];
                        item.events.push(parseNode(node));
                        // FIXME: unclear if this should be part of order, too
                        // order.push('events');
                    } else {
                        key = item.types[0] == 'function'
                            && !/^\./.test(subitem.name)
                            ? 'arguments' : 'properties';
                        item[key] = item[key] || [];
                        item[key].push(parseNode(node));
                        order.push(key);
                    }
                } else {
                    item.description = item.description
                        ? item.description + ' ' + line : line;
                }
            }
        });
        item.summary = Ox.parseMarkdown(item.summary);
        if (item.description) {
            item.description = Ox.parseMarkdown(item.description);
        }
        if (item.types[0] == 'function') {
            item.order = Ox.unique(order);
        }
        return item;
    }
    function parseScript(string) {
        // remove script tags and extra indentation
        var lines = decodeLinebreaks(string).split('\n'),
            indent = getIndent(lines[1]);
        return {
            statement: lines.slice(1, -1).map(function(line, i) {
                return line.slice(indent);
            }).join('\n')
        };
    }
    function parseSource(source, file) {
        var blocks = [],
            items = [],
            section = '',
            tokens = [];
        Ox.tokenize(source).forEach(function(token) {
            var match;
            if (token.type == 'comment' && (
                match = re.multiline.exec(token.value)
                || re.singleline.exec(token.value)
            )) {
                blocks.push(match[1]);
                tokens.push([]);
            } else if (tokens.length) {
                tokens[tokens.length - 1].push(token);
            }
        });
        blocks.forEach(function(block, i) {
            var item, lastItem, lastToken,
                lines = block
                    .replace(re.script, encodeLinebreaks)
                    .replace(re.test, encodeLinebreaks)
                    .split('\n'),
                parent, tree = parseTree(lines);
            if (re.item.test(tree.line)) {
                // parse the tree's root node
                item = parseNode(tree);
                item.file = file || '';
                if (section) {
                    item.section = section;
                }
                // FIXME: should become !/^\./.test(item.name)
                if (/^[A-Z]/.test(item.name)) {
                    // main item
                    // remove leading linebreaks and whitespace
                    item.source = parseTokens(tokens[i]);
                    item.line = item.source[0].line;
                    items.push(item);
                } else {
                    // property of an item
                    // FIXME: should become item.name.slice(1)
                    item.name = item.name.replace(/^\./, '');
                    lastItem = Ox.last(items);
                    parent = lastItem.types[0] == 'function'
                        && lastItem.returns
                        && lastItem.returns[0].types[0] == 'object'
                        ? lastItem.returns[0] : lastItem;
                    parent.properties = parent.properties || [];
                    parent.properties.push(item);
                    if (
                        parent.order && !Ox.contains(parent.order, 'properties')
                    ) {
                        parent.order.push('properties');
                    }
                    // add a linebreak, and the property's source without
                    // leading whitespace, to the last item's source
                    lastToken = Ox.last(lastItem.source);
                    lastItem.source = lastItem.source.concat(
                        {
                            column: lastToken.column + lastToken.value.length,
                            line: lastToken.line,
                            type: 'linebreak',
                            value: '\n'
                        },
                        parseTokens(tokens[i], true)
                    );
                }
            } else {
                section = tree.line;
            }
        });
        return items;
    }
    function parseTest(string) {
        // fixme: we cannot properly handle tests where a string contains '\n '
        var lines = decodeLinebreaks(string).split('\n ');
        return {
            statement: lines[0].slice(2),
            expected: lines[1].trim()
        };
    }
    function parseTokens(tokens, includeLeading) {
        // removes leading and trailing linebreaks and whitespace
        var start = 0, stop = tokens.length,
            types = ['linebreak', 'whitespace'];
        if (includeLeading) {
            // for properties, whose tokens belong to the main item, we only 
            // remove leading whitespace
            while (tokens[start].type == 'whitespace') {
                start++;
            }
        } else {
            // remove leading linebreaks and whitespace
            while (types.indexOf(tokens[start].type) > -1) {
                start++;
            }
            // but keep leading whitespace in the first significant line
            while (start && tokens[start - 1].type == 'whitespace') {
                start--;
            }
        }
        // remove trailing linebreaks and whitespace
        while (stop > start && types.indexOf(tokens[stop - 1].type) > -1) {
            stop--;
        }
        return tokens.slice(start, stop);
    }
    function parseTree(lines) {
        // parses indented lines into a tree structure, like
        // {line: "...", nodes: [{line: "...", nodes: [...]}]}
        var branches = [],
            indent,
            node = {
                // chop the root line
                line: lines.shift().trim()
            };
        if (lines.length) {
            indent = getIndent(lines[0]);
            lines.forEach(function(line) {
                if (getIndent(line) == indent) {
                    // line is a child,
                    // make it the root line of a new branch
                    branches.push([line]);
                } else {
                    // line is a descendant of the last child,
                    // add it to the last branch
                    branches[branches.length - 1].push(line);
                }
            });
            node.nodes = branches.map(function(lines) {
                return parseTree(lines);
            });
        }
        return node;
    }
    function parseTypes(string) {
        // returns {types: [""]}
        // or {types: [""], default: ""}
        // or {types: [""], class: ""}
        var array,
            isArray,
            ret = {types: []},
            type;
        // only split by ':' if there is no default string value
        if ('\'"'.indexOf(string.slice(-2, -1)) == -1) {
            array = string.split(':');
            string = array[0];
            if (array.length == 2) {
                ret['class'] = array[1];
            }
        }
        string.split('|').forEach(function(string) {
            var unwrapped = unwrap(string);
            if (unwrapped in types) {
                ret.types.push(wrap(types[unwrapped]));
            } else if (
                (type = Ox.filter(Ox.values(types), function(type) {
                    return Ox.startsWith(type, unwrapped);
                })).length
            ) {
                ret.types.push(wrap(type[0]));
            } else {
                ret['default'] = string;
            }
        });
        function unwrap(string) {
            return (isArray = /^\[.+\]$/.test(string))
                ? string.slice(1, -1) : string;
        }
        function wrap(string) {
            return isArray ? '[' + string + 's' + ']' : string;
        }
        return ret;
    }
    return function(argument, callback) {
        var counter = 0, items = [], ret;
        if (arguments.length == 1) {
            // source
            ret = addInheritedProperties(parseSource(argument));
        } else {
            // file(s)
            argument = Ox.makeArray(argument);
            argument.forEach(function(file) {
                Ox.get(file, function(source) {
                    items = items.concat(
                        parseSource(source, file.split('?')[0])
                    );
                    if (++counter == argument.length) {
                        callback(addInheritedProperties(items));
                    }
                });
            });
        }
        return ret;
    };
}());

/*@
Ox.identify <f> Returns the type of a JavaScript identifier
    (string) -> <s> Type
        Type can be `'constant'`, `'identifier'`, `'keyword'`, `'method'`,
        `'object'` or `'property'`.
    > Ox.identify('PI')
    'constant'
    > Ox.identify('foo')
    'identifier'
    > Ox.identify('for')
    'keyword'
    > Ox.identify('forEach')
    'method'
    > Ox.identify('window')
    'object'
    > Ox.identify('prototype')
    'property'
@*/
Ox.identify = (function() {
    // see https://developer.mozilla.org/en/JavaScript/Reference
    var identifiers = {
        constant: [
            // Math
            'E', 'LN2', 'LN10', 'LOG2E', 'LOG10E', 'PI', 'SQRT1_2', 'SQRT2',
            // Number
            'MAX_VALUE', 'MIN_VALUE', 'NEGATIVE_INFINITY', 'POSITIVE_INFINITY'
        ],
        keyword: [
            'break',
            'case', 'catch', 'class', 'const', 'continue',
            'debugger', 'default', 'delete', 'do',
            'else', 'enum', 'export', 'extends',
            'false', 'finally', 'for', 'function',
            'if', 'implements', 'import', 'in', 'instanceof', 'interface',
            'let', 'module',
            'new', 'null',
            'package', 'private', 'protected', 'public',
            'return',
            'super', 'switch', 'static',
            'this', 'throw', 'true', 'try', 'typeof',
            'var', 'void',
            'yield',
            'while', 'with'
        ],
        method: [
            // Array
            'concat',
            'every',
            'filter', 'forEach',
            'join',
            'lastIndexOf',
            'indexOf', 'isArray',
            'map',
            'pop', 'push',
            'reduce', 'reduceRight', 'reverse',
            'shift', 'slice', 'some', 'sort', 'splice',
            'unshift',
            // Date
            'getDate', 'getDay', 'getFullYear', 'getHours',
            'getMilliseconds', 'getMinutes', 'getMonth', 'getSeconds',
            'getTime', 'getTimezoneOffset',
            'getUTCDate', 'getUTCDay', 'getUTCFullYear', 'getUTCHours',
            'getUTCMilliseconds', 'getUTCMinutes', 'getUTCMonth', 'getUTCSeconds',
            'now',
            'parse',
            'setDate', 'setFullYear', 'setHours', 'setMilliseconds',
            'setMinutes', 'setMonth', 'setSeconds', 'setTime',
            'setUTCDate', 'setUTCFullYear', 'setUTCHours', 'setUTCMilliseconds',
            'setUTCMinutes', 'setUTCMonth', 'setUTCSeconds',
            'toDateString', 'toJSON', 'toLocaleDateString', 'toLocaleString',
            'toLocaleTimeString', 'toTimeString', 'toUTCString',
            'UTC',
            // Function
            'apply', 'bind', 'call', 'isGenerator',
            // JSON
            'parse', 'stringify',
            // Math
            'abs', 'acos', 'asin', 'atan', 'atan2',
            'ceil', 'cos',
            'exp',
            'floor',
            'log',
            'max', 'min',
            'pow',
            'random', 'round',
            'sin', 'sqrt',
            'tan',
            // Number
            'toExponential', 'toFixed', 'toLocaleString', 'toPrecision',
            // Object
            'create',
            'defineProperty', 'defineProperties',
            'freeze',
            'getOwnPropertyDescriptor', 'getOwnPropertyNames', 'getPrototypeOf',
            'hasOwnProperty',
            'isExtensible', 'isFrozen', 'isPrototypeOf', 'isSealed',
            'keys',
            'preventExtensions', 'propertyIsEnumerable',
            'seal',
            'toLocaleString', 'toString',
            'valueOf',
            // RegExp
            'exec', 'test',
            // String
            'charAt', 'charCodeAt', 'concat',
            'fromCharCode',
            'indexOf',
            'lastIndexOf', 'localeCompare',
            'match',
            'replace',
            'search', 'slice', 'split', 'substr', 'substring',
            'toLocaleLowerCase', 'toLocaleUpperCase',
            'toLowerCase', 'toUpperCase', 'trim',
            // Window
            'addEventListener', 'alert', 'atob',
            'blur', 'btoa',
            'clearInterval', 'clearTimeout', 'close', 'confirm',
            'dispatchEvent',
            'escape',
            'find', 'focus',
            'getComputedStyle', 'getSelection',
            'moveBy', 'moveTo',
            'open',
            'postMessage', 'print', 'prompt',
            'removeEventListener', 'resizeBy', 'resizeTo',
            'scroll', 'scrollBy', 'scrollTo',
            'setCursor', 'setInterval', 'setTimeout', 'stop',
            'unescape'
        ],
        object: [
            'Array',
            'Boolean',
            'Date', 'decodeURI', 'decodeURIComponent',
            'encodeURI', 'encodeURIComponent', 'Error', 'eval', 'EvalError',
            'Function',
            'Infinity', 'isFinite', 'isNaN',
            'JSON',
            'Math',
            'NaN', 'Number',
            'Object',
            'parseFloat', 'parseInt',
            'RangeError', 'ReferenceError', 'RegExp',
            'String', 'SyntaxError',
            'TypeError',
            'undefined', 'URIError',
            'window'
        ],
        property: [
            // Function
            'constructor', 'length', 'prototype',
            // RegExp
            'global', 'ignoreCase', 'lastIndex', 'multiline', 'source',
            // Window
            'applicationCache',
            'closed', 'console', 'content', 'crypto',
            'defaultStatus', 'document',
            'frameElement', 'frames',
            'history',
            'innerHeight', 'innerWidth',
            'length', 'location', 'locationbar', 'localStorage',
            'menubar',
            'name', 'navigator',
            'opener', 'outerHeight', 'outerWidth',
            'pageXOffset', 'pageYOffset', 'parent', 'personalbar',
            'screen', 'screenX', 'screenY', 'scrollbars', 'scrollX', 'scrollY',
            'self', 'sessionStorage', 'status', 'statusbar',
            'toolbar', 'top'
        ]
    };
    return function(identifier) {
        var ret;
        if (identifiers.keyword.indexOf(identifier) > -1) {
            // fast track for keywords (used in Ox.tokenize)
            ret = 'keyword';
        } else {
            ret = 'identifier';
            Ox.forEach(identifiers, function(words, type) {
                if (words.indexOf(identifier) > -1) {
                    ret = type;
                    return false; // break
                }
            });
        }
        return ret;
    };
}());

/*@
Ox.minify <f> Minifies JavaScript
    (source) -> <s> Minified JavaScript
    (file, callback) -> <u> undefined
    source <s> JavaScript source
    file <s> JavaScript file
    callback <f> Callback function
    > Ox.minify('void/**' + '/0')
    'void 0'
    > Ox.minify('for (a in b)\n{\t\tc = void 0;\n}')
    'for(a in b)\n{c=void 0;}'
    > Ox.minify('return a; return 0; return "";')
    'return a;return 0;return"";'
    > Ox.minify('return\na;\nreturn\n0;\nreturn\n"";')
    'return\na;return\n0;return\n"";'
@*/
Ox.minify = function() {
    // see https://github.com/douglascrockford/JSMin/blob/master/README
    // and http://inimino.org/~inimino/blog/javascript_semicolons
    if (arguments.length == 1) {
        return minify(arguments[0]);
    } else {
        Ox.get(arguments[0], function(source) {
            arguments[1](minify(source));
        });
    }
    function minify(source) {
        var tokens = Ox.tokenize(source),
            length = tokens.length,
            ret = '';
        tokens.forEach(function(token, i) {
            var next, nextToken, prevToken;
            if (['linebreak', 'whitespace'].indexOf(token.type) > -1) {
                prevToken = i == 0 ? null : tokens[i - 1];
                next = i + 1;
                while (
                    next < length && ['comment', 'linebreak', 'whitespace']
                        .indexOf(tokens[next].type) > -1
                ) {
                    next++;
                }
                nextToken = next == length ? null : tokens[next];
            }
            if (token.type == 'linebreak') {
                // replace a linebreak between two tokens that are identifiers
                // or numbers or strings or unary operators or grouping
                // operators with a single newline, otherwise remove it
                if (
                    prevToken && nextToken && (
                        ['identifier', 'number', 'string'].indexOf(prevToken.type) > -1
                        || ['++', '--', ')', ']', '}'].indexOf(prevToken.value) > -1
                    ) && (
                        ['identifier', 'number', 'string'].indexOf(nextToken.type) > -1
                        || ['+', '-', '++', '--', '~', '!', '(', '[', '{'].indexOf(nextToken.value) > -1
                    )
                ) {
                    ret += '\n';
                }
            } else if (token.type == 'whitespace') {
                // replace whitespace between two tokens that are identifiers or
                // numbers, or between a token that ends with "+" or "-" and one
                // that begins with "+" or "-", with a single space, otherwise
                // remove it
                if (
                    prevToken && nextToken && ((
                        ['identifier', 'number'].indexOf(prevToken.type) > -1
                        && ['identifier', 'number'].indexOf(nextToken.type) > -1
                    ) || (
                        ['+', '-', '++', '--'].indexOf(prevToken.value) > -1
                        && ['+', '-', '++', '--'].indexOf(nextToken.value) > -1
                    ))
                ) {
                    ret += ' ';
                }
            } else if (token.type != 'comment') {
                // remove comments and leave all other tokens untouched
                ret += token.value;
            }
        });
        return ret;
    }
};

/*@
Ox.test <f> Takes JavaScript, runs inline tests, returns results
    (source, callback) -> <u> undefined
    (file, callback) -> <u> undefined
    (files, callback) -> <u> undefined
    (doc, callback) -> <u> undefined
    (docs, callback) -> <u> undefined
    source <s> JavaScript source
    file <s> JavaScript file
    files <[s]> Array of JavaScript files
    doc <o> Documentation object (as returned by Ox.doc)
    docs <[o]> Array of documentation objects (as returned by Ox.doc)
    callback <f> Callback function
        results <[o]> Array of results
            actual <s> Actual result
            expected <s> Expected result
            name <s> Item name
            section <s|u> Section in the file
            statement <s> Test statement
            passed <b> True if actual result and expected result are equal
    .data <o> undocumented
    <script>
        Ox.test.foo = function(item) {
            return item.bar / item.baz;
        };
        Ox.test.source = [
            '/*@',
            'Ox.test.foo <f> Returns an items\'s bar per baz',
            '    Bar per baz is a good indicator of an item\'s foo-ness.',
            '    (item) -> <n> Bar per baz, or NaN',
            '    item <o> Any item',
            '    > Ox.test.foo({bar: 1, baz: 10})',
            '    0.1',
            '    > Ox.test.foo({})',
            '    NaN',
            '@*' + '/',
            'Ox.test.foo = function(item) {',
            '    return item.bar / item.baz;',
            '};'
        ].join('\n');
    </script>
    > Ox.test(Ox.test.source, function(r) { Ox.test(r[0].passed, true); })
    undefined
@*/
Ox.test = function(argument, callback) {
    // Ansynchronous functions can be tested by calling Ox.test(actual,
    // expected) in the callback. If Ox.test is called inside a test statement
    // (unless at the beginning of the statement, which is a test for Ox.test),
    // the call to Ox.test is patched by inserting the test statement string as
    // the first argument of the Ox.test call, and Ox.test will branch when
    // called with three arguments.
    function runTests(items) {
        var id = Ox.uid(), regexp = /(.+Ox\.test\()/, results = [];
        // We have to create a globally accessible object so that synchronous
        // and asynchronous tests can read, write and return the same data.
        Ox.test.data[id] = {
            callback: callback,
            done: false,
            results: results,
            tests: {}
        };
        items.forEach(function(item) {
            item.tests && item.tests.some(function(test) {
                return test.expected;
            }) && item.tests.forEach(function(test) {
                var actual, statement = test.statement,
                    isAsync = regexp.test(statement);
                if (isAsync) {
                    // Add a pending test
                    Ox.test.data[id].tests[test.statement] = {
                        expected: test.expected,
                        name: item.name,
                        section: item.section
                    };
                    // Patch the test statement
                    statement = statement.replace(
                        regexp,
                        "$1'" + statement.replace(/'/g, "\\'") + "', "
                    );
                }
                Ox.Log('TEST', statement);
                actual = eval(statement);
                if (!isAsync && test.expected) {
                    Ox.test.data[id].results.push({
                        actual: stringifyResult(actual),
                        expected: test.expected,
                        name: item.name,
                        section: item.section,
                        statement: statement,
                        passed: Ox.isEqual(
                            actual, eval('(' + test.expected + ')')
                        )
                    });
                }
            });
        });
        Ox.test.data[id].done = true;
        if (Ox.isEmpty(Ox.test.data[id].tests)) {
            callback(Ox.test.data[id].results);
            delete Ox.test.data[id];
        }
    }
    function stringifyResult(result) {
        return Ox.isEqual(result, -0) ? '-0'
            : Ox.isNaN(result) ? 'NaN'
            : Ox.isUndefined(result) ? 'undefined'
            : JSON.stringify(result);
    }
    if (arguments.length == 2) {
        if (Ox.typeOf(argument) == 'string' && Ox.contains(argument, '\n')) {
            // source code
            runTests(Ox.doc(argument));
        } else {
            argument = Ox.makeArray(argument);
            if (Ox.typeOf(argument[0]) == 'string') {
                // files
                Ox.doc(argument, runTests);
            } else {
                // doc objects
                runTests(argument);
            }
        }
    } else {
        var statement = arguments[0],
            actual = arguments[1],
            expected = arguments[2],
            id, test;
        Ox.forEach(Ox.test.data, function(v, k) {
            if (v.tests[statement]) {
                id = k;
                test = v.tests[statement];
                return false; // break
            }
        });
        Ox.test.data[id].results.push(Ox.extend(test, {
            actual: stringifyResult(actual),
            statement: statement,
            passed: Ox.isEqual(actual, expected)
        }));
        delete Ox.test.data[id].tests[statement];
        if (Ox.test.data[id].done && Ox.isEmpty(Ox.test.data[id].tests)) {
            Ox.test.data[id].callback(Ox.test.data[id].results);
            delete Ox.test.data[id];
        }
    }
};
Ox.test.data = {};

/*@
Ox.tokenize <f> Tokenizes JavaScript
    (source) -> <[o]> Array of tokens
        column <n> Column of the token
        line <n> Line of the token
        type <s> Type of the token
            Type can be `'comment'`, `'error'`, `'identifier'`, `'linebreak'`,
            `'number'`, `'operator'`, `'regexp'`, `'string'` or `'whitespace'`
        value <s> Value of the token
    source <s> JavaScript source code
    > Ox.tokenize('// comment\nvar foo = bar / baz;').length
    14
    > Ox.tokenize('return /foo/gi;')[2].value.length
    7
    > Ox.tokenize('[.1, 0xFF, 1e1, 1e+1, 1e-1, 1e+1+1]').length
    20
@*/
Ox.tokenize = (function() {

    // see https://github.com/mozilla/narcissus/blob/master/lib/lexer.js

    var comment = ['//', '/*'],
        identifier = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$_',
        linebreak = '\n\r',
        number = '0123456789',
        operator = [
            // arithmetic
            '+', '-', '*', '/', '%', '++', '--',
            // assignment
            '=', '+=', '-=', '*=', '/=', '%=',
            '&=', '|=', '^=', '<<=', '>>=', '>>>=',
            // bitwise
            '&', '|', '^', '~', '<<', '>>', '>>>',
            // comparison
            '==', '!=', '===', '!==', '>', '>=', '<', '<=',
            // conditional
            '?', ':',
            // grouping
            '(', ')', '[', ']', '{', '}',
            // logical
            '&&', '||', '!',
            // other
            '.', ',', ';'
        ],
        regexp = 'abcdefghijklmnopqrstuvwxyz',
        string = '\'"',
        whitespace = ' \t';

    function isRegExp(tokens) {
        // Returns true if the current token is the beginning of a RegExp, as
        // opposed to the beginning of an operator
        var i = tokens.length - 1, isRegExp, token
        // Scan back to the previous significant token, or to the beginning of
        // the source
        while (i >= 0 && [
            'comment', 'linebreak', 'whitespace'
        ].indexOf(tokens[i].type) > -1) {
            i--;
        }
        if (i == -1) {
            // Source begins with a forward slash
            isRegExp = true;
        } else {
            token = tokens[i];
            isRegExp = (
                token.type == 'identifier'
                && Ox.identify(token.value) == 'keyword'
                && ['false', 'null', 'true'].indexOf(token.value) == -1
            ) || (
                token.type == 'operator'
                && ['++', '--', ')', ']', '}'].indexOf(token.value) == -1
            );
        }
        return isRegExp;
    }

    return function(source) {
        var char,
            column = 1,
            cursor = 0,
            delimiter,
            length = source.length,
            line = 1,
            lines,
            next,
            tokens = [],
            start,
            type,
            value;
        source = source.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        while (cursor < length) {
            start = cursor;
            char = source[cursor];
            if (comment.indexOf(delimiter = char + source[cursor + 1]) > -1) {
                type = 'comment';
                ++cursor;
                while (char = source[++cursor]) {
                    if (delimiter == '//' && char == '\n') {
                        break;
                    } else if (delimiter == '/*' && char + source[cursor + 1] == '*/') {
                        cursor += 2;
                        break;
                    }
                }
            } else if (identifier.indexOf(char) > -1) {
                type = 'identifier';
                while ((identifier + number).indexOf(source[++cursor]) > -1) {}
            } else if (linebreak.indexOf(char) > -1) {
                type = 'linebreak';
                while (linebreak.indexOf(source[++cursor]) > -1) {}
            } else if (
                number.indexOf(char) > -1
                || char == '.' && number.indexOf(source[cursor + 1]) > -1
            ) {
                type = 'number';
                while ((number + '.abcdefxABCDEFX+-').indexOf(source[++cursor]) > -1) {
                    if (
                        source[cursor - 1] != 'e' && source[cursor - 1] != 'E'
                        && (source[cursor] == '+' || source[cursor] == '-')
                    ) {
                        break;
                    }
                }
            } else if (char == '/' && isRegExp(tokens)) {
                type = 'regexp';
                while ((char = source[++cursor]) != '/' && cursor < length) {
                    char == '\\' && ++cursor;
                }
                while (regexp.indexOf(source[++cursor]) > -1) {}
            } else if (operator.indexOf(char) > -1) {
                // has to be tested after number and regexp
                type = 'operator';
                while (operator.indexOf(char += source[++cursor]) > -1 && cursor < length) {}
            } else if (string.indexOf(delimiter = char) > -1) {
                type = 'string';
                while ((char = source[++cursor]) != delimiter && cursor < length) {
                    char == '\\' && ++cursor;
                }
                ++cursor;
            } else if (whitespace.indexOf(char) > -1) {
                type = 'whitespace';
                while (whitespace.indexOf(source[++cursor]) > -1) {}
            } else {
                type = 'error';
                ++cursor;
            }
            value = source.slice(start, cursor);
            if (
                type == 'error' && tokens.length
                && tokens[tokens.length - 1].type == 'error'
            ) {
                tokens[tokens.length - 1].value += value;
            } else {
                tokens.push(
                    {column: column, line: line, type: type, value: value}
                );
            }
            if (type == 'comment') {
                lines = value.split('\n');
                column = lines[lines.length - 1].length;
                line += lines.length - 1;
            } else if (type == 'linebreak') {
                column = 1;
                line += value.length;
            } else {
                column += value.length;
            }
        }
        return tokens;
    };

}());
