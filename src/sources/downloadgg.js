const cheerio = require('cheerio')

const File = require('../classes/File')
const { sizeToBytes, fetchPage } = require('../utils')

exports.domains = ['download.gg']

exports.get = async (url, proxy) => {
  const res = await fetchPage(url, proxy)

  if (res.status !== 200) {
    throw new Error(res.statusText)
  }

  const $ = cheerio.load(res.data)

  const wrappers = $('#progressContainer .wrapper').toArray()

  if (!wrappers.length) {
    throw new Error('Could not find file list on page')
  }

  return wrappers.map(el => {
    const $el = $(el)
    const name = $el.find('.name').text().trim()
    const sizeText = $el.find('.size').text().trim()

    // download.gg uses "Mo" (French) for MB and "Go" for GB
    const normalized = sizeText
      .replace(/\bMo\b/i, 'MB')
      .replace(/\bGo\b/i, 'GB')
      .replace(/\bKo\b/i, 'KB')

    return new File({
      name,
      size: normalized ? sizeToBytes(normalized) : 0,
    })
  })
}
