import { Accounts } from 'meteor/accounts-base'
import { getUserByEmail } from '../../../../../api/accounts/user/getUserByEmail'

export const sendResetPasswordEmail = function sendResetPasswordEmail ({ email }) {
  const user = getUserByEmail(email)

  if (user) {
    return Accounts.sendResetPasswordEmail(user._id)
  }
  // fails silently to prevent sniffing email addresses
}
