const axios = require('axios')
const cheerio = require('cheerio')

const File = require('../classes/File')
const { proxyToAxios, sizeToBytes } = require('../utils')

exports.domains = ['mediafire.com']

/**
 * Some mediafire links are instant downloads which would crash HTML parsing
 * or make node run out of memory. This ensures the link returns text/html.
 */
async function ensureHtmlResponse(url, proxy) {
  const { headers } = await axios({
    url,
    method: 'head',
    ...proxyToAxios(proxy),
  })

  if (!headers?.['content-type']?.includes('text/html')) {
    throw new Error(`Expected "text/html" but received "${headers['content-type']}"`)
  }
}

/**
 * Extract folder key from a MediaFire folder URL.
 * Folder URLs look like: https://www.mediafire.com/folder/FOLDERKEY[/name]
 */
function extractFolderKey(url) {
  const match = url.match(/mediafire\.com\/folder\/([a-zA-Z0-9]+)/)
  return match ? match[1] : null
}

/**
 * Fetch all files from a MediaFire folder using the public API.
 * Handles pagination via the chunk parameter.
 */
async function getFolderFiles(folderKey, proxy) {
  const files = []
  let chunk = 1
  let moreChunks = true

  while (moreChunks) {
    const apiUrl = `https://www.mediafire.com/api/1.5/folder/get_content.php?folder_key=${folderKey}&content_type=files&chunk=${chunk}&response_format=json`

    const res = await axios({
      url: apiUrl,
      ...proxyToAxios(proxy),
    })

    if (res.status !== 200) {
      throw new Error('Response returned bad status')
    }

    const folderContent = res.data?.response?.folder_content
    if (!folderContent) {
      throw new Error('Unexpected API response structure')
    }

    const fileList = folderContent.files ?? []
    for (const f of fileList) {
      files.push(new File({
        name: f.filename,
        size: f.size,
        downloads: f.downloads,
        createdAt: f.created,
      }))
    }

    const chunkSize = parseInt(folderContent.chunk_size ?? 0, 10)
    const totalCount = parseInt(folderContent.total_count ?? 0, 10)
    moreChunks = chunk * chunkSize < totalCount
    chunk++
  }

  return files
}

exports.get = async (url, proxy) => {
  // Check if this is a multi-file folder page
  const folderKey = extractFolderKey(url)
  if (folderKey) {
    return getFolderFiles(folderKey, proxy)
  }

  // Single file page
  await ensureHtmlResponse(url, proxy)

  const res = await axios({
    url,
    ...proxyToAxios(proxy)
  })

  // NOTE: mediafire does a 302 redirect if file does not exist
  if (res.status !== 200) {
    throw new Error('Response returned bad status')
  }

  const $ = cheerio.load(res.data)
  const el = $('.dl-info').first()

  const name = el.find('.filename').first().text().trim()
  const size = sizeToBytes(el.find('.details li:eq(0) span').first().text())
  const createdAt = el.find('.details li:eq(1) span').first().text()

  return [
    new File({ name, size, createdAt })
  ]
}
