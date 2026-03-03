const axios = require('axios')
const cheerio = require('cheerio')

const File = require('../classes/File')
const { proxyToAxios, sizeToBytes } = require('../utils')

exports.domains = ['buzzheavier.com']

exports.get = async (url, proxy) => {
  const res = await axios({
    url,
    ...proxyToAxios(proxy)
  })

  if (res.status !== 200) {
    throw new Error(res.statusText)
  }

  const $ = cheerio.load(res.data)

  const name = $('span.text-2xl').first().text().trim()

  if (!name) {
    throw new Error('Could not extract file name from page')
  }

  // Parse "Size - 363.9MB | Views - 1588 | Downloads - 1372"
  const detailsText = $('li:contains("Details:")').first().text()
  let size = 0, views = 0, downloads = 0

  if (detailsText) {
    const sizeMatch = detailsText.match(/Size\s*-\s*([^\s|]+)/)
    const viewsMatch = detailsText.match(/Views\s*-\s*(\d+)/)
    const downloadsMatch = detailsText.match(/Downloads\s*-\s*(\d+)/)

    if (sizeMatch) size = sizeToBytes(sizeMatch[1])
    if (viewsMatch) views = parseInt(viewsMatch[1], 10)
    if (downloadsMatch) downloads = parseInt(downloadsMatch[1], 10)
  }

  return [
    new File({ name, size, views, downloads })
  ]
}
