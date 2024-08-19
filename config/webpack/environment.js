const { environment } = require('@rails/webpacker')
const sassLoader = require('./loaders/sass.js')

// Check if environment.loaders exists before trying to use it
if (environment.loaders) {
  environment.loaders.prepend('sass', sassLoader)
} else {
  console.warn('environment.loaders is undefined. Skipping sass loader configuration.')
}

environment.config.set('node', false)

module.exports = environment