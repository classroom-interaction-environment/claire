import { Meteor } from 'meteor/meteor'
import { check } from 'meteor/check'

const { passwordEnrollTokenExpirationInDays } = Meteor.settings.accounts.config
const expirationInMs = passwordEnrollTokenExpirationInDays * 86400000 // 24 hrs

/**
 * Returns the expiration of enrollment from now including expiration offset.
 * @param when {Date} now
 * @return {Number} the expiration Date in absolute ms
 */
export const getEnrollmentExpiration = when => {
  check(when, Date)

  return when.getTime() + expirationInMs
}
