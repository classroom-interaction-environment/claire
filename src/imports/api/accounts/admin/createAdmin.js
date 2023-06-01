import { Meteor } from 'meteor/meteor'
import { check } from 'meteor/check'
import { getCollection } from '../../utils/getCollection'
import { matchNonEmptyString } from '../../utils/check/matchNonEmptyString'
import { Admin } from '../../../contexts/system/accounts/admin/Admin'

/**
 * Adds a user by user id to the Admins collection.
 * @param newAdminId {string} the user _id of the user who will be new admin
 * @return {String} the doc id of the the user's entry in the admin collection
 */

export const createAdmin = function (newAdminId) {
  check(newAdminId, matchNonEmptyString)

  const AdminCollection = getCollection(Admin.name)

  if (AdminCollection.find({ userId: newAdminId }).count() > 0) {
    throw new Meteor.Error('createAdmin.failed', 'createAdmin.alreadyAdmin', { adminId: newAdminId })
  }

  return AdminCollection.insert({ userId: newAdminId })
}
