const { convertFileSize } = require('size-converter')

// <protocol>://<user>:<pass>@<ip>:<port>
exports.proxyToAxios = string => {
  if (!string) return false

  const [protocol, proxy] = string.split('://')
  const [creds, addr] = proxy.split('@')

  if (creds && addr) {
    const [username, password] = creds.split(':')
    const [host, port] = addr.split(':')

    return {
      protocol,
      host,
      port,
      auth: {
        username,
        password
      }
    }
  }

  const [host, port] = creds.split(':')
  
  return {
    protocol,
    host,
    port,
    auth: {
      username,
      password
    }
  }
}

exports.sizeToBytes = string => {
  const { number } = convertFileSize(string, 'bytes', 1000)

  return number
}