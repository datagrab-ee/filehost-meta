const os = require('os')
const fs = require('fs')
const path = require('path')
const { connect } = require('puppeteer-real-browser')

/**
 * Connect to a real browser instance with automatic temp directory cleanup.
 *
 * chrome-launcher creates temp user data dirs (e.g. /tmp/lighthouse.XXXXXXX)
 * that often aren't cleaned up due to race conditions between browser.close()
 * and the chrome-launcher kill/destroyTmp flow. This wrapper manages its own
 * temp directory and guarantees cleanup.
 *
 * @param {object} [options]
 * @param {object} [options.proxy] - Proxy config ({ host, port, username, password })
 * @param {boolean} [options.turnstile] - Enable turnstile solving
 * @returns {Promise<{ browser: object, page: object, cleanup: () => Promise<void> }>}
 */
exports.connectBrowser = async function connectBrowser(options = {}) {
  const { proxy = {}, turnstile = false } = options

  // Create our own temp directory so we can guarantee cleanup
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'filehost-meta-'))

  const connectOptions = {
    headless: false,
    turnstile,
    disableXvfb: false,
    customConfig: {
      userDataDir,
    },
  }

  if (proxy.host) {
    connectOptions.proxy = proxy
  }

  let browser = null

  try {
    const result = await connect(connectOptions)
    browser = result.browser

    const page = result.page

    /**
     * Cleanup function: close the browser and remove the temp directory.
     * Safe to call multiple times.
     */
    const cleanup = async () => {
      try {
        if (browser) {
          await browser.close().catch(() => {})
          browser = null
        }
      } finally {
        // Give a short moment for file handles to release
        await new Promise(r => setTimeout(r, 500))
        removeTmpDir(userDataDir)
      }
    }

    return { browser, page, cleanup }
  } catch (err) {
    // If connect itself fails, make sure we still clean up
    if (browser) {
      await browser.close().catch(() => {})
    }
    removeTmpDir(userDataDir)
    throw err
  }
}

/**
 * Forcefully remove a temporary directory and all its contents.
 */
function removeTmpDir(dirPath) {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true, maxRetries: 3 })
    }
  } catch {
    // Best-effort cleanup; don't throw
  }
}
