const path = require("path");

module.exports = {
  //* the entry needs to be the exact relative path
  entry: "./src/app.ts",
  output: {
    //* the file name is up to you but there are some go-tos
    filename: "bundle.js",
    //* the path needs to be absolute path, so we use the path node module
    //* in the resolve method the first (starting point) arg is the globally available __dirname, and the second is the destination
    path: path.resolve(__dirname, "dist"),
  },
};
