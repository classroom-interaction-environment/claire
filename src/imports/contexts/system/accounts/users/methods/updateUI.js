import { Meteor } from 'meteor/meteor'
import { userExists } from '../../../../../api/accounts/user/userExists'

export const updateUI = function updateUI ({ userId, fluid, classId }) {
  if (!userExists({ userId })) {
    throw new Meteor.Error('errors.403', 'user.updateUI', 'user.userNotFound')
  }

  const query = { ui: {} }

  if (typeof fluid === 'boolean') query.ui.fluid = fluid
  if (typeof classId === 'string') query.ui.classId = classId

  return Meteor.users.update(userId, { $set: query })
}
