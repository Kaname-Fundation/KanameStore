const path = require("path");
const { CopyRspackPlugin } = require("@rspack/core");

module.exports = {
    mode: "production",
    entry: "./index.js",
    output: {
        filename: "main.js",
        library: "kaname-full",
        libraryTarget: "umd",
        globalObject: "this",
        path: path.resolve(__dirname, "dist"),
    },
    plugins: [
        new CopyRspackPlugin({
            patterns: [{ from: "metadata.json", to: "" }],
        }),
    ],
};
