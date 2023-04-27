import { i18n } from '../../language/language'
import { Meteor } from 'meteor/meteor'
import { getCredentialsAsBuffer, getFullName } from './common'
import { createLog } from '../../log/createLog'

const log = createLog({ name: 'enrollAccount', type: 'log' })

export const getEnrollAccountSubject = ({ siteName, defaultLocale }) => user => {
  const locale = user?.locale || defaultLocale
  return i18n.get(locale, 'accounts.enroll.subject', { siteName })
}

export const getEnrollAccountText = ({ expiration, defaultLocale, supportEmail }) => (user, originalUrl) => {
  const credentials = getCredentialsAsBuffer(user)
  const locale = user?.locale || defaultLocale
  const cleanUrl = originalUrl.replace('/#/enroll-account', '/enroll-account')

  const textOptions = {}
  textOptions.name = getFullName(user)
  textOptions.url = `${cleanUrl}?d=${encodeURIComponent(credentials)}`
  textOptions.expires = expiration.toString()
  textOptions.supportEmail = supportEmail

  const text = i18n.get(locale, 'accounts.enroll.text', textOptions)

  if (Meteor.isDevelopment && !Meteor.isTest) {
    log(textOptions)
    log(text)
  }

  return text
}
