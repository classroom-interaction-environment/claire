import { Meteor } from 'meteor/meteor'
import { Accounts } from 'meteor/accounts-base'
import { getEnrollmentExpiration } from '../../../../../api/accounts/registration/getEnrollmentExpiration'

export const verifyToken = function verifyToken ({ email, token, reason }) {
  const user = Accounts.findUserByEmail(email)

  if (!user) {
    throw new Meteor.Error('errors.403', 'user.tokenInvalid', 'user.userNotFound')
  }

  const service = (user?.services?.password?.[reason] || {})

  if (service.token !== token) {
    throw new Meteor.Error('errors.403', 'user.tokenInvalid', 'user.tokenInvalid')
  }

  if (service.reason !== reason) {
    throw new Meteor.Error('errors.403', 'user.tokenInvalid', 'user.reasonInvalid')
  }

  const now = Date.now()
  const when = getEnrollmentExpiration(new Date(service.when || 0))

  if ((when - now) < 0) {
    throw new Meteor.Error('errors.403', 'user.tokenInvalid', 'user.tokenExpired')
  }

  return true
}
