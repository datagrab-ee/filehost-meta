const axios = require('axios')
const cheerio = require('cheerio')
const { sizeToBytes } = require('../utils')

const File = require('../classes/File')

const { proxyToAxios } = require('../utils')

exports.domains = ['racaty.com', 'racaty.net', 'racaty.io']

exports.get = async (url, proxy) => {
  try {
    const res = await axios({
      url,
      ...proxyToAxios(proxy)
    })

    // NOTE: racaty does a 302 redirect if file does not exist
    if (res.status !== 200) {
      throw new Error('Response returned bad status')
    }

    const $ = cheerio.load(res.data)
    const el = $('.fileinf-o .name').first()

    const file = el.find('strong').first().text().trim()
    const size = sizeToBytes(el.find('#rctyFsize').first().text())
    const createdAt = el.find('span').first().text().split(' ').pop()

    return [
      new File({
        name: file,
        size,
        createdAt
      })
    ]
  } catch (err) {
    throw err
  }
}