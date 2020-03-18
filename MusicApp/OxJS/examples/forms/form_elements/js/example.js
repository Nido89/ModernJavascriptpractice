/*
This example demonstrates various form elements provided by Ox.UI.
*/

'use strict';

Ox.load({Geo: {}, UI: {}, Unicode: {}}, function() {
    var countries = Ox.sortASCII(Ox.COUNTRIES.filter(function(country) {
            return !country.dissolved && !country.disputed && !country.exception;
        }).map(function(country) {
            return country.name;
        })),
        elements = {
            ArrayInput: {
                description: 'Allows you to enter an array of strings.',
                options: [
                    {
                        description: 'Array input',
                        max: 3,
                        width: 256
                    },
                    {
                        description: 'Array input with label',
                        label: 'Please enter up to 3 names',
                        max: 3,
                        width: 256
                    },
                    {
                        description: 'Custom array input with label',
                        input: {
                            get: function() {
                                var $input = Ox.FormElementGroup({
                                    elements: [
                                        Ox.Select({
                                            items: [
                                                {id: 'home', title: 'Home'},
                                                {id: 'work', title: 'Work'},
                                                {id: 'mobile', title: 'Mobile'}
                                            ],
                                            overlap: 'right',
                                            width: 80
                                        })
                                        .bindEvent({
                                            change: function() {
                                                $input.options('elements')[1]
                                                    .focusInput();
                                            }
                                        }),
                                        Ox.Input({
                                            autovalidate: /[\d\s\.+\-\/]/,
                                            width: 128
                                        })
                                    ]
                                });
                                return $input
                            },
                            getEmpty: function() {
                                return ['home', ''];
                            },
                            isEmpty: function(value) {
                                return value[1] === '';
                            }
                        },
                        label: 'Please enter up to 3 phone numbers',
                        max: 3,
                        width: 256
                    }
                ]
            },
            Button: {
                description: 'Can be used as a form element '
                    + '(i.e. has a value and fires change events) '
                    + 'when it\'s selectable, or has multiple values.',
                options: [
                    {
                        description: 'Selectable image button with tooltip',
                        selectable: true,
                        title: 'like',
                        tooltip: 'Like',
                        type: 'image'
                    },
                    {
                        description: 'Multi-value image button with tooltip',
                        tooltip: ['Lock', 'Unlock'],
                        type: 'image',
                        values: [
                            {id: 'unlocked', title: 'lock'},
                            {id: 'locked', title: 'unlock'}
                        ]
                    },
                    {
                        description: 'Selectable button',
                        selectable: true,
                        title: 'Select me'
                    },
                    {
                        description: 'Multi-value button with fixed width',
                        values: [
                            {id: 'off', title: 'Off'},
                            {id: 'on', title: 'On'}
                        ],
                        width: 64
                    }
                ]
            },
            ButtonGroup: {
                description: 'Works as a form element when it\'s selectable.',
                options: [
                    {
                        description: 'Image buttons, select one',
                        buttons: [
                            {id: 'grid', title: 'grid'},
                            {id: 'iconlist', title: 'iconlist'},
                            {id: 'list', title: 'list'},
                            {id: 'columns', title: 'columns'}
                        ],
                        selectable: true,
                        type: 'image'
                    },
                    {
                        description: 'Image buttons, select any',
                        buttons: [
                            {id: 'check', title: 'check'},
                            {id: 'flag', title: 'flag'},
                            {id: 'like', title: 'like'},
                            {id: 'star', title: 'star'}
                        ],
                        max: -1,
                        min: 0,
                        selectable: true,
                        type: 'image'
                    },
                    {
                        description: 'Text buttons, select one',
                        buttons: [
                            {id: 'a', title: 'Select me'},
                            {id: 'b', title: 'or select me'},
                            {id: 'c', title: 'or select me'}
                        ],
                        selectable: true
                    },
                    {
                        description: 'Text buttons, select one or two',
                        buttons: [
                            {id: 'a', title: 'Select me'},
                            {id: 'b', title: 'and select me'},
                            {id: 'c', title: 'or select me'}
                        ],
                        max: 2,
                        min: 1,
                        selectable: true
                    },
                    {
                        description: 'Text buttons, select two',
                        buttons: [
                            {id: 'a', title: 'Select me'},
                            {id: 'b', title: 'and select me'},
                            {id: 'c', title: 'or select me'}
                        ],
                        max: 2,
                        min: 2,
                        selectable: true
                    },
                    {
                        description: 'Text buttons, select any',
                        buttons: [
                            {id: 'a', title: 'Select me'},
                            {id: 'b', title: 'and select me'},
                            {id: 'c', title: 'and select me'}
                        ],
                        max: -1,
                        min: 0,
                        selectable: true
                    }
                ]
            },
            Checkbox: {
                description: 'Has a value of either true or false',
                options: [
                    {
                        description: 'Checkbox',
                    },
                    {
                        description: 'Checkbox with label',
                        label: 'Check me',
                        labelWidth: 112, // fixme
                        width: 128
                    },
                    {
                        description: 'Checkbox with title',
                        title: 'Check me',
                        width: 128
                    },
                    {
                        description: 'Checkbox, indeterminate',
                        indeterminate: true
                    }
                ]
            },
            CheckboxGroup: {
                description: 'Combines multiple checkboxes',
                options: [
                    {
                        description: 'Checkboxes, select one',
                        checkboxes: [
                            {id: 'a', title: 'Check me'},
                            {id: 'b', title: 'or check me'},
                            {id: 'c', title: 'or check me'}
                        ],
                        width: 360
                    },
                    {
                        description: 'Checkboxes, select one or two',
                        checkboxes: [
                            {id: 'a', title: 'Check me'},
                            {id: 'b', title: 'and check me'},
                            {id: 'c', title: 'or check me'}
                        ],
                        max: 2,
                        min: 1,
                        width: 360
                    },
                    {
                        description: 'Checkboxes, select two',
                        checkboxes: [
                            {id: 'a', title: 'Check me'},
                            {id: 'b', title: 'and check me'},
                            {id: 'c', title: 'or check me'}
                        ],
                        max: 2,
                        min: 2,
                        width: 360
                    },
                    {
                        description: 'Checkboxes, select any',
                        checkboxes: [
                            {id: 'a', title: 'Check me'},
                            {id: 'b', title: 'and check me'},
                            {id: 'c', title: 'and check me'}
                        ],
                        max: -1,
                        min: 0,
                        width: 360
                    },
                    {
                        description: 'Checkboxes as a list, select one',
                        checkboxes: [
                            {id: 'a', title: 'Check me'},
                            {id: 'b', title: 'or check me'},
                            {id: 'c', title: 'or check me'}
                        ],
                        type: 'list',
                        width: 360                        
                    }
                ]
            },
            ColorInput: {
                description: 'Allows you to enter a RGB or HSL value.',
                options: [
                    {
                        description: 'RGB',
                        value: [255, 0, 0]
                    },
                    {
                        description: 'HSL',
                        mode: 'hsl'
                    }
                ]
            },
            DateInput: {
                description: 'Allows you to enter a date.',
                options: [
                    {
                        description: 'Short date input'
                    },
                    {
                        description: 'Medium date input',
                        format: 'medium'
                    },
                    {
                        description: 'Long date input',
                        format: 'long'
                    },
                    {
                        description: 'Medium date input with weekday',
                        format: 'medium',
                        weekday: true
                    },
                    {
                        description: 'Long date input with weekday',
                        format: 'long',
                        weekday: true
                    }
                ]
            },
            DateTimeInput: {
                description: 'Allows you to enter a date and a time.',
                options: [
                    {
                        description: 'Short date/time input with am/pm',
                        ampm: true
                    },
                    {
                        description: 'Medium date/time input with seconds',
                        format: 'medium',
                        seconds: true
                    },
                    {
                        description: 'Long date/time input with weekday',
                        format: 'long',
                        weekday: true
                    }
                ]
            },
            FormElementGroup: {
                description: 'Combines multiple form elements.',
                options: [
                    {
                        description: 'Two Selects and one DateInput',
                        elements: [
                            Ox.Select({
                                items: [
                                    {id: 'departure', title: 'Departure'},
                                    {id: 'arrival', title: 'Arrival'}
                                ],
                                overlap: 'right',
                                width: 96
                            }),
                            Ox.Select({
                                items: [
                                    {id: 'before', title: 'is before'},
                                    {id: 'after', title: 'is after'}
                                ],
                                overlap: 'right',
                                width: 96
                            }),
                            Ox.DateInput()
                        ]
                    }
                ]
            },
            Input: {
                description: 'Is a standard text input element, with various options.',
                options: [
                    {
                        description: 'Integer between 0 and 100',
                        arrows: true,
                        max: 100,
                        min: 0,
                        type: 'int'
                    },
                    {
                        description: 'Input with text',
                        value: 'Text'
                    },
                    {
                        description: 'Disabled input with text',
                        disabled: true,
                        value: 'Text'
                    },
                    {
                        description: 'Input with placeholder',
                        placeholder: 'Placeholder'
                    },
                    {
                        description: 'Input with label',
                        label: 'Label'
                    },
                    {
                        description: 'Input with clear button',
                        clear: true
                    },
                    {
                        description: 'Autocomplete with replace',
                        autocomplete: countries,
                        autocompleteReplace: true,
                        width: 256
                    },
                    {
                        description: 'Autocomplete with replace and correct',
                        autocomplete: countries,
                        autocompleteReplace: true,
                        autocompleteReplaceCorrect: true,
                        width: 256
                    },
                    {
                        description: 'Autocomplete with select and highlight',
                        autocomplete: countries,
                        autocompleteSelect: true,
                        autocompleteSelectHighlight: true,
                        width: 256
                    },
                    {
                        description: 'Autocomplete with replace and select',
                        autocomplete: countries,
                        autocompleteReplace: true,
                        autocompleteSelect: true,
                        width: 256
                    },
                    {
                        description: 'Autocomplete with replace, correct and select',
                        autocomplete: countries,
                        autocompleteReplace: true,
                        autocompleteReplaceCorrect: true,
                        autocompleteSelect: true,
                        width: 256
                    },
                    {
                        description: 'Password',
                        type: 'password',
                        width: 256
                    },
                    {
                        description: 'Password with label, placeholder and clear button',
                        clear: true,
                        label: 'Label',
                        placeholder: 'Placeholder',
                        type: 'password',
                        width: 256
                    },
                    //{
                    //    description: 'Textarea with label',
                    //    height: 128,
                    //    label: 'Label',
                    //    type: 'textarea',
                    //    width: 256
                    //},
                    {
                        description: 'Textarea with placeholder',
                        height: 128,
                        placeholder: 'Placeholder',
                        type: 'textarea',
                        width: 256
                    }
                ]
            },
            InputGroup: {
                description: 'Combines multiple input elements and separators.',
                options: [
                    {
                        description: 'Two Inputs',
                        inputs: [
                            Ox.Input({
                                id: 'width',
                                placeholder: 'Width',
                                //type: 'int',
                                width: 64
                            }),
                            Ox.Input({
                                id: 'height',
                                placeholder: 'Height',
                                //type: 'int',
                                width: 64
                            })
                        ],
                        separators: [
                            {title: '×', width: 16}
                        ]
                    },
                    {
                        description: 'A Checkbox, an Input, and two Selects',
                        inputs: [
                            Ox.Checkbox({
                                width: 16
                            }),
                            Ox.FormElementGroup({
                                elements: [
                                    Ox.Input({
                                        type: 'int',
                                        width: 64
                                    }),
                                    Ox.Select({
                                        items: [
                                            {id: 'items', title: 'items'},
                                            {id: 'hours', title: 'hours'},
                                            {id: 'gb', title: 'GB'},
                                        ],
                                        overlap: 'left',
                                        width: 64
                                    }),
                                ],
                                float: 'right',
                                width: 128
                            }),
                            Ox.Select({
                                items: [
                                    {id: 'title', title: 'Title'},
                                    {id: 'director', title: 'Director'},
                                    {id: 'year', title: 'Year'}
                                ],
                                value: 'title',
                                width: 128
                            })
                        ],
                        separators: [
                            {title: 'Limit to', width: 64},
                            {title: 'sorted by', width: 64}
                        ]
                    }
                ]
            },
            ObjectArrayInput: {
                description: 'Allows you to enter an array of objects.',
                options: [
                    {
                        description: 'Multiple contacts',
                        buttonTitles: {
                            add: 'Add contact',
                            remove: 'Remove contact'
                        },
                        inputs: [
                            {
                                element: 'Input',
                                options: {id: 'firstname', label: 'First Name'}
                            },
                            {
                                element: 'Input',
                                options: {id: 'lastname', label: 'Last Name'}
                            },
                            {
                                element: 'ArrayInput',
                                options: {id: 'phone', label: 'Phone Numbers', max: 3}
                            },
                            {
                                element: 'Input',
                                options: {id: 'email', label: 'E-Mail Address'}
                            },
                        ]
                    }
                ]
            },
            ObjectInput: {
                description: 'Combines multiple key/value pairs.',
                options: [
                    {
                        description: 'Contact object',
                        elements: [
                            Ox.Input({id: 'firstname', label: 'First Name'}),
                            Ox.Input({id: 'lastname', label: 'Last Name'}),
                            Ox.ArrayInput({id: 'phone', label: 'Phone Numbers', max: 3}),
                            Ox.Input({id: 'email', label: 'E-Mail Address'})
                        ]
                    }
                ]
            },
            Range: {
                description: 'Is a horizontal slider.',
                options: [
                    {
                        description: 'On/off switch',
                        max: 1,
                        min: 0,
                        size: 48,
                        thumbSize: 32,
                        thumbValue: true,
                        values: ['Off', 'On']
                    },
                    {
                        description: 'A value between 0 and 10',
                        arrows: true,
                        max: 10,
                        min: 0,
                        size: 360,
                        thumbSize: 32,
                        thumbValue: true
                    },
                    {
                        description: 'One of six colors',
                        size: 360,
                        thumbValue: true,
                        trackColors: [
                            'rgb(255, 0, 0)',
                            'rgb(255, 255, 0)',
                            'rgb(0, 255, 0)',
                            'rgb(0, 255, 255)',
                            'rgb(0, 0, 255)',
                            'rgb(255, 0, 255)'
                        ],
                        values: ['Red', 'Yellow', 'Green', 'Cyan', 'Blue', 'Magenta']
                    },
                    {
                        description: 'A value between 0 and 359',
                        max: 359,
                        min: 0,
                        size: 360,
                        thumbSize: 36,
                        thumbValue: true,
                        trackColors: [
                            'rgb(255, 0, 0)',
                            'rgb(255, 255, 0)',
                            'rgb(0, 255, 0)',
                            'rgb(0, 255, 255)',
                            'rgb(0, 0, 255)',
                            'rgb(255, 0, 255)',
                            'rgb(255, 0, 0)'
                        ],
                        trackGradient: true
                    }
                ]
            },
            Select: {
                description: 'Is a select element.',
                options: [
                    {
                        description: 'Image select, select one',
                        items: [
                            {id: 'a', title: 'Select me'},
                            {id: 'b', title: 'or select me'},
                            {id: 'c', title: 'or select me'}
                        ],
                        type: 'image',
                        width: 16 // fixme!
                    },
                    {
                        description: 'Text select with label, select one',
                        items: [
                            {id: 'a', title: 'Select me'},
                            {id: 'b', title: 'or select me'},
                            {id: 'c', title: 'or select me'}
                        ],
                        label: 'Please select...',
                        labelWidth: 128
                    },
                    {
                        description: 'Text select with title, select one or two',
                        items: [
                            {id: 'a', title: 'Select me'},
                            {id: 'b', title: 'and select me'},
                            {id: 'c', title: 'or select me'}
                        ],
                        max: 2,
                        min: 1,
                        title: 'Please select...'
                    },
                    {
                        description: 'Text select with title, select two',
                        items: [
                            {id: 'a', title: 'Select me'},
                            {id: 'b', title: 'and select me'},
                            {id: 'c', title: 'or select me'}
                        ],
                        max: 2,
                        min: 2,
                        title: 'Please select...'
                    },
                    {
                        description: 'Text select with title, select any',
                        items: [
                            {id: 'a', title: 'Select me'},
                            {id: 'b', title: 'and select me'},
                            {id: 'c', title: 'and select me'}
                        ],
                        max: -1,
                        min: 0,
                        title: 'Please select...'
                    }
                ]
            },
            SelectInput: {
                description: 'Is a select element with optional text input.',
                options: [
                    {
                        items: [
                            {id: 'javascript', title: 'JavaScript'},
                            {id: 'python', title: 'Python'},
                            {id: 'other', title: 'Other...'}
                        ],
                        value: 'javascript',
                        width: 256
                    }
                ]
            },
            Spreadsheet: {
                description: 'Combines a variable number of columns and rows.',
                options: [
                    {
                        title: 'Budget',
                        value: {
                            columns: [2010, 2011, 2012],
                            rows: ['Item A', 'Item B', 'Item C']
                        }
                    }
                ]
            },
            TimeInput: {
                description: 'Allows you to enter a time.',
                options: [
                    {
                        description: 'Time input with am/pm',
                        ampm: true
                    },
                    {
                        description: 'Time input with seconds',
                        seconds: true
                    },
                    {
                        description: 'Time input with milliseconds',
                        milliseconds: true
                    }
                ]
            }
        },
        $form = Ox.FormPanel({
            form: Object.keys(elements).sort().map(function(name) {
                var element = elements[name]; 
                return {
                    id: name.toLowerCase(),
                    title: name,
                    description: '<code>Ox.' + name + '</code> '
                        + element.description[0].toLowerCase()
                        + element.description.slice(1),
                    descriptionWidth: 360,
                    items: element.options.map(function(options, i) {
                        return Ox[name](Ox.extend(options, {
                            id: Ox.char(97 + i),
                            description: Ox.char(65 + i) + '. '
                                + options.description
                        }));
                    }),
                    validate: function() {
                        return true;
                    }
                }
            })
        })
        .bindEvent({
            change: showValues,
            select: showValues
        }),

        $list = Ox.Element(),

        $panel = Ox.SplitPanel({
                elements: [
                    {
                        element: $form
                    },
                    {
                        element: $list,
                        resizable: true,
                        resize: [256],
                        size: 256
                    }
                ],
                orientation: 'horizontal'
            })
            .appendTo(Ox.$body);

    showValues({section: 'arrayinput'});

    function showValues(data) {
        setTimeout(function() {
            $panel.replaceElement(1,
                Ox.TreeList({
                    data: Ox.extend(
                        {}, data.section, $form.values()[data.section]
                    ),
                    expanded: true,
                    width: 256 - Ox.UI.SCROLLBAR_SIZE
                })
            );
        }, 250);
    }

});
