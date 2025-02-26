[![https://img.shields.io/npm/v/filehost-meta](https://img.shields.io/npm/v/filehost-meta)](https://www.npmjs.com/package/filehost-meta) [![https://img.shields.io/npm/dw/filehost-meta](https://img.shields.io/npm/dw/filehost-meta)](https://www.npmjs.com/package/filehost-meta)

# filehost-meta

Fetch basic file information from a download link.

## Usage

```js
const { getSources, getInfo } = require('filehost-meta')

// Get all supported sources
// Returns an array of hostnames
const sources = getSources()

// Get file information from page without proxy
// Returns a File class object { name, size, views, downloads, createdAt, updatedAt }
getInfo(url)
  .then(data => {})
  .catch(console.error)

// Get file information from page with a HTTP proxy (http://<user>:<pass>@<ip>:<port>)
// Returns a File class object { name, size, views, downloads, createdAt, updatedAt }
getInfo(url, { proxy })
  .then(data => {})
  .catch(console.error)
```

## Supported Hosts

- Dropmefiles
- Files.fm
- Google Drive - *requires API key in env* - `GOOGLE_KEY`
- Gofile - *requires API key in env* - `GOFILE_KEY`
- KrakenFiles
- Mediafire
- Mega
- Mixdrop
- Pixeldrain
- Terminal.lc
- Uploadhaven
- Workupload

### RIP 🥀

- ~~Anonfiles~~ (shut down)
- ~~Zippyshare~~ (shut down)
- ~~Nopy~~ (shut down)
- ~~Racaty~~ (shut down)
- ~~Transfer.sh~~ (shut down)

## TODO

- [ ] Up2sha.re
- [ ] Dropbox
- [ ] Wetransfer
- [ ] Megaup.net

## Contributing

Go for it.