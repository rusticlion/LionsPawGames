const { environment } = require('@rails/webpacker')
const sassLoader = require('./loaders/sass.js')

environment.loaders.prepend('sass', sassLoader)

module.exports = environment
