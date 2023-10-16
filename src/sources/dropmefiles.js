const axios = require('axios')
const cheerio = require('cheerio')

const File = require('../classes/File')

const { proxyToAxios } = require('../utils')

exports.domains = ['dropmefiles.com']

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
    const list = $('#upfiles ul').first()

    const files = list.find('li').toArray().map(li => {
      const el = $(li)

      const file = el.clone().children().remove().end().text().trim()
      const size = el.attr('data-fsize')

      return new File({
        name: file,
        size: size,
      })
    })

    return files
  } catch (err) {
    throw err
  }
}