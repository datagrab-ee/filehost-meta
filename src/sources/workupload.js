const puppeteer = require('puppeteer')
const File = require('../classes/File')

const { proxyToPuppeteer } = require('../utils')

exports.domains = ['workupload.com']

exports.get = async (url, proxy) => {
  let browser

  const pupProxy = proxyToPuppeteer(proxy)

  try {
    // Launch Puppeteer browser with proxy settings if provided
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        ...pupProxy ? [`--proxy-server=${pupProxy.ip}:${pupProxy.port}`] : []
      ]
    })

    const page = await browser.newPage()

    // proxy authentication if necessary
    if (pupProxy.username || pupProxy.password) {
      await page.authenticate({ username: pupProxy.username, password: pupProxy.password })
    }

    // Go to the specified URL
    await page.goto(url, { waitUntil: 'networkidle2' })

    // Check for text indicating file does not exist
    const pageContent = await page.content()

    if (pageContent.includes('file does not exist')) {
      throw new Error('Response returned bad status')
    }

    // Extract file name and size using Puppeteer's page.evaluate
    const fileData = await page.evaluate(() => {
      const el = document.querySelector('#notice table')
      if (!el) return null // Handle cases where element is not found

      const file = el.querySelectorAll('td')[1]?.innerText
      const size = el.querySelectorAll('td')[3]?.innerText.split(' ')[0]

      return { file, size }
    })

    if (!fileData) {
      throw new Error('Could not find file data on page')
    }

    // Return new File instance
    return [
      new File({
        name: fileData.file,
        size: fileData.size,
      }),
    ]
  } catch (err) {
    throw err
  } finally {
    if (browser) {
      await browser.close() // Ensure the browser is closed even if there is an error
    }
  }
}