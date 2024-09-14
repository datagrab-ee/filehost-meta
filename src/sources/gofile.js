const axios = require('axios')
const { stringify } = require('qs')

const File = require('../classes/File')

const { proxyToAxios } = require('../utils')

exports.domains = ['gofile.io']

exports.get = async (url, proxy) => {
  try {
    if (!process.env.GOFILE_KEY) {
      throw new Error('Missing env variable "GOFILE_KEY" for Gofile API')
    }

    const contentId = url.split('/d/').pop()
    
    const res = await axios({
      method: 'get',
      url: `https://api.gofile.io/contents/${contentId}`,
      params: {
        token: process.env.GOFILE_KEY
      },
      ...proxyToAxios(proxy)
    })

    if (res.status !== 200) {
      throw new Error(res.statusText)
    }
    
    if (res.data?.status !== 'ok') {
      throw new Error(res.data?.status ?? 'Response returned bad status')
    }
    
    const { data } = res.data
    const createdAt = data.createTime * 1000
    
    return Object.values(data.children)
      .map(({ name, size, downloadCount }) => new File({
        name,
        size,
        downloads: downloadCount,
        createdAt
      }))
  } catch (err) {
    throw err
  }
}