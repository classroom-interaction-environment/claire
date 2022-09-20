import { translateReactive } from '../../../../utils/translateReactive'

export const SocialStateType = {
  TYPE: Number,
  PREFIX: 'socialState',
  entries: {
    PLENUM: {
      label: translateReactive('socialState.plenum'),
      value: 0,
      icon: 'chalkboard-teacher'
    },
    SINGLE: {
      label: translateReactive('socialState.single'),
      value: 1,
      icon: 'user'
    },
    PARTNER: {
      label: translateReactive('socialState.partner'),
      value: 5,
      icon: 'users'
    },
    GROUP: {
      label: translateReactive('socialState.group'),
      value: 2,
      icon: 'users'
    },
    PROJECT: {
      label: translateReactive('socialState.project'),
      value: 3,
      icon: 'chart-line'
    },
    STATIONS: {
      label: translateReactive('socialState.stations'),
      value: 4,
      icon: 'code-branch'
    }
  },
  _arr: null,
  toArr () {
    if (!this._arr) {
      this._arr = Object.values(this.entries)
    }
    return this._arr
  },
  entry (value) {
    return this.toArr().find(entry => entry.value === value)
  },
  resolve (value) {
    const entry = this.entry(value)
    return entry ? entry.label() : value
  },
  icon (value) {
    const entry = this.entry(value)
    return entry ? entry.icon : ''
  }
}
