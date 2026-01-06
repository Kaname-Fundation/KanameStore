const path = require("path");
const rspack = require("@rspack/core");
const mode = process.env.NODE_ENV || "development";
const minimize = mode === "production";

module.exports = {
  mode,
  devtool: "source-map",
  entry: {
    main: [
      path.resolve(__dirname, "index.js"),
      path.resolve(__dirname, "index.scss"),
    ],
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
    library: "GnomeIcons",
    libraryTarget: "umd",
  },
  externals: {
    osjs: "OSjs",
  },
  optimization: {
    minimize,
  },
  plugins: [
    new rspack.CssExtractRspackPlugin({
      filename: "[name].css",
    }),
    new rspack.CopyRspackPlugin({
      patterns: [{ from: "metadata.json" }],
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(svg|png|jpe?g|gif|webp)$/,
        type: 'asset/resource',
        generator: {
          filename: (pathData) => {
            if (pathData.filename.includes('src/icons')) {
              // Flatten the directory structure for icons to match legacy OS.js behavior
              // OR maintain it if that's what's needed.
              // The original logic was: 'icons/[name].[ext]' which FLATTENS directories.
              return 'icons/[name][ext]';
            }
            return '[hash][ext]';
          }
        }
      },
      {
        test: /\.scss$/,
        use: [
          rspack.CssExtractRspackPlugin.loader,
          "css-loader",
          {
            loader: "sass-loader",
            options: {
              sassOptions: {
                silenceDeprecations: ["legacy-js-api"],
              },
            },
          },
        ],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "builtin:swc-loader",
          options: {
            jsc: {
              parser: {
                syntax: "ecmascript",
              },
            },
          },
        },
      },
    ],
  },
};
