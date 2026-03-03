const { connect } = require('puppeteer-real-browser')

const File = require('../classes/File')

exports.domains = ['workupload.com']

exports.get = async (url, proxy) => {
  let browser

  try {
    const connectOptions = {
      headless: false,
      turnstile: true,
      disableXvfb: false,
    }

    if (proxy) {
      const parsed = new URL(proxy)
      connectOptions.proxy = {
        host: parsed.hostname,
        port: parsed.port,
        username: parsed.username || undefined,
        password: parsed.password || undefined,
      }
    }

    const result = await connect(connectOptions)
    browser = result.browser
    const page = result.page

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 })

    const pageContent = await page.content()

    if (pageContent.includes('file does not exist')) {
      throw new Error('File does not exist')
    }

    const fileData = await page.evaluate(() => {
      const el = document.querySelector('#notice table')
      if (!el) return null

      const name = el.querySelectorAll('td')[1]?.innerText
      const size = el.querySelectorAll('td')[3]?.innerText.split(' ')[0]

      return { name, size }
    })

    if (!fileData) {
      throw new Error('Could not find file data on page')
    }

    return [
      new File({ name: fileData.name, size: fileData.size })
    ]
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}
