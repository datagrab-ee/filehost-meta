const axios = require('axios')
const cheerio = require('cheerio')
const { sizeToBytes } = require('../utils')

const File = require('../classes/File')

const { proxyToAxios } = require('../utils')

exports.domains = ['mediafire.com']

// some mediafire links are instant downloads
// and that will potentially crash our html parsing or make node run out of memory
// so this function makes sure that the given link returns "text/html" content-type
async function checkLinkResponseType (url, proxy) {
  const { headers } = await axios({
    url,
    proxy: proxyToAxios(proxy),
    method: 'head'
  })

  // content type is something other than html
  if (!headers?.['content-type']?.includes('text/html')) {
    throw new Error(`Expected "text/html" but received "${headers['content-type']}"`)
  }

  return
}

exports.get = async (url, proxy) => {
  try {
    // make sure we are going to be handling html before requesting data
    await checkLinkResponseType(url, proxy)

    const res = await axios({
      url,
      proxy: proxyToAxios(proxy)
    })

    // NOTE: mediafire does a 302 redirect if file does not exist
    if (res.status !== 200) {
      throw new Error('Response returned bad status')
    }

    const $ = cheerio.load(res.data)
    const el = $('.dl-info').first()

    const file = el.find('.filename').first().text().trim()
    const size = sizeToBytes(el.find('.details li:eq(0) span').first().text())
    const createdAt = el.find('.details li:eq(1) span').first().text()

    return [
      new File({
        name: file,
        size,
        createdAt
      })
    ]
  } catch (err) {
    console.error(err)

    throw err
  }
}