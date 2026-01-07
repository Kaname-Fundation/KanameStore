const path = require("path");
const rspack = require("@rspack/core");

module.exports = {
  mode: "production",
  entry: path.resolve(__dirname, "index.js"),
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "index.js"
  },
  plugins: [
    new rspack.CopyRspackPlugin({
      patterns: [
        { from: "src" }
      ]
    })
  ]
};
