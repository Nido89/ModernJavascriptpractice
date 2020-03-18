import json
import os

base_path = os.path.dirname(__file__)
if base_path:
    os.chdir(base_path)

f = open('../json/countries.json')
data = json.loads(f.read())
f.close()

f = open('../json/countries.json', 'w')
f.write(json.dumps(data, indent=4, sort_keys=True))
f.close()