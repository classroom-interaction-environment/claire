import { Accounts } from 'meteor/accounts-base'

export const sendResetPasswordEmail = function sendResetPasswordEmail ({ email }) {
  const user = Accounts.findUserByEmail(email)
  if (user) {
    return Accounts.sendResetPasswordEmail(user._id)
  }
  // fails silently to prevent sniffing email addresses
}
