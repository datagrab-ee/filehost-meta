const axios = require('axios')
const cheerio = require('cheerio')
const { default: convertSize } = require('convert-size')

const File = require('../classes/File')

const { proxyToAxios } = require('../utils')

exports.get = async (url, proxy) => {
  try {
    const res = await axios({
      url,
      proxy: proxyToAxios(proxy)
    })

    if (res.status !== 200) {
      throw new Error(res.statusText)
    }

    if (res.data?.indexOf('does not exist') !== -1) {
      throw new Error('Response returned bad status')
    }

    const $ = cheerio.load(res.data)
    const el = $('#lrbox .left').first()

    const file = el.find('font').eq(2).text()
    const size = convertSize(el.find('font').eq(4).text(), 'B')
    const createdAt = el.find('font').eq(6).text()

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