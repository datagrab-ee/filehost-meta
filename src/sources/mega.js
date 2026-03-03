const megajs = require('megajs')
const { HttpProxyAgent } = require('http-proxy-agent')
const { HttpsProxyAgent } = require('https-proxy-agent')

const File = require('../classes/File')

exports.domains = ['mega.nz', 'mega.co.nz']

exports.get = (url, proxy) => {
  return new Promise((resolve, reject) => {
    const mega = megajs.File.fromURL(url)

    if (proxy) {
      mega.api.httpAgent = new HttpProxyAgent(proxy)
      mega.api.httpsAgent = new HttpsProxyAgent(proxy)
    }

    mega.loadAttributes((err, file) => {
      if (err) return reject(err)

      const isFolder = file.type !== 0

      if (isFolder) {
        resolve(
          file.children.map(child => new File({
            name: child.name,
            size: child.size,
            createdAt: new Date(child.timestamp * 1e3),
          }))
        )
      } else {
        resolve([
          new File({
            name: file.name,
            size: file.size,
          })
        ])
      }
    })
  })
}
