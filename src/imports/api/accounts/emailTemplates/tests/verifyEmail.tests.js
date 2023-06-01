/* eslint-env mocha */
import { Meteor } from 'meteor/meteor'
import { Random } from 'meteor/random'
import { expect } from 'chai'
import { getVerifyEmailSubject, getVeryFyEmailText } from '../verifyEmail'
import { stub, restoreAll } from '../../../../../tests/testutils/stub'
import { i18n } from '../../../language/language'

describe('verify email', function () {
  afterEach(function () {
    restoreAll()
  })

  describe(getVerifyEmailSubject.name, function () {
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

      const subject = getVerifyEmailSubject({
        siteName, defaultLocale
      })
      expect(subject(user)).to.equal('accounts.verifyEmail.subject')
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

      const subject = getVerifyEmailSubject({
        siteName, defaultLocale
      })

      ;[{}, null, undefined].forEach(u => {
        expect(subject(u)).to.equal('accounts.verifyEmail.subject')
      })
    })
  })

  describe(getVeryFyEmailText.name, function () {
    it('returns the text for the current user', function () {
      const defaultLocale = Random.id()
      const user = {
        firstName: Random.id(6),
        lastName: Random.id(6),
        locale: Random.id(6)
      }

      const userName = `${user.firstName} ${user.lastName}`
      const originalUrl = Meteor.absoluteUrl('/#/')

      stub(i18n, 'get', (locale, str, options) => {
        expect(options.name).to.equal(userName)
        expect(options.url).to.not.include('/#/')
        expect(locale).to.not.equal(defaultLocale)
        expect(locale).to.equal(user.locale)
        return str
      })

      const text = getVeryFyEmailText({ defaultLocale })

      expect(text(user, originalUrl)).to.equal('accounts.verifyEmail.text')
    })
  })
})
