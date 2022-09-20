import { Meteor } from 'meteor/meteor'
import { check } from 'meteor/check'
import { getCollection } from '../../utils/getCollection'
import { matchNonEmptyString } from '../../utils/check/matchNonEmptyString'
import { Admin } from '../../../contexts/system/accounts/admin/Admin'
import { userExists } from '../user/userExists'

let AdminCollection

/**
 * Removes a user by user id from the Admins collection.
 * @param userId
 * @return {String} the doc id of the the user's entry in the admin collection
 */
export const removeAdmin = function (userId) {
  check(userId, matchNonEmptyString)

  if (!userExists({ userId })) {
    throw new Meteor.Error('removeAdmin.failed', 'errors.userNotFound', userId)
  }

  if (!AdminCollection) {
    AdminCollection = getCollection(Admin.name)
  }

  if (AdminCollection.find({ userId }).count() === 0) {
    throw new Meteor.Error('removeAdmin.failed', 'removeAdmin.notAdmin', userId)
  }

  return AdminCollection.remove({ userId })
}
