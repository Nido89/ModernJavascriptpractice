import Image
import json
import os
import sys

svg_path = '../svg/icons/'
png_path = '../png/icons/4096/'

for file in os.listdir(svg_path):
    svg_file = svg_path + file
    print svg_file
    if svg_file[-4:] == '.svg' and not os.path.islink(svg_file):
        tmp_file = png_path + file + '.png'
        png_file = tmp_file.replace('.svg.png', '.png')
        if True: #not os.path.exists(png_file):
            os.system('qlmanage -t -s 4096 -o ' + png_path + ' ' + svg_file)
            while not os.path.exists(tmp_file):
                pass
            os.rename(tmp_file, png_file)
            image = Image.open(png_file)
            for size in [1024, 256, 64, 16]:
                image = image.resize((size, size), Image.ANTIALIAS)
                image.save(png_file.replace('/4096/', '/%d/' % size))

if sys.argv[-1] != '-nopng':
    for file in os.listdir('../png/flags/'):
        if file[-4:] == '.png':
            country = file[:-4]
            png_file = png_path + country + '.png'
            print png_file
            image = Image.open(png_file)
            # include 4096 to overwrite manually generated image
            for size in [4096, 1024, 256, 64, 16]:
                if size < 4096:
                    image = image.resize((size, size), Image.ANTIALIAS)
                image.save(png_file.replace('/4096/', '/%d/' % size))

image = Image.new('RGB', (1216, 1216))
f = open('../json/countries.json')
countries = json.loads(f.read())
f.close()
for i, country in enumerate(countries):
    file = png_path.replace('/4096/', '/64/') + country['code'] + '.png'
    if os.path.exists(file):
        image.paste(Image.open(file), (i % 19 * 64, int(i / 19) * 64))
image.save('../png/icons.png')