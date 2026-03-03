const axios = require('axios')
const cheerio = require('cheerio')

const File = require('../classes/File')
const { proxyToAxios, sizeToBytes } = require('../utils')

exports.domains = ['uploadhaven.com']

exports.get = async (url, proxy) => {
  const res = await axios({
    url,
    ...proxyToAxios(proxy)
  })

  if (res.status !== 200) {
    throw new Error(res.statusText)
  }

  if (res.data?.includes('download could not be found')) {
    throw new Error('Download could not be found')
  }

  const $ = cheerio.load(res.data)
  const meta = $('.responsiveInfoTable').first().text()

  const [rawName, rawSize] = meta.split(/\r?\n/).filter(x => x.trim())

  const name = rawName.split(':').pop().trim()
  const size = sizeToBytes(rawSize.split(':').pop().trim())

  return [
    new File({ name, size })
  ]
}
