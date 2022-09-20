import { Lang } from '../../utils/Translate'

export const TimeUnit = {
  type: Number,
  entries: {
    MILLISECONDS: {
      label: Lang.translateReactive('time.milliseconds'),
      value: 0
    },
    SECONDS: {
      label: Lang.translateReactive('time.seconds'),
      value: 1
    },
    MINUTES: {
      label: Lang.translateReactive('time.minutes'),
      value: 2
    },
    HOURS: {
      label: Lang.translateReactive('time.hours'),
      value: 3
    },
    DAYS: {
      label: Lang.translateReactive('time.days'),
      value: 4
    },
    MONTHS: {
      label: Lang.translateReactive('time.months'),
      value: 5
    },
    YEARS: {
      label: Lang.translateReactive('time.years'),
      value: 6
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
  },
  essentialOptions () {
    return [
      this.entries.MINUTES,
      this.entries.HOURS
    ]
  }
}
