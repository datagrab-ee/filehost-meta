const axios = require('axios')
const cheerio = require('cheerio')

const File = require('../classes/File')
const { proxyToAxios, sizeToBytes } = require('../utils')

exports.domains = ['datanodes.to']

exports.get = async (url, proxy) => {
  // Datanodes redirects /{code}/{filename} -> /download and uses a
  // "file_code" cookie to identify the file. We extract the code from
  // the URL and send the cookie directly.
  const pathParts = new URL(url).pathname.split('/').filter(Boolean)
  const fileCode = pathParts[0]

  if (!fileCode) {
    throw new Error('Could not extract file code from datanodes URL')
  }

  const res = await axios({
    url: 'https://datanodes.to/download',
    headers: {
      Cookie: `file_code=${fileCode}`,
    },
    // Don't throw on non-2xx so we can inspect the response
    validateStatus: () => true,
    ...proxyToAxios(proxy)
  })

  if (res.status !== 200) {
    throw new Error(`Request failed with status ${res.status}`)
  }

  const $ = cheerio.load(res.data)

  const name = $('h1.text-gray-900').first().text().trim()
    || $('h1.text-white.text-3xl').first().text().trim()

  const sizeText = $('small.text-gray-500.font-bold').first().text().trim()

  if (!name || name === 'File Not Found') {
    throw new Error('File not found on datanodes')
  }

  return [
    new File({
      name,
      size: sizeText ? sizeToBytes(sizeText) : 0,
    })
  ]
}
