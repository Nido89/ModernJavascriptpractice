'use strict';

Ox.load.Unicode = function(options, callback) {

    Ox.getJSON(Ox.PATH + 'Unicode/json/Unicode.json?' + Ox.VERSION, function(chars) {

        //@ Constants

        //@ Ox.UNICODE_CHARACTERS <o> Unicode characters
        Ox.UNICODE_CHARACTERS = chars;

        var byASCII = {}, byName = {}, bySection = [], byType = {};

        Ox.forEach(chars, function(data, char) {
            if (data.ascii) {
                byASCII[data.ascii] = byASCII[data.ascii] || [];
                byASCII[data.ascii].push(char);
            }
            data.names.forEach(function(name) {
                byName[name] = char;
            });
            bySection[data.section] = bySection[data.section] || [];
            bySection[data.section].push(char);
            byType[data.type] = byType[data.type] || [];
            byType[data.type].push(char);
        });

        //@ Functions

        /*@
        Ox.getCharactersByASCII <f> Returns all unicode equivalents of a given ASCII character
            (ascii) -> <[s]> Unicode Characters
            ascii <s> ASCII string
            > Ox.getCharactersByASCII('A').length
            36
        @*/
        Ox.getCharactersByASCII = function(ascii) {
            return byASCII[ascii] || '';
        };

        /*@
        Ox.getCharacterByName <f> Returns a character for a given unicode name
            (name) -> <s> Character
            > Ox.getCharacterByName('Skull and Crossbones')
            '\u2620'
        @*/
        Ox.getCharacterByName = function(name) {
            return byName[name.toUpperCase()] || '';
        };

        /*@
        Ox.getCharactersBySection <f> Returns all characters in a given section
            (section) -> <[s]> Characters
            section <s> Unicode section name
            > Ox.getCharactersBySection('Arabic').length
            252
        @*/
        Ox.getCharactersBySection = function(section) {
            return bySection[section.toUpperCase()] || '';
        };

        /*@
        Ox.getCharactersByType <f> Returns all characters of a given type
            (type) -> <[s]> Characters
            type <s> Unicode character type
            > Ox.getCharactersByType('Uppercase Latin Alphabet').join('')
            'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        @*/
        Ox.getCharactersByType = function(type) {
            return byType[type.toUpperCase()] || '';
        };

        /*@
        Ox.sortASCII <f> Sorts an array of unicode strings
            (arr) -> <[s]> Sorted array
            > Ox.sortASCII(['å', 'b', 'ç', 'd', 'é'])
            ['å', 'b', 'ç', 'd', 'é']
        @*/
        // FIXME: should be Ox.sortUnicode
        Ox.sortASCII = function(arr) {
            return Ox.sort(arr, function(str) {
                return Ox.toASCII(str);
            });
        };

        /*@
        Ox.toASCII <f> Replaces a unicode string with its ASCII equivalent
            (unicode) -> <s> ASCII string
            > Ox.toASCII('Åbçdé')
            'Abcde'
            > Ox.toASCII('\u2162 \u33a6')
            '3 km3'
        @*/
        Ox.toASCII = function(str) {
            return Ox.map(str, function(chr) {
                return chars[chr].ascii || chr; 
            });
        };

        callback(true);

    });

}
