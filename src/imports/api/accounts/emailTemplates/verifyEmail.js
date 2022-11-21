import { Meteor } from 'meteor/meteor'
import { i18n } from '../../language/language'
import { getFullName } from './common'
import { createLog } from '../../log/createLog'

const debug = createLog({ name: 'email/verify', type: 'debug' })

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
    debug(url, text)
  }

  return text
}
