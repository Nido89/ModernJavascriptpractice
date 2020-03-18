#!/usr/bin/env python3
# -*- coding: utf-8 -*-
#vim: et:ts=4:sw=4:sts=4

import datetime
import json
import os
import re
import shutil
import subprocess
import sys
import tarfile
import time

import ox


def get_version():
    if os.path.exists('../../.git'):
        revision = subprocess.Popen(
            ['git', 'rev-list', 'HEAD', '--count'], stdout=subprocess.PIPE
        ).communicate()[0].strip().decode('utf-8')
        revision = int(revision) - 94
    else:
        revision = 'x+' + datetime.datetime.now().strftime('%Y%m%d%H%M')
    return '0.1.%s' % revision

def build_oxjs(downloads=False, geo=False):

    base_path = os.path.dirname(__file__)
    if base_path:
        os.chdir(base_path)

    root_path = '../../'
    source_path = root_path + 'source/'
    dev_path = root_path + 'dev.tmp/'
    min_path = root_path + 'min.tmp/'

    locales = {}
    version = get_version()
    year = time.strftime('%Y', time.gmtime())
    comment = ' OxJS %s (c) %s 0x2620, dual-licensed GPL/MIT, see https://oxjs.org for details ' % (version, year)

    # Empty dev and min
    for path in [dev_path, min_path]:
        if os.path.exists(path):
            for item in os.listdir(path):
                full_path = '%s%s' % (path, item)
                if os.path.isdir(full_path):
                    if not (geo is False and item == 'Geo'):
                        shutil.rmtree(full_path)
                else:
                    os.remove(full_path)

    # Ox.UI Theme Data
    theme_data = {}
    themes = [dirname for dirname in os.listdir(source_path + 'UI/themes/') if not dirname[0] in '._']
    for theme in themes:
        theme_data[theme] = read_jsonc(source_path + 'UI/themes/%s/json/theme.jsonc' % theme)
        theme_data[theme]['themeClass'] = 'OxTheme' + theme[0].upper() + theme[1:]

    # Ox.UI CSS
    css = read_text(source_path + 'UI/css/UI.css')
    css = css.replace('$import', '\n'.join([
        '@import url("../themes/%s/css/theme.css?%s");' % (theme, version) for theme in themes
    ]))
    write_file('%sUI/css/UI.css' % dev_path, css)
    write_file('%sUI/css/UI.css' % min_path, css)

    # Ox.UI Theme CSS
    css = read_text(source_path + 'UI/css/theme.css')
    for theme in themes:
        theme_css = parse_css(css, theme_data[theme])
        theme_css = theme_css.replace('.png)', '.png?%s)' % version)
        write_file('%sUI/themes/%s/css/theme.css' % (dev_path, theme), theme_css)
        write_file('%sUI/themes/%s/css/theme.css' % (min_path, theme), theme_css)

    # Ox.UI SVGs
    ui_images = {}
    path = source_path + 'UI/svg/'
    for filename in [filename for filename in os.listdir(path) if not filename[0] in '._']:
        svg = read_text(path + filename)
        svg = re.sub('\n\s*', '', svg)
        svg = re.sub('<!--.+?-->', '', svg)
        # temporary fix for Chrome SVG bug, remove later!
        svg = re.sub('width="256" height="256"', 'width="10" height="10" viewBox="0 0 255 255"', svg)
        # end fix
        ui_images[filename[:-4]] = svg
        if filename.startswith('symbolLoading'):
            for theme in themes:
                theme_svg = re.sub('#808080', format_hex(theme_data[theme]['symbolDefaultColor']), svg)
                write_file('%sUI/themes/%s/svg/%s' % (dev_path, theme, filename), theme_svg)
                write_file('%sUI/themes/%s/svg/%s' % (min_path, theme, filename), theme_svg)

    # copy & link
    ui_files = {'dev': [], 'min': []}
    for path, dirnames, filenames in os.walk(source_path):
        for filename in filenames:
            if '_' not in path and filename[0] not in '._' \
                    and not filename.endswith('~') \
                    and not filename.endswith('.css') \
                    and '/UI/svg' not in path \
                    and (geo or '/Geo/' not in path):
                # write copies in min path
                source = os.path.join(path, filename)
                is_jquery = re.search('^jquery-[\d\.]+\.js$', filename)
                is_jquery_min = re.search('^jquery-[\d\.]+\.min\.js$', filename)
                is_jquery_plugin = re.search('^jquery\..*?\.js$', filename)
                is_jsonc = re.search('\.jsonc$', filename)
                if is_jquery or is_jquery_min:
                    target = os.path.join(path.replace(source_path, min_path), 'jquery.js')
                else:
                    target = os.path.join(path.replace(source_path, min_path), filename)
                    if is_jquery_plugin:
                        ui_files['dev'].append(target.replace(min_path, ''))
                        ui_files['min'].append(target.replace(min_path, ''))
                if '/Ox/js/' not in source and '/UI/js/' not in source and not is_jquery:
                    if re.match('^Ox\..+\.js$', filename) or is_jsonc:
                        js = read_text(source)
                        print('minifiy and write', filename, target)
                        write_file(target, ox.js.minify(js, '' if is_jsonc else comment))
                    else:
                        copy_file(source, target)
                # write links in dev path
                parts = os.path.join(path.replace(source_path, ''), filename).split('/')
                for i, part in enumerate(parts):
                    if i < len(parts) - 1:
                        parts[i] = '..'
                link_source = '/'.join(parts).replace(filename, os.path.join(path, filename))[3:]
                link_target = target.replace(min_path, dev_path)
                if not is_jquery_min:
                    write_link(link_source, link_target)
                # locales
                match = re.search('/(\w+)/json/locale.(\w+).json', source)
                if match:
                    module = match.group(1)
                    locale = match.group(2)
                    if module not in locales:
                        locales[module] = []
                    locales[module].append(locale)
    # remove dangling links from dev tree that might
    # be left over from renamed or removed files
    for path, dirnames, filenames in os.walk(dev_path):
        for f in filenames:
            f = os.path.join(path, f)
            if os.path.islink(f) and not os.path.exists(f):
                os.unlink(f)
    # Ox.js
    filenames = [
        [
            'Core.js'  # has to run first so that Ox is defined
        ],
        [
            'Function.js',  # getSortValue (Array.js) depends on Ox.cache
            'Polyfill.js'   # FIXME: not clear if needed here
        ],
        [
            'Array.js',   # Ox.slice (Collection.js) depends on Ox.toArray, salt (HTML.js) depends on Ox.range
            'String.js',  # salt (HTML.js) depends on Ox.char
            'Type.js'     # Ox.typeOf needed in Collection.js FF3.6 for Ox.slice fallback
        ],
        [
            'Collection.js',  # Ox.PATH (Constants.js) depends on Ox.slice
            'Math.js'         # Ox.MAX_LATITUDE (Constants.js) depends on Ox.sinh
        ]
    ]
    js = ''
    js_dir = 'Ox/js/'
    ox_files = []
    for group in filenames:
        ox_files.append([])
        for filename in group:
            ox_files[-1].append(js_dir + filename)
    ox_files.append([])
    filenames = sum(filenames, [])  # flatten
    for filename in sorted(os.listdir(source_path + js_dir)):
        if filename not in filenames \
                and not filename.startswith('.') \
                and not filename.startswith('_') \
                and not filename.endswith('~'):
            filenames.append(filename)
    for filename in filenames:
        js += read_text(source_path + js_dir + filename) + '\n'
        if not js_dir + filename in sum(ox_files, []):
            ox_files[-1].append(js_dir + filename)
    js = re.sub(
        'Ox.LOCALES = \{\}',
        'Ox.LOCALES = ' + json.dumps(locales, indent=4, sort_keys=True),
        js
    )
    js = re.sub(
        "Ox.VERSION = '([\d\.]+)'",
        "Ox.VERSION = '%s'" % version,
        js
    )
    write_file(dev_path + '/Ox/json/' + 'Ox.json', json.dumps({
        'files': ox_files,
        'locales': locales,
        'version': version
    }, indent=4, sort_keys=True))
    write_file(min_path + 'Ox.js', ox.js.minify(js, comment))

    # Ox.UI
    js = ''
    root = source_path + 'UI/'
    for path, dirnames, filenames in os.walk(root):
        for filename in sorted(filenames):
            # jquery gets included by Ox.UI loader
            # locale json files are loaded lazily
            # Ox.UI.css imports all other css files
            # svgs are loaded as URLs or dataURLs
            # Ox.UI PNGs are loaded on demand
            if path != root and '_' not in path and filename[0] not in '._' \
                    and not filename.endswith('~') \
                    and 'jquery' not in filename \
                    and 'locale' not in filename \
                    and not filename.endswith('theme.css') \
                    and not filename.endswith('.svg') \
                    and 'UI/png' not in path:
                ui_files['dev'].append(os.path.join(path.replace(source_path, ''), filename))
                if '/js/' not in path:
                    ui_files['min'].append(os.path.join(path.replace(source_path, ''), filename))
                if filename.endswith('.js'):
                    js += read_text(os.path.join(path, filename)) + '\n'
    filename = min_path + 'UI/js/UI.js'
    write_file(filename, ox.js.minify(js, comment))

    ui_files['min'].append(filename.replace(min_path, ''))
    write_file(min_path + 'UI/json/UI.json', json.dumps({
        'files': sorted(ui_files['min']),
        'images': ui_images
    }, sort_keys=True))
    write_file(dev_path + 'UI/json/UI.json', json.dumps({
        'files': sorted(ui_files['dev']),
        'images': ui_images
    }, indent=4, sort_keys=True))
    ui_files['dev'].append('UI/UI.js')

    # index
    data = {
        # sum(list, []) is flatten
        'documentation': sorted(sum(ox_files, [])) + sorted(list(filter(
            lambda x: re.search('\.js$', x),
            ui_files['dev']
        )) + ['%s/%s.js' % (x, x) for x in ['Geo', 'Image', 'Unicode']]),
        'examples': sorted(sum(map(
            lambda x: list(filter(
                lambda x: not re.search('/[._]', x),
                map(
                    lambda y: x + '/' + y,
                    os.listdir(root_path + 'examples/' + x)
                )
            )),
            list(filter(
                lambda x: not re.search('^[._]', x),
                os.listdir(root_path + 'examples/')
            ))
        ), [])) if os.path.exists(root_path + 'examples/') else (),
        'readme': list(map(
            lambda x: {
                'date': time.strftime(
                    '%Y-%m-%dT%H:%M:%SZ',
                    time.gmtime(os.path.getmtime(root_path + 'readme/' + x))
                ),
                'id': x.split('.')[0],
                'title': get_title(root_path + 'readme/' + x)
            },
            filter(
                lambda x: not re.search('^[._]', x) and re.search('\.html$', x),
                os.listdir(root_path + 'readme/')
            )
        ))
    }
    write_file(root_path + 'index.json', json.dumps(data, indent=4, sort_keys=True))

    # downloads
    if downloads:
        data = {
            'date': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
            'size': {'oxjs': os.path.getsize(min_path + 'Ox.js')},
            'version': version
        }
        download_path = root_path + 'downloads/'
        # source
        source_file = download_path + 'OxJS.%s.source.tar.gz' % version
        data['size']['source'] = write_tarfile(source_file, root_path, 'OxJS', filter_source)
        write_link(source_file.replace(download_path, ''), source_file.replace(version, 'latest'))
        # min
        min_file = download_path + 'OxJS.%s.min.tar.gz' % version
        data['size']['min'] = write_tarfile(min_file, root_path, 'OxJS', filter_min)
        write_link(min_file.replace(download_path, ''), min_file.replace(version, 'latest'))
        # json
        write_file(download_path + 'downloads.json', json.dumps(data, indent=4, sort_keys=True))

    # legacy
    build_path = root_path + 'build/'
    if os.path.exists(build_path) and not os.path.islink(build_path[:-1]):
        shutil.rmtree(build_path)
        write_link('min', build_path[:-1])
    real_dev_path = root_path + 'dev/'
    real_min_path = root_path + 'min/'
    if os.path.exists(real_dev_path):
        shutil.rmtree(real_dev_path)
    shutil.move(dev_path, real_dev_path)
    if os.path.exists(real_min_path):
        shutil.rmtree(real_min_path)
    shutil.move(min_path, real_min_path)


def copy_file(source, target):
    print('copying', source, 'to', target)
    write_file(target, read_file(source))

def filter_min(tarinfo):
    name = tarinfo.name
    if name == 'OxJS' or re.search('^OxJS/min', name):
        return tarinfo
    return None

def filter_source(tarinfo):
    name = tarinfo.name
    if re.search('^[._]', name) or re.search('/[._]', name) or re.search('~$', name):
        return None
    if re.search('^OxJS/downloads', name):
        return None
    if name == 'OxJS/tools/geo/png/icons.png':
        return None
    if re.search('^OxJS/tools/geo/png/icons/', name) and (
        not re.search('4096', name) or not os.path.exists(
            name.replace('OxJS/', '../../').replace('icons/4096', 'flags')
        )
    ):
        return None
    return tarinfo

def format_hex(rgb):
    return '#%s' % ''.join([hex(c)[-2:].replace('x', '0').upper() for c in rgb])

def get_title(file):
    match = re.search('<h1>(.+)</h1>', read_text(file))
    return match.groups()[0] if match else 'Untitled'

def parse_css(css, values):
    def sub(match):
        key = match.group(1)
        index = match.group(2)
        value = values[key] if index is None else values[key][int(index[1:-1])]
        if isinstance(value, str):
            string = value
        else:
            if isinstance(value[0], int):
                value = [value]
            string = ', '.join(
                ['rgb%s(%s)' % (
                    'a' if len(vals) == 4 else '',
                    ', '.join([str(val) for val in vals])
                ) for vals in value]
            )
        return string
    return re.sub('\$(\w+)(\[\d+\])?', sub, css)

def read_file(file):
    print('reading', file)
    f = open(file, 'rb')
    data = f.read()
    f.close()
    return data

def read_text(file):
    return read_file(file).decode('utf-8')

def read_jsonc(file):
    return ox.jsonc.loads(read_text(file))

def write_file(file, data):
    print('writing', file)
    write_path(file)
    if not isinstance(data, bytes):
        data = data.encode('utf-8')
    f = open(file, 'wb')
    f.write(data)
    f.close()
    return len(data)

def write_link(source, target):
    print('linking', source, 'to', target)
    write_path(target)
    # remove files, symlinks *and broken symlinks*
    if os.path.exists(target) or os.path.lexists(target):
        if os.path.isdir(target) and not os.path.islink(target):
            os.rmdir(target)
        else:
            os.unlink(target)
    os.symlink(source, target)

def write_path(file):
    path = os.path.split(file)[0]
    if path and not os.path.exists(path):
        os.makedirs(path)

def write_tarfile(file, path, arcname, filter):
    print('writing', file)
    f = tarfile.open(file, 'w:gz')
    f.add(path, arcname=arcname, filter=filter)
    f.close()
    return os.path.getsize(file)


if __name__ == '__main__':
    build_oxjs(downloads='-downloads' in sys.argv, geo='-nogeo' not in sys.argv)
