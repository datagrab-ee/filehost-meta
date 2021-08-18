const test = require('./src/sources/filesfm')

test.get('https://files.fm/u/aqm2v59tv#/')
  .then(console.log)
  .catch(console.error)