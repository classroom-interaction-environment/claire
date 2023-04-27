import { Accounts } from 'meteor/accounts-base'
import { Users } from '../User'
import { getUsersCollection } from '../../../../../api/utils/getUsersCollection'

export const resendVerificationEmail = function resendVerificationEmail ({ userId }) {
  const user = getUsersCollection().findOne(userId)

  if (!user) {
    // logError()
    // fails silently to prevent sniffing email addresses
    return
  }

  if (Users.helpers.verify(user)) {
    // logError(new Meteor.Error('user.verifyEmail.alreadyVerified', userId))
    // fails silently to prevent sniffing email addresses
    return
  }

  // send mail
  return Accounts.sendVerificationEmail(userId)
}
