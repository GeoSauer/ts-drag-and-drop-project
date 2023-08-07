const path = require("path");

module.exports = {
  mode: "development",
  //* the entry needs to be the exact relative path
  entry: "./src/app.ts",
  devServer: {
    static: [
      {
        directory: path.join(__dirname),
      },
    ],
  },
  output: {
    //* the file name is up to you but there are some go-tos
    filename: "bundle.js",
    //* the path needs to be absolute path, so we use the path node module
    //* in the resolve method the first (starting point) arg is the globally available __dirname, and the second is the destination
    path: path.resolve(__dirname, "dist"),
    //* public path is needed because in dev server webpack stores the compiled code in memory but doesn't actually create the bundle.js until we npm run build
    publicPath: "/dist/",
  },
  //* since we have source maps enabled in tsconfig, this tells webpack to look for them and wire them up properly
  devtool: "inline-source-map",
  module: {
    rules: [
      {
        //* the test is a regex that looks for any .ts file
        test: /\.ts$/,
        //* here we tell it to use the ts-loader
        use: "ts-loader",
        //* and this just speeds things up because it doesn't need to look in here at all
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    //* here we tell it to bundle all files with these extensions together
    extensions: [".ts", ".js"],
  },
};
