'use strict';

/*@
Ox.Form <f> Form Object
    options <o> Options object
        error  <s> error
        id     <s> id
        items  <a|[]> []
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.Element> Form Object
        change <!> change
        validate <!> validate
        submit <!> submit
@*/

Ox.Form = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
            .defaults({
                error: '',
                id: '',
                items: [],
                validate: function(valid) {
                    return Ox.every(valid);
                }
            })
            .options(options || {})
            .addClass('OxForm');

    Ox.extend(self, {
        $items: [],
        $messages: [],
        itemIds: [],
        itemIsValid: []
    });

    self.options.items.forEach(function(item, i) {
        validateItem(i, function(valid) {
            self.itemIsValid[i] = valid;
        });
        self.itemIds[i] = item.options('id') || item.id;
        self.$items[i] = Ox.FormItem({element: item}).appendTo(that);
        item.bindEvent({
            autovalidate: function(data) {
                validateForm(i, data.valid);
                data.valid && self.$items[i].setMessage('');
            },
            /*
            // fixme: should't inputs also trigger a change event?
            blur: function(data) {
                that.triggerEvent('change', {
                    id: self.itemIds[i],
                    data: data
                });
            },
            */
            change: function(data) {
                // fixme: shouldn't this be key/value instead of id/data?
                that.triggerEvent('change', {
                    id: self.itemIds[i],
                    data: data
                });
                validateItem(i, function(valid) {
                    validateForm(i, valid);
                });
            },
            submit: function(data) {
                self.formIsValid && that.submit();
            },
            validate: function(data) {
                validateForm(i, data.valid);
                // timeout needed for cases where the form is removed
                // from the DOM, triggering blur of an empty item -
                // in this case, we don't want the message to appear
                setTimeout(function() {
                    self.$items[i].setMessage(data.valid ? '' : data.message);
                }, 0);
            }
        });
    });

    self.formIsValid = self.options.validate(self.itemIsValid);

    function getItemIndexById(id) {
        return self.itemIds.indexOf(id);
    }

    function validateForm(pos, valid) {
        self.itemIsValid[pos] = valid;
        if (self.options.validate(self.itemIsValid) != self.formIsValid) {
            self.formIsValid = !self.formIsValid;
            that.triggerEvent('validate', {
                valid: self.formIsValid
            });
        }
    }

    function validateItem(pos, callback) {
        var item = self.options.items[pos],
            validate = item.options('validate');
        if (validate) {
            validate(item.value(), function(data) {
                callback(data.valid);
            });
        } else {
            callback(item.value && !Ox.isEmpty(item.value));
        }
    }

    /*@
    addItem <f> addItem
        (pos, item) -> <u> add item at position
    @*/
    that.addItem = function(pos, item) {
        Ox.Log('Form', 'addItem', pos)
        self.options.items.splice(pos, 0, item);
        self.$items.splice(pos, 0, Ox.FormItem({element: item}));
        pos == 0 ?
            self.$items[pos].insertBefore(self.$items[0]) :
            self.$items[pos].insertAfter(self.$items[pos - 1]);
    }

    /*@
    removeItem <f> removeItem
        (pos) -> <u> remove item from position
    @*/
    that.removeItem = function(pos) {
        Ox.Log('Form', 'removeItem', pos);
        self.$items[pos].remove();
        self.options.items.splice(pos, 1);
        self.$items.splice(pos, 1);
    }

    that.setMessages = function(messages) {
        Ox.forEach(messages, function(v) {
            self.$items[getItemIndexById(v.id)].setMessage(v.message);
        });
    };    

    /*@
    submit <f> submit
    @*/
    that.submit = function() {
        that.triggerEvent('submit', {values: that.values()});
    };

    /*@
    valid <f> valid
    @*/
    that.valid = function() {
        return self.formIsValid;
    };

    /*@
    values <f> values
    @*/
    that.values = function() {
        // FIXME: this should accept a single string argument to get a single value
        /*
            get/set form values
            call without arguments to get current form values
            pass values as array to set values (not implemented)
        */
        var values = {};
        if (arguments.length == 0) {
            self.$items.forEach(function($item, i) {
                values[self.itemIds[i]] = self.$items[i].value();
            });
            //Ox.Log('Form', 'VALUES', values)
            return values;
        } else {
            Ox.Log('Form', 'SET FORM VALUES', arguments[0])
            Ox.forEach(arguments[0], function(value, key) {
                var index = getItemIndexById(key);
                index > -1 && self.options.items[index].value(value);
            });
            return that;
        }
    };

    return that;

};
