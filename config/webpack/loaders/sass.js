module.exports = {
  test: /\.scss$/,
  use: [{
    loader: "style-loader"
  }, {
    loader: "css-loader",
    options: {
      esModule: false
    }
  }, {
    loader: "sass-loader"
  }]
}
