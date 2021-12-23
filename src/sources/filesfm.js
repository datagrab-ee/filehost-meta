const axios = require('axios')
const cheerio = require('cheerio')

const File = require('../classes/File')

const { proxyToAxios } = require('../utils')

exports.domains = ['files.fm']

exports.get = async (url, proxy) => {
  try {
    const res = await axios({
      url,
      proxy: proxyToAxios(proxy)
    })

    if (res.status !== 200) {
      throw new Error(res.statusText)
    }

    if (res.data?.indexOf('files have been permanently removed') !== -1) {
      throw new Error('Response returned bad status')
    }
    
    const $ = cheerio.load(res.data)
    const script = $('script:contains("arrNames")').last().html()

    // NOTE: dangerous :)
    const names = eval(script.split('arrNames = ')[1].split(';')[0])
    const sizes = eval(script.split('arrSizesInBytes = ')[1].split(';')[0])
    const createdAts = eval(script.split('arrDatesCreated = ')[1].split(';')[0])
    const updatedAts = eval(script.split('arrDatesModified = ')[1].split(';')[0])

    const files = []

    for (const index in names) {
      const name = names[index]
      const size = sizes[index]
      const createdAt = createdAts[index]
      const updatedAt = updatedAts[index]

      files.push(
        new File({
          name,
          size,
          createdAt,
          updatedAt
        })
      )
    }

    return files
  } catch (err) {
    throw err
  }
}