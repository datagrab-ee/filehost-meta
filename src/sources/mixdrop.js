const axios = require('axios')
const cheerio = require('cheerio')

const File = require('../classes/File')
const { proxyToAxios, sizeToBytes } = require('../utils')

exports.domains = ['mixdrop.co', 'mixdrop.ag', 'mixdrop.ps']

exports.get = async (url, proxy) => {
  const res = await axios({
    url,
    ...proxyToAxios(proxy)
  })

  if (res.status !== 200) {
    throw new Error(res.statusText)
  }

  if (res.data?.toLowerCase()?.includes('we are sorry')) {
    throw new Error('File not found')
  }

  const $ = cheerio.load(res.data)
  const el = $('.tbl-c.c-l.title').first()

  const name = el.find('[title]').text().trim()
  const size = sizeToBytes(el.clone().children().remove().end().text().trim())

  return [
    new File({ name, size })
  ]
}
