
import { name as applicationName } from "./metadata.json";

// Register the application
OSjs.make("osjs/packages").register(applicationName, (core, args, options, metadata) => {

    // Create a new Application instance
    const proc = core.make("osjs/application", {
        args,
        options,
        metadata
    });

    // Create the main window
    proc.createWindow({
        id: "WBWWB",
        title: metadata.title.en_EN,
        icon: proc.resource(metadata.icon),
        dimension: { width: 960, height: 540 },
        position: "center",
        attributes: {
            drawer: true,
            bg: "black"
        }
    })
        .on("destroy", () => proc.destroy())
        .render(($content, win) => {
            // Create an iframe to load the game
            const iframe = document.createElement("iframe");
            iframe.style.width = "100%";
            iframe.style.height = "100%";
            iframe.style.border = "0";
            iframe.style.backgroundColor = "black";

            // Point to the src/index.html
            iframe.src = proc.resource("src/index.html");

            // Focus the iframe so game input works immediately
            iframe.onload = () => {
                iframe.contentWindow.focus();
                iframe.contentWindow.onclick = () => iframe.contentWindow.focus();
            };

            $content.appendChild(iframe);
        });

    return proc;
});
