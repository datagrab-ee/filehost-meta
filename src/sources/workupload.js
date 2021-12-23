const axios = require('axios')
const cheerio = require('cheerio')
const { sizeToBytes } = require('../utils')

const File = require('../classes/File')

const { proxyToAxios } = require('../utils')

exports.domains = ['workupload.com']

exports.get = async (url, proxy) => {
  try {
    const res = await axios({
      url,
      proxy: proxyToAxios(proxy)
    })

    if (res.status !== 200) {
      throw new Error(res.statusText)
    }

    if (res.data?.indexOf('file does not exist') !== -1) {
      throw new Error('Response returned bad status')
    }
    
    const scriptMetaBody = res.data.split("body: '")[1].split("',")[0]

    const $ = cheerio.load(scriptMetaBody)

    const file = $('td').eq(1).text()
    const size = $('td').eq(3).text().split(' ')[0]

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