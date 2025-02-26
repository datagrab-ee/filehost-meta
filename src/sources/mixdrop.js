const axios = require('axios')
const cheerio = require('cheerio')
const { sizeToBytes } = require('../utils')

const File = require('../classes/File')

const { proxyToAxios } = require('../utils')

exports.domains = ['mixdrop.co', 'mixdrop.ag', 'mixdrop.ps']

exports.get = async (url, proxy) => {
  try {
    const res = await axios({
      url,
      ...proxyToAxios(proxy)
    })

    if (res.status !== 200) {
      throw new Error(res.statusText)
    }

    if (res.data?.toLowerCase()?.indexOf('we are sorry') !== -1) {
      throw new Error('Response returned bad status')
    }
    
    const $ = cheerio.load(res.data)
    const el = $('.tbl-c.c-l.title').first()

    const file = el.find('[title]').text().trim()
    const size = sizeToBytes(el.clone().children().remove().end().text().trim())

    return [
      new File({
        name: file,
        size: size,
      })
    ]
  } catch (err) {
    throw err
  }
}