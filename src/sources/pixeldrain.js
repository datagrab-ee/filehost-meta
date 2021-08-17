const axios = require('axios')

const File = require('../classes/File')

const { proxyToAxios } = require('../utils')

exports.get = async (url, proxy) => {
  try {
    const id = url.split('/').pop()

    const res = await axios({
      url: `https://pixeldrain.com/api/file/${id}/info`,
      proxy: proxyToAxios(proxy)
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
  } catch (err) {
    console.error(err)

    throw err
  }
}