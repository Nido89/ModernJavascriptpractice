/*@
Ox.escapeRegExp <f> Escapes a string for use in a regular expression
    (str) -> <r> Escaped string
    str <s> String
    > Ox.escapeRegExp('foo.com/bar?baz')
    'foo\\.com\\/bar\\?baz'
    > new RegExp(Ox.escapeRegExp('/\\^$*+?.-|(){}[]')).test('/\\^$*+?.-|(){}[]')
    true    
@*/
// see https://developer.mozilla.org/en/JavaScript/Guide/Regular_Expressions
Ox.escapeRegExp = function(string) {
    return (string + '').replace(/([\/\\^$*+?.\-|(){}[\]])/g, '\\$1');
};