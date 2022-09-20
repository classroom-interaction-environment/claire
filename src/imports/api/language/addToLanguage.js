import { i18n } from './language'
import { createLog } from '../log/createLog'

const debug = createLog({ name: 'addToLanguage', type: 'debug' })

/**
 * Receives an object with locale-implementations and tries to fetch a
 * translation for the current locale. If no translation for this locale is
 * defined, it simply skips.
 *
 * The language impl MUST be imported via dynamic import!
 *
 * Supported results are either JSON format or default export Objects,
 * named exports are not supported!
 *
 * @example
 * addToLanguage({
 *   en: () => import('../i18n/en.json'),
 *   de: () => import('../i18n/de.js')
 * })
 *
 *
 * @param languages {Object}
 * @return {Promise<Boolean>}
 */

export const addToLanguage = async languages => {
  const locale = i18n.getLocale()
  const importFn = languages[locale]
  debug(locale, 'is supported:', !!importFn)

  if (!importFn) { return false }

  const definitions = await importFn()

  if (typeof definitions !== 'object' || definitions === null) {
    debug('no definitions after loaded fn for locale', locale)
    return false
  }

  const l10n = { [locale]: definitions.default || definitions }
  debug('add new definitions', l10n)
  i18n.addl10n(l10n)
  i18n.setLocale(locale)
  return true
}
