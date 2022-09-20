export const DimensionType = {
  TYPE: Number,

  entries: {
    ACTOR: {
      label: 'dimension.actor',
      value: 0
    },
    LAYER: {
      label: 'dimension.layer',
      value: 1
    }

  },
  _arr: null,
  toArr () {
    if (!this._arr) {
      this._arr = Object.values(this.entries).sort(function (a, b) {
        return a.value - b.value
      })
    }
    return this._arr
  },
  resolve (value) {
    const entry = this.toArr()[value]
    return entry ? entry.label() : value
  }
}
