
(function ($) {

    // Scripts are now loaded in game.html to ensure order.
    // This file only handles asset preloading and initialization.

    // these files are preloaded while the title screen is showing
    // Asset files only.
    var files = [
        "preload!art/menubg_main.png",
        "preload!art/menuitems.png",
        "preload!art/menuselector.png"
    ];

    // these files are preloaded in the background after the menu is displayed.
    // only non-essential files here
    var files2 = [
        "preload!art/menubg_episodes.png",
        "preload!art/menuitems_episodes.png",
        "preload!art/menubg_skill.png",
        "preload!art/menubg_levels.png",
        "preload!art/menuitems_levels.png",
        "preload!art/skillfaces.png",
        "preload!art/getpsyched.png",
        "preload!art/menubg_control.png",
        "preload!art/menulight.png",
        "preload!art/menubg_customize.png",
        "preload!art/control_keys.png",
        "preload!art/confirm_newgame.png",
        "preload!art/paused.png"
    ];

    $(document).ready(function () {
        console.log("load_fixed.js ready. Checking components...");

        if (typeof Wolf === 'undefined') {
            console.error("Wolf namespace missing! Scripts failed to load.");
            return;
        }

        var components = ['Input', 'Game', 'Menu'];
        var missing = components.filter(function (c) { return typeof Wolf[c] === 'undefined'; });

        if (missing.length > 0) {
            console.error("Critical components missing: " + missing.join(", "));
            // Should not happen with sync loading
            return;
        }

        var progress = $("<div>"),
            n = 0;

        progress.addClass("load-progress").appendTo("#title-screen");
        $("#title-screen").show();


        yepnope.addPrefix("preload", function (resource) {
            resource.noexec = true;
            resource.instead = function (input, callback) {
                var image = new Image();
                image.onload = callback;
                image.onerror = callback;
                image.src = input.substr(input.lastIndexOf("!") + 1);
            };
            return resource;
        });


        Modernizr.load([
            {
                test: window.requestAnimationFrame,
                nope: "js/requestAnimFrame.js"
            }, {
                test: window.atob && window.btoa,
                nope: "js/base64.js"
            }, {
                // Main loading block for ASSETS
                load: files,
                callback: function (file) {
                    console.log("Loaded asset:", file);
                    progress.width((++n / (files.length)) * 100 + "%");
                },
                complete: function () {
                    console.log("All assets loaded.");

                    progress.remove();
                    $("#title-screen").fadeOut(1500, function () {
                        // Init Game
                        Wolf.Input.init();
                        Wolf.Game.init();
                        Wolf.Menu.show();
                    });

                    // preload non-essential art
                    Modernizr.load(files2);
                }
            }
        ]);
    });

})(jQuery);
