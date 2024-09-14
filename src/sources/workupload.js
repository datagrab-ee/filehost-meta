const puppeteer = require('puppeteer')
const File = require('../classes/File')

exports.domains = ['workupload.com']

exports.get = async (url, proxy) => {
  let browser
  try {
    // Launch Puppeteer browser with proxy settings if provided
    browser = await puppeteer.launch({
      headless: true,
      args: proxy ? [`--proxy-server=${proxy}`] : [],
    })

    const page = await browser.newPage()

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