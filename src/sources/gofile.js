const axios = require('axios')
const { stringify } = require('qs')

const File = require('../classes/File')

const { proxyToAxios } = require('../utils')

exports.get = async (url, proxy) => {
  try {
    const folderId = url.split('/d/').pop()
    
    const res = await axios({
      method: 'get',
      url: 'https://api.gofile.io/getFolder',
      params: {
        folderId
      },
      proxy: proxyToAxios(proxy)
    })

    if (res.status !== 200) {
      throw new Error(res.statusText)
    }
    
    if (res.data?.status !== 'ok') {
      throw new Error(res.data?.status ?? 'Response returned bad status')
    }
    
    const { data } = res.data
    const createdAt = data.createTime * 1000
    
    return Object.values(data.contents)
      .map(({ name, size, downloadCount }) => new File({
        name,
        size,
        downloads: downloadCount,
        createdAt
      }))
  } catch (err) {
    console.error(err)

    throw err
  }
}