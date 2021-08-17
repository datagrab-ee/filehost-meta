class File {

  constructor (data) {

    this.name = data.name ?? null
    this.size = parseInt(data.size ?? 0, 10)
    this.views = parseInt(data.views ?? 0, 10)
    this.downloads = parseInt(data.downloads ?? 0, 10)

    this.createdAt = data?.createdAt ?? null
    this.updatedAt = data?.updatedAt ?? data?.createdAt ?? null

    if (this.createdAt) this.createdAt = new Date(this.createdAt)
    if (this.updatedAt) this.updatedAt = new Date(this.updatedAt)
  }

}

module.exports = File