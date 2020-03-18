'use strict';

/*@
Ox.Focus <o> Basic focus controller
@*/

Ox.Focus = (function() {

    var stack = [],

        that = {
            cleanup: function() {
                stack = stack.filter(function(item) {
                    try {
                        return !!Ox.$elements[item]
                    } catch(e) {
                        return false;
                    }
                });
            },
            debug: function() {
                return stack.map(function(item) {
                    try {
                        return Ox.$elements[item][0];
                    } catch(e) {
                        return item;
                    }
                });
            },
            focusedElement: function() {
                return Ox.$elements[Ox.last(stack)];
            },
            focusedElementIsInput: function() {
                var $element = that.focusedElement();
                return $element && $element.hasClass('OxKeyboardFocus');
            },
            gainFocus: function($element) {
                var $focusedElement = that.focusedElement(),
                    oxid = $element.oxid,
                    index = stack.indexOf(oxid);
                if (index == -1 || index < stack.length - 1) {
                    stack = $element.parentElements().map(function($element) {
                        return $element.oxid;
                    }).concat(oxid);
                    if ($focusedElement) {
                        try {
                            $focusedElement
                                .removeClass('OxFocus')
                                .triggerEvent('losefocus');
                        } catch(e) {
                            that.cleanup();
                        }
                    }
                    try {
                        $element
                            .addClass('OxFocus')
                            .triggerEvent('gainfocus');
                    } catch(e) {
                        that.cleanup();
                    }
                }
            },
            hasFocus: function($element) {
                return Ox.last(stack) == $element.oxid;
            },
            loseFocus: function($element) {
                var $focusedElement,
                    index = stack.indexOf($element.oxid);
                if (index > -1 && index == stack.length - 1) {
                    stack.pop();
                    try {
                        $element
                            .removeClass('OxFocus')
                            .triggerEvent('losefocus');
                    } catch(e) {
                        that.cleanup();
                    }
                    $focusedElement = that.focusedElement();
                    if (stack.length) {
                        if ($focusedElement) {
                            try {
                                $focusedElement
                                    .addClass('OxFocus')
                                    .triggerEvent('gainfocus');
                            } catch(e) {
                                that.cleanup();
                            }
                        }
                    }
                }
            },
            removeElement: function($element) {
                var index = stack.indexOf($element.oxid);
                if (index == stack.length - 1) {
                    that.loseFocus($element);
                } else if (index > -1) {
                    stack.splice(index, 1);
                }
            }
        };

    return that;

}());
