import { Meteor } from 'meteor/meteor'
import { userExists } from '../../../../../api/accounts/user/userExists'
import { getUsersCollection } from '../../../../../api/utils/getUsersCollection'

export const updateUI = function updateUI ({ userId, fluid, classId }) {
  if (!userExists({ userId })) {
    throw new Meteor.Error('user.updateUI', 'user.userNotFound', { userId })
  }

  const query = { ui: {} }

  if (typeof fluid === 'boolean') query.ui.fluid = fluid
  if (typeof classId === 'string') query.ui.classId = classId

  return getUsersCollection().update(userId, { $set: query })
}
