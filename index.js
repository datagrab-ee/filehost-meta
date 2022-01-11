const sources = require('./src/sources')

exports.getSources = function allSources() {
  return Object.values(sources).map(source => source.domains).flatMap(x => x)
}

exports.getInfo = async function getInfo(url, options = {}) {
  const { hostname } = new URL(url)

  for (const { domains, get } of Object.values(sources)) {
    let source = hostname.toLowerCase()

    // some hosts add www[1-999] so strip it
    source = source.split('.')
    if (source[0].includes('www')) source = source.slice(1)
    source = source.join('.')

    if (domains.includes(source)) {
      return get(url, options?.proxy)
    }
  }

  throw new Error(`Host: ${hostname} is not defined in sources. Could not get file info.`)
}