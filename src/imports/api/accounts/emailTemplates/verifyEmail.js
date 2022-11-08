import { Meteor } from 'meteor/meteor'
import { i18n } from '../../language/language'
import { getFullName } from './common'

export const getVerifyEmailSubject = ({ siteName, defaultLocale }) => user => {
  const locale = user?.locale || defaultLocale
  return i18n.get(locale, 'accounts.verifyEmail.subject', { siteName })
}

export const getVeryFyEmailText = ({ defaultLocale, supportEmail }) => (user, originalUrl) => {
  const locale = user?.locale || defaultLocale
  const userId = user._id
  const url = `${originalUrl.replace(/\/#\//, '/')}?u=${userId}`
  const name = getFullName(user)
  const text = i18n.get(locale, 'accounts.verifyEmail.text', { name, url, supportEmail })

  if (Meteor.isDevelopment && !Meteor.isTest) {
    console.debug(url)
    console.debug(text)
  }

  return text
}
