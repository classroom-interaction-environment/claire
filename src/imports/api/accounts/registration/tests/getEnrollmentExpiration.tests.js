/* eslint-env mocha */
import { expect } from 'chai'
import {Meteor} from 'meteor/meteor'
import { getEnrollmentExpiration } from '../getEnrollmentExpiration'

const { passwordEnrollTokenExpirationInDays } = Meteor.settings.accounts.config

describe(getEnrollmentExpiration.name, function () {
  it('returns the given expiration of days in ms from given date', () => {
    const now = new Date()
    const expires = getEnrollmentExpiration(now)
    const diff = expires - now.getTime()
    expect(diff / 86400000).to.equal(passwordEnrollTokenExpirationInDays)
  })
})
