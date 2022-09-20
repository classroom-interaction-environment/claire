import { i18n } from './language'

/**
 * Changes the current locale for our i18n system to the given language (code)
 * as long as a language exists in the i18n settings.
 *
 * If the locale exists and has not already been loaded, the locale's
 * base-definitions will be loaded.
 *
 * The base-definitions are the most common minimal i18n-definitions for
 * a language.
 *
 * It's important to note, that only languages that are supported will be
 * applied.
 *
 * @async
 * @param locale {string} 2-char code of the locale (en, de, fr etc).
 * @return {Promise<void>}
 */
export const changeLocale = async locale => {
  const availableLanguages = await import('./config/availableLanguages')

  if (!availableLanguages[locale]) {
    throw new Error(`Unsupported locale ${locale}`)
  }

  // we only load the base-definitions
  // if this hasn't already been done
  if (!loaded.has(locale)) {
    const { load } = availableLanguages[locale]
    const definitions = await load()

    i18n.addl10n({ [locale]: definitions })
    loaded.add(locale)
  }

  i18n.setLocale(locale)
}

/**
 * @private
 * @type {Set<string>}
 */
const loaded = new Set()
