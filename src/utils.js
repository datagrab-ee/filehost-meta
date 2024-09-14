const { HttpProxyAgent } = require('http-proxy-agent')
const { HttpsProxyAgent } = require('https-proxy-agent')
const { convertFileSize } = require('size-converter')

// <protocol>://<user>:<pass>@<ip>:<port>
exports.proxyToAxios = string => {
  if (!string) return {}

  return {
    httpAgent: new HttpProxyAgent(string),
    httpsAgent: new HttpsProxyAgent(string),
    proxy: false
  }
}

exports.proxyToPuppeteer = string => {
  if (!string) return {}

  const proxyUrl = string.replace('http://', '').replace('https://', '')
  const [auth, host] = proxyUrl.split('@')

  const [username, password] = auth.split(':')
  const [ip, port] = host.split(':')

  return {
    username,
    password,
    ip,
    port
  }
}


exports.sizeToBytes = string => {
  const { number } = convertFileSize(string, 'bytes', 1000)

  return number
}