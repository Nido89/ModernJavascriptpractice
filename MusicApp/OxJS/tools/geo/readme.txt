To create Ox.Geo/json/Ox.Geo.json and Ox.Geo/png/*
- run python /py/geo.py
  use the -cache option if you don't want to update from wikipedia
- check for new flags and create svg/icons
- run python /py/png.py
  use the -nopng option if you don't want to skip the few flags that only exist as png, not as svg
- open html/geo.html, wait, and save json as json/countries.json
- run python py/fix.py
- save json/countries.json as source/Ox.Geo/json/Ox.Geo.json
- copy png/icons/ to source/Ox.Geo/png/flags/ (16, 64 and 256 is probably enough)