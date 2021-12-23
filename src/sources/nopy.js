const axios = require('axios')
const { stringify } = require('qs')

const File = require('../classes/File')

const { proxyToAxios } = require('../utils')

exports.domains = ['nopy.to', 'nopyright.com']

exports.get = async (url, proxy) => {
  try {
    const [code, file] = url.split('/').slice(-2)
    
    const res = await axios({
      method: 'post',
      url: 'https://data.nopy.to/file',
      data: stringify({
        code,
        file,
      }),
      proxy: proxyToAxios(proxy)
    })

    if (res.status !== 200) {
      throw new Error(res.statusText)
    }
    
    if (res.data?.status !== 'ok') {
      throw new Error(res.data?.status ?? 'Response returned bad status')
    }
    
    const data = res.data.msg
    
    return [
      new File({
        name: data.filename,
        size: data.raw_size,
        createdAt: data.date
      })
    ]
  } catch (err) {
    throw err
  }
}