const axios = require('axios')
const cheerio = require('cheerio')

const File = require('../classes/File')
const { proxyToAxios, sizeToBytes } = require('../utils')

exports.domains = ['mediafire.com']

/**
 * Some mediafire links are instant downloads which would crash HTML parsing
 * or make node run out of memory. This ensures the link returns text/html.
 */
async function ensureHtmlResponse(url, proxy) {
  const { headers } = await axios({
    url,
    method: 'head',
    ...proxyToAxios(proxy),
  })

  if (!headers?.['content-type']?.includes('text/html')) {
    throw new Error(`Expected "text/html" but received "${headers['content-type']}"`)
  }
}

exports.get = async (url, proxy) => {
  await ensureHtmlResponse(url, proxy)

  const res = await axios({
    url,
    ...proxyToAxios(proxy)
  })

  // NOTE: mediafire does a 302 redirect if file does not exist
  if (res.status !== 200) {
    throw new Error('Response returned bad status')
  }

  const $ = cheerio.load(res.data)
  const el = $('.dl-info').first()

  const name = el.find('.filename').first().text().trim()
  const size = sizeToBytes(el.find('.details li:eq(0) span').first().text())
  const createdAt = el.find('.details li:eq(1) span').first().text()

  return [
    new File({ name, size, createdAt })
  ]
}
