import { i18n } from '../../language/language'
import { Meteor } from 'meteor/meteor'
import { getCredentialsAsBuffer, getFullName } from './common'

export const getResetPasswordSubject = ({ siteName, defaultLocale }) => user => {
  const locale = user?.locale || defaultLocale
  return i18n.get(locale, 'accounts.resetPassword.subject', { siteName })
}

export const getResetPasswordText = ({ expiration, defaultLocale, supportEmail }) => (user, originalUrl) => {
  const locale = user?.locale || defaultLocale
  const credentials = getCredentialsAsBuffer(user)
  const cleanUrl = originalUrl.replace(/\/#\//, '/')

  const textOptions = {}
  textOptions.name = getFullName(user)
  textOptions.url = `${cleanUrl}?d=${encodeURIComponent(credentials)}`
  textOptions.expires = expiration.toString()
  textOptions.supportEmail = supportEmail

  const text = i18n.get(locale, 'accounts.resetPassword.text', textOptions)

  if (Meteor.isDevelopment && !Meteor.isTest) {
    console.debug(textOptions.url)
    console.debug(text)
  }

  return text
}
