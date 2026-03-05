const os = require('os')
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const { connect } = require('puppeteer-real-browser')

/**
 * Track all active browser sessions so we can clean them up on process exit.
 * Each entry: { browser, userDataDir }
 */
const activeSessions = new Set()

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
  let session = null

  try {
    const result = await connect(connectOptions)
    browser = result.browser
    const page = result.page

    // Track this session for process-exit cleanup
    session = { browser, userDataDir }
    activeSessions.add(session)

    /**
     * Cleanup function: close the browser and remove the temp directory.
     * Safe to call multiple times.
     */
    const cleanup = async () => {
      activeSessions.delete(session)
      try {
        if (browser) {
          await browser.close().catch(() => {})
          browser = null
        }
      } finally {
        // Give a short moment for file handles to release
        await new Promise(r => setTimeout(r, 500))
        killChromeByDataDir(userDataDir)
        removeTmpDir(userDataDir)
      }
    }

    return { browser, page, cleanup }
  } catch (err) {
    // If connect itself fails, make sure we still clean up
    if (session) activeSessions.delete(session)
    if (browser) {
      await browser.close().catch(() => {})
    }
    killChromeByDataDir(userDataDir)
    removeTmpDir(userDataDir)
    throw err
  }
}

/**
 * Kill any Chrome processes that were launched with the given user data dir.
 */
function killChromeByDataDir(userDataDir) {
  try {
    const pids = execSync(`pgrep -f "${userDataDir}"`, { encoding: 'utf-8', timeout: 5000 })
      .trim()
      .split('\n')
      .map(p => parseInt(p, 10))
      .filter(p => p && p !== process.pid)
    for (const pid of pids) {
      try { process.kill(pid, 'SIGKILL') } catch {}
    }
  } catch {
    // pgrep exits non-zero when no processes match — that's fine
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

// ---------------------------------------------------------------------------
// Process-exit cleanup: kill all active browsers and remove temp dirs
// when the process is terminated (e.g. pm2 restart, Ctrl+C, crash).
// ---------------------------------------------------------------------------

/**
 * Synchronous cleanup — used in the 'exit' handler where only sync code runs.
 * Kills chrome processes by their userDataDir and removes the temp dirs.
 */
function cleanupAllSync() {
  for (const session of activeSessions) {
    killChromeByDataDir(session.userDataDir)
    removeTmpDir(session.userDataDir)
  }
  activeSessions.clear()
}

/**
 * Async cleanup for intercepted signals. Tries graceful browser.close()
 * first, then forcefully kills processes and cleans temp dirs.
 */
async function gracefulShutdown(signal) {
  const promises = []
  for (const session of activeSessions) {
    promises.push(
      Promise.resolve()
        .then(() => session.browser?.close())
        .catch(() => {})
        .finally(() => {
          killChromeByDataDir(session.userDataDir)
          removeTmpDir(session.userDataDir)
        })
    )
  }
  activeSessions.clear()
  await Promise.allSettled(promises)

  // Re-raise the signal so the process exits with the correct code
  process.kill(process.pid, signal)
}

// Graceful async cleanup on common termination signals
process.once('SIGINT', () => gracefulShutdown('SIGINT'))
process.once('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.once('SIGHUP', () => gracefulShutdown('SIGHUP'))

// Last-resort synchronous cleanup when the process is exiting
process.on('exit', cleanupAllSync)
