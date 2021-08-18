const axios = require('axios')
const cheerio = require('cheerio')
const { sizeToBytes } = require('../utils')

const File = require('../classes/File')

const { proxyToAxios } = require('../utils')

exports.get = async (url, proxy) => {
  try {
    const res = await axios({
      url,
      proxy: proxyToAxios(proxy)
    })

    // NOTE: mediafire does a 302 redirect if file does not exist
    if (res.status !== 200) {
      throw new Error('Response returned bad status')
    }

    const $ = cheerio.load(res.data)
    const el = $('.dl-info').first()

    const file = el.find('.filename').first().text().trim()
    const size = sizeToBytes(el.find('.details li:eq(0) span').first().text())
    const createdAt = el.find('.details li:eq(1) span').first().text()

    return [
      new File({
        name: file,
        size,
        createdAt
      })
    ]
  } catch (err) {
    console.error(err)

    throw err
  }
}