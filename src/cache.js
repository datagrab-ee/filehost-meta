const fs = require('fs')
const os = require('os')
const path = require('path')
const crypto = require('crypto')

let enabled = true
let maxSize = 100 * 1024 * 1024 // 100MB
let ttl = 24 * 60 * 60 * 1000 // 24h
let store = 'memory' // 'memory' | 'file'
let filePath = path.join(os.tmpdir(), 'filehost-meta-cache')

// index: hash -> { url, data (memory only), size, expiresAt }
let index = new Map()

// Hash a URL into a safe cache key
function hashUrl(url) {
  return crypto.createHash('md5').update(url).digest('hex')
}

// Full path to a file-store cache entry
function entryFilePath(hash) {
  return path.join(filePath, `${hash}.json`)
}

// Scan an existing file store dir and rebuild the index (used on switch/startup)
function reindexFileStore() {
  index.clear()
  if (!fs.existsSync(filePath)) return

  for (const file of fs.readdirSync(filePath)) {
    if (!file.endsWith('.json')) continue
    try {
      const raw = fs.readFileSync(path.join(filePath, file), 'utf-8')
      const { url, expiresAt, size } = JSON.parse(raw)
      const hash = path.basename(file, '.json')
      index.set(hash, { url, size, expiresAt })
    } catch {
      // Corrupt/partial file - ignore
    }
  }
}

/**
 * Configure the internal cache.
 *
 * @param {object} [options]
 * @param {boolean} [options.enabled] - Enable/disable caching entirely
 * @param {number} [options.maxSize] - Max total cache size in bytes
 * @param {number} [options.ttl] - Per-entry expiry in ms
 * @param {'memory'|'file'} [options.store] - Cache backend
 * @param {string} [options.filePath] - Directory used when store is 'file'
 */
exports.configureCache = (options = {}) => {
  if (options.enabled !== undefined) enabled = !!options.enabled
  if (options.maxSize !== undefined) maxSize = options.maxSize
  if (options.ttl !== undefined) ttl = options.ttl

  if (options.filePath !== undefined) filePath = options.filePath
  if (options.store !== undefined) store = options.store

  if (store === 'file') {
    fs.mkdirSync(filePath, { recursive: true })
    reindexFileStore()
  } else {
    index.clear()
  }
}

/**
 * Clear the entire cache (index + underlying storage).
 */
exports.clearCache = () => {
  if (store === 'file') {
    for (const hash of index.keys()) {
      try { fs.unlinkSync(entryFilePath(hash)) } catch {}
    }
  }
  index.clear()
}

/**
 * Get a cached result for a URL, or null if missing/expired/disabled.
 */
exports.getCached = (url) => {
  if (!enabled) return null

  const hash = hashUrl(url)
  const entry = index.get(hash)
  if (!entry) return null

  if (Date.now() > entry.expiresAt) {
    evict(hash)
    return null
  }

  if (store === 'file') {
    try {
      const raw = fs.readFileSync(entryFilePath(hash), 'utf-8')
      return JSON.parse(raw).data
    } catch {
      evict(hash)
      return null
    }
  }

  return entry.data
}

/**
 * Store a result for a URL, evicting oldest entries if over maxSize.
 */
exports.setCached = (url, data) => {
  if (!enabled) return

  const hash = hashUrl(url)
  const serialized = JSON.stringify(data)
  const size = Buffer.byteLength(serialized)
  const expiresAt = Date.now() + ttl

  // Remove any previous entry for this URL before size accounting
  evict(hash)

  evictUntilFits(size)

  if (store === 'file') {
    const payload = JSON.stringify({ url, data, size, expiresAt })
    try {
      fs.writeFileSync(entryFilePath(hash), payload)
    } catch {
      return // Best-effort - don't index if the write failed
    }
    index.set(hash, { url, size, expiresAt })
  } else {
    index.set(hash, { url, data, size, expiresAt })
  }
}

// Remove a single entry from the index and underlying storage
function evict(hash) {
  if (!index.has(hash)) return
  if (store === 'file') {
    try { fs.unlinkSync(entryFilePath(hash)) } catch {}
  }
  index.delete(hash)
}

// Evict oldest entries (Map insertion order = FIFO) until incomingSize fits
function evictUntilFits(incomingSize) {
  let total = incomingSize
  for (const entry of index.values()) total += entry.size

  const iterator = index.keys()
  while (total > maxSize) {
    const next = iterator.next()
    if (next.done) break
    const hash = next.value
    const entry = index.get(hash)
    total -= entry.size
    evict(hash)
  }
}
