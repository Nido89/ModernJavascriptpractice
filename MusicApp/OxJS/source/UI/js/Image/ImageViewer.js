'use strict';

/*@
Ox.ImageViewer <f> Image Viewer
    options <o> Options
        area <[n]> [x0, y0, x1, y1], if set this will override center and zoom
        center <[n]|s|'auto'> Center ([x, y] or 'auto')
        elasticity <n|0> Number of pixels to scroll/zoom beyond min/max
        height <n|384> Viewer height in px
        imageHeight <n|0> Image height in px
        imagePreviewURL <s|''> URL of smaller preview image
        imageURL <s|''> Image URL
        imageWidth <n|0> Image width in px
        maxZoom <n|16> Maximum zoom (minimum zoom is 'fit')
        overviewSize <n|128> Size of overview image in px
        width <n|512> Viewer width in px
        zoom <n|s|'fit'> Zoom (number or 'fit' or 'fill')
    self <o> Shared private variable
    ([options[, self]]) -> <o:Ox.Element> Image Viewer
        center <!> Center changed
            center <[n]|s> Center
        zoom <!> Zoom changed
            zoom <n|s> Zoom
@*/

Ox.ImageViewer = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({
            area: [],
            center: 'auto',
            elasticity: 0,
            height: 384,
            imageHeight: 0,
            imagePreviewURL: '',
            imageURL: '',
            imageWidth: 0,
            maxZoom: 16,
            overviewSize: 128,
            width: 512,
            zoom: 'fit'
        })
        .options(options || {})
        .update({
            area: function() {
                if (self.options.area && self.options.area.length == 4) {
                    var centerAndZoom = getCenterAndZoom(self.options.area);
                    self.options.center = centerAndZoom.center;
                    self.options.zoom = centerAndZoom.zoom;
                    setCenterAndZoom(true, true);
                }
            },
            center: function() {
                setCenterAndZoom(true, true);
            },
            // allow for setting height and width at the same time
            height: updateSize,
            width: updateSize,
            zoom: function() {
                setCenterAndZoom(true, true);
            }
        })
        .addClass('OxImageViewer OxGrid')
        .on({
            mousedown: function() {
                that.gainFocus();
            },
            mouseenter: function() {
                showInterface();
            },
            mouseleave: function() {
                hideInterface();
            },
            mousemove: function() {
                showInterface();
                hideInterface();
            }
        })
        .bindEvent({
            doubleclick: onDoubleclick,
            dragstart: onDragstart,
            drag: onDrag,
            dragend: onDragend,
            key_0: function() {
                that.options({zoom: 1});
            },
            key_1: function() {
                that.options({center: 'auto', zoom: 'fit'});
            },
            key_2: function() {
                that.options({center: 'auto', zoom: 'fill'});
            },
            key_down: function() {
                that.options({
                    center: [
                        self.center[0],
                        self.center[1] + self.options.height / 2 / self.zoom
                    ]
                });
            },
            key_equal: function() {
                that.options({zoom: self.zoom * 2});
            },
            key_left: function() {
                that.options({
                    center: [
                        self.center[0] - self.options.width / 2 / self.zoom,
                        self.center[1]
                    ]
                });
            },
            key_minus: function() {
                that.options({zoom: self.zoom / 2});
            },
            key_right: function() {
                that.options({
                    center: [
                        self.center[0] + self.options.width / 2 / self.zoom,
                        self.center[1]
                    ]
                });
            },
            key_up: function() {
                that.options({
                    center: [
                        self.center[0],
                        self.center[1] - self.options.height / 2 / self.zoom
                    ]
                });
            },
            mousewheel: onMousewheel,
            singleclick: onSingleclick
        });

    if (self.options.area && self.options.area.length == 4) {
        var centerAndZoom = getCenterAndZoom(self.options.area);
        self.options.center = centerAndZoom.center;
        self.options.zoom = centerAndZoom.zoom;
    } 

    self.imageRatio = self.options.imageWidth / self.options.imageHeight;
    self.overviewHeight = Math.round(
        self.options.overviewSize / (self.imageRatio > 1 ? self.imageRatio : 1)
    );
    self.overviewWidth = Math.round(
        self.options.overviewSize * (self.imageRatio > 1 ? 1 : self.imageRatio)
    );
    self.overviewZoom = self.overviewWidth / self.options.imageWidth;

    self.$image = Ox.Element('<img>')
        .addClass('OxImage')
        .attr({src: self.options.imagePreviewURL})
        //.css(getImageCSS())
        .appendTo(that);

    Ox.$('<img>')
        .one({
            load: function() {
                self.$image.attr({src: self.options.imageURL});
            }
        })
        .attr({src: self.options.imageURL});

    self.$scaleButton = Ox.ButtonGroup({
            buttons: [
                {
                    id: 'fit',
                    title: 'fit',
                    tooltip: Ox._('Zoom to Fit') + ' <span class="OxBright">[1]</span>'
                },
                {
                    id: 'fill',
                    title: 'fill',
                    tooltip: Ox._('Zoom to Fill') + ' <span class="OxBright">[2]</span>'
                }
            ],
            style: 'overlay',
            type: 'image'
        })
        .addClass('OxInterface OxScaleButton')
        .on({
            mouseenter: function() {
                self.mouseIsInInterface = true;
            },
            mouseleave: function() {
                self.mouseIsInInterface = false;
            }
        })
        .bindEvent({
            click: function(data) {
                that.options({center: 'auto', zoom: data.id});
            }
        })
        .appendTo(that);

    self.$zoomButton = Ox.ButtonGroup({
            buttons: [
                {
                    id: 'out',
                    title: 'remove',
                    tooltip: Ox._('Zoom Out') + ' <span class="OxBright">[-]</span>'
                },
                {
                    id: 'original',
                    title: 'equal',
                    tooltip: Ox._('Original Size') + ' <span class="OxBright">[0]</span>'
                },
                {
                    id: 'in',
                    title: 'add',
                    tooltip: Ox._('Zoom In') + ' <span class="OxBright">[=]</span>'
                }
            ],
            style: 'overlay',
            type: 'image'
        })
        .addClass('OxInterface OxZoomButton')
        .on({
            mouseenter: function() {
                self.mouseIsInInterface = true;
            },
            mouseleave: function() {
                self.mouseIsInInterface = false;
            }
        })
        .bindEvent({
            click: function(data) {
                if (data.id == 'out') {
                    that.options({zoom: self.zoom / 2});
                } else if (data.id == 'original') {
                    that.options({zoom: 1});
                } else {
                    that.options({zoom: self.zoom * 2});
                }
            }
        })
        .appendTo(that);

    self.$overview = Ox.Element()
        .addClass('OxInterface OxImageOverview')
        .css({
            height: self.overviewHeight + 'px',
            width: self.overviewWidth + 'px'
        })
        .hide()
        .on({
            mouseenter: function() {
                self.mouseIsInInterface = true;
            },
            mouseleave: function() {
                self.mouseIsInInterface = false;
            }
        })
        .appendTo(that);

    self.$overviewImage = Ox.Element('<img>')
        .attr({src: self.options.imagePreviewURL})
        .css({
            height: self.overviewHeight + 'px',
            width: self.overviewWidth + 'px'
        })
        .appendTo(self.$overview);

    self.$overlay = Ox.Element()
        .addClass('OxImageOverlay')
        .appendTo(self.$overview);

    self.$area = {};
    ['bottom', 'center', 'left', 'right', 'top'].forEach(function(area) {
        self.$area[area] = Ox.Element()
            .addClass('OxImageOverlayArea')
            .attr({id: 'OxImageOverlay' + Ox.toTitleCase(area)})
            .css(getAreaCSS(area))
            .appendTo(self.$overlay);
    });

    setSize();

    function getAreaCSS(area) {
        return area == 'bottom' ? {
            height: self.overviewHeight + 'px'
        } : area == 'center' ? {
            left: self.overviewWidth + 'px',
            top: self.overviewHeight + 'px',
            right: self.overviewWidth + 'px',
            bottom: self.overviewHeight + 'px'
        } : area == 'left' ? {
            top: self.overviewHeight + 'px',
            bottom: self.overviewHeight + 'px',
            width: self.overviewWidth + 'px'
        } : area == 'right' ? {
            top: self.overviewHeight + 'px',
            bottom: self.overviewHeight + 'px',
            width: self.overviewWidth + 'px'
        } : {
            height: self.overviewHeight + 'px'
        };
    }

    function getArea(center, zoom) {
        center = Ox.clone(center);
        zoom = Ox.clone(zoom);
        self.viewerRatio = self.options.width / self.options.height;
        self.imageIsWider = self.imageRatio > self.viewerRatio;
        if (center == 'auto') {
            center = [
                Math.round(self.options.imageWidth / 2),
                Math.round(self.options.imageHeight / 2)
            ];
        }
        if (zoom == 'fit') {
            zoom = self.imageIsWider
                ? self.options.width / self.options.imageWidth
                : self.options.height / self.options.imageHeight;
        } else if (zoom == 'fill') {
            zoom = self.imageIsWider
                ? self.options.height / self.options.imageHeight
                : self.options.width / self.options.imageWidth;
        }
        return [
            Math.max(center[0] - self.options.width / 2 / zoom, 0),
            Math.max(center[1] - self.options.height / 2 / zoom, 0),
            Math.min(center[0] + self.options.width / 2 / zoom, self.options.imageWidth),
            Math.min(center[1] + self.options.height / 2 / zoom, self.options.imageHeight)
        ];
    }

    function getCenter(e) {
        var $target = $(e.target), center, offset, offsetX, offsetY;
        if ($target.is('.OxImage')) {
            center = [e.offsetX / self.zoom, e.offsetY / self.zoom];
        } else if ($target.is('.OxImageOverlayArea')) {
            offset = that.offset();
            offsetX = e.clientX - offset.left - self.options.width
                + self.overviewWidth + 6;
            offsetY = e.clientY - offset.top - self.options.height
                + self.overviewHeight + 6;
            center = [offsetX / self.overviewZoom, offsetY / self.overviewZoom];
        }
        return center;
    }

    function getCenterAndZoom(area) {
        if (!area || !area.length) {
            return {center: 'auto', zoom: 'fit'};
        }
        var areaWidth = area[2] - area[0],
            areaHeight = area[3] - area[1],
            areaRatio = areaWidth / areaHeight;
        self.viewerRatio = self.options.width / self.options.height;
        return {
            center: [
                (area[0] + area[2]) / 2,
                (area[1] + area[3]) / 2
            ],
            zoom: self.viewerRatio < areaRatio
                ? self.options.width / areaWidth
                : self.options.height / areaHeight
        };
    }

    function getImageCSS() {
        return {
            left: Math.round(self.options.width / 2 - self.center[0] * self.zoom) + 'px',
            top: Math.round(self.options.height / 2 - self.center[1] * self.zoom) + 'px',
            width: Math.round(self.options.imageWidth * self.zoom) + 'px',
            height: Math.round(self.options.imageHeight * self.zoom) + 'px'
        };
    }

    function getOverlayCSS() {
        var centerLeft = self.center[0] / self.options.imageWidth * self.overviewWidth,
            centerTop = self.center[1] / self.options.imageHeight * self.overviewHeight,
            centerWidth = self.options.width / self.zoom * self.overviewZoom + 4,
            centerHeight = self.options.height / self.zoom * self.overviewZoom + 4;
        return {
            left: Math.round(centerLeft - centerWidth / 2 - self.overviewWidth) + 'px', 
            top: Math.round(centerTop - centerHeight / 2 - self.overviewHeight) + 'px', 
            width: Math.round(2 * self.overviewWidth + centerWidth) + 'px',
            height: Math.round(2 * self.overviewHeight + centerHeight) + 'px'
        };
    }

    function getZoomCenter(e, factor) {
        var center = getCenter(e),
            delta = [
                center[0] - self.center[0],
                center[1] - self.center[1]
            ];
        if (factor == 0.5) {
            factor = -1;
        }
        return [
            self.center[0] + delta[0] / factor,
            self.center[1] + delta[1] / factor
        ];
    }

    function hideInterface() {
        clearTimeout(self.interfaceTimeout);
        self.interfaceTimeout = setTimeout(function() {
            if (!self.mouseIsInInterface) {
                self.interfaceIsVisible = false;
                self.$scaleButton.animate({opacity: 0}, 250);
                self.$zoomButton.animate({opacity: 0}, 250);
                self.$overview.animate({opacity: 0}, 250);
            }
        }, 2500);
    }

    function limitCenter(elastic) {
        var center, imageHeight, imageWidth, maxCenter, minCenter;
        if (self.options.zoom == 'fill') {
            imageWidth = self.imageIsWider
                ? self.options.height * self.imageRatio
                : self.options.width;
            imageHeight = self.imageIsWider
                ? self.options.height
                : self.options.width / self.imageRatio;
        } else if (self.options.zoom == 'fit') {
            imageWidth = self.imageIsWider
                ? self.options.width
                : self.options.height * self.imageRatio;
            imageHeight = self.imageIsWider
                ? self.options.width / self.imageRatio
                : self.options.height;
        } else {
            imageWidth = self.options.imageWidth * self.options.zoom;
            imageHeight = self.options.imageHeight * self.options.zoom;
        }
        minCenter = [
            imageWidth > self.options.width
                ? self.options.width / 2 / self.zoom
                : self.options.imageWidth / 2,
            imageHeight > self.options.height
                ? self.options.height / 2 / self.zoom
                : self.options.imageHeight / 2
        ].map(function(value) {
            return elastic ? value - self.options.elasticity / self.zoom : value;
        });
        maxCenter = [
            self.options.imageWidth - minCenter[0],
            self.options.imageHeight - minCenter[1]
        ];
        center = self.options.center == 'auto' ? [
            self.options.imageWidth / 2,
            self.options.imageHeight / 2
        ] : [
            Ox.limit(self.options.center[0], minCenter[0], maxCenter[0]),
            Ox.limit(self.options.center[1], minCenter[1], maxCenter[1])
        ];
        if (Ox.isArray(self.options.center)) {
            self.options.center = center;
        }
        return center;
    }

    function limitZoom(elastic) {
        // FIXME: elastic maxZoom is still wrong
        var imageSize = self.imageIsWider ? self.options.imageWidth : self.options.imageHeight,
            minZoom = elastic
                ? (self.fitZoom * imageSize - 2 * self.options.elasticity) / imageSize
                : self.fitZoom,
            maxZoom = elastic
                ? (self.maxZoom * imageSize + 2 * self.options.elasticity) / imageSize
                : self.maxZoom,
            zoom = self.options.zoom == 'fill' ? self.fillZoom
                : self.options.zoom == 'fit' ? self.fitZoom
                : Ox.limit(self.options.zoom, minZoom, maxZoom);
        if (Ox.isNumber(self.options.zoom)) {
            self.options.zoom = zoom;
        }
        return zoom;
    }

    function onDoubleclick(e) {
        var $target = $(e.target), factor = e.shiftKey ? 0.5 : 2;
        if ((
            $target.is('.OxImage') || $target.is('.OxImageOverlayArea')
        ) && (
            (!e.shiftKey && self.zoom < self.maxZoom)
            || (e.shiftKey && self.zoom > self.fitZoom)
        )) {
            that.options({
                center: getZoomCenter(e, factor),
                zoom: self.zoom * factor
            });
        }
    }

    function onDragstart(e) {
        var $target = $(e.target);
        if ($target.is('.OxImage') || $target.is('#OxImageOverlayCenter')) {
            self.drag = {
                center: self.center,
                zoom: $target.is('.OxImage') ? self.zoom : -self.overviewZoom
            };
        }
    }

    function onDrag(e) {
        if (self.drag) {
            self.options.center = [
                self.drag.center[0] - e.clientDX / self.drag.zoom,
                self.drag.center[1] - e.clientDY / self.drag.zoom
            ];
            setCenterAndZoom(false, true);
        }
    }

    function onDragend() {
        if (self.drag) {
            self.drag = null;
            setCenterAndZoom(true);
        }
    }

    function onMousewheel(e) {
        var $target = $(e.target),
            factor = e.deltaY > 0 ? 2 : 0.5;
        if (e.deltaX == 0 && Math.abs(e.deltaY) && !self.mousewheelTimeout) {
            if ($target.is('.OxImage') || $target.is('.OxImageOverlayArea')) {
                self.options.center = getZoomCenter(e, factor);
                self.options.zoom = self.zoom * factor;
                setCenterAndZoom(true, true);
                self.mousewheelTimeout = setTimeout(function() {
                    self.mousewheelTimeout = null;
                }, 250);
            }
        }
    }

    function onSingleclick(e) {
        var $target = $(e.target), offset, offsetX, offsetY;
        if ($target.is('.OxImage') || $target.is('.OxImageOverlayArea')) {
            that.options({center: getCenter(e)});
        }
    }

    function setCenterAndZoom(animate, elastic) {
        self.zoom = limitZoom(elastic);
        self.center = limitCenter(elastic);
        if (animate) {
            self.$image.stop().animate(getImageCSS(), 250, function() {
                var center = limitCenter(),
                    zoom = limitZoom(),
                    setCenter = center[0] != self.center[0]
                        || center[1] != self.center[1],
                    setZoom = zoom != self.zoom;
                if (setCenter || setZoom) {
                    self.options.center = center;
                    self.options.zoom = zoom;
                    setCenterAndZoom();
                }
                that.triggerEvent({
                    center: {center: self.options.center},
                    zoom: {zoom: self.options.zoom}
                });
            });
            self.$overlay.stop().animate(getOverlayCSS(), 250);
        } else {
            self.$image.css(getImageCSS());
            self.$overlay.css(getOverlayCSS());
        }
        updateInterface();
        showInterface();
        hideInterface();
    }

    function setSize() {
        self.viewerRatio = self.options.width / self.options.height;
        self.imageIsWider = self.imageRatio > self.viewerRatio;
        self.fillZoom = (
            self.imageIsWider
            ? self.options.height * self.imageRatio
            : self.options.width
        ) / self.options.imageWidth;
        self.fitZoom = (
            self.imageIsWider
            ? self.options.width
            : self.options.height * self.imageRatio
        ) / self.options.imageWidth;
        self.maxZoom = Math.max(self.fillZoom, self.options.maxZoom);
        that.css({
            width: self.options.width + 'px',
            height: self.options.height + 'px'
        });
        setCenterAndZoom();
    }

    function showInterface() {
        clearTimeout(self.interfaceTimeout);
        if (!self.interfaceIsVisible) {
            self.interfaceIsVisible = true;
            self.$scaleButton.animate({opacity: 1}, 250);
            self.$zoomButton.animate({opacity: 1}, 250);
            self.$overview.animate({opacity: 1}, 250);
        }
    }

    function updateInterface() {
        var isFitZoom = self.zoom == self.fitZoom;
        self.$scaleButton[
            isFitZoom ? 'disableButton' : 'enableButton'
        ]('fit');
        self.$scaleButton[
            self.zoom == self.fillZoom
            && self.center[0] == self.options.imageWidth / 2
            && self.center[1] == self.options.imageHeight / 2
            ? 'disableButton' : 'enableButton'
        ]('fill');
        self.$zoomButton[
            isFitZoom ? 'disableButton' : 'enableButton'
        ]('out');
        self.$zoomButton[
            self.zoom == 1 ? 'disableButton' : 'enableButton'
        ]('original');
        self.$zoomButton[
            self.zoom == self.maxZoom ? 'disableButton' : 'enableButton'
        ]('in');
        !isFitZoom && self.$overview.show();
        self.$overview.stop().animate({
            opacity: isFitZoom ? 0 : 1
        }, 250, function() {
            isFitZoom && self.$overview.hide();
        });
    }

    function updateSize() {
        if (!self.updateTimeout) {
            self.updateTimeout = setTimeout(function() {
                self.updateTimeout = null;
                setSize();
            });
        }
    }

    that.getArea = function() {
        return getArea(self.options.center, self.options.zoom);
    };

    that.setArea = function(area) {
        var centerAndZoom = getCenterAndZoom(area);
        that.options({center: centerAndZoom.center, zoom: centerAndZoom.zoom});
        return that;
    };

    return that;

};
