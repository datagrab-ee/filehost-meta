const axios = require('axios')

const File = require('../classes/File')

const { proxyToAxios, sizeToBytes } = require('../utils')

exports.domains = ['filesadmin.com']

exports.get = async (url, proxy) => {
  try {
    const res = await axios({
      url,
      ...proxyToAxios(proxy)
    })

    if (res.status !== 200) {
      throw new Error(res.statusText)
    }

    const data = res.data

    // use regex to extract file name, size and upload date
    const filename = data.match(/var filename = "(.*)";/)[1]
    const size = data.match(/var filsize = "(.*)";/)[1]
    const date = data.match(/var filedate = "(.*)";/)[1]

    // parse date
    const [day, month, year, hours, minutes, seconds] = date.match(/\d+/g);

    return [
      new File({
        name: filename,
        size: sizeToBytes(size),
        createdAt: new Date(year, month - 1, day, hours, minutes, seconds),
      })
    ]
  } catch (err) {
    throw err
  }
}
