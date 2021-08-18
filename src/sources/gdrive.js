const axios = require('axios')

const File = require('../classes/File')

const { proxyToAxios } = require('../utils')

exports.get = async (url, proxy) => {
  try {
    if (!process.env.GOOGLE_KEY) {
      throw new Error('Missing env variable "GOOGLE_KEY" for Google Drive API')
    }

    let fileId
    
    if (url.includes('/file/d/')) {
      fileId = url.split('/')[5]
    }

    if (url.includes('?id=')) {
      fileId = url.split('?id=')[1].split('&')[0]
    }

    const res = await axios({
      method: 'get',
      url: `https://www.googleapis.com/drive/v3/files/${fileId}`,
      params: {
        fields: 'name,size,createdTime,modifiedTime',
        key: process.env.GOOGLE_KEY
      },
      proxy: proxyToAxios(proxy)
    })

    if (res.status !== 200) {
      throw new Error(res.statusText)
    }
    
    const { name, size, createdTime, modifiedTime } = res.data
    
    return [
      new File({
        name,
        size,
        createdAt: createdTime,
        updatedAt: modifiedTime
      })
    ]
  } catch (err) {
    throw err
  }
}