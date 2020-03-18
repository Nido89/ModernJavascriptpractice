#!/usr/bin/python
# -*- coding: utf-8 -*-
import os
import ox
import ox.js
import json

strings = {
    'inside Ox._()': {},
    'outside Ox._()': {}
}
lines = []
path = './dev/'
files = []

for f in ['Ox/json/Ox.json', 'UI/json/UI.json']:
    with open(path + f) as fd:
        for filename in json.load(fd)['files']:
            if isinstance(filename, list):
                files += filename
            else:
                files.append(filename)

files = [f for f in files if f.endswith('.js')]

for f in files:
    f = os.path.join(path, f)
    with open(f) as fd:
        data = fd.read().decode('utf-8')
        inside = False
        level = 0
        tokens = ox.js.tokenize(data)
        for i, token in enumerate(tokens):
            if i >= 3 and tokens[i - 3]['value'] + tokens[i - 2]['value'] \
                    + tokens[i - 1]['value'] + tokens[i]['value'] == 'Ox._(':
                inside = True
                level = 1
            elif inside:
                if token['value'] == '(':
                    level +=1
                elif token['value'] == ')':
                    level -= 1
                    inside = level > 0
            if token['type'] == 'string' and len(token['value']) > 2:
                key = inside and 'inside Ox._()' or 'outside Ox._()'
                string = token['value'][1:-1].replace(
                        "\\'", "'"
                    ).replace(
                        '\\]"', '\\"'
                    )
                    #.replace(/\\'/g, '\'')
                    #.replace(/([^\\]")/, '\\"')
                if not string in strings[key]:
                    strings[key][string] = []
                strings[key][string].append(
                    f.replace(path, '') + ':%d' % token['line']
                )

for key in ox.sorted_strings(strings):
    lines.append(key)
    for string in ox.sorted_strings(strings[key]):
        lines.append((' ' * 4) + '"%s"' % string)
        for f in ox.sorted_strings(strings[key][string]):
            lines.append((' ' * 8) + f)

print (u'\n'.join(lines)).encode('utf-8')
