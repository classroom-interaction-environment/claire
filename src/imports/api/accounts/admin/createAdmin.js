import { Meteor } from 'meteor/meteor'
import { check } from 'meteor/check'
import { getCollection } from '../../utils/getCollection'
import { matchNonEmptyString } from '../../utils/check/matchNonEmptyString'
import { Admin } from '../../../contexts/system/accounts/admin/Admin'

/**
 * Adds a user by user id to the Admins collection.
 * @async
 * @param newAdminId {string} the user _id of the user who will be new admin
 * @return {Promise<string>} the doc id of the the user's entry in the admin collection
 */

export const createAdmin = async (newAdminId) => {
  check(newAdminId, matchNonEmptyString)

  const AdminCollection = getCollection(Admin.name)

  if (await AdminCollection.findOneAsync({ userId: newAdminId })) {
    throw new Meteor.Error('createAdmin.failed', 'createAdmin.alreadyAdmin', { adminId: newAdminId })
  }

  return AdminCollection.insertAsync({ userId: newAdminId })
}
