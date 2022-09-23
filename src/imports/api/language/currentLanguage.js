import { i18n } from './language'

/**
 * Returns the current language as settings file.
 *
 * @return {{
 *  code: String
 * }}
 */
export const currentLanguage = () => {
  if (!i18n.initialized()) {
    return null
  }
  return i18n.getSetting('current')
}
