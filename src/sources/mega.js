const File = require('../classes/File')

const megajs = require('megajs')

exports.get = (url, proxy) => {
  return new Promise((resolve, reject) => {
    try {
      const mega = megajs.File.fromURL(url)

      mega.api.requestModule = mega.api.requestModule.defaults({ proxy })

      mega.loadAttributes((err, file) => {
        if (err) return reject(err)

        const type = file.type === 0 ? 'file' : 'folder'
        const files = []

        if (type === 'folder') {
          files.push(
            ...file.children.map(x => new File({
              name: x.name,
              size: x.size,
              createdAt: new Date(x.timestamp * 1e3)
            }))
          )
        }
        else {
          files.push(
            new File({
              name: file.name,
              size: file.size
            })
          )
        }

        resolve(files)
      })
    } catch (err) {
      reject(err)
    }
  })
}