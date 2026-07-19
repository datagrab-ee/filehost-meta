const axios = require('axios')
const { HttpProxyAgent } = require('http-proxy-agent')
const { HttpsProxyAgent } = require('https-proxy-agent')
const { convertFileSize } = require('size-converter')

// Max bytes to buffer when fetching a "page" - override with setMaxPageBytes()
let maxPageBytes = 10 * 1024 * 1024 // 10MB

/**
 * Override the default max page size (in bytes) used by fetchPage().
 */
exports.setMaxPageBytes = (bytes) => {
  maxPageBytes = bytes
}

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

/**
 * Throws if response headers indicate a direct file download instead of a webpage.
 */
function assertIsWebpage(headers = {}) {
  const disposition = headers['content-disposition']
  if (disposition && /attachment/i.test(disposition)) {
    throw new Error('Expected a webpage but received a file download (content-disposition: attachment)')
  }

  const contentType = headers['content-type']
  if (contentType && !contentType.includes('text/html')) {
    throw new Error(`Expected "text/html" but received "${contentType}"`)
  }
}
exports.assertIsWebpage = assertIsWebpage

/**
 * GET a URL as a webpage, guarding against accidentally downloading a file.
 * Does a HEAD check first (best-effort), then caps and validates the GET body.
 */
exports.fetchPage = async (url, proxy, axiosOptions = {}) => {
  const proxyConfig = exports.proxyToAxios(proxy)

  // Best-effort HEAD check - skip silently if the host doesn't support it
  try {
    const headRes = await axios({
      url,
      method: 'head',
      headers: axiosOptions.headers,
      ...proxyConfig,
    })
    assertIsWebpage(headRes.headers)
  } catch (err) {
    if (err.message?.startsWith('Expected')) throw err
  }

  const res = await axios({
    url,
    maxContentLength: maxPageBytes,
    maxBodyLength: maxPageBytes,
    ...proxyConfig,
    ...axiosOptions,
  })

  assertIsWebpage(res.headers)

  return res
}
