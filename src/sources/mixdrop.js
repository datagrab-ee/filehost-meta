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

    if (res.data?.indexOf('we are sorry') !== -1) {
      throw new Error('Response returned bad status')
    }
    
    const $ = cheerio.load(res.data)
    const el = $('.tbl-c.c-l.title').first()

    const file = el.find('span').text().trim()
    const size = convertSize(el.clone().children().remove().end().text().trim(), 'B')

    return [
      new File({
        name: file,
        size: size,
      })
    ]
  } catch (err) {
    console.error(err)

    throw err
  }
}