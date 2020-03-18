var path = Ox.PATH.replace('/build/', '/dev/'),
    files = [
        path + 'Ox/json/Ox.json',
        path + 'UI/json/UI.json'
    ],
    strings = {
        'inside Ox._()': {},
        'outside Ox._()': {}
    },
    lines = ['\n'];

Ox.getJSON(files, function(data) {
    files = [];
    Ox.forEach(data, function(data, file) {
        files = files.concat(Ox.flatten(data.files).filter(function(file) {
            return Ox.endsWith(file, '.js');
        }));
    });
    Ox.getAsync(files.map(function(file) {
        return Ox.PATH + file;
    }), Ox.get, function(data) {
        Ox.forEach(data, function(data, file) {
            var inside = false,
                level = 0,
                tokens = Ox.tokenize(data);
            tokens.forEach(function(token, i) {
                var key, string;
                if (i >= 3
                    && tokens[i - 3].value + tokens[i - 2].value
                    + tokens[i - 1].value + tokens[i].value == 'Ox._('
                ) {
                    inside = true;
                    level = 0;
                } else if (inside) {
                    if (token.value == '(') {
                        level++;
                    } else if (token.value == ')') {
                        level--;
                        inside = level > 0;
                    }
                }
                if (token.type == 'string' && token.value.length > 2) {
                    key = inside ? 'inside Ox._()' : 'outside Ox._()';
                    string = token.value.slice(1, -1)
                        .replace(/\\'/g, '\'')
                        .replace(/([^\\]")/, '\\"')
                    if (!Ox.isArray(strings[key][string])) {
                        strings[key][string] = [];
                    }
                    strings[key][string].push(
                        file.replace(path, '') + ':' + token.line
                    );
                }
            });
        });
        Ox.forEach(strings, function(values, key) {
            lines.push(key);
            Ox.sort(Object.keys(values)).forEach(function(string) {
                lines.push(Ox.repeat(' ', 4) + '"' + string + '"');
                Ox.sort(strings[key][string]).forEach(function(file) {
                    lines.push(Ox.repeat(' ', 8) + file);
                });
            });
        });
        Ox.print(lines.join('\n'));
    });
});
