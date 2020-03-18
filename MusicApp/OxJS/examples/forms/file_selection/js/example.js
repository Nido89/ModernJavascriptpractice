/*
This examples shows how to do file selection &mdash; usually for upload &mdash;
in Ox.UI.
*/
'use strict';

/*
Load the `UI` module.
*/
Ox.load('UI', function() {

    var $elements = [
            /*
            Ox.FileButton has the following options:
            <pre>
            disabled
                If true, the button is disabled
            image
                Symbol name (if type is 'image'),
                default is 'file' or 'files'
                (depending on maxFiles)
            maxFiles
                Maximum number of files,
                default is -1 (unlimited)
            maxSize
                Maximum total size in bytes,
                default is -1 (unlimited)
            title
                Button title (if type is 'text')
                and tooltip text
            type
                Type, either 'text' or 'image',
                default is 'text'
            width
                Width in px (if type is 'text')
            </pre>
            Ox.FileButton fires a `click` event (not on click, like Ox.Button,
            but once the user has selected one or more files) that we can bind
            to like this:
            <pre>
            $fileButton.bindEvent({
                click: function(data) {
                    // Print array of files
                    Ox.print(data.files);
                }
            });
            </pre>
            We create two image buttons and two text buttons: one of each to
            select a single file, one for multiple files.
            */
            Ox.FileButton({
                maxFiles: 1,
                title: 'Select File...',
                type: 'image'
            }),
            Ox.FileButton({
                title: 'Select Files...',
                type: 'image'
            }),
            Ox.FileButton({
                maxFiles: 1,
                title: 'Select File...',
                width: 128
            }),
            Ox.FileButton({
                title: 'Select Files...',
                width: 128
            }),
            /*
            Ox.FileInput is a form element, so it has a value option and fires a
            `change` event. Its other options are similar to Ox.FileButton,
            without `image`, `title` and `type`, and we can bind to its `change`
            event like this:
            <pre>
            $fileInput.bindEvent({
                change: function(data) {
                    // Print array of files
                    Ox.print(data.value);
                }
            });
            </pre>
            Again, we create one input to select a single file and one for
            multiple files.
            */
            Ox.FileInput({
                maxFiles: 1,
                maxSize: 1000000,
                width: 256
            }),
            Ox.FileInput({
                maxSize: 1000000,
                width: 256
            })
        ],
        /*
        File selection also works from a menu. A basic menu item looks like
        `{id: 'id', title: 'Title'}`, and its `click` event fires on click.
        By adding a `file` property (which takes the same `maxFiles`, `maxSize`
        and `width` options as Ox.FileButton), we enable file selection, and
        the `click` event now fires once one or more files are selected. We can
        bind to it like this:
        <pre>
        $mainMenu.bindEvent({
            click: function(data) {
                if (data.id == 'foo') {
                    // Print array of files
                    Ox.print(data.files);
                }
            }
        });
        </pre>
        Note that keyboard navigation works as well. Just like any other menu
        item, it can be activated by pressing `enter`, which opens the file
        selection dialog.
        */
        $menu = Ox.MainMenu({
                menus: [
                    {id: 'file', title: 'File', items: [
                        {id: 'file', title: 'Select File...', file: {
                            maxFiles: 1, width: 80
                        }},
                        {id: 'files', title: 'Select Files...', file: {
                            width: 80
                        }},
                        {id: 'disabled', title: 'Disabled', file: {
                            width: 80
                        }, disabled: true}
                    ]}
                ]
            })
            /*
            On click, we display the event data and open a dialog.
            */
            .bindEvent({
                click: function(data) {
                    showEvent(data);
                    openDialog(data);
                }
            }),
        /*
        This is a container for our buttons and inputs.
        */
        $main = Ox.Element(),
        /*
        This is the list that will display the event data.
        */
        $list = Ox.TreeList({
            data: {},
            expanded: true,
            width: 256
        }),
        /*
        They both share a panel.
        */
        $innerPanel = Ox.SplitPanel({
            elements: [
                {element: $main},
                {element: $list, resizable: true, resize: [256], size: 256}
            ],
            orientation: 'horizontal'
        }),
        /*
        Menu and inner panel go into the outer panel.
        */
        $outerPanel = Ox.SplitPanel({
            elements: [
                {element: $menu, size: 20},
                {element: $innerPanel}
            ],
            orientation: 'vertical'
        })
        .appendTo(Ox.$body);    

    /*
    Here, we append the buttons and inputs to the container. For each element,
    we add an event handler (`click` event for buttons, `change` event for
    inputs) to display the event data.
    */
    $elements.forEach(function($element, i) {
        $element
            .css({top: 16 + 32 * i + 'px'})
            .bindEvent(
                $element.is('.OxFileButton') ? 'click' : 'change', showEvent
            )
            .appendTo($main);
    });    

    /*
    When the user selects one or more files via the menu, we open a dialog. This
    dialog contains an Ox.FileInput that is populated with the selected file(s).
    */
    function openDialog(data) {
        var $button = Ox.Button({
                    id: 'close',
                    title: 'Close'
                })
                .bindEvent({
                    click: function() {
                        $dialog.close();
                    }
                }),
            $content = Ox.Element().css(getContentCSS(data)),
            $input = Ox.FileInput({
                    maxFiles: data.id == 'file' ? 1 : -1,
                    value: data.files,
                    width: 256
                })
                .css({top: '16px', marginBottom: '16px'})
                .bindEvent({
                    change: function(data) {
                        showEvent(data);
                        $content.css(getContentCSS(data));
                    }
                })
                .appendTo($content),
            $dialog = Ox.Dialog({
                    buttons: [$button],
                    content: $content,
                    height: 129,
                    keys: {escape: 'close'},
                    title: data.title.replace('...', ''),
                    width: 288 + (data.id == 'file' ? 0 : Ox.UI.SCROLLBAR_SIZE)
                })
                .open();
        function getContentCSS(data) {
            return {height: 49 + (data.files || data.value).length * 16 + 'px'};
        }
    }

    /*
    Whenever any of our FileButtons fires a `click` event, or any of our
    FileInputs fires a `change` event, we display the event data. Note that we
    have to transform the file object to a regular object before we can pass it
    to the list.
    */
    function showEvent(data) {
        var key = data.files ? 'files' : 'value';
        data[key] = data[key].map(function(file) {
            var object = {};
            Object.keys(file).forEach(function(key) {
                object[key] = file[key];
            });
            return object;
        });
        $list.options({data: data});
    }

});
