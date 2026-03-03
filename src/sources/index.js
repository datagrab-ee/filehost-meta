const fs = require('fs')
const path = require('path')

const sources = {}

// Auto-discover all source files in this directory
fs.readdirSync(__dirname)
  .filter(file => file !== 'index.js' && file.endsWith('.js'))
  .forEach(file => {
    const name = path.basename(file, '.js')
    sources[name] = require(path.join(__dirname, file))
  })

module.exports = sources
