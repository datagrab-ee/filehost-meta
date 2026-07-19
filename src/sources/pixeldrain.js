const axios = require('axios')

const File = require('../classes/File')
const { proxyToAxios } = require('../utils')

exports.domains = ['pixeldrain.com']

exports.get = async (url, proxy) => {
  // Use pathname only so query strings (e.g. ?fbclid=...) can't leak into the id
  const id = new URL(url).pathname.split('/').filter(Boolean).pop()

  const res = await axios({
    url: `https://pixeldrain.com/api/file/${id}/info`,
    ...proxyToAxios(proxy)
  })

  if (res.status !== 200) {
    throw new Error(res.statusText)
  }

  if (!res.data?.success) {
    throw new Error('Response returned bad status')
  }

  const data = res.data

  return [
    new File({
      name: data.name,
      size: data.size,
      views: data.views,
      downloads: data.downloads,
      createdAt: data.date_upload,
    })
  ]
}
