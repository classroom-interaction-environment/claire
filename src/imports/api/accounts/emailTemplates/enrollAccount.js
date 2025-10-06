import { getCredentialsAsBuffer, getFullName } from './common'
import { i18n } from '../../language/language'


export const getEnrollAccountSubject = ({ siteName, defaultLocale, debug = () => {} }) => user => {
  const locale = user?.locale || defaultLocale
  const scope = 'accounts.enroll.subject'
  const text = i18n.get(locale, scope, { siteName })
  debug({ scope, locale, text })
  return text
}

export const getEnrollAccountText = ({ expiration, defaultLocale, supportEmail, debug = () => {} }) => (user, originalUrl) => {
  const credentials = getCredentialsAsBuffer(user)
  const locale = user?.locale || defaultLocale
  const cleanUrl = originalUrl.replace('/#/enroll-account', '/enroll-account')
  const url = `${cleanUrl}?d=${encodeURIComponent(credentials)}`
  const textOptions = {}
  textOptions.name = getFullName(user)
  textOptions.url = url
  textOptions.expires = expiration.toString()
  textOptions.supportEmail = supportEmail

  const scope = 'accounts.enroll.text'
  const text = i18n.get(locale, scope, textOptions)
  debug({ scope, url, credentials, textOptions, text, })

  return text
}
