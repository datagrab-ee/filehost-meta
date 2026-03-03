const { HttpProxyAgent } = require('http-proxy-agent')
const { HttpsProxyAgent } = require('https-proxy-agent')
const { convertFileSize } = require('size-converter')

/**
 * Convert a proxy string to axios-compatible agent config.
 * Format: <protocol>://<user>:<pass>@<ip>:<port>
 */
exports.proxyToAxios = (string) => {
  if (!string) return {}

  return {
    httpAgent: new HttpProxyAgent(string),
    httpsAgent: new HttpsProxyAgent(string),
    proxy: false
  }
}

/**
 * Convert a human-readable file size string (e.g. "363.9 MB") to bytes.
 */
exports.sizeToBytes = (string) => {
  const { number } = convertFileSize(string, 'bytes', 1000)
  return number
}

/**
 * Normalize a hostname by stripping www/www[N] prefixes.
 * e.g. "www3.example.com" -> "example.com"
 */
exports.normalizeHostname = (hostname) => {
  const parts = hostname.toLowerCase().split('.')
  if (parts[0].startsWith('www')) {
    return parts.slice(1).join('.')
  }
  return parts.join('.')
}
