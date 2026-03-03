const axios = require('axios')
const cheerio = require('cheerio')

const File = require('../classes/File')
const { proxyToAxios } = require('../utils')

exports.domains = ['files.fm']

exports.get = async (url, proxy) => {
  const res = await axios({
    url,
    ...proxyToAxios(proxy)
  })

  if (res.status !== 200) {
    throw new Error(res.statusText)
  }

  if (res.data?.indexOf('files have been permanently removed') !== -1) {
    throw new Error('Files have been permanently removed')
  }

  const $ = cheerio.load(res.data)
  const script = $('script:contains("arrNames")').last().html()

  if (!script) {
    throw new Error('Could not extract file data from page')
  }

  // NOTE: using eval here is dangerous but necessary for parsing JS array literals
  const names = eval(script.split('arrNames = ')[1].split(';')[0])
  const sizes = eval(script.split('arrSizesInBytes = ')[1].split(';')[0])
  const createdAts = eval(script.split('arrDatesCreated = ')[1].split(';')[0])
  const updatedAts = eval(script.split('arrDatesModified = ')[1].split(';')[0])

  return names.map((name, i) => new File({
    name,
    size: sizes[i],
    createdAt: createdAts[i],
    updatedAt: updatedAts[i],
  }))
}
