'use strict';

/*@
Ox.GarbageCollection <f> GarbageCollection
    () -> <o> run garbage collection
    debug() -> {} output debug information
@*/

Ox.GarbageCollection = (function() {

    var that = {},
        timeout;

    that.collect = function() {
        var len = Ox.len(Ox.$elements);
        Object.keys(Ox.$elements).forEach(function(id) {
            var $element = Ox.$elements[id];
            if ($element && Ox.isUndefined($element.data('oxid'))) {
                $element.remove();
                delete Ox.$elements[id];
            }
        });
        timeout && clearTimeout(timeout);
        timeout = setTimeout(that.collect, 60000);
        Ox.Log('GC', len, '-->', Ox.len(Ox.$elements));
    };

    /*@
    debug <f> debug info
        () -> <s>
    @*/
    that.debug = function() {
        var classNames = {}, sorted = [];
        Ox.forEach(Ox.$elements, function($element, id) {
            var className = $element[0].className;
            classNames[className] = (classNames[className] || 0) + 1;
        });
        Ox.forEach(classNames, function(count, className) {
            sorted.push({className: className, count: count});
        });
        return sorted.sort(function(a, b) {
            return a.count - b.count;
        }).map(function(v) {
            return v.count + ' ' + v.className
        }).join('\n');
    };

    setTimeout(that.collect, 60000);

    return that;

}());
