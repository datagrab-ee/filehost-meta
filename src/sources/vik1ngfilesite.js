const axios = require('axios')
const cheerio = require('cheerio')

const File = require('../classes/File')
const { proxyToAxios, sizeToBytes } = require('../utils')

exports.domains = ['vikingfile.com', 'vik1ngfile.site']

exports.get = async (url, proxy) => {
  const res = await axios({
    url,
    ...proxyToAxios(proxy)
  })

  if (res.status !== 200) {
    throw new Error(res.statusText)
  }

  const $ = cheerio.load(res.data)

  const name = $('#filename').text().trim()

  if (!name) {
    throw new Error('Could not extract file name from page')
  }

  const sizeText = $('#size').text().trim()
  const size = sizeText ? sizeToBytes(sizeText) : 0

  return [
    new File({ name, size })
  ]
}
