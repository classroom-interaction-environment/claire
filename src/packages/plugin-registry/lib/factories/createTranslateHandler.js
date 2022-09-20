import { check, Match } from 'meteor/check'

export const createTranslateHandler = ({ target }) => {
  return function (value) {
    check(value, Match.Maybe(Function))

    if (typeof value === 'function') {
      target.translate = value
      return value
    }

    return (...args) => target.translate(...args)
  }
}
