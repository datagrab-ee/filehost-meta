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

exports.sizeToBytes = string => {
  const { number } = convertFileSize(string, 'bytes', 1000)

  return number
}