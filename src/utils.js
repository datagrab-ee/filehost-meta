// <protocol>://<user>:<pass>@<ip>:<port>
exports.proxyToAxios = string => {
  if (!string) return false

  const [protocol, proxy] = string.split('://')
  const [creds, addr] = proxy.split('@')

  let username
  let password
  let host
  let port

  if (creds && addr) {
    [username, password] = creds.split(':')
    [host, port] = addr.split(':')
  }
  else {
    [host, port] = creds.split(':')
  }

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