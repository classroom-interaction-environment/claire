import { Meteor } from 'meteor/meteor'
import I18NConstructor from 'meteor/ostrio:i18n'
import { i18n } from './language'
import { Schema } from '../schema/Schema'
import { createLog } from '../log/createLog'

const { defaultLocale, siteName } = Meteor.settings.public
const debug = createLog({ name: 'initLanguage', type: 'debug' })

/**
 * Initializes language.
 * It will skip the process, if the language system has already been
 * initialized. In such case use `changeLocale` to reload the base-i18n.
 *
 * Also initializes the schema-messagebox system with the default locale
 * for custom messages.
 *
 * If no locale is added it will fall-back to the `defaultLocale`, defined
 * by the system-settings.
 *
 * @async
 * @param locale {string=} optional, the locale to be used as default
 * @param defaultOptions {object=} optional, object containing default options (such as siteName etc.)
 * @return {Promise<{}>} resolves to the `i18n` module
 */
export const initLanguage = async (locale, defaultOptions = {}) => {
  if (i18n.initialized()) {
    return i18n
  }

  const availableLanguages = await import('./config/availableLanguages')
  const hasLocale = !!availableLanguages[locale]
  const finalLocale = hasLocale
    ? locale
    : defaultLocale
  debug('init', finalLocale)

  // load the default i18n definitions for this locale

  const { load } = availableLanguages[finalLocale]
  const allSettings = {}

  Object.entries(availableLanguages).forEach(([locale, { settings }]) => {
    allSettings[locale] = settings
  })

  const localeData = await load()
  const config = {
    settings: {
      defaultLocale: finalLocale,
      ...allSettings
    },
    [finalLocale]: localeData
  }

  const i18nOptions = Object.assign(defaultOptions, { siteName })
  const i18nProvider = new I18NConstructor({
    i18n: config,
    returnKey: true,
    helperName: null,
    helperSettingsName: null
  })

  i18n.load(i18nProvider, i18nOptions)
  i18n.setLocale(finalLocale)

  // init schema messages with reactive translation
  const translate = (...args) => i18n.get(...args)
  Schema.setLanguage({ translate, defaultLocale: finalLocale })

  return i18n
}
