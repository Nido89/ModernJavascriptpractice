/*
In this example, we will build a list of countries that can be displayed both as
a table and as a grid of icons.
*/
'use strict';

/*
We load the `UI` and `Geo` modules. The `Geo` module gives us Ox.COUNTRIES, the
data for our list.
*/
Ox.load(['UI', 'Geo'], function() {

    /*
    We extend the country data to include a flag icon (Ox.getFlagByCountryCode
    returns an image URL), and patch the `region` property so that when our list
    is sorted by region, regions will be grouped by continent.
    */
    var items = Ox.COUNTRIES.map(function(country) {
            return Ox.extend({}, country, {
                flag: Ox.getFlagByCountryCode(country.code, 256),
                region: country.continent + ', ' + country.region
            });
        }),

        /*
        These are the table columns in list view. The `operator` property
        specifies the default sort order, `format` allows us to modify the value
        before it gets displayed, `align` (default: `'left'`) is used to set the
        alignment, and the rest should be pretty self-explanatory.
        */
        columns = [
            {
                id: 'code',
                operator: '+',
                title: 'Code',
                visible: true,
                width: 64
            },
            {
                id: 'name',
                operator: '+',
                removable: false,
                title: 'Name',
                visible: true,
                width: 256
            },
            {
                id: 'continent',
                operator: '+',
                title: 'Continent',
                visible: true,
                width: 96
            },
            {
                format: function(value) {
                    return value.split(', ')[1];
                },
                id: 'region',
                operator: '+',
                title: 'Region',
                visible: true,
                width: 160
            },
            {
                align: 'right',
                format: function(value) {
                    return Ox.formatArea(value);
                },
                id: 'area',
                operator: '-',
                title: 'Area',
                visible: true,
                width: 112
            },
            {
                align: 'right',
                format: function(value) {
                    return Ox.formatDegrees(value, 'lat');
                },
                id: 'lat',
                operator: '-',
                title: 'Latitude',
                visible: true,
                width: 80
            },
            {
                align: 'right',
                format: function(value) {
                    return Ox.formatDegrees(value, 'lng');
                },
                id: 'lng',
                operator: '+',
                title: 'Longitude',
                visible: true,
                width: 80
            }
        ],

        /*
        This is the width of the UI element where more information about the
        selected item gets displayed.
        */
        itemSize = 288 + Ox.UI.SCROLLBAR_SIZE,

        /*
        `ui` holds the state of our application:
        */
        ui = {
            /*
            the query string,
            */
            find: '',
            /*
            the types of countries to include,
            */
            include: {
                dependency: false,
                disputed: false,
                dissolved: false,
                exception: false
            },
            /*
            the selected items (note that this is an array, even though we will
            limit the maximum number of selected items to 1, later on),
            */
            selected: [],
            /*
            the sort order (note that this is an array too, so if our country
            names weren't unique, we could add more criteria)
            */
            sort: [{key: 'name', operator: '+'}],
            /*
            and the view (either `'grid'` or `'list'`).
            */
            view: 'grid'
        },

        /*
        This is the query for our list, which depends on `ui.find` and
        `ui.include`.
        */
        query = getQuery(),

        /*
        A simple toolbar.
        */
        $toolbar = Ox.Bar({size: 24}).addClass('bar'),

        /*
        A group of two buttons to switch between `grid` and `list` view.
        */
        $view = Ox.ButtonGroup({
                buttons: [
                    {id: 'grid', title: 'grid', tooltip: 'View as Grid'},
                    {id: 'list', title: 'list', tooltip: 'View as List'}
                ],
                selectable: true,
                type: 'image',
                value: ui.view
            })
            .bindEvent({change: view})
            .appendTo($toolbar),

        /*
        A select element to set the sort order. In `list` view, the table
        provides its own UI for sorting, so we only show this element in `grid`
        view.
        */
        $sort = Ox.Select({
                items: columns.filter(function(column) {
                    return column.id != 'flag';
                }).map(function(column) {
                    return {
                        id: column.id,
                        title: 'Sort by ' + column.title
                    };
                }),
                value: ui.sort[0].key,
                width: 128
            })
            .bindEvent({change: sort})
            [ui.view == 'grid' ? 'show' : 'hide']()
            .appendTo($toolbar),

        /*
        A button to switch between 'ascending' and 'descending'. Again, this is
        only needed in `grid` view.
        */
        $order = Ox.Button(getOptions())
            .bindEvent({click: order})
            [ui.view == 'grid' ? 'show' : 'hide']()
            .appendTo($toolbar),

        /*
        This is our search box. To implement "find-as-you-type", we set its
        `changeOnKeypress` option to `true`. Otherwise, its `change` event would
        only fire when the user hits return.
        */
        $find = Ox.Input({
                changeOnKeypress: true,
                clear: true,
                placeholder: 'Find',
                width: 192
            })
            .addClass('right')
            .bindEvent({change: find})
            .appendTo($toolbar),

        /*
        And a menu to specify which types of countries to include.
        */
        $include = Ox.MenuButton({
                items: [
                    {id: 'dependency', title: 'Include dependencies'},
                    {id: 'disputed', title: 'Include disputed countries'},
                    {id: 'dissolved', title: 'Include dissolved countries'},
                    {id: 'exception', title: 'Include other entities'}
                ].map(function(item) {
                    return Ox.extend(item, {checked: false});
                }),
                type: 'image'
            })
            .addClass('right')
            .bindEvent({change: include})
            .appendTo($toolbar),

        /*
        The list itself.
        */
        $list = renderList(),

        /*
        A simple statusbar.
        */
        $statusbar = Ox.Bar({size: 16}),

        /*
        An element for the status text.
        */
        $status = Ox.Element().addClass('status').appendTo($statusbar),

        /*
        The list panel holds the toolbar, the list and the statusbar.
        */
        $listPanel = Ox.SplitPanel({
            elements: [
                {element: $toolbar, size: 24},
                {element: $list},
                {element: $statusbar, size: 16}
            ],
            orientation: 'vertical'
        }),

        /*
        Now we can move on to the item panel. The first element is another bar.
        */
        $titlebar = Ox.Bar({size: 24}).addClass('bar'),

        /*
        The label will show the country name.
        */
        $title = Ox.Label({
                width: itemSize - 28
            })
            .hide()
            .appendTo($titlebar),

        /*
        A button to deselect the currently selected item.
        */
        $deselect = Ox.Button({
                title: 'close',
                type: 'image'
            })
            .bindEvent({
                click: function() {
                    $list.options({selected: []});
                    select({ids: []});
                }
            })
            .hide()
            .appendTo($titlebar),

        /*
        An element to hold the item data.
        */
        $item = Ox.Element().addClass('item'),

        /*
        The item panel: titlebar, item and one more bar (to match the layout of
        the list panel).
        */
        $itemPanel = Ox.SplitPanel({
                elements: [
                    {element: $titlebar, size: 24},
                    {element: $item},
                    {element: Ox.Bar({size: 16}), size: 16}
                ],
                orientation: 'vertical'
            }),

        /*
        And finally the main panel, which combines the list panel and the item
        panel.
        */
        $mainPanel = Ox.SplitPanel({
                elements: [
                    {element: $listPanel},
                    {element: $itemPanel, size: itemSize}
                ],
                orientation: 'horizontal'
            })
            .appendTo(Ox.$body);

    /*
    Whenever the user types something in the search box, we update the list
    query.
    */
    function find() {
        ui.find = $find.options('value');
        query = getQuery();
        $status.html('Loading...');
        $list.options({query: query});
    }

    /*
    This function returns the options for the sort order button, which depend on
    `ui.sort`.
    */
    function getOptions() {
        var operator = ui.sort[0].operator;
        return {
            title: operator == '+' ? 'up' : 'down',
            tooltip: operator == '+' ? 'Ascending' : 'Descending',
            type: 'image'
        };
    }

    /*
    This function returns a query, which is an array of conditions and an
    operator. Additionally to `find`, which applies to the country's `'name'`
    property, we add a condition for each `include` setting that is `false`. For
    example, in order to not include dependencies, we have to add a condition
    that tests if the country's `'dependency'` property is `undefined`.
    */
    function getQuery() {
        var query = {
            conditions: [{key: 'name', operator: '=', value: ui.find}],
            operator: '&'
        };
        Ox.forEach(ui.include, function(value, key) {
            !value && query.conditions.push(
                {key: key, operator: '=', value: void 0}       
            );
        });
        return query;
    }

    /*
    A handler for the `change` event of the menu button.
    */
    function include(data) {
        ui.include[data.id] = data.checked;
        find();
    }

    /*
    A handler for the `init` event of the list, which fires once the list knows
    the total number of items for the current query. In our case, it'll know
    that instantly. But the list's `items` option doesn't have to be a static
    array &mdash; it can also be a call to any remote API that understands our
    `query` syntax. (In fact, when passing an `items` array, Ox.List uses
    Ox.api, which is a local implementation of such an API.) The first request
    to this API will return the totals, so they can be displayed before
    retrieving the actual data.
    */
    function init(data) {
        $status.html(
            (data.items || 'No') + ' countr'
            + (data.items == 1 ? 'y' : 'ies')
        );
    }

    /*
    A handler for the `click` event of the sort order button. Note that we have
    to pass a deep copy of `ui.sort`. If `ui.sort` and the lists `sort` option
    were references to the same array, then changing `ui.sort` and passing it
    as `sort` option would no longer register as a change. In other words: to
    update the options of a widget, don't hold references and update them, but
    use the widget's `options` method.
    */
    function order() {
        ui.sort[0].operator = ui.sort[0].operator == '+' ? '-' : '+';
        $order.options(getOptions());
        $list.options({sort: Ox.clone(ui.sort, true)});
    }

    /*
    This renders the selected item. In grid view, we display all the country's
    properties, in list view, we show a flag icon.
    */
    function renderItem() {
        var code = ui.selected[0];
        $item.empty();
        if (code) {
            $item.append(
                ui.view == 'grid'
                    ? Ox.TreeList({
                        data: Ox.getCountryByCode(code),
                        scrollbarVisible: true,
                        width: itemSize
                    })
                    : Ox.Element('<img>')
                        .addClass('flag')
                        .attr({src: Ox.getFlagByCountryCode(code, 256)})
            );
        }
    }

    /*
    This renders the list.
    */
    function renderList() {
        return ui.view == 'grid'
            /*
            For grid view, we use Ox.IconList.
            */
            ? Ox.IconList({
                /*
                The border radius of the icons, in px.
                */
                borderRadius: 16,
                /*
                Signals that all icons have the same ratio, in this case `1`.
                */
                fixedRatio: 1,
                /*
                A function that takes item data, sort option and icon size, and
                returns an object with the icon's image URL, width, height,
                title and info. Info is the "subtitle", and we'll display the
                formatted value of the current sort key.
                */
                item: function(data, sort, size) {
                    var key = sort[0].key == 'name' ? 'code' : sort[0].key,
                        column = Ox.getObjectById(columns, key),
                        info = (column.format || Ox.identity)(data[key]);
                    return {
                        height: size,
                        id: data.id,
                        info: info,
                        title: data.name,
                        url: data.flag,
                        width: size
                    };
                },
                items: items,
                /*
                Maximum number of items that can be selected.
                */
                max: 1,
                /*
                Since the total number of items isn't very large, we don't need
                pagination, so we set `pageLength` to a larger number.
                */
                pageLength: 1000,
                query: query,
                /*
                This enables "select-as-you-type". When the list has focus, the
                user can just type a few letters, and if they match the
                beginning of an item's `name` property, that item will be
                selected.
                */
                selectAsYouType: 'name',
                selected: ui.selected,
                /*
                The icon size, in px.
                */
                size: 128,
                sort: Ox.clone(ui.sort, true),
                /*
                The unique key. Whenever the list fires a `select` event, it
                will reference this as the item's unique id.
                */
                unique: 'code'
            })
            .bindEvent({
                init: init,
                select: select
            })
        /*
        For list view, we use Ox.TableList.
        */
        : Ox.TableList({
                /*
                The list columns, as defined earlier.
                */
                columns: columns,
                columnsMovable: true,
                columnsRemovable: true,
                columnsVisible: true,
                /*
                The other options are similar as above.
                */
                items: items,
                max: 1,
                pageLength: 1000,
                query: query,
                selectAsYouType: 'name',
                scrollbarVisible: true,
                selected: ui.selected,
                sort: Ox.clone(ui.sort, true),
                unique: 'code'
            })
            .bindEvent({
                init: init,
                select: select,
                /*
                As the TableList has its own UI for sorting, we also bind to its
                `sort` event.
                */
                sort: sort
            });
    }

    /*
    A handler for the `select` event of the list.
    */
    function select(data) {
        var id = data.ids[0];
        if (id) {
            ui.selected = [id];
            data = $list.value(id);
            $title.options({title: data.name}).show();
            $deselect.show();
        } else {
            ui.selected = [];
            $title.hide();
            $deselect.hide();
        }
        renderItem();
    }

    /*
    A handler for both the `sort` event of the table and the `change` event of
    the sort select element. In the latter case, we patch the event's properties
    to match the signature of the former.
    */
    function sort(data) {
        if (data.value) {
            data = {
                key: data.value,
                operator: Ox.getObjectById(columns, data.value).operator
            };
        }
        ui.sort = [{key: data.key, operator: data.operator}];
        $sort.options({value: data.key});
        $order.options(getOptions());
        $list.options({sort: Ox.clone(ui.sort, true)});
    }

    /*
    And a handler for the change event of the `view` switch.
    */
    function view(data) {
        ui.view = data.value;
        $sort[ui.view == 'grid' ? 'show' : 'hide']();
        $order[ui.view == 'grid' ? 'show' : 'hide']();
        $list = renderList();
        $listPanel.replaceElement(1, $list);
        $list.gainFocus();
        renderItem();
    }

});

/*
For an example that displays the countries on a map, see
<a href="#examples/world&#95;map&#95;with&#95;countries">here</a>.
*/