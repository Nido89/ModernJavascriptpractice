'use strict';

/*@
Ox.Dialog <f> Dialog object
    options <o> Options object
    self <o>    Shared private variable
    ([options[, self]]) -> <o:Ox.Element> Dialog object
        close <!> close
        open <!> open
        resizeend <!> resizeend
        resize <!> resize
@*/

Ox.Dialog = function(options, self) {

    // fixme: use controlsTop/controlsBottom options, like in VideoPlayer (????)

    self = self || {};
    var that = Ox.Element({}, self)
            .defaults({
                buttons: [],
                controlsBottom: [],
                controlsTop: [],
                closeButton: false,
                content: null,
                fixedCenter: false,
                fixedSize: false,
                fixedRatio: false,
                focus: true,
                height: 200,
                keys: {},
                maxHeight: Infinity,
                maximizeButton: false,
                maxWidth: Infinity,
                minHeight: 64,
                minWidth: 128,
                removeOnClose: false,
                title: '',
                width: 400
            })
            .options(options || {})
            .update({
                buttons: setButtons,
                content: setContent,
                height: function() {
                    setMinAndMax();
                    setCSS({height: self.options.height});
                },
                title: function() {
                    self.$title.animate({
                        opacity: 0
                    }, 50, function() {
                        self.$title.html(self.options.title).animate({
                            opacity: 1
                        }, 50);
                    });
                },
                width: function() {
                    setMinAndMax();
                    setCSS({width: self.options.width});
                }
            })
            .addClass('OxDialog')
            .bindEvent({
                key_enter: function() {
                    keypress('enter');
                },
                key_escape: function() {
                    keypress('escape');
                }
            })
            .hide()
            .appendTo(Ox.Fullscreen.element ? Ox.Fullscreen.element : Ox.$body);

    self.hasButtons = !!self.options.buttons.length;
    self.barsHeight = 24 + 24 * self.hasButtons;
    self.initialMaxHeight = self.options.maxHeight;
    self.initialMaxWidth = self.options.maxWidth;
    self.titleMargin = 8 + (self.options.closeButton ? 20 : 0)
        + (self.options.maximizeButton ? 20 : 0);

    if (self.options.focus) {
        self.$layer = Ox.Layer({type: 'dialog'});
    }

    /*
    ////
    self.$box = $('<div>')
        .addClass('OxDialogBox')
        .css({zIndex: 11});
    */

    self.$titlebar = Ox.Bar({
            size: 24
        })
        .addClass('OxTitlebar')
        .appendTo(that);

    if (self.options.closeButton) {
        self.$closeButton = Ox.Button({
                title: 'close',
                type: 'image'
            })
            .css({
                top: '4px',
                left: '4px'
            })
            .bindEvent({
                click: function() {
                    that.close();
                }
            })
            .appendTo(self.$titlebar);
    }

    if (self.options.maximizeButton) {
        self.$maximizeButton = Ox.Button({
                type: 'image',
                values: ['add', 'remove']
            })
            .css({
                top: '4px',
                left: '24px'
            })
            .bindEvent({
                click: maximize
            })
            .appendTo(self.$titlebar);
    }

    self.$title = Ox.Element()
        .addClass('OxTitle')
        .css({
            marginLeft: self.titleMargin + 'px',
            marginRight: self.titleMargin + 'px'
        })
        .html(self.options.title)
        .appendTo(self.$titlebar);

    setContent();

    if (self.hasButtons) {
        self.$buttonsbar = Ox.Bar({
                size: 24
            })
            .addClass('OxButtonsbar')
            .appendTo(that);
        self.$buttonsLeft = $('<div>')
            .addClass('OxButtonsLeft')
            .appendTo(self.$buttonsbar.$element);
        self.$buttonsRight = $('<div>')
            .addClass('OxButtonsRight')
            .appendTo(self.$buttonsbar.$element);
        setButtons();
    }

    if (!self.options.fixedCenter) {        
        self.$titlebar.css({
                cursor: 'move'
            })
            .bindEvent({
                doubleclick: function() {
                    !self.centered && center(true);
                },
                dragstart: dragstart,
                drag: drag,
                dragend: dragend
            });
        self.hasButtons && self.$buttonsbar.css({
                cursor: 'move'
            })
            .bindEvent({
                doubleclick: function() {
                    !self.centered && center(true);
                },
                dragstart: dragstart,
                drag: drag,
                dragend: dragend
            });        
    }

    !self.options.fixedSize && [
        'TopLeft', 'Top', 'TopRight', 'Left',
        'Right', 'BottomLeft', 'Bottom', 'BottomRight'
    ].forEach(function(edge) {
        Ox.Element()
            .addClass('OxResize OxResize' + edge)
            .bindEvent({
                doubleclick: function() {
                    reset(true);
                },
                dragstart: resizestart,
                drag: resize,
                dragend: resizeend
            })
            .appendTo(that);
    });

    function center(animate) {
        var ms = animate ? 100 : 0;
        self.centered && decenter();
        that.animate({
            left: Math.round((
                window.innerWidth - self.options.width
            ) * 0.5) + 'px',
            top: Math.round((
                window.innerHeight - self.options.height - self.barsHeight
            ) * 0.4) + 'px',
            width: self.options.width + 'px',
            height: self.options.height + self.barsHeight + 'px'
        }, ms, function() {
            that.css({
                left: 0,
                top: 0,
                right: 0,
                bottom: Math.round((
                    window.innerHeight - self.options.height - self.barsHeight
                ) * 0.2) + 'px',
                margin: 'auto'
            });
            self.centered = true;
            Ox.isFunction(animate) && animate();
        });
    }

    function decenter() {
        var offset = that.offset();
        if (self.centered) {
            that.css({
                left: offset.left + 'px',
                top: offset.top + 'px',            
                margin: 0
            });
            self.centered = false;
        }
    }

    function dragstart(event) {
        var offset;
        if (!$(event.target).is('.OxButton')) {
            Ox.$body.addClass('OxDragging');
            offset = that.offset();
            self.drag = {
                left: offset.left,
                top: offset.top,
                x: event.clientX,
                y: event.clientY
            };
            decenter();
            //// that.wrap(self.$box);
        }
    }

    function drag(event) {
        Ox.Log('Window', document.body.scrollTop, '...')
        var left, top;
        if (!$(event.target).is('.OxButton')) {
            left = Ox.limit(
                self.drag.left - self.drag.x + event.clientX,
                self.minLeft, self.maxLeft
            );
            top = Ox.limit(
                self.drag.top - self.drag.y + event.clientY,
                self.minTop, self.maxTop
            );
            setCSS({left: left, top: top});
        }
    }

    function dragend(event) {
        if (!$(event.target).is('.OxButton')) {
            Ox.$body.removeClass('OxDragging');
            //// that.unwrap();
        }
    }

    function getButtonById(id) {
        var ret = null;
        Ox.forEach(self.options.buttons, function(button) {
            if (button.options && button.options('id') == id) {
                ret = button;
                return false; // break
            }
        });
        return ret;
    }

    function keypress(key) {
        var id = self.options.keys[key];
        Ox.Log('Window', id, getButtonById(id));
        id && getButtonById(id).$element.trigger('click');
    }

    function maximize() {
        var data, offset = that.offset();
        decenter();
        if (!self.maximized) {
            self.originalLeft = offset.left;
            self.originalTop = offset.top;
            self.originalWidth = self.options.width;
            self.originalHeight = self.options.height;
        }
        setCSS(self.maximized ? {
            left: self.originalLeft,
            top: self.originalTop,
            width: self.originalWidth,
            height: self.originalHeight
        } : {
            left: Math.round((window.innerWidth - self.options.maxWidth) / 2),
            top: Math.round((
                window.innerHeight - self.options.maxHeight - self.barsHeight
            ) / 2),
            width: self.options.maxWidth,
            height: self.options.maxHeight
        }, true);
        self.maximized = !self.maximized;
    }

    function reset(animate) {
        var data, left, offset, top;
        if (!self.centered) {
            offset = that.offset();
            left = Ox.limit(
                offset.left + Math.round((
                    self.options.width - self.initialWidth
                ) / 2),
                self.minLeft, self.maxLeft
            );
            top = Ox.limit(
                offset.top + Math.round((
                    self.options.height - self.initialHeight
                ) / 2),
                self.minTop, self.maxTop
            );
        }
        setCSS(Ox.extend({
            width: self.initialWidth,
            height: self.initialHeight
        }, self.centered ? {} : {
            left: left,
            top: top
        }), animate);
    }

    function resizestart(event) {
        Ox.$body.addClass('OxDragging');
        var edge = event.target.className.slice(17).toLowerCase(),
            offset = that.offset();
        self.drag = {
            edge: edge,
            height: self.options.height,
            isLeft: edge.indexOf('left') > -1,
            isTop: edge.indexOf('top') > -1,
            isRight: edge.indexOf('right') > -1,
            isBottom: edge.indexOf('bottom') > -1,
            left: offset.left,
            top: offset.top,
            width: self.options.width
        };
        decenter();
        if (self.maximized) {
            self.$maximizeButton.toggle();
            self.maximized = false;
        }
        //// that.wrap(self.$box);
    }

    function resize(event) {
        var horizontal, vertical, offset,
            ratio = self.drag.width / self.drag.height;
        if (!self.drag.fixedRatio && event.shiftKey) {
            self.drag.centerX = Math.round(
                self.drag.left + self.drag.width / 2
            );
            self.drag.centerY = Math.round(
                self.drag.top + self.drag.height / 2
            );
        }
        self.drag.fixedCenter = self.options.fixedCenter || event.altKey;
        self.drag.fixedRatio = self.options.fixedRatio || event.shiftKey;
        horizontal = self.drag.edge == 'left' || self.drag.edge == 'right'
            || ratio >= 1 || !self.drag.fixedRatio;
        vertical = self.drag.edge == 'top' || self.drag.edge == 'bottom'
            || ratio < 1 || !self.drag.fixedRatio;
        if (self.drag.isLeft && horizontal) {
            self.options.width = Ox.limit(
                self.options.width + (
                    self.drag.left - Math.min(event.clientX, self.maxLeft)
                ) * (self.drag.fixedCenter ? 2 : 1),
                self.options.minWidth,
                self.options.maxWidth
            );
            if (self.drag.fixedRatio) {
                self.options.height = Ox.limit(
                    Math.round(self.options.width / ratio),
                    self.options.minHeight,
                    self.options.maxHeight
                );
                self.options.width = Math.round(self.options.height * ratio);
            }
            setCSS(Ox.extend({
                left: self.drag.left + (
                    self.drag.width - self.options.width
                ) / (self.drag.fixedCenter ? 2 : 1),
                width: self.options.width
            }, self.drag.fixedRatio ? {
                top: Math.max(Math.round(
                    self.drag.edge == 'topleft'
                    ? self.drag.top + self.drag.height - self.options.height
                    : self.drag.edge == 'bottomleft'
                    ? self.drag.top
                    : self.drag.centerY - self.options.height / 2
                ), self.minTop),
                height: self.options.height
            } : {}));
        }
        if (self.drag.isTop && vertical) {
            self.options.height = Ox.limit(
                self.options.height + (
                    self.drag.top
                    - Ox.limit(event.clientY, self.minTop, self.maxTop)
                ) * (self.drag.fixedCenter ? 2 : 1),
                self.options.minHeight,
                self.options.maxHeight
            );
            if (self.drag.fixedRatio) {
                self.options.width = Ox.limit(
                    Math.round(self.options.height * ratio),
                    self.options.minWidth,
                    self.options.maxWidth
                );
                self.options.height = Math.round(self.options.width / ratio);
            }
            setCSS(Ox.extend({
                top: Math.max(self.drag.top + (
                    self.drag.height - self.options.height
                ) / (self.drag.fixedCenter ? 2 : 1), self.minTop),
                height: self.options.height
            }, (self.drag.fixedRatio) ? {
                left: Math.round(
                    self.drag.edge == 'topleft'
                    ? self.drag.left + self.drag.width - self.options.width
                    : self.drag.edge == 'topright'
                    ? self.drag.left
                    : self.drag.centerX - self.options.width / 2
                ),
                width: self.options.width
            } : {}));
        }
        if (self.drag.isRight && horizontal) {
            self.options.width = Ox.limit(
                self.options.width + (
                    Math.max(event.clientX, 24)
                    - self.drag.left - self.drag.width
                ) * (self.drag.fixedCenter ? 2 : 1),
                self.options.minWidth,
                self.options.maxWidth
            );
            if (self.drag.fixedRatio) {
                self.options.height = Ox.limit(
                    Math.round(self.options.width / ratio),
                    self.options.minHeight,
                    self.options.maxHeight
                );
                self.options.width = Math.round(self.options.height * ratio);
            }
            setCSS(Ox.extend({
                width: self.options.width
            }, self.drag.fixedCenter ? {
                left: self.drag.left + (
                    self.drag.width - self.options.width
                ) / 2
            } : {}, self.drag.fixedRatio ? {
                top: Math.max(Math.round(
                    self.drag.edge == 'topright'
                    ? self.drag.top + self.drag.height - self.options.height
                    : self.drag.edge == 'bottomright'
                    ? self.drag.top
                    : self.drag.centerY - self.options.height / 2
                ), self.minTop),
                height: self.options.height
            } : {}));
        }
        if (self.drag.isBottom && vertical) {
            self.options.height = Ox.limit(
                self.options.height + (
                    Math.max(event.clientY, 24)
                    - self.drag.top - self.drag.height - self.barsHeight
                ) * (self.drag.fixedCenter ? 2 : 1),
                self.options.minHeight,
                self.options.maxHeight
            );
            if (self.drag.fixedRatio) {
                self.options.width = Ox.limit(
                    Math.round(self.options.height * ratio),
                    self.options.minWidth,
                    self.options.maxWidth
                );
                self.options.height = Math.round(self.options.width / ratio);
            }
            setCSS(Ox.extend({
                height: self.options.height
            }, self.drag.fixedCenter ? {
                top: Math.max(self.drag.top + (
                    self.drag.height - self.options.height
                ) / 2, self.minTop)
            } : {}, self.drag.fixedRatio && self.drag.edge == 'bottom' ? {
                left: Math.round(
                    self.drag.edge == 'bottomleft'
                    ? self.drag.left + self.drag.width - self.options.width
                    : self.drag.edge == 'bottomright'
                    ? self.drag.left
                    : self.drag.centerX - self.options.width / 2
                ),
                width: self.options.width
            } : {}));
        }
        offset = that.offset();
        self.drag.left = offset.left;
        self.drag.top = offset.top;
        self.drag.width = self.options.width;
        self.drag.height = self.options.height;
        self.drag.minLeft = 24 - self.options.width;
        self.drag.minTop = self.hasButtons
            ? 24 - self.options.height - self.barsHeight : 0;
        that.triggerEvent('resize', {
            width: self.options.width,
            height: self.options.height
        });
    }

    function resizeend() {
        Ox.$body.removeClass('OxDragging');
        //// that.unwrap();
        that.triggerEvent('resizeend', {
            width: self.options.width,
            height: self.options.height
        });
    }

    function resizeWindow() {
        self.options.width = Math.min(self.options.width, window.innerWidth);
        self.options.height = Math.min(
            self.options.height, window.innerHeight - self.barsHeight
        );
        var offset = that.offset();
        setMinAndMax();
        if (self.centered) {
            center();
        } else if (self.maximized) {
            self.maximized = false;
            maximize();
        } else {
            setCSS({
                left: Math.min(offset.left, self.maxLeft),
                top: Math.min(offset.top, self.maxTop),
                width: self.options.width,
                height: self.options.height
            });
        }
    }

    function setButtons() {
        var buttonsLeft,
            buttonsRight,
            index = Ox.indexOf(self.options.buttons, Ox.isEmpty);
        if (index > -1) {
            buttonsLeft = self.options.buttons.slice(0, index);
            buttonsRight = self.options.buttons.slice(index + 1);
        } else {
            buttonsLeft = [];
            buttonsRight = self.options.buttons;
        }
        self.$buttonsLeft.empty();
        buttonsLeft.forEach(function($button) {
            $button.addClass('OxLeft').appendTo(self.$buttonsLeft);
        });
        self.$buttonsRight.empty();
        buttonsRight.forEach(function($button) {
            $button.addClass('OxRight').appendTo(self.$buttonsRight);
        });
    }

    function setContent() {
        var animate = !!self.$content,
            isImage = !Ox.UI.isElement(self.options.content)
                && self.options.content.is('img');
        if (animate) {
            self.$content.animate({
                opacity: 0
            }, 250, function() {
                $(this).remove();
            });
            self.options.content.css({
                opacity: 0
            });
        }
        self.$content = (isImage ? self.options.content : Ox.Element())
            .addClass('OxContent')
            .css(self.hasButtons ? {
                bottom: '24px'
            } : {
                bottom: 0,
                borderBottomLeftRadius: '8px',
                borderBottomRightRadius: '8px'
            })
            .appendTo(that);
        !isImage && self.$content.append(
            self.options.content.css(self.hasButtons ? {} : {
                borderBottomLeftRadius: '8px',
                borderBottomRightRadius: '8px'
            })
        );
        animate && self.options.content.animate({
            opacity: 1
        }, 250);
    }

    function setCSS(css, animate) {
        var ms = animate ? 100 : 0,
            offset = that.offset(),
            triggerEvent = self.isOpen && (
                (css.width && css.width != self.options.width)
                || (css.height && css.height != self.options.height)
            );
        css = Ox.extend({
            left: offset.left,
            top: offset.top,
            width: self.options.width,
            height: self.options.height
        }, css);
        that.animate({
            left: css.left + 'px',
            top: css.top + 'px',
            width: css.width + 'px',
            height: css.height + self.barsHeight + 'px'
        }, ms, function() {
            self.options.width = css.width;
            self.options.height = css.height;
            self.minLeft = 24 - self.options.width;
            self.minTop = self.hasButtons
                ? 24 - self.options.height - self.barsHeight : 0;
            triggerEvent && that.triggerEvent('resize', {
                width: self.options.width,
                height: self.options.height
            });
            Ox.isFunction(animate) && animate();
        });
    }

    function setMinAndMax() {
        var ratio, maxRatio, minRatio;
        self.maxLeft = window.innerWidth - 24;
        self.maxTop = window.innerHeight - 24;
        self.minLeft = 24 - self.options.width;
        self.minTop = self.hasButtons ? 24 - self.options.height : 0;
        self.options.maxHeight = Ox.limit(
            self.initialMaxHeight, 64, window.innerHeight - self.barsHeight
        );
        self.options.maxWidth = Ox.limit(
            self.initialMaxWidth, 128, window.innerWidth
        );
        if (self.options.fixedRatio) {
            ratio = self.options.width / self.options.height;
            maxRatio = self.options.maxWidth / self.options.maxHeight;
            minRatio = self.options.minWidth / self.options.minHeight;
            if (maxRatio > ratio) {
                self.options.maxWidth = Math.round(
                    self.options.maxHeight * ratio
                );
            } else if (maxRatio < ratio) {
                self.options.maxHeight = Math.round(
                    self.options.maxWidth / ratio
                );
            } 
            if (minRatio > ratio) {
                self.options.minWidth = Math.round(
                    self.options.minHeight * ratio
                );
            } else if (minRatio < ratio) {
                self.options.minHeight = Math.round(
                    self.options.minWidth / ratio
                );
            }
        }
    }

    /*@
    close <f> close
        (callback) -> <o>  close
    @*/
    that.close = function(callback) {
        if (self.isOpen) {
            self.isOpen = false;
            that.animate({
                opacity: 0
            }, 250, function() {
                // that.remove();
                that.hide();
                callback && callback();
            });
            if (self.maximized) {
                self.$maximizeButton.toggle();
                self.maximized = false;
            }
            if (self.options.focus) {
                self.$layer.hide();
                that.loseFocus();
            }
            Ox.$window.off({resize: resizeWindow});
            that.triggerEvent('close');
            self.options.removeOnClose && that.remove();
        }
        return that;
    };

    /*@
    disableButton <f> disable button
        (id) -> <o>  disable button
    @*/
    that.disableButton = function(id) {
        getButtonById(id).options({disabled: true});
        return that;
    };

    /*@
    disableButtons <f> disable buttons
        () -> <o>  disable all buttons
    @*/
    that.disableButtons = function() {
        self.options.buttons.forEach(function(button) {
            !Ox.isEmpty(button) && button.options({disabled: true});
        });
    };

    that.disableCloseButton = function() {
        self.$closeButton && self.$closeButton.options({disabled: true});
        return that;
    };

    /*@
    enableButton <f> enable button
        (id) -> <o>  enable button
    @*/
    that.enableButton = function(id) {
        getButtonById(id).options({disabled: false});
        return that;
    };

    /*@
    enableButtons <f> enable buttons
        () -> <o>  enable all buttons
    @*/
    that.enableButtons = function() {
        self.options.buttons.forEach(function(button) {
            !Ox.isEmpty(button) && button.options({disabled: false});
        });
    };

    that.enableCloseButton = function() {
        self.$closeButton && self.$closeButton.options({disabled: false});
        return that;
    };

    /*@
    open <f> open 
        () -> <o> open dialog 
    @*/
    that.open = function() {
        if (!self.isOpen) {
            self.isOpen = true;
            self.initialHeight = self.options.height;    
            self.initialWidth = self.options.width;
            setMinAndMax();
            center();
            reset();
            that.css({
                opacity: 0
            }).show().animate({
                opacity: 1
            }, 250);
            if (self.options.focus) {
                self.$layer.show();
                that.gainFocus();
            }
            Ox.$window.on({resize: resizeWindow});
            that.triggerEvent('open');
        }
        return that;        
    };

    /*@
    setSize <f> set size
        (width, height) -> <o>  set size
    @*/
    that.setSize = function(width, height) {
        self.options.width = width;
        self.options.height = height;
        setMinAndMax();
        if (self.maximized) {
            self.originalWidth = width;
            self.originalHeight = height;
            self.options.width = self.options.maxWidth;
            self.options.height = self.options.maxHeight;
        }
        center(true);
        that.triggerEvent('resize', {
            width: self.options.width,
            height: self.options.height
        });
        return that;
    };

    return that;

};
