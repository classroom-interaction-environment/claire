import { i18n } from '../../../i18n/i18n'

export const translationCallbackAdapter = (key, language) => {
  return i18n.get(language, key)
}
