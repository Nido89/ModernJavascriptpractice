import json
import ox
import re

remove = [
    'ABOVE', 'BAR', 'BELOW', 'CEDILLA', 'DIGRAPH', 'LONGA', 'ROTUNDA'
]
special = {
    'ACCOUNT OF': 'a/o',
    'ADDRESSED TO THE SUBJECT': 'a/s',
    'AM': 'a.m.',
    'ANGSTROM SIGN': 'A',
    'C OVER KG': 'c/kg',
    'CADA UNA': 'c/u',
    'CARE OF': 'c/o',
    'CM CUBED': 'cm3',
    'CM SQUARED': 'cm2',
    'CO': 'Co.',
    'DM CUBED': 'dm3',
    'DM SQUARED': 'dm2',
    'EIGHT': '8',
    'ELEVEN': '11',
    'EULER CONSTANT': 'E',
    'FACSIMILE SIGN': 'FAX',
    'FEMININE ORDINAL INDICATOR': 'a',
    'FIFTY': '50',
    'FIVE': '5',
    'FIVE HUNDRED': '500',
    'FOUR': '4',
    'INFORMATION SOURCE': 'I',
    'KCAL': 'kcal',
    'KELVIN SIGN': 'K',
    'KK': 'K.K.',
    'KM CAPITAL': 'KM',
    'KM CUBED': 'km3',
    'KM SQUARED': 'km2',
    'LATIN SMALL LETTER N PRECEDED BY APOSTROPHE': '\'n',
    'LIMITED LIABILITY SIGN': 'LTD',
    'M CUBED': 'm3',
    'M OVER S SQUARED': 'm/s2',
    'M SQUARED': 'm2',
    'MASCULINE ORDINAL INDICATOR': 'o',
    'MB SMALL': 'mb',
    'MM CUBED': 'mm3',
    'MM SQUARED': 'mm2',
    'MV MEGA': 'MV',
    'MW MEGA': 'MW',
    'NINE': '9',
    'NUMERO SIGN': 'No',
    'ONE': '1',
    'ONE HUNDRED': '100',
    'ONE THOUSAND': '1000',
    'PA AMPS': 'pA',
    'PARTNERSHIP SIGN': 'PTE',
    'PLANCK CONSTANT': 'h',
    'PLANCK CONSTANT OVER PI': 'h',
    'PLANCK CONSTANT OVER TWO PI': 'h',
    'PM': 'p.m.',
    'RAD OVER S SQUARED': 'rad/s2',
    'RUPEE SIGN': 'Rs',
    'S T': 'st',
    'SERVICE MARK': 'SM',
    'SEVEN': '7',
    'SIX': '6',
    'TELEPHONE SIGN': 'TEL',
    'TEN': '10',
    'THREE': '3',
    'TRADE MARK SIGN': 'TM',
    'TWELVE': '12',
    'TWO': '2'
}
special_keys = sorted(special.keys(), key=lambda x: -len(x))
units = [
    'bar', 'Bq',
    'cal', 'cd', 'cm',
    'da', 'dB', 'dl',
    'ffi', 'ffl', 'fm',
    'GHz', 'GPa', 'Gy',
    'ha', 'hPa', 'Hz',
    'in',
    'kA', 'kcal', 'kg', 'KHz', 'kl', 'km', 'KPa', 'kt', 'kV', 'kW',
    'log', 'lm', 'ln', 'lx',
    'mA', 'mg', 'MHz', 'mil', 'ml', 'mm', 'mol', 'MPa', 'ms', 'mV', 'mW',
    'nA', 'nF', 'nm', 'ns', 'nV', 'nW',
    'oV',
    'Pa', 'pc', 'pH', 'PPM', 'ps', 'pV', 'pW',
    'rad',
    'sr', 'Sv',
    'THz',
    'wb'
]

txt = ox.cache.read_url('http://unicode.org/Public/UNIDATA/NamesList.txt', unicode=True)
lines = txt.split('\n')
length = len(lines)
chars = {}
sections = []
types = []
for i, line in enumerate(lines):
    results = re.compile('^@@\t[0-9A-Z]{4}\t(.+)\t[0-9A-Z]{4}').findall(line)
    if results:
        # section
        section = results[0].upper()
        sections.append(section)
    else:
        results = re.compile('^@\t\t(.+)').findall(line)
        if results:
            # type
            type = results[0].upper()
            types.append(type)
        else:
            results = re.compile('^([0-9A-Z]{4})\t(.+)').findall(line)
            if results:
                # char + name
                char = unichr(int(results[0][0], 16))
                name = results[0][1]
                chars[char] = {
                    'names': [] if name[0] == '<' else [name],
                    'section': section,
                    'type': type
                }
                if char == '\uFFFF':
                    break
            else:
                results = re.compile('^\t= (.+)').findall(line)
                if results:
                    # name
                    for name in results[0].upper().split(', '):
                        chars[char]['names'].append(name)
        
html = ox.cache.readUrlUnicode('http://unicode.org/charts/uca/chart_Latin.html')
results = re.compile("title='(.+):.+<tt>([0-9A-Z]{4})</tt>").findall(html)
no_ascii = []
for result in results:
    code = result[1]
    if int(code, 16) > 127:
        char = unichr(int(code, 16))
        name = result[0]
        words = name.split(' ')
        ascii = ''
        for key in special_keys:
            if name == key or name.endswith(' ' + key):
                ascii = special[key]
                break
        if not ascii:
            for unit in units:
                if words[-1] == unit.upper():
                    ascii = unit
                    break;
            if not ascii:
                name = re.sub(' WITH .+', '', name)
                for word in remove:
                    name = re.sub(' ' + word, '', name)
                words = name.split(' ')
                if len(words[-1]) <= 2:
                    ascii = words[-1]
                else:
                    no_ascii.append(name)
        if ascii:
            if 'SMALL' in words and not 'CAPITAL' in words:
                ascii = ascii.lower()
            chars[char]['ascii'] = ascii

f = open('../../source/Ox.Unicode/json/Ox.Unicode.json', 'w')
f.write(json.dumps(chars, indent=4, sort_keys=True))
f.close()

f = open('json/no_ascii.json', 'w')
f.write(json.dumps(sorted(no_ascii), indent=4))
f.close()
