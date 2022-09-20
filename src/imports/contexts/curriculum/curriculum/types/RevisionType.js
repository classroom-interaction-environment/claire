import { Lang } from '../../utils/Translate'

export const RevisionTypes = {
  TYPE: Number,
  entries: {
    UNREVISED: {
      label: Lang.translateReactive('revision.unrevised'),
      value: 0,
      icon: 'edit',
      color: 'muted'
    },
    COMPLETE: {
      label: Lang.translateReactive('revision.complete'),
      value: 1,
      icon: 'check',
      color: 'success'
    },
    FLAGGED: {
      label: Lang.translateReactive('revision.flagged'),
      value: 2,
      icon: 'exclamation-triangle',
      color: 'danger'
    },
    IN_REVISION: {
      label: Lang.translateReactive('revision.inRevision'),
      value: 3,
      icon: 'eye',
      color: 'info'
    }
  },
  getTypeByValue () {
    return null
  },
  toArr () {
    if (!this._arr) {
      this._arr = Object.values(this.entries)
    }
    return this._arr
  },
  byStatus (value) {
    const arr = this.toArr()
    return arr.find(entry => entry.value === value)
  }
}
