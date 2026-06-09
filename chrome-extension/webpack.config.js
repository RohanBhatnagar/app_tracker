const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { loadEnv } = require("./scripts/loadEnv");

const env = loadEnv(path.resolve(__dirname, ".env"));

const frontendEnv = {
  "process.env.EXTENSION_API_BASE_URL": JSON.stringify(
    env.EXTENSION_API_BASE_URL || "http://127.0.0.1:5000"
  ),
  "process.env.GMAIL_POLL_INTERVAL_MINUTES": JSON.stringify(
    env.GMAIL_POLL_INTERVAL_MINUTES || "0.5"
  ),
};

module.exports = {
  mode: "production",
  entry: {
    background: "./src/background/index.js",
    popup: "./src/index.js",
  },
  output: {
    clean: true,
    path: path.resolve(__dirname, "dist"),
    filename: "[name].bundle.js",
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
          },
        },
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/index.html",
      filename: "index.html",
      chunks: ["popup"],
    }),
    new webpack.DefinePlugin(frontendEnv),
  ],
  optimization: {
    splitChunks: {
      chunks: "all",
    },
  },
};
