const axios = require('axios')
const cheerio = require('cheerio')

const File = require('../classes/File')

const { proxyToAxios } = require('../utils')
const { sizeToBytes } = require('../utils')

exports.domains = ['krakenfiles.com']

exports.get = async (url, proxy) => {
  try {
    const res = await axios({
      url,
      ...proxyToAxios(proxy)
    })

    if (res.status !== 200) {
      throw new Error(res.statusText)
    }
    
    const $ = cheerio.load(res.data)

    const name = $('.coin-name').first().text()
    const size = sizeToBytes($('.general-information .lead-text').eq(2).text().replaceAll(',', ''))
    const views = Number($('.views-count').eq(1).text().replace(/[\r\n]/g, ''))
    const downloads = Number($('.downloads-count').eq(1).text().replace(/[\r\n]/g, ''))

    return [
      new File({
        name,
        size,
        views,
        downloads
      })
    ]
  } catch (err) {
    throw err
  }
}