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

    if (res.status !== 200) {
      throw new Error(res.statusText)
    }

    if (res.data?.indexOf('download could not be found') !== -1) {
      throw new Error('Response returned bad status')
    }
    
    const $ = cheerio.load(res.data)
    const meta = $('.responsiveInfoTable').first().text()

    let [file, size] = meta.split(/\r?\n/).filter(x => x.trim())

    file = file.split(':').pop().trim()
    size = sizeToBytes(size.split(':').pop().trim())

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