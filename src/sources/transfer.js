const axios = require('axios')
const cheerio = require('cheerio')

const File = require('../classes/File')

const { proxyToAxios } = require('../utils')

exports.domains = ['transfer.sh']

exports.get = async (url, proxy) => {
  try {
    const res = await axios({
      url,
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7'
      },
      ...proxyToAxios(proxy)
    })

    if (res.status !== 200) {
      throw new Error(res.statusText)
    }

    
    const $ = cheerio.load(res.data)
    const el = $('#home .wrapper')

    const file = el.find('h2.page-title').text().trim()
    const size = el.find('h4').eq(1).find('b').text().replaceAll(',', '').trim()

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