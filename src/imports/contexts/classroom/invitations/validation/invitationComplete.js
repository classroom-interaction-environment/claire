import { check, Match } from 'meteor/check'
import { Meteor } from 'meteor/meteor'
import { CodeInvitation } from '../CodeInvitations'

/**
 * Checks, whether a code document is considered complete. This is the case when all users have fulfilled their
 * invitation with a registration. It does not differentiate , whether a registration failed or succeeded.
 * @param codeDoc {object}
 * @param codeDoc._id {string} the _id of the current code doc
 * @param codeDoc.registeredUsers {[string]=} the current registered users
 * @param codeDoc.maxUsers {Number} the number of maxmimum allowed registrations
 * @return {boolean} true if max users is exactly reached, otherwise false
 * @throws {Meteor.Error} if parameters are not contained or validated
 * @throws {Meteor.Error} in case the registered users amount has exceeded the max users
 */
export const invitationComplete = codeDoc => {
  check(codeDoc, Match.ObjectIncluding({
    _id: String,
    maxUsers: Number
  }))
  const { _id, registeredUsers, maxUsers } = codeDoc

  if (!Array.isArray(registeredUsers) || !registeredUsers.length) {
    return false
  }
  else if (registeredUsers.length > maxUsers) {
    throw new Meteor.Error(CodeInvitation.errors.maxUsersExceeded, _id)
  }
  else {
    return registeredUsers.length === maxUsers
  }
}