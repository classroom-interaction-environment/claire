import { Meteor } from 'meteor/meteor'
import { check } from 'meteor/check'
import { getCollection } from '../../utils/getCollection'
import { matchNonEmptyString } from '../../utils/check/matchNonEmptyString'
import { Admin } from '../../../contexts/system/accounts/admin/Admin'
import { userExists } from '../user/userExists'

/**
 * Removes a user by user id from the Admins collection.
 * @param userId
 * @return {Promise<string>} the doc id of the the user's entry in the admin collection
 */
export const removeAdmin = async (userId) => {
  check(userId, matchNonEmptyString)

  if (!await userExists({ userId })) {
    throw new Meteor.Error('removeAdmin.failed', 'removeAdmin.userNotFound', { userId })
  }

  const AdminCollection = getCollection(Admin.name)

  if (await AdminCollection.countDocuments({ userId }) === 0) {
    throw new Meteor.Error('removeAdmin.failed', 'removeAdmin.notAdmin', { userId })
  }

  return AdminCollection.removeAsync({ userId })
}
