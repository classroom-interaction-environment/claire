import { check, Match } from 'meteor/check'

export const createCategoriesHandler = ({ target }) => {
  return function (value) {
    check(value, Match.Maybe(Function))

    if (value) {
      target.categories = value
    }

    return target.categories()
  }
}
