import DesktopServiceProvider from "./src/provider";
import "./src/styles.scss";

// Register the shell as an application/extension
OSjs.make("osjs/packages").register("osjs-desktop", (core, args, options, metadata) => {
  const proc = core.make("osjs/application", { args, options, metadata });
  const provider = new DesktopServiceProvider(core, { 
    args,
    options
  });

  proc.on("destroy", () => provider.destroy());

  // Initialize the desktop service
  provider.init();
  provider.start();

  return proc;
});
