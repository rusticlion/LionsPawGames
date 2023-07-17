const { environment } = require('@rails/webpacker')
const sassLoader = require('./loaders/sass')

environment.loaders.prepend('sass', sassLoader)

module.exports = environment
