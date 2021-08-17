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

    // NOTE: racaty does a 302 redirect if file does not exist
    if (res.status !== 200) {
      throw new Error('Response returned bad status')
    }

    const $ = cheerio.load(res.data)
    const el = $('.fileinf-o .name').first()

    const file = el.find('strong').first().text().trim()
    const size = convertSize(el.find('#rctyFsize').first().text(), 'B')
    const createdAt = el.find('span').first().text().split(' ').pop()

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