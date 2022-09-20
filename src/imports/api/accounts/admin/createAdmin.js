import { Meteor } from 'meteor/meteor'
import { check } from 'meteor/check'
import { getCollection } from '../../utils/getCollection'
import { matchNonEmptyString } from '../../utils/check/matchNonEmptyString'
import { Admin } from '../../../contexts/system/accounts/admin/Admin'

let AdminCollection

/**
 * Adds a user by user id to the Admins collection.
 * @param userId
 * @return {String} the doc id of the the user's entry in the admin collection
 */

export const createAdmin = function (userId) {
  check(userId, matchNonEmptyString)

  if (!AdminCollection) {
    AdminCollection = getCollection(Admin.name)
  }

  if (AdminCollection.find({ userId }).count() > 0) {
    throw new Meteor.Error('createAdmin.failed', 'createAdmin.alreadyAdmin', userId)
  }

  return AdminCollection.insert({ userId })
}
