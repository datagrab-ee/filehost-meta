const axios = require('axios')

const File = require('../classes/File')

const { proxyToAxios, sizeToBytes } = require('../utils')

exports.domains = ['terminal.lc']

exports.get = async (url, proxy) => {
  try {
    const [a, b, c, id] = url.split('/')

    const res = await axios({
      method: 'post',
      url: `https://terminal.lc/data`,
      data: {
        type: 'file',
        file: id,
      },
      headers: {
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      ...proxyToAxios(proxy)
    })

    if (res.status !== 200) {
      throw new Error(res.statusText)
    }
    
    if (res.data.error) {
      throw new Error(res.data.error)
    }

    const data = res.data
    
    return [
      new File({
        name: data.file,
        size: sizeToBytes(data.size),
        createdAt: new Date(data.date),
      })
    ]
  } catch (err) {
    throw err
  }
}