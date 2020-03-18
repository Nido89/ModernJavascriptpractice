'use strict';

Ox.load.Geo = function(options, callback) {

    Ox.getJSON(Ox.PATH + 'Geo/json/Geo.json?' + Ox.VERSION, function(data) {

        //@ Constants

        /*@
        Ox.COUNTRIES <[o]> Array of countries
            A list of independent or de-facto independent countries and
            dependencies since January 1, 1970 (see 
            <a href="http://en.wikipedia.org/wiki/List of sovereign states">Wikipedia</a>),
            including other entities with
            <a href="http://en.wikipedia.org/wiki/ISO 3166-1 alpha-2">ISO 3166-1 alpha-2</a>
            country codes or country status at
            <a href="http://www.imdb.com/country/" target="_blank">IMDb</a> or
            <a href="http://www.fifa.com/worldranking/rankingtable/">FIFA</a>,
            grouped by continents and regions (see
            <a href="http://unstats.un.org/unsd/methods/m49/m49regin.htm">United Nations</a>).
            area <n> Area of the country's bounding box in square meters
            code <s> ISO 3166-1 alpha-2, ISO 3166-2 or ISO 3166-3 country code
            continent <s> The country's continent
            created <o|u> Present if the country was created since 1970
                country <[s]> Preceding country or countries
                created <s> "merged", "renamed" or "split"
                date <s> Date of creation ("YYYY" or "YYYY-MM-DD")
            dependencies <[s]|u> Array of dependencies of the country
            dependency <[s]|u> Array of countries the country is a dependency of
            disputed <[s]|u> Array of countries the country is disputed by
            disputes <[s]|u> Array of countries the country disputes
            dissolved <o|u> Present if the country was dissolved
                country <[s]> Succeeding country or countries
                date <s> Date of dissolution ("YYYY" or "YYYY-MM-DD")
                dissolved <s> "joined", "merged" or "renamed"
            east <n> Longitude of the country's eastern boundary
            exception <b> True for exceptionally reserved ISO 3166-1 alpha-2 codes
                (like "AC", "EU" or "UK")
            flagURL <s> The country's flag (Wikipedia, SVG)
            googleName <s|u> The country's name according to Google Maps
            imdbName <s|u> The country's name according to IMDb
            independence <o|u> Present if the country became independent since 1970
                country <[s]> Former country or countries
                date <s> Date of independence ("YYYY" or "YYYY-MM-DD")
            languages <[s]|u> Array of languages spoken in this country
                To be precise: languages that are spoken in this country more
                than in any other, i.e. each language only appears once. This
                can be used to map languages to flag icons.
            lat <n> Latitude of the center of the country's bounding box
            lng <n> Longitude of the center of the country's bounding box
            name <s> Name of the country
            north <n> Latitude of the country's northern boundary
            region <s> The country's region
            south <n> Latitude of the country's southern boundary
            wikipediaName <s|u> The country's name according to Wikipedia 
            west <n> Longitude of the country's western boundary
            <script>
                Ox.test.array = [
                    // Current independent countries
                    Ox.COUNTRIES.filter(function(c) {
                        return !c.dissolved && !c.dependency && !c.disputed && !c.exception
                    }).length,
                    // Current dependent countries
                    Ox.COUNTRIES.filter(function(c) {
                        return !c.dissolved && c.dependency && !c.exception
                    }).length,
                    // Current disputed countries
                    Ox.COUNTRIES.filter(function(c) {
                        return !c.dissolved && c.disputed && !c.exception
                    }).length,
                    // Current other entities
                    Ox.COUNTRIES.filter(function(c) {
                        return !c.dissolved && c.exception
                    }).length,
                    // Dissolved independent countries
                    Ox.COUNTRIES.filter(function(c) {
                        return c.dissolved && !c.dependency && !c.disputed && !c.exception
                    }).length,
                    // Dissolved dependent countries
                    Ox.COUNTRIES.filter(function(c) {
                        return c.dissolved && c.dependency && !c.exception
                    }).length,
                    // Dissolved disputed countries
                    Ox.COUNTRIES.filter(function(c) {
                        return c.dissolved && c.disputed && !c.exception
                    }).length,
                    // Dissolved other entities
                    Ox.COUNTRIES.filter(function(c) {
                        return c.dissolved && c.exception
                    }).length
                ];
            </script>
            > Ox.COUNTRIES.length
            354
            > Ox.sum(Ox.test.array)
            354
            > Ox.test.array
            [196, 73, 10, 8, 28, 24, 14, 1]
        @*/
        Ox.COUNTRIES = data.countries;
        //@ Ox.LANGUAGES <[o]> Array of ISO 639-1 language codes and names
        Ox.LANGUAGES = data.languages;

        Ox.GEO_COLORS = {

            'North America': [0, 0, 255],
            'Northern America': [0, 0, 255],

            'South America': [0, 255, 0],
            'Southern America': [0, 255, 0],
            'Caribbean': [192, 255, 192],
            'Central America': [0, 128, 0],

            'Europe': [255, 255, 0],
            'Western Europe': [255, 255, 0],
            'Northern Europe': [255, 255, 192],
            'Southern Europe': [128, 128, 0],
            'Eastern Europe': [255, 192, 0],

            'Africa': [255, 0, 255],
            'Northern Africa': [255, 0, 255],
            'Southern Africa': [255, 128, 255],
            'Middle Africa': [128, 0, 128],
            'Western Africa': [128, 0, 255],
            'Eastern Africa': [255, 0, 128],

            'Asia': [255, 0, 0],
            'Eastern Asia': [255, 0, 0],
            'South-Eastern Asia': [255, 128, 128],
            'Southern Asia': [128, 0, 0],
            'Western Asia': [255, 128, 0],
            'Central Asia': [128, 64, 0],

            'Oceania': [0, 255, 255],
            'Australia and New Zealand': [0, 255, 255],
            'Micronesia': [192, 255, 255],
            'Melanesia': [0, 128, 128],
            'Polynesia': [128, 128, 255],

            'Antarctica': [128, 128, 128]

        };

        //@ Functions

        /*@
        Ox.getCountryByCode <f> Returns a country object for a given country code
            (code) -> <o> Country object
            code <s> ISO 3166 country code
            > Ox.getCountryByCode('US').name
            'United States'
        @*/
        Ox.getCountryByCode = Ox.getCountryByCountryCode = function(code) {
            var country;
            code = code.toUpperCase();
            Ox.forEach(Ox.COUNTRIES, function(c) {
                if (c.code == code) {
                    country = c;
                    return false; // break
                }
            });
            return country;
        };

        /*@
        Ox.getCountryByGeoname <f> Returns a country object for a given geoname
            (name) -> <o> Country object
            name <s> Geoname
            > Ox.getCountryByGeoname('Los Angeles, California, United States').code
            'US'
            > Ox.getCountryByGeoname('The Bottom, Saba, Bonaire, Sint Eustatius and Saba').code
            'BQ'
        @*/
        Ox.getCountryByGeoname = function(geoname) {
            // fixme: UAE correction doesn't belong here, fix in map
            geoname = (geoname || '').replace(' - United Arab Emirates', ', United Arab Emirates')
            return Ox.getCountryByName(Ox.splitGeoname(geoname).pop());
        };

        /*@
        Ox.getCountryByName <f> Returns a country object for a given country name
            (name) -> <o> Country object
            name <s> Country name
            > Ox.getCountryByName('United States').code
            'US'
            > Ox.getCountryByName('USA').code
            'US'
        @*/
        Ox.getCountryByName = function(name) {
            var country;
            Ox.forEach(Ox.COUNTRIES, function(c) {
                if (name == c.name || name == c.googleName || name == c.imdbName) {
                    country = c;
                    return false; // break
                }
            });
            return country;
        };

        /*@
        Ox.getFlagByCountryCode <f> Returns an image URL for a given country code
            (code[, size]) -> <s> Image URL
            code <s> Country code (like 'FR')
            size <n> Image size (16, 64 or 256)
        @*/
        Ox.getFlagByCountryCode = function(code, size) {
            var country = Ox.getCountryByCode(code);
            code = country ? country.code : 'NTHH';
            size = size || 16;
            return Ox.PATH + 'Geo/png/flags/' + size + '/' + code + '.png';
        };

        /*@
        Ox.getFlagByGeoname <f> Returns an image URL for a given geoname
            (geoname[, size]) -> <s> Image URL
            geoname <s> Geoname (like 'France' or 'Paris, France')
            size <n> Image size (16, 64 or 256)
        @*/
        Ox.getFlagByGeoname = function(geoname, size) {
            var country = Ox.getCountryByGeoname(geoname),
                code = country ? country.code : 'NTHH';
            size = size || 16;
            return Ox.PATH + 'Geo/png/flags/' + size + '/' + code + '.png';
        };

        /*@
        Ox.getFlagByLanguage <f> Returns an image URL for a given language
            (language[, size]) -> <s> Image URL
            language <s> Language (like "French")
            size <n> Image size (16, 64 or 256)
        @*/
        Ox.getFlagByLanguage = function(language, size) {
            var country, code;
            language = language.toLowerCase()
                .replace(' languages', '')
                .replace(' sign language', '');
            Ox.COUNTRIES.forEach(function(c) {
                if (c.languages && c.languages.map(function(language) {
                    return language.toLowerCase();
                }).indexOf(language) > -1) {
                    country = c;
                    return false; // break
                }
            });
            code = country ? country.flag || country.code : 'NTHH';
            return Ox.PATH + 'Geo/png/flags/' + size + '/' + code + '.png';
        };

        /*@
        Ox.getGeoColor <f> Returns a color for a continent or region
            (str) -> <a> RGB
            str <s> Continent or region
        @*/
        Ox.getGeoColor = function(str) {
            return Ox.GEO_COLORS[str] || [128, 128, 128];
        };

        /*@
        Ox.getLanguageCodeByName <f> Returns a language code
            (str) -> <s> Two-letter ISO 639-1 language code, or original string
            str <s> Language name
        @*/
        Ox.getLanguageCodeByName = function(str) {
            var language = Ox.getObject(Ox.LANGUAGES, 'name', Ox.toTitleCase(str));
            return language ? language.code : str;
        };

        /*@
        Ox.getLanguageNameByCode <f> Returns a language name
            (str) -> <s> Language name, or original string
            str <s> Two-letter ISO 639-1 language code
        @*/
        Ox.getLanguageNameByCode = function(str) {
            var language = Ox.getObject(Ox.LANGUAGES, 'code', str);
            return language ? language.name : str;
        };

        /*@
        Ox.splitGeoname <f> Splits a geoname into its component parts
            (geoname) -> <[s]> Components
            geoname <s> Geoname
        @*/
        Ox.splitGeoname = function(geoname) {
            var countries = [
                    'Bonaire, Sint Eustatius and Saba',
                    'Saint Helena, Ascension and Tristan da Cunha'
                ],
                split;
            countries.forEach(function(country) {
                if (Ox.endsWith(geoname, country)) {
                    geoname = geoname.replace(country, country.replace(', ', '; '));
                }
            });
            split = geoname.split(', ');
            countries.forEach(function(country) {
                if (Ox.endsWith(Ox.last(split), country.replace(', ', '; '))) {
                    Ox.last(split, country);
                }
            });
            return split;
        };

        /*
        Ox.getScript(
            'https://maps.googleapis.com/maps/api/js?callback=Ox.GoogleMapsCallback&sensor=false',
            function() {
                callback(true);
            }
        );
        */

        callback(true);

    });

}
