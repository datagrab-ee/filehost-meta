[![https://img.shields.io/npm/v/filehost-meta](https://img.shields.io/npm/v/filehost-meta)](https://www.npmjs.com/package/filehost-meta) [![https://img.shields.io/npm/dw/filehost-meta](https://img.shields.io/npm/dw/filehost-meta)](https://www.npmjs.com/package/filehost-meta)

# filehost-meta

Fetch basic file information from a download link.

## Usage

```js
const { getSources, getInfo } = require('filehost-meta')

// Get all supported hostnames
const sources = getSources()

// Get file information from a URL
// Returns an array of File objects: { name, size, views, downloads, createdAt, updatedAt }
getInfo(url)
  .then(files => console.log(files))
  .catch(console.error)

// With an HTTP proxy (http://<user>:<pass>@<ip>:<port>)
getInfo(url, { proxy: 'http://user:pass@127.0.0.1:8080' })
  .then(files => console.log(files))
  .catch(console.error)
```

## Supported Hosts

| Host | Domain | Notes |
|------|--------|-------|
| Akirabox | `akirabox.com`, `akirabox.to` | Cloudflare Turnstile (requires `xvfb` on headless Linux) |
| Bowfile | `bowfile.com` | Shared folder support |
| Buzzheavier | `buzzheavier.com` | |
| Datanodes | `datanodes.to` | |
| Download.gg | `download.gg` | French locale (Mo/Go units) |
| Dropmefiles | `dropmefiles.com` | |
| Files.fm | `files.fm` | |
| Filesadmin | `filesadmin.com` | |
| Google Drive | `drive.google.com` | Requires `GOOGLE_KEY` env var |
| Gofile | `gofile.io` | Requires `GOFILE_KEY` env var |
| KrakenFiles | `krakenfiles.com` | |
| Mediafire | `mediafire.com` | |
| Mega | `mega.nz`, `mega.co.nz` | |
| Mixdrop | `mixdrop.co`, `mixdrop.ag`, `mixdrop.ps` | |
| Pixeldrain | `pixeldrain.com` | |
| Terminal.lc | `terminal.lc` | |
| Uploadhaven | `uploadhaven.com` | |
| ViKiNG FiLE | `vikingfile.com` | |
| Workupload | `workupload.com` | Requires `xvfb` on headless Linux |

## Adding a New Source

To add a new file host, create a new file in `src/sources/`. The file is auto-discovered — no registration needed.

Each source must export `domains` (array of hostnames) and `get` (async function):

```js
// src/sources/example.js
const axios = require('axios')
const cheerio = require('cheerio')

const File = require('../classes/File')
const { proxyToAxios, sizeToBytes } = require('../utils')

exports.domains = ['example.com']

exports.get = async (url, proxy) => {
  const res = await axios({
    url,
    ...proxyToAxios(proxy)
  })

  if (res.status !== 200) {
    throw new Error(res.statusText)
  }

  const $ = cheerio.load(res.data)

  // Extract file info from page...
  const name = $('.filename').text().trim()
  const size = sizeToBytes($('.filesize').text().trim())

  return [
    new File({ name, size })
  ]
}
```

That's it. Drop the file in `src/sources/` and it works.

## TODO

- [ ] Up2sha.re
- [ ] Dropbox
- [ ] Wetransfer
- [ ] Megaup.net

## Contributing

Go for it.
