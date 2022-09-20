import { Accounts } from 'meteor/accounts-base'

export const confirmResearch = ({ email, token }) => {
  const user = Accounts.findUserByEmail(email)
  const expectedToken = user?.research?.token

  if (token !== expectedToken) {
    throw new Meteor.Error('errors.500', 'user.research.failed', 'user.tokenInvalid')
  }

  const confirmedAt = new Date()
  return Meteor.users.update(user._id, {
    $set: {
      'research.confirmed': true,
      'research.confirmedAt': confirmedAt,
    },
    $unset: {
      'research.token': 1
    }
  })
}