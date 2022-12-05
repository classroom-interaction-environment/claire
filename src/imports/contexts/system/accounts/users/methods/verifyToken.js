import { Meteor } from 'meteor/meteor'
import { getEnrollmentExpiration } from '../../../../../api/accounts/registration/getEnrollmentExpiration'
import { getUserByEmail } from '../../../../../api/accounts/user/getUserByEmail'

/**
 * Verifies a given reset attempt, which consists of email, reason and token.
 * All three must be valid in order to pass!
 *
 * @param email {string}
 * @param token {srting}
 * @param reason {string}
 * @return {boolean}
 * @throws {Meteor.Error} when one of the three is not valid
 */
export const verifyToken = function verifyToken ({ email, token, reason }) {
  const user = getUserByEmail(email)

  if (!user) {
    throw new Meteor.Error('user.tokenInvalid', 'user.userNotFound', { email })
  }

  const service = user?.services?.password?.[reason]

  if (!service || service.reason !== reason) {
    throw new Meteor.Error('user.tokenInvalid', 'user.reasonInvalid', { reason })
  }

  if (service.token !== token) {
    throw new Meteor.Error('user.tokenInvalid', 'user.tokenInvalid', { email })
  }

  const now = Date.now()
  const when = getEnrollmentExpiration(new Date(service.when || 0))
  const expired = when - now

  if (expired < 0) {
    throw new Meteor.Error('user.tokenInvalid', 'user.tokenExpired', { expired })
  }

  return true
}
