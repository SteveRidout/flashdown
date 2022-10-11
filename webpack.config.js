const path = require("path");

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
  stats: {
    errorDetails: true,
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
};
