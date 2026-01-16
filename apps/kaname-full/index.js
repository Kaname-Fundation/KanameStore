import { name as applicationName } from './metadata.json';

const register = (core, args, options, metadata) => {
    // Metapackage: does nothing, just ensures dependencies are installed
};

OSjs.make("osjs/packages").register(applicationName, register);
