const path = require("path");
const webpack = require("webpack");

const { NODE_ENV = "production" } = process.env;

module.exports = {
  entry: "./src/flashdown.ts",
  target: "node",
  mode: NODE_ENV,
  output: {
    filename: "flashdown.js",
    path: path.resolve(__dirname, "dist"),
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new webpack.BannerPlugin({ banner: "#!/usr/bin/env node", raw: true }),
  ],
};
