const axios = require('axios')

const File = require('../classes/File')

const { proxyToAxios } = require('../utils')

exports.get = async (url, proxy) => {
  try {
    const [a, b, c, id] = url.split('/')

    const res = await axios({
      url: `https://api.anonfiles.com/v2/file/${id}/info`,
      proxy: proxyToAxios(proxy)
    })

    if (res.status !== 200) {
      throw new Error(res.statusText)
    }

    if (!res.data?.status) {
      throw new Error(res.data?.status ?? 'Response returned bad status')
    }
    
    const data = res.data.data.file
    
    return [
      new File({
        name: data.metadata.name,
        size: data.metadata.size.bytes,
      })
    ]
  } catch (err) {
    console.error(err)

    throw err
  }
}