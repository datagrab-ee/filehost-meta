const axios = require('axios')

const File = require('../classes/File')
const { proxyToAxios, sizeToBytes } = require('../utils')

exports.domains = ['filesadmin.com']

exports.get = async (url, proxy) => {
  const res = await axios({
    url,
    ...proxyToAxios(proxy)
  })

  if (res.status !== 200) {
    throw new Error(res.statusText)
  }

  const data = res.data

  const filename = data.match(/var filename = "(.*)";/)?.[1]
  const size = data.match(/var filsize = "(.*)";/)?.[1]
  const date = data.match(/var filedate = "(.*)";/)?.[1]

  if (!filename) {
    throw new Error('Could not extract file info from page')
  }

  let createdAt = null
  if (date) {
    const [day, month, year, hours, minutes, seconds] = date.match(/\d+/g)
    createdAt = new Date(year, month - 1, day, hours, minutes, seconds)
  }

  return [
    new File({
      name: filename,
      size: size ? sizeToBytes(size) : 0,
      createdAt,
    })
  ]
}
