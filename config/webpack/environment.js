const { environment } = require('@rails/webpacker')
const sassLoader = require('./loaders/sass.js')

environment.loaders.prepend('sass', sassLoader)
environment.loaders.append('fonts', {
  test: /\.(woff|woff2|eot|ttf|otf)$/,
  use: [
    {
      loader: 'file-loader',
      options: {
        name: '[name].[ext]',
        outputPath: 'fonts/',
      },
    },
  ],
});

module.exports = environment
