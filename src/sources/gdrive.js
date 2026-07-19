const axios = require('axios')

const File = require('../classes/File')
const { proxyToAxios } = require('../utils')

exports.domains = ['drive.google.com']

exports.get = async (url, proxy) => {
  if (!process.env.GOOGLE_KEY) {
    throw new Error('Missing env variable "GOOGLE_KEY" for Google Drive API')
  }

  const parsed = new URL(url)
  let fileId

  if (parsed.pathname.includes('/file/d/')) {
    // Pathname only, so trailing query strings/fragments can't leak in
    fileId = parsed.pathname.split('/file/d/')[1]?.split('/')[0]
  } else if (parsed.searchParams.has('id')) {
    fileId = parsed.searchParams.get('id')
  }

  if (!fileId) {
    throw new Error('Could not extract file ID from Google Drive URL')
  }

  const res = await axios({
    method: 'get',
    url: `https://www.googleapis.com/drive/v3/files/${fileId}`,
    params: {
      fields: 'name,size,createdTime,modifiedTime',
      key: process.env.GOOGLE_KEY
    },
    ...proxyToAxios(proxy)
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
      updatedAt: modifiedTime,
    })
  ]
}
