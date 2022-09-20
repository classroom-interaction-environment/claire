/**
 * A DoubleMap holds references to both key and value as keys, so you can
 * access via either key or value.
 *
 * This allows, for example to get a key by value without expensive search.
 */

class DoubleMap {
  constructor (obj = {}) {
    const self = this
    self.keys = new Map()
    self.vals = new Map()

    Object.entries(obj).forEach(([key, value]) => {
      self.set(key, value)
    })
  }

  set (key, value) {
    this.keys.set(key, value)
    this.vals.set(value, key)
  }

  get (any) {
    if (this.keys.has(any)) {
      return this.keys.get(any)
    }

    return this.vals.get(any)
  }
}

export { DoubleMap }
