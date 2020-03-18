Ox.VideoPlayerMenu = function(options, self) {

    self = self || {};
    var that = Ox.Element({}, self)
        .defaults({
            items: []
        })
        .options(options || {})
        .update({
            // ...
        })
        .on({
            click: function(e) {
                var $target = $(e.target), group, id;
                that.hide();
                if (
                    !$target.is('.OxLine')
                    && !$target.is('.OxSpace')
                    && !$target.is('.OxDisabled')
                ) {
                    group = $target.parent().data().group;
                    id = $target.parent().data().id;
                    self.$items.filter(function($item) {
                        return $item.data().group == group;
                    }).forEach(function($item) {
                        $($item.children()[1]).attr({
                            src: Ox.UI.getImageURL('symbol' + (
                                $item.data().id == id ? 'Check' : 'None'
                            ))
                        });
                    });
                    that.triggerEvent('click', {
                        group: group,
                        id: id
                    });
                }
            }
        });

    self.$items = [];
    self.height = 2;

    self.options.items.forEach(function(item) {
        var $item;
        if (!Ox.isEmpty(item)) {
            $item = $('<div>')
                .addClass('OxItem' + (item.disabled ? ' OxDisabled' : ''))
                .data({
                    group: item.group,
                    id: item.id
                })
                .appendTo(that);
            if (!item.disabled) {
                $item.on({
                    mouseenter: function() {
                        $(this).addClass('OxSelected');
                    },
                    mouseleave: function() {
                        $(this).removeClass('OxSelected');
                    }
                });
            }
            $('<div>').html(item.title).appendTo($item);
            $('<img>').attr({
                src: Ox.UI.getImageURL(
                    'symbol' + (item.checked ? 'Check' : 'None')
                )
            }).appendTo($item);
            self.$items.push($item);
            self.height += 14;
        } else {
            $('<div>').addClass('OxSpace').appendTo(that);
            $('<div>').addClass('OxLine').appendTo(that);
            $('<div>').addClass('OxSpace').appendTo(that);
            self.height += 5;
        }
    });

    that.css({height: self.height + 'px'});

    return that;

};
