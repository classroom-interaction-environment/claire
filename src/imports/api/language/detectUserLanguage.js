import { Meteor } from 'meteor/meteor'
import { isDefinedString } from '../utils/check/isDefinedString'

/**
 * Detects a user's language using various checks. Supports server and client.
 * @param user {object} required, the user document to check
 * @return {string|undefined}
 */
export const detectUserLanguage = (user) => {
  const locale  = user && user.locale

  if (isDefinedString(locale)) {
    return locale
  }

  if (!Meteor.isClient) {
    return undefined
  }

  const clientLanguage = (window.navigator.language ?? window.navigator.userLanguage ?? '')
  const clientLocale = clientLanguage.split('-')[0]

  if (isDefinedString(clientLocale)) {
    return clientLocale
  }
}

