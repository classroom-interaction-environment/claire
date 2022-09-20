import { Meteor } from 'meteor/meteor'
import { Accounts } from 'meteor/accounts-base'

export const userExists = ({ userId, email } = {}) => {
  if (userId) {
    return Meteor.users.find(userId).count() > 0
  }

  if (email) {
    return !!Accounts.findUserByEmail(email)
  }

  return false
}
