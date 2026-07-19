const sources = require('./src/sources')
const { normalizeHostname, setMaxPageBytes } = require('./src/utils')

/**
 * Override the max bytes buffered when fetching a page (default 10MB).
 * Guards against accidentally downloading a full file instead of a page.
 */
exports.setMaxPageBytes = setMaxPageBytes


/**
 * Get a flat array of all supported hostnames.
 */
exports.getSources = function getSources() {
  return Object.values(sources).flatMap(source => source.domains)
}

/**
 * Get file info from a supported file host URL.
 *
 * @param {string} url - The file host URL
 * @param {object} [options] - Options
 * @param {string} [options.proxy] - HTTP proxy string (http://<user>:<pass>@<ip>:<port>)
 * @returns {Promise<File[]>}
 */
exports.getInfo = async function getInfo(url, options = {}) {
  const { hostname } = new URL(url)
  const normalized = normalizeHostname(hostname)

  for (const source of Object.values(sources)) {
    if (source.domains.includes(normalized)) {
      return source.get(url, options.proxy)
    }
  }

  throw new Error(`Host "${hostname}" is not supported. Could not get file info.`)
}
