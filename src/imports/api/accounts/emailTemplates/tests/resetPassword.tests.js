/* eslint-env mocha */
import { Random } from 'meteor/random'
import { expect } from 'chai'
import { getResetPasswordSubject, getResetPasswordText } from '../resetPassword'
import { stub, restoreAll } from '../../../../../tests/testutils/stub'
import { i18n } from '../../../language/language'

describe('reset password', function () {
  afterEach(function () {
    restoreAll()
  })

  describe(getResetPasswordSubject.name, function () {
    it('returns the subject for a user\'s locale', function () {
      const siteName = Random.id(6)
      const defaultLocale = Random.id(6)
      const user = { locale: Random.id(6) }

      stub(i18n, 'get', (locale, str, options) => {
        expect(options.siteName).to.equal(siteName)
        expect(locale).to.not.equal(defaultLocale)
        expect(locale).to.equal(user.locale)
        return str
      })

      const subject = getResetPasswordSubject({
        siteName, defaultLocale
      })
      expect(subject(user)).to.equal('accounts.resetPassword.subject')
    })
    it('returns the subject for a default locale as fallback', function () {
      const siteName = Random.id(6)
      const defaultLocale = Random.id(6)
      const user = { locale: Random.id(6) }

      stub(i18n, 'get', (locale, str, options) => {
        expect(options.siteName).to.equal(siteName)
        expect(locale).to.equal(defaultLocale)
        expect(locale).to.not.equal(user.locale)
        return str
      })

      const subject = getResetPasswordSubject({
        siteName, defaultLocale
      })

      ;[{}, null, undefined].forEach(u => {
        expect(subject(u)).to.equal('accounts.resetPassword.subject')
      })
    })
  })

  describe(getResetPasswordText.name, function () {
    it('returns the text for the current user', function () {
      const expiration = Random.id()
      const defaultLocale = Random.id()
      const user = {
        firstName: Random.id(6),
        lastName: Random.id(6),
        emails: [{ address: `${Random.id()}@example.com` }],
        locale: Random.id(6)
      }

      const userName = `${user.firstName} ${user.lastName}`
      const originalUrl = Meteor.absoluteUrl('/#/reset-password')

      stub(i18n, 'get', (locale, str, options) => {
        expect(options.name).to.equal(userName)
        expect(options.expires).to.equal(expiration)
        expect(options.url).to.not.include('/#/')

        // url contains encoded user credentials
        const suffix = options.url.split('=')[1]
        const encodedCredentials = decodeURIComponent(suffix)
        const credentialsStr = Buffer.from(encodedCredentials, 'base64').toString('utf8')
        const credentials = JSON.parse(credentialsStr)
        expect(credentials).to.deep.equal([
          user.emails[0].address,
          user.firstName,
          user.lastName
        ])

        expect(locale).to.not.equal(defaultLocale)
        expect(locale).to.equal(user.locale)
        return str
      })

      const text = getResetPasswordText({
        expiration, defaultLocale
      })

      expect(text(user, originalUrl)).to.equal('accounts.resetPassword.text')
    })
  })
})
