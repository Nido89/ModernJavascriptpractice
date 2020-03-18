# -*- coding: utf-8 -*-

import codecs
import json
import os
import ox
import re
import sys
import urllib

CACHE = sys.argv[-1] == '-cache'

try:
    DATA = ox.jsonc.loads(ox.file.read_file('../jsonc/countries.jsonc'))
except:
    print 'parse error, see jsonc/debug.json'
    ox.file.write_file('../jsonc/debug.json', ox.js.minify(ox.file.read_file('../jsonc/countries.jsonc')))
    sys.exit()

GEO = {}
for country in json.loads(ox.file.read_file('../../../source/Ox.Geo/json/Ox.Geo.json')):
    GEO[country['code']] = {}
    for key in ['area', 'lat', 'lng', 'south', 'west', 'north', 'east']:
        GEO[country['code']][key] = country[key]

LOGS = {}

def decode_wikipedia_id(id):
    id = id.replace('_', ' ').encode('utf8')
    return urllib.unquote(id).decode('utf8')

def encode_wikipedia_id(id):
    # try:
    #     id = id.encode('utf8')
    # except:
    #     pass
    # return urllib2.quote(id.replace(' ', '_').encode('utf8'))
    return id.replace(' ', '_').encode('utf8')

def get_countries():
    def exclude(country):
        return country['name'] in ['Federation of Bosnia and Herzegovina', 'Republika Srpska']
    def exists(country):
        for c in countries:
            if c['name'] == country['name']:
                return True
        return False
    def fix(html):
        html = html.split('The following alpha-2 codes were previously exceptionally reserved')[0]
        for key, value in DATA['wikipedia_url'].iteritems():
            html = html.replace(encode_wikipedia_id(key), encode_wikipedia_id(value))
        return re.sub('<span style="display:none" class="sortkey">[\w\s]+ !</span><span class="sorttext">', '', html)
    def parse(match):
        country = {}
        is_tuple = type(match) == tuple
        name = decode_wikipedia_id(match[1] if is_tuple else match)
        if is_tuple:
            country['code'] = match[0]
        if name in DATA['name']:
            country['name'] = DATA['name'][name]
            country['wikipediaName'] = name
        else:
            country['name'] = name
        return country
    def sort(country):
        return country['code'] if 'code' in country else u'ZZ ' + country['name']
    countries = map(lambda x: parse(x), DATA['wikipedia'])
    # ISO 3166-3
    html = read_wikipedia_url('ISO 3166-3').replace('Rhodesia', 'Southern Rhodesia') # FIXME: can this be avoided?
    matches = re.compile('<td id="([A-Z]{4})">.*?<a href="/wiki/(.*?)".*?>', re.DOTALL).findall(html)
    countries += map(lambda x: parse(x), matches)
    # ISO 3166-1 alpha-2
    html = fix(read_wikipedia_url('ISO 3166-1 alpha-2'))
    matches = re.compile('<tt>([A-Z]{2})</tt></td>\n<td><a href="/wiki/(.*?)"', re.DOTALL).findall(html)
    countries += filter(lambda x: not exists(x), map(lambda x: parse(x), matches))
    # List of sovereign states
    html = read_wikipedia_url('List of sovereign states')
    matches = re.compile('>&#160;</span><a href="/wiki/(.*?)"', re.DOTALL).findall(html)
    countries += filter(lambda x: not exists(x) and not exclude(x), map(lambda x: parse(x), matches))
    '''
    for year in range(1970, 2020, 10):
        html = read_wikipedia_url('List of sovereign states in the %ds' % year)
        matches = re.compile('class="thumbborder" />.*?</span> ?<a href="/wiki/(.*?)"', re.DOTALL).findall(html)
        print year, '-' * 64
        for x in map(lambda x: x['name'], filter(lambda x: not exists(x), map(lambda x: parse(x), matches))):
            print x
    sys.exit()
    '''
    # Country data
    countries = sorted(countries, key=sort)
    countries = map(lambda x: get_country_data(x), countries)
    # Independence
    for i, country in enumerate(countries):
        if 'created' in country and not 'dependency' in country:
            name = country['created']['country'][0]
            data = filter(lambda x: x['name'] == name, countries)[0]
            if 'dependency' in data:
                countries[i]['independence'] = {
                    'country': data['dependency'],
                    'date': country['created']['date']
                }
    # Flags
    countries = sorted(countries, key=sort)
    flags = get_flags(countries)
    return countries

def get_country_data(country):
    name = country['name']
    html = read_wikipedia_url(country['wikipediaName'] if 'wikipediaName' in country else name)
    # code
    if name in DATA['code']:
        country['code'] = DATA['code'][name]
    elif not 'code' in country:
        match = re.search('"/wiki/ISO_3166-2:(\w{2})"', html)
        if not match:
            match = re.search('"/wiki/\.(\w{2})"', html)
        if match:
            country['code'] = match.group(1).upper()
    # continents and regions
    for continent, regions in DATA['continents'].iteritems():
        for region, countries in regions.iteritems():
            if name in countries:
                country['continent'] = continent
                country['region'] = region
                break
    # created
    if name in DATA['created']:
        country['created'] = DATA['created'][name]
    # dependencies
    for c, d in DATA['dependencies'].iteritems():
        c = c.split('; ')
        if name in c:
            country['dependencies'] = d if not 'dependencies' in country else country['dependencies'] + d
        elif name in d:
            country['dependency'] = c if not 'dependency' in country else country['dependency'] + c
    # disputes
    for c, d in DATA['disputes'].iteritems():
        c = c.split('; ')
        if name in c:
            country['disputes'] = d if not 'disputes' in country else country['disputes'] + d
        elif name in d:
            country['disputed'] = c if not 'disputed' in country else country['disputed'] + c
    # dissolved
    if name in DATA['dissolved']:
        country['dissolved'] = DATA['dissolved'][name]             
    # exception
    if country['code'] in DATA['exception']:
        country['exception'] = True
    # flag
    if name in DATA['flag']:
        file = DATA['flag'][name] if DATA['flag'][name][-4:] == '.png' else DATA['flag'][name] + '.svg'
        country['flagURL'] = get_flag('File:' + file)
    else:
        match = re.search('width:58%; vertical-align:middle;?"( align="center")?><a href="/w/index\.php\?title=(File:.*?)(&amp;page=1)?"', html)
        if not match:
            match = re.search('"/w/index\.php\?title=(File:Flag_.*?\.svg)(&amp;page=1)?"', html)
        if match:
            country['flagURL'] = get_flag(match.group(len(match.groups()) - 1))
    # google
    if name in DATA['google']:
        country['googleName'] = DATA['google'][name]
    # imdb
    if name in DATA['imdb']:
        country['imdbName'] = DATA['imdb'][name]
    # independence
    if name in DATA['independence']:
        country['independence'] = DATA['independence'][name]
    # languages
    for language, c in DATA['languages'].iteritems():
        if c == name:
            if not 'languages' in country:
                country['languages'] = [language]
            else:
                country['languages'].append(language)
    # area, lat, lng, south, west, north, east
    if country['code'] in GEO:
        for key in GEO[country['code']]:
            country[key] = GEO[country['code']][key]
    return country

def get_flag(id):
    html = read_wikipedia_url(id)
    match = re.search('<div class="fullImageLink" id="file"><a href="(.*?)"', html)
    return 'http:' + match.group(1)

def get_flags(countries):
    def sort(country):
        index = 1 if 'dependency' in country or 'dissolved' in country else 0
        if country['name'] in DATA['flag_link']:
            index = 2
        return index
    flags = {}
    flag_countries = {}
    for country in sorted(countries, key=lambda x: sort(x)):
        if 'flagURL' in country: # account for errors
            extension = country['flagURL'][-3:]
            file = '../%s/flags/%s.%s' % (extension, country['code'], extension)
            if not country['flagURL'] in flag_countries:
                flag_countries[country['flagURL']] = country['code']
                img = read_url(country['flagURL'])
                if not os.path.exists(file) or ox.file.read_file(file) != img:
                    ox.file.write_path(file)
                    ox.file.write_file(file, img)
            else:
                flags[country['code']] = flag_countries[country['flagURL']]
                if not os.path.lexists(file):
                    ox.file.write_link(flags[country['code']] + '.' + extension, file)
                file = file.replace('/flags/', '/icons/')
                if not os.path.lexists(file):
                    ox.file.write_link(flags[country['code']] + '.' + extension, file)
                for size in [4096, 1024, 256, 64, 16]:
                    file = '../png/icons/%d/%s.png' % (size, country['code'])
                    if not os.path.lexists(file):
                        ox.file.write_path(file)
                        ox.file.write_link(flags[country['code']] + '.png', file)
    return flags

def get_imdb_countries(countries):
    def decode(match):
        return unichr(int(match.group(0)[3:-1], 16))
    LOGS['new countries'] = []
    imdb_countries = DATA['imdb']
    html = read_url('http://www.imdb.com/country/')
    matches = re.compile('<a href="/country/(.*?)">(.*?)\n</a>').findall(html)
    for match in matches:
        code = match[0].upper()
        name = re.sub('&#x(.{2});', decode, match[1])
        new = True
        for country in countries:
            if name == country['name'] or ('imdbName' in country and name == country['imdbName']):
                new = False
            if code == country['code']:
                new = False
                if name != country['name']:
                    imdb_countries[country['name']] = name
                    if not 'imdbName' in country or name != country['imdbName']:
                        LOGS['new countries'].append(name)
            if not new:
                break
        if new:
            print 'new', match
            LOGS['new countries'].append(name)
    ox.file.write_json('../json/imdbCountries.json', imdb_countries, indent=4, sort_keys=True)

def get_imdb_languages():
    def decode(match):
        return unichr(int(match.group(0)[3:-1], 16))
    LOGS['new languages'] = []
    imdb_languages = {}
    html = read_url('http://www.imdb.com/language/')
    matches = re.compile('<a href="/language/.*?">(.*?)</a>').findall(html)
    for match in matches:
        language = re.sub('&#x(.{2});', decode, match)
        language = re.sub('( languages| Sign Language)$', '', language)
        imdb_languages[language] = ''
        if not language in DATA['languages']:
            LOGS['new languages'].append(language)
    ox.file.write_json('../json/imdbLanguages.json', imdb_languages, indent=4, sort_keys=True)

def parse_txt():
    data = {
        'created': {},
        'dissolved': {},
        'independence': {}
    }
    f = codecs.open('../txt/countries.txt', 'r', 'utf-8')
    lines = map(lambda x: x.strip(), f.readlines())
    f.close()
    for line in filter(lambda x: x[0] != '#', lines):
        date, country_a, operator, country_b = re.compile(
            '([\d\-]+) +(.+) ([\*=\+\-><]) (.+)'
        ).match(line).groups()
        countries_a = country_a.split(' / ')
        countries_b = country_b.split(' / ')
        if operator == '*':
            data['independence'][country_b] = {
                'country': countries_a,
                'date': date
            }
        elif operator == '=':
            data['dissolved'][country_a] = {
                'country': countries_b,
                'date': date,
                'dissolved': 'renamed'
            }
            data['created'][country_b] = {
                'country': countries_a,
                'date': date,
                'created': 'renamed'
            }
        elif operator == '+':
            for country in countries_a:
                data['dissolved'][country] = {
                    'country': countries_b,
                    'date': date,
                    'dissolved': 'joined'
                }
        elif operator == '-':
            for country in countries_b:
                data['created'][country] = {
                    'country': countries_a,
                    'date': date,
                    'created': 'split'
                }
        elif operator == '>':
            for country in countries_a:
                data['dissolved'][country] = {
                    'country': countries_b,
                    'date': date,
                    'dissolved': 'merged'
                }
            data['created'][country_b] = {
                'country': countries_a,
                'date': date,
                'created': 'merged'
            }
        elif operator == '<':
            data['dissolved'][country_a] = {
                'country': countries_b,
                'date': date,
                'dissolved': 'split'
            }
            for country in countries_b:
                data['created'][country] = {
                    'country': countries_a,
                    'date': date,
                    'created': 'merged'
                }
    return data

def read_url(url):
    print 'reading', url
    return ox.cache.read_url(url) if CACHE else ox.net.read_url(url)

def read_wikipedia_url(id):
    url = 'http://en.wikipedia.org/wiki/' + encode_wikipedia_id(id)
    html = read_url(url)
    try:
        html = unicode(html, 'utf8')
    except:
        html = unicode(html, 'iso-8859-1')
    return html

if __name__ == '__main__':
    data = parse_txt()
    DATA['created'] = data['created']
    DATA['dissolved'] = data['dissolved']
    DATA['independence'] = data['independence']
    countries = get_countries()
    ox.file.write_json('../json/countries.json', countries, indent=4, sort_keys=True)
    LOGS['total'] = len(countries)
    for key in ['code', 'continent', 'flagURL']:
        LOGS['no ' + key] = map(lambda x: x['name'], filter(lambda x: not key in x, countries))
    LOGS['current independent'] = 0
    LOGS['current dependent'] = 0
    LOGS['current disputed'] = 0
    LOGS['current exception'] = 0
    LOGS['dissolved independent'] = 0
    LOGS['dissolved dependent'] = 0
    LOGS['dissolved disputed'] = 0
    LOGS['dissolved exception'] = 0
    for country in countries:
        key = ' '.join([
            'dissolved' if 'dissolved' in country else 'current',
            'exception' if 'exception' in country else (
                'disputed' if 'disputed' in country else (
                    'dependent' if 'dependency' in country else 'independent'
                )
            )
        ])
        LOGS[key] += 1
    get_imdb_countries(countries)
    get_imdb_languages()
    print json.dumps(LOGS, indent=4, sort_keys=True)
    
    
