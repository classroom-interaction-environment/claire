import { i18n } from './language'

/**
 * Returns the current language as settings file.
 *
 * @return {{
 *  code: String
 * }}
 */
export const currentLanguage = () => i18n.getSetting('current')
