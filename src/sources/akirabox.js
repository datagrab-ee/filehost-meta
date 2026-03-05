const { connectBrowser } = require('../browser')

const File = require('../classes/File')
const { sizeToBytes } = require('../utils')

exports.domains = ['akirabox.com', 'akirabox.to']

exports.get = async (url, proxy) => {
  let cleanup

  try {
    const connectOptions = { turnstile: true }

    if (proxy) {
      const parsed = new URL(proxy)
      connectOptions.proxy = {
        host: parsed.hostname,
        port: parsed.port,
        username: parsed.username || undefined,
        password: parsed.password || undefined,
      }
    }

    const result = await connectBrowser(connectOptions)
    cleanup = result.cleanup
    const page = result.page

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 })

    // Wait for Cloudflare challenge to resolve
    const startTime = Date.now()
    while (Date.now() - startTime < 30000) {
      const title = await page.title()
      if (title !== 'Just a moment...') break
      await new Promise(r => setTimeout(r, 1000))
    }

    // Wait for page content to render after Cloudflare redirect
    await page.waitForSelector('h1.text-break, .file-request', { timeout: 15000 }).catch(() => {})
    // Extra settle time for dynamic content
    await new Promise(r => setTimeout(r, 2000))

    const fileData = await page.evaluate(() => {
      const name = document.querySelector('h1.text-break')?.textContent?.trim()
        || document.querySelector('h1')?.textContent?.trim()

      // Parse size from "(530.92 MB)" in the file-request section
      let size = null
      const spans = document.querySelectorAll('.file-request span')
      for (const span of spans) {
        const match = span.textContent.match(/\(([\d.]+\s*[KMGT]?B)\)/)
        if (match) { size = match[1]; break }
      }

      // Also try the gray info text pattern
      if (!size) {
        const allText = document.body.innerText
        const sizeMatch = allText.match(/([\d.]+\s*[KMGT]?B)\s*\)/)
        if (sizeMatch) size = sizeMatch[1]
      }

      // Parse date and stats from info table
      let date = null, views = null, downloads = null
      const rows = document.querySelectorAll('table tr')
      for (const row of rows) {
        const cells = row.querySelectorAll('td')
        if (cells.length < 2) continue
        const label = cells[0].textContent.trim()
        const value = cells[1].textContent.trim()

        if (label.includes('Date')) date = value
        if (label.includes('Stats')) {
          const parts = value.split('|').map(s => parseInt(s.replace(/\D/g, ''), 10))
          views = parts[0] || 0
          downloads = parts[1] || 0
        }
      }

      return { name, size, date, views, downloads }
    })

    if (!fileData?.name) {
      throw new Error('Could not extract file name from page')
    }

    let createdAt = null
    if (fileData.date) {
      createdAt = new Date(fileData.date)
      if (isNaN(createdAt.getTime())) createdAt = null
    }

    return [
      new File({
        name: fileData.name,
        size: fileData.size ? sizeToBytes(fileData.size) : 0,
        views: fileData.views || 0,
        downloads: fileData.downloads || 0,
        createdAt,
      })
    ]
  } finally {
    if (cleanup) {
      await cleanup()
    }
  }
}
