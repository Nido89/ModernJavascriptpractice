'use strict';
window.onerror = function(error, url) {
    if (!url) {
        document.onreadystatechange = function() {
            if (document.readyState == 'complete') {
                var logo = new Image();
                logo.onload = function() {
                    var warning = document.createElement('div');
                    warning.innerHTML = 'Please open this file over HTTP.';
                    warning.style.margin = '16px';
                    document.body.appendChild(warning);
                }
                logo.src = 'source/UI/themes/oxlight/png/logo128.png';
                document.body.style.backgroundColor = 'rgb(224, 224, 224)';
                document.body.style.color = 'rgb(64, 64, 64)';
                document.body.style.fontFamily = [
                    'Lucida Grande', 'Segoe UI', 'DejaVu Sans',
                    'Lucida Sans Unicode', 'Helvetica', 'Arial', 'sans-serif'
                ].join(', ');
                document.body.style.fontSize = '13px';
                document.body.style.margin = Math.floor(
                    window.innerHeight / 2
                ) - 128 + 'px';
                document.body.style.textAlign = 'center';
                document.body.appendChild(logo);
            }
        };
    }
};
Ox.load(/^https?:\/\/(www\.)?oxjs\.org\//.test(
    window.location.href
), function() {
    var app = window.oxjs = {
        $ui: {},
        animate: function() {
            var home = app.url.parse().page == '';
            app.state.animating = true;
            if (home) {
                app.$ui.logo.attr({src: app.getSRC('logo')});
                app.$ui.screen.show();
                app.$ui.label.show();
                app.$ui.menu.options({value: ''}).show();
            } else {
                app.$ui.menu.options({value: app.user.page});
            }
            app.$ui.panel.find('.OxButtonGroup').css({opacity: 0});
            [
                'screen', 'logo', 'label', 'menu', 'switch'
            ].forEach(function(element) {
                app.$ui[element].stop().animate(
                    app.getCSS(element),
                    500,
                    element == 'screen' ? function() {
                        if (!home) {
                            app.$ui.logo.attr({src: app.getSRC('logo')});
                            app.$ui.panel.find('.OxButtonGroup').css({
                                opacity: 1
                            });
                            app.$ui.screen.hide();
                            app.$ui.label.hide();
                            app.$ui.menu.hide().options({value: ''});
                        }
                        app.state.animating = false;
                    } : void 0
                );
            });
        },
        data: {
            downloads: {},
            html: {},
            legacyThemes: {classic: 'oxlight', modern: 'oxdark'},
            pages: [
                {id: 'about', title: 'About'},
                {id: 'readme', title: 'Readme'},
                {id: 'examples', title: 'Examples'},
                {id: 'doc', title: 'Documentation'},
                {id: 'download', title: 'Download'},
                {id: 'development', title: 'Development'}
            ],
            user: {
                item: {doc: '', examples: '', readme: ''},
                page: '',
                previousPage: 'about',
                theme: 'oxlight'
            },
            warning: 'Aw, snap! This website requires an up-to-date, '
                + 'HTML5-compliant web browser. '
                + 'It should work fine in current versions of '
                + '<a href="http://google.com/chrome/">Chrome</a>, '
                + '<a href"http://mozilla.org/firefox/">Firefox</a> and '
                + '<a href="http://apple.com/safari/">Safari</a>, or '
                + 'Internet Explorer with '
                + '<a href="http://google.com/chromeframe/">'
                + 'Chrome Frame</a> installed. '
                + 'To proceed at your own risk, click on the logo above.'
        },
        db: Ox.localStorage('OxJS'),
        getCSS: function(element) {
            var css = {},
                home = app.url.parse().page == '',
                center = Math.floor(window.innerWidth / 2),
                middle = Math.floor(window.innerHeight / 2);
            if (element == 'label') {
                css = home ? {
                    top: middle + 16 + 'px',
                    left: center - 128 + 'px',
                    width: '242px',
                    height: '16px',
                    fontSize: '12px',
                    opacity: 1,
                    overflow: 'visible'
                } : {
                    top: '35px',
                    left: '4px',
                    width: '40px',
                    height: '4px',
                    fontSize: '1px',
                    opacity: 0
                }
            } else if (element == 'loading') {
                css.top = middle + 52 + 'px'
            } else if (element == 'logo') {
                css = home || !app.state.loaded ? {
                    left: center - 128 + 'px',
                    top: middle - 128 + 'px',
                    width: '256px',
                    height: '128px',
                    borderRadius: '32px'
                } : {
                    top: '6px',
                    left: '6px',
                    width: '48px',
                    height: '24px',
                    borderRadius: '6px'
                };
            } else if (element == 'menu') {
                css = home ? {
                    top: middle + 56 + 'px',
                    left: Math.ceil(center - app.$ui.menu.width() / 2) + 'px'
                } : {
                    top: '6px',
                    left: Math.ceil(center - app.$ui.menu.width() / 2) + 'px'
                };
            } else if (element == 'screen') {
                css.opacity = home ? 1 : 0;
            } else if (element == 'switch') {
                css = home ? {
                    top: middle + 96 + 'px',
                    right: Math.floor(center - app.$ui.switch.width() / 2) + 'px'
                } : {
                    top: '6px',
                    right: '6px'
                };
            } else if (element == 'warning') {
                css = {
                    left: center - 128 + 'px',
                    top: middle + 16 + 'px',
                };
            }
            return css;
        },
        getSRC: function(element) {
            return 'min/UI/themes/' + app.user.theme + '/' + {
                icon: 'png/icon16.png',
                loading: 'svg/symbolLoading.svg',
                logo: 'png/logo128.png'
            }[element];
        },
        init: function() {
            app.user = Ox.extend(app.data.user, app.db());
            app.user.theme = app.data.legacyThemes[app.user.theme]
                || app.user.theme;
            app.loadScreen(function() {
                app.loadData(function() {
                    Ox.load('UI', {theme: app.user.theme}, app.load);
                });
            });
        },
        load: function(browserSupported) {
            var data = app.url.parse();
            app.user.page = data.page;
            if (data.item && data.page in app.user.item) {
                app.user.item[data.page] = data.item;
            }
            app.db(app.user);
            app.$ui.panel = app.ui.panel()
                .select(app.user.page)
                .appendTo(Ox.$body);
            // jquerify so that we can animate
            ['screen', 'logo', 'loading'].forEach(function(element) {
                app.$ui[element] = $('.' + element);
            });
            app.$ui.loading.animate({opacity: 0}, 500, function() {
                app.$ui.loading.remove();
            });
            if (!browserSupported) {
                app.$ui.warning = app.ui.warning()
                    .css(app.getCSS('warning'))
                    .appendTo(Ox.$body);
                app.$ui.logo
                    .css({cursor: 'pointer'})
                    .one({
                        click: function() {
                            app.$ui.warning.remove();
                            app.load(true);
                        }
                    });
            } else if (!data.page) {
                app.$ui.logo
                    .css({cursor: 'pointer'})
                    .on({click: app.toggle});
                ['label', 'menu', 'switch'].forEach(function(element) {
                    app.$ui[element] = app.ui[element]()
                        .css({opacity: 0})
                        .appendTo(Ox.$body);
                    app.$ui[element]
                        .css(app.getCSS(element))
                        .animate({opacity: 1}, 500);
                });
            } else {
                ['label', 'menu', 'switch'].forEach(function(element) {
                    app.$ui[element] = app.ui[element]().appendTo(Ox.$body);
                    app.$ui[element].css(app.getCSS(element)).hide();
                });
                app.$ui.screen.animate({opacity: 0}, 500, function() {
                    app.$ui.screen.hide();
                });
                app.$ui.logo.animate({opacity: 0}, 500, function() {
                    app.$ui.logo
                        .attr({src: app.getSRC('logo')})
                        .css(app.getCSS('logo'))
                        .animate({opacity: 1}, 500, function() {
                            app.$ui.logo
                                .css({cursor: 'pointer'})
                                .on({click: app.toggle});
                        });
                    app.$ui.switch.css({opacity: 0}).show()
                        .animate({opacity: 1}, 500);
                });
            }
            Ox.$window.on({hashchange: app.url.change});
            app.state.loaded = true;
        },
        loadData: function(callback) {
            var q = '?' + salt,
                url = '//oxjs.org/downloads/downloads.json' + q;
            Ox.getJSON('index.json' + q, function(data) {
                app.data = Ox.extend(app.data, data);
                app.data.pages.forEach(function(page) {
                    var id = page.id == 'doc' ? 'documentation' : page.id;
                    Ox.get('readme/index/' + id + '.html' + q, function(html) {
                        app.data.html[id] = html;
                        if (Ox.len(app.data.html) == app.data.pages.length) {
                            navigator.onLine ? Ox.getJSON(url, function(data) {
                                app.data.downloads = data;
                                callback();
                            }) : callback();
                        }
                    });
                });
            });
        },
        loadScreen: function(callback) {
            app.setTheme(app.user.theme);
            app.$ui.screen = app.ui.screen();
            app.$ui.loading = app.ui.loading();
            app.$ui.logo = app.ui.logo().one({
                load: function() {
                    Ox.$('body')
                        .append(app.$ui.screen)
                        .append(app.$ui.logo)
                        .append(app.$ui.loading);
                    app.rotate();
                    callback();
                }
            });
            Ox.$(window).on({resize: app.resize});
        },
        patchButtonGroup: function($buttonGroup) {
            $buttonGroup.find('.OxButton').css({
                height: '22px',
                paddingLeft: '8px',
                paddingRight: '8px',
                fontSize: '13px'
            }).find('.OxButton:first-child').css({
                borderTopLeftRadius: '6px',
                borderBottomLeftRadius: '6px'
            }).find('.OxButton:last-child').css({
                borderTopRightRadius: '6px',
                borderBottomRightRadius: '6px'
            });
            return $buttonGroup;
        },
        re: {
            code: [
                new RegExp(
                    '<span class="OxIdentifier">Ox</span>'
                    + '(<span class="OxOperator">\\.</span>'
                    + '<span class="OxIdentifier">UI</span>)?'
                    + '<span class="OxOperator">\\.</span>'
                    + '<span class="Ox\\w+">([\\w\\$]+)<\\/span>',
                    'g'
                ),
                function(match) {
                    var string = Ox.stripTags(match);
                    return string == 'Ox.My' ? string
                        : '<a href="#doc/' + string
                            + '" class="doclink">' + match + '</a>';
                }
            ],
            comment: [
                /\b(Ox\.[\w\$]+)/g,
                function(match) {
                    return match == 'Ox.My' ? match
                        : '<a href="#doc/' + match
                            + '" class="OxMonospace doclink">' + match + '</a>'
                }
            ],
            size: [
                /\{size\.(\w+)\}/g,
                function(match, key) {
                    return app.data.downloads.size ? ' (' + Ox.formatValue(
                        app.data.downloads.size[key], 'B'
                    ) + ')' : '';
                }
            ],
            version: [
                '{version}',
                function() {
                    var version = app.data.downloads.version,
                        current = 'You\'re currently running version '
                            + Ox.VERSION + '.',
                        latest = version ? 'The latest version is ' + version
                            + ' (' + app.data.downloads.date.slice(0, 10)
                            + ').' : '';
                    return version ? latest + (
                        /^https?:\/\/(www\.)?oxjs\.org\//.test(
                            window.location.href
                        ) ? ''
                        : version == Ox.VERSION ? ' You\'re up to date.'
                        : ' ' + current
                    ) : current;
                }
            ]
        },
        resize: function() {
            [
                'logo', 'loading', 'label', 'menu', 'switch'
            ].forEach(function(element) {
                app.$ui[element] && app.$ui[element].css(app.getCSS(element));
            });
        },
        rotate: function() {
            var css, deg = 0,
                previousTime = +new Date(),
                interval;
            function step() {
                var currentTime = +new Date(),
                    delta = (currentTime - previousTime) / 1000,
                    loadingIcon = document.getElementById('loadingIcon'),
                    next = Math.round((deg + delta * 360) % 360 / 30) * 30;
                if (loadingIcon) {
                    if (deg != next) {
                        previousTime = currentTime;
                        deg = next;
                        css = 'rotate(' + deg + 'deg)';
                        loadingIcon.style.MozTransform = css;
                        loadingIcon.style.MSTransform = css;
                        loadingIcon.style.OTransform = css;
                        loadingIcon.style.WebkitTransform = css;
                        loadingIcon.style.transform = css;
                    }
                    if (window.requestAnimationFrame !== undefined) {
                        window.requestAnimationFrame(step);
                    }
                } else if (window.requestAnimationFrame === undefined) {
                    clearInterval(interval);

                }
            };
            if (window.requestAnimationFrame !== undefined) {
                window.requestAnimationFrame(step);
            } else {
                interval = setInterval(step, 83);
            }
        },
        setTheme: function(theme) {
            app.user.theme = theme;
            app.db(app.user);
            (Ox.$('#icon') || Ox.$('<link>').attr({
                id: 'icon',
                rel: 'shortcut icon',
                type: 'image/png'
            }).appendTo(Ox.$('head'))).attr({
                href: app.getSRC('icon')
            });
            app.$ui.logo && app.$ui.logo
                .attr({src: app.getSRC('logo')})
                .css(app.getCSS('logo'));
            Ox.Theme
                ? Ox.Theme(theme)
                : Ox.$('body').addClass('OxTheme' + Ox.toTitleCase(theme));
        },
        state: {
            animating: false,
            loaded: false
        },
        toggle: function() {
            !app.state.animating && app.url.push(
                app.url.parse().page ? {
                        page: '',
                        item: ''
                    } : {
                        page: app.user.previousPage,
                        item: app.user.previousPage in app.user.item
                            ? app.user.item[app.user.previousPage] : ''
                    }
            );
        },
        ui: {
            doc: function() {
                return Ox.DocPanel({
                        element: $('<div>')
                            .addClass('page')
                            .css({
                                margin: '32px',
                                width: window.innerWidth - 640 + 'px'
                            })
                            .html(app.data.html.documentation),
                        examples: app.data.docItems ? null : app.data.examples,
                        examplesPath: app.data.docItems ? null : 'examples/',
                        files: app.data.docItems ? null : app.data.documentation,
                        getModule: function(item) {
                            return item.file.replace(/^dev\//, '')
                                .split('/')[0];
                        },
                        getSection: function(item) {
                            return item.section
                                || item.file.replace(/^dev\//, '')
                                    .split('/')[2].split('.')[0];
                        },
                        items: app.data.docItems || null,
                        path: 'dev/',
                        references: /\b(Ox\.[\w\$]+(?=\W))/g,
                        replace: [app.re.code],
                        results: app.data.testResults || null,
                        selected: app.user.item.doc,
                        showLoading: true,
                        showTests: true
                    })
                    .bindEvent({
                        example: function(data) {
                            app.url.push({page: 'examples', item: data.id});
                        },
                        select: function(data) {
                            app.url.push({item: data.id});
                        }
                    })
                    .bindEventOnce({
                        load: function(data) {
                            app.data.docItems = data.items;
                        },
                        tests: function(data) {
                            app.data.testResults = data.results;
                        }
                    });
            },
            examples: function() {
                return Ox.ExamplePanel({
                        element: $('<div>')
                            .addClass('page')
                            .css({
                                margin: '32px',
                                width: window.innerWidth - 640 + 'px'
                            })
                            .html(app.data.html.examples),
                        examples: app.data.examples,
                        mode: app.url.parse().mode || 'source',
                        path: 'examples/',
                        references: /\b(Ox\.[\w\$]+(?=\W))/g,
                        replaceCode: [app.re.code],
                        replaceComment: [app.re.comment],
                        selected: app.user.item.examples
                    })
                    .bindEvent({
                        change: function(data) {
                            app.url.push({
                                mode: data.value == 'live' ? 'live' : ''
                            });
                        },
                        select: function(data) {
                            app.url.push({item: data.id});
                        }
                    });
            },
            label: function() {
                return Ox.Label({
                        textAlign: 'center',
                        title: 'A JavaScript Library for Web Applications',
                        width: 256
                    })
                    .addClass('label animate')
                    .css({
                        paddingTop: '4px',
                        paddingBottom: '4px',
                        borderRadius: '6px'
                    });
            },
            loading: function() {
                return Ox.$('<img>')
                    .addClass('loading')
                    .attr({id: 'loadingIcon', src: app.getSRC('loading')})
                    .css(app.getCSS('loading'));
            },
            logo: function() {
                return Ox.$('<img>')
                    .addClass('logo animate')
                    .attr({src: app.getSRC('logo')})
                    .css(app.getCSS('logo'));
            },
            menu: function() {
                return app.patchButtonGroup(
                    Ox.ButtonGroup({
                        buttons: app.data.pages,
                        min: 0,
                        selectable: true,
                    })
                    .addClass('menu animate')
                    .bindEvent({
                        change: function(data) {
                            data.value && app.url.push({page: data.value});
                        }
                    })
                );
            },
            page: function(page, replace) {
                return Ox.Container().append(
                    $('<div>').addClass('OxSelectable page').html(
                        app.data.html[page]
                            .replace(app.re.size[0], app.re.size[1])
                            .replace(app.re.version[0], app.re.version[1])
                    )
                );
            },
            panel: function() {
                var $panel = Ox.TabPanel({
                        content: function(id) {
                            app.$ui[id] && app.$ui[id].remove();
                            return app.$ui[id] = app.ui[id]
                                ? app.ui[id]() : app.ui.page(id);
                        },
                        size: 36,
                        tabs: app.data.pages
                    })
                    .bindEvent({
                        change: function(data) {
                            if (app.state.loaded) {
                                app.url.push({page: data.selected});
                            }
                        }
                    });
                app.patchButtonGroup(
                    $panel.find('.OxButtonGroup').css({top: '6px'})
                );
                return $panel;
            },
            readme: function() {
                var $list = Ox.Container()
                        .css({overflowY: 'scroll'})
                        .on({
                            click: function(e) {
                                var $target = $(e.target),
                                    $parent = $target.parent();
                                if ($parent.is('.item')) {
                                    $target = $parent;
                                }
                                selectItem(
                                    $target.is('.item') && (
                                        $target.is(':not(.selected)')
                                        || !e.metaKey
                                    ) ? $target.attr('id') : ''
                                );
                            }
                        }),
                    $text = Ox.Container()
                        .addClass('OxSerif OxSelectable text'),
                    $panel = Ox.SplitPanel({
                            elements: [
                                {element: $list, size: 256},
                                {element: $text}
                            ],
                            orientation: 'horizontal'
                        })
                        .update(function(key, value) {
                            key == 'selected' && selectItem(value);
                        })
                        .addClass('readme');
                Ox.sortBy(app.data.readme, '-date').forEach(function(item, i) {
                    var $item = $('<div>')
                        .addClass('item')
                        .attr({id: item.id})
                        .css({width: 224 - Ox.UI.SCROLLBAR_SIZE + 'px'})
                        .appendTo($list);
                    $('<div>')
                        .addClass('OxSerif title')
                        .html(item.title)
                        .appendTo($item);
                    $('<div>')
                        .addClass('OxSerif OxLight date')
                        .html(Ox.formatDate(item.date, '%B %e, %Y', true))
                        .appendTo($item);
                });
                selectItem(app.user.item.readme);
                function selectItem(id) {
                    if (id && !Ox.getObjectById(app.data.readme, id)) {
                        id = '';
                    }
                    $panel.find('.item.selected').removeClass('selected');
                    id && $panel.find('.item#' + id).addClass('selected');
                    Ox.get('readme/' + (
                        id || 'index/readme'
                    ) + '.html?' + salt, function(html) {
                        $text.empty()
                            .append(
                                id ? html
                                : $('<div>')
                                    .addClass('page')
                                    .css({
                                        margin: '16px',
                                        width: window.innerWidth - 640 + 'px'
                                    })
                                    .html(html)
                            )
                            .find('.code').each(function() {
                                var $this = $(this);
                                $this.replaceWith(
                                    Ox.SyntaxHighlighter({
                                        source: $this.text()
                                    })
                                    .attr({id: $this.attr('id')})
                                );
                            });
                    });
                    app.url.push({item: id});
                }
                return $panel;
            },
            screen: function() {
                return Ox.$('<div>').addClass('screen animate');
            },
            switch: function() {
                return app.patchButtonGroup(
                    Ox.ButtonGroup({
                        buttons: [
                            {id: 'oxlight', title: 'Light'},
                            {id: 'oxmedium', title: 'Medium'},
                            {id: 'oxdark', title: 'Dark'}
                        ],
                        selectable: true,
                        value: app.user.theme
                    })
                    .addClass('switch animate')
                    .bindEvent({
                        change: function(data) {
                            app.setTheme(data.value);
                        }
                    })
                );
            },
            warning: function() {
                return $('<div>').addClass('warning').html(app.data.warning);
            }
        },
        url: {
            change: function() {
                var data = app.url.parse();
                app.user.previousPage = app.user.page;
                app.user.page = data.page;
                if (data.page in app.user.item) {
                    app.user.item[data.page] = data.item;
                }
                app.db(app.user);
                if (app.user.page != app.user.previousPage) {
                    app.$ui.panel.select(app.user.page);
                }
                if (app.user.page) {
                    app.$ui[app.user.page].options(Ox.extend({
                        selected: data.item
                    }, app.user.page == 'examples' ? {
                        mode: data.mode || 'source'
                    } : {}));
                }
                if (!app.user.page || !app.user.previousPage) {
                    app.animate();
                }
            },
            format: function(data) {
                var hash = '';
                if (data.page) {
                    hash = '#' + data.page;
                    if (data.item && data.page in app.user.item) {
                        hash += '/' + data.item;
                        if (data.page == 'examples' && data.mode == 'live') {
                            hash += '/live';
                        }
                    }
                }
                return hash;
            },
            parse: function(hash) {
                hash = hash || window.location.hash;
                var data = {}, formattedHash, split = hash.slice(1).split('/');
                data.page = Ox.getObjectById(app.data.pages, split[0])
                    ? split[0] : '';
                data.item = data.page in app.user.item && split[1]
                    ? split[1] : '';
                data.mode = data.page == 'examples' && split[2] == 'live'
                    ? 'live' : '';
                formattedHash = app.url.format(data);
                hash != formattedHash && app.url.replace(formattedHash);
                return data;
            },
            push: function(data) {
                data = data || {};
                data.page = 'page' in data ? data.page : app.user.page;
                data.item = 'item' in data ? data.item : app.user.item[data.page] || '';
                window.location.hash = app.url.format(data);
                return app;
            },
            replace: function(hash) {
                var location = window.location;
                if (history.replaceState) {
                    history.replaceState(
                        {}, '', location.origin + location.pathname + hash
                    );
                }
                return app;
            }
        },
        user: {}
    },
    salt = /^https?:\/\/(www\.)?oxjs\.org\//.test(window.location.href) ? Ox.VERSION : +new Date;
    app.init();
});
