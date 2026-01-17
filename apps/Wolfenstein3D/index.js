/*
 * KanameOS - Web Based Operating System
 *
 * Copyright (c) 2026 Abdul Vaiz Vahry Iskandar <cyberaioff@gmail.com>
 * All rights reserved.
 *
 * ---------------------------------------------------------
 * Based on OS.js - JavaScript Cloud/Web Desktop Platform
 * Copyright (c) Anders Evenrud <andersevenrud@gmail.com>
 * ---------------------------------------------------------
 *
 */
import { name as applicationName } from './metadata.json';

// Creates the internal callback function when OS.js launches an application
// Note the first argument is the 'name' taken from your metadata.json file
const register = (core, args, options, metadata) => {

    // Create a new Application instance
    const proc = core.make('osjs/application', {
        args,
        options,
        metadata
    });

    // Create  a new Window instance
    proc.createWindow({
        id: 'Wolfenstein3D',
        title: metadata.title.en_EN,
        icon: proc.resource(metadata.icon),
        dimension: { width: 640, height: 480 },
        attributes: {
            resizable: false,
            maximizable: false
        }
    })
        .on('destroy', () => proc.destroy())
        .render(($content, win) => {
            const iframe = document.createElement('iframe');
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.src = proc.resource('/html5-wolfenstein3D/game.html');
            iframe.setAttribute('border', '0');
            $content.appendChild(iframe);

            win.on('focus', () => {
                iframe.contentWindow.postMessage('resume', window.location.href);
            });

            win.on('blur', () => {
                iframe.contentWindow.postMessage('pause', window.location.href);
            });
        });

    return proc;
};

OSjs.make("osjs/packages").register(applicationName, register);
