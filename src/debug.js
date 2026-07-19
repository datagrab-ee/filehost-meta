let debugEnabled = false

// Enable/disable debug bandwidth logging
exports.setDebug = (enabled) => {
  debugEnabled = !!enabled
}

// Internal check used by other modules
exports.isDebugEnabled = () => debugEnabled

// Log bytes used by a request, best-effort
exports.logBandwidth = (method, url, bytes) => {
  if (!debugEnabled) return
  const kb = (bytes / 1024).toFixed(2)
  console.log(`[filehost-meta] ${method} ${url} - ${kb} KB`)
}
