import { i18n } from '../../../api/language/language'

/**
 * @deprecated
 */
export const Lang = {
  setTranslationProvider (provider, accessProperty = '__') {},

  translate (field, ...args) {
    return i18n.get(field, ...args)
  },

  translateReactive (field, lang) {
    return function () {
      return Lang.translate(field, lang)
    }
  },

  _defaultSelectOne: 'form.selectOne',
  _defaultEntry: 'common.entry',

  firstOption () {
    return Lang.translateReactive(Lang._defaultSelectOne)
  },


  entry () {
    return Lang.translateReactive(Lang._defaultEntry)
  }
}
