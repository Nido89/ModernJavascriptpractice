'use strict';

/*@
Ox.FormItem <f> FormItem Element, wraps form element with an error message
    options <o> Options object
        element <o|null> element
        error <s> error message
    self <o>    Shared private variable
    ([options[, self]]) -> <o:Ox.Element> FormItem Element
@*/

Ox.FormItem = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
            .defaults({
                element: null,
                error: ''
            })
            .options(options || {})
            .addClass('OxFormItem');

    self.description = self.options.element.options('description');
    if (self.description) {
        $('<div>')
            .addClass('OxFormDescription OxSelectable')
            .html(self.description)
            .appendTo(that);
    }
    that.append(self.options.element);
    self.$message = Ox.Element()
        .addClass('OxFormMessage OxSelectable')
        .appendTo(that);

    /*@
    setMessage <f> set message
        (message) -> <u> set message
    @*/
    that.setMessage = function(message) {
        self.$message.html(message)[message !== '' ? 'show' : 'hide']();
    };

    /*@
    value <f> get value
        () -> <s> get value of wrapped element
    @*/
    that.value = function() {
        return self.options.element.value();
    };

    return that;

};
