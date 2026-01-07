import NotificationServiceProvider from "./src/provider";
import "./src/styles.scss";

// Register as an extension
OSjs.make("osjs/packages").register("osjs-notifications", (core, args, options, metadata) => {
  const proc = core.make("osjs/application", { args, options, metadata });
  const provider = new NotificationServiceProvider(core, { 
    args,
    options
  });

  proc.on("destroy", () => provider.destroy());

  // Initialize the service
  provider.init();
  provider.start();

  return proc;
});
