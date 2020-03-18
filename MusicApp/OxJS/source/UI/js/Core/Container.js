'use strict';

// fixme: wouldn't it be better to let the elements be,
// rather then $element, $content, and potentially others,
// 0, 1, 2, etc, so that append would append 0, and appendTo
// would append (length - 1)?
/*@
Ox.Container <f> Container element
    options <o> Options object
    self    <o> Shared private variable
    ([options[, self]]) -> <o:Ox.Element> Container object
@*/
Ox.Container = function(options, self) {
    var that = Ox.Element({}, self)
        .options(options || {})
        .addClass('OxContainer');
    // fixme: we used to pass self _again_ to the content,
    // which obviously makes clicks trigger twice
    // removed for now, but may break something else.
    // (maybe, if needed, content can pass a container event along)
    that.$content = Ox.Element({})
        .options(options || {})
        .addClass('OxContent')
        .appendTo(that);
    return that;
};
