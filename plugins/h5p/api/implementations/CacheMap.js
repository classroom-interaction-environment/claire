export class CacheMap {
  static create () {
    return new CacheMap()
  }

  constructor () {
    this.storage = new Map()
  }

  async load (key) {
    return this.storage.get(key)
  }

  async save (key, value) {
    return this.storage.set(key, value)
  }
}
