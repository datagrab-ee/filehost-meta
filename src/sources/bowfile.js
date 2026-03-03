const axios = require('axios')
const cheerio = require('cheerio')

const File = require('../classes/File')
const { proxyToAxios } = require('../utils')

exports.domains = ['bowfile.com']

exports.get = async (url, proxy) => {
  const axiosProxy = proxyToAxios(proxy)

  // GET the shared page to establish session cookie
  const pageRes = await axios.get(url, { ...axiosProxy, maxRedirects: 5 })
  const cookies = pageRes.headers['set-cookie']?.map(c => c.split(';')[0]).join('; ')

  const headers = {
    Cookie: cookies,
    Referer: url,
    'Content-Type': 'application/x-www-form-urlencoded',
  }

  const ajaxUrl = 'https://bowfile.com/account/ajax/load_files'

  // Load root listing
  const rootRes = await axios.post(ajaxUrl, 'pageType=nonaccountshared&nodeId=&pageStart=0&perPage=500', {
    ...axiosProxy,
    headers,
  })

  if (!rootRes.data?.html) {
    throw new Error('Could not load file listing')
  }

  const allFiles = []

  // Parse file items from HTML response
  const parseFiles = (html) => {
    const $ = cheerio.load(html)
    const files = []

    $('.fileIconLi:not(.folderIconLi)').each((_, el) => {
      const name = $(el).attr('dtfilename')
      const sizeRaw = $(el).attr('dtsizeraw')
      const uploadDate = $(el).attr('dtuploaddate')
      const downloads = $(el).find('.downloadCount').text().trim()

      if (name) {
        files.push({ name, sizeRaw, uploadDate, downloads })
      }
    })

    return files
  }

  // Parse folder IDs from HTML response
  const parseFolders = (html) => {
    const $ = cheerio.load(html)
    const folderIds = []

    $('.folderIconLi').each((_, el) => {
      const id = $(el).attr('folderid')
      if (id) folderIds.push(id)
    })

    return folderIds
  }

  // Get files from root
  allFiles.push(...parseFiles(rootRes.data.html))

  // If there are folders, load files from each folder
  const folderIds = parseFolders(rootRes.data.html)
  for (const folderId of folderIds) {
    const folderRes = await axios.post(ajaxUrl, `pageType=nonaccountshared&nodeId=${folderId}&pageStart=0&perPage=500`, {
      ...axiosProxy,
      headers,
    })

    if (folderRes.data?.html) {
      allFiles.push(...parseFiles(folderRes.data.html))
    }
  }

  if (allFiles.length === 0) {
    throw new Error('Could not find any files on page')
  }

  return allFiles.map(f => {
    let createdAt = null
    if (f.uploadDate) {
      createdAt = new Date(f.uploadDate)
      if (isNaN(createdAt.getTime())) createdAt = null
    }

    return new File({
      name: f.name,
      size: f.sizeRaw ? parseInt(f.sizeRaw, 10) : 0,
      downloads: f.downloads ? parseInt(f.downloads, 10) : 0,
      createdAt,
    })
  })
}
