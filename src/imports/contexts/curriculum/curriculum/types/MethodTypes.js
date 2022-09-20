import { Lang } from '../../utils/Translate'

export const MethodTypes = {
  TYPE: Number,
  PREFIX: 'method',
  entries: {
    PRESENTATION_TEACHER: {
      label: Lang.translateReactive('method.presentationTeacher'),
      value: 0,
      icon: 'user'
    },
    PRESENTATION_STUDENT: {
      label: Lang.translateReactive('method.presentationStudent'),
      value: 1,
      icon: 'user'
    },
    DISCUSSION: {
      label: Lang.translateReactive('method.discussion'),
      value: 2,
      icon: 'comments'
    },
    TASK: {
      label: Lang.translateReactive('method.task'),
      value: 3,
      icon: 'edit'
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
  entry (value) {
    return this.toArr()[value]
  },
  resolve (value) {
    const entry = this.entry(value)
    return entry ? entry.label() : value
  },
  icon (value) {
    const entry = this.entry(value)
    return entry.icon || ''
  }
}
