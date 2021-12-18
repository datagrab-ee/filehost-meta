[![https://nodei.co/npm/filehost-meta.png?downloads=true&downloadRank=true&stars=true](https://nodei.co/npm/filehost-meta.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/filehost-meta)

# filehost-meta

Fetch basic file information from a download link.

## Example

```js
const getFileInfo = require('filehost-meta')

getFileInfo('DOWNLOAD_LINK')
  .then(data => {
    // name, size, views, downloads, createdAt, updatedAt
  })
  .catch(console.error)
```

## Supported Hosts

- Anonfiles
- Files.fm
- Google Drive - *requires API key in env* - `GOOGLE_KEY`
- Gofile - *requires API key in env* - `GOFILE_KEY`
- Mediafire
- Mega
- Mixdrop
- Pixeldrain
- Racaty
- Uploadhaven
- Workupload
- Zippyshare

## TODO

- [ ] Dropmefiles.com
- [ ] Up2sha.re
- [ ] Letsupload.io
- [ ] Teknik.io
- [ ] Terminal.lc
- [ ] Dropbox
- [ ] Wetransfer

## Contributing

Go for it.