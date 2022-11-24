import { check } from 'meteor/check'
import { getCollection } from '../../utils/getCollection'
import { matchNonEmptyString } from '../../utils/check/matchNonEmptyString'

/**
 * Determines, whether a given user (by id) is an Admin, independent from the assigned roles.
 * @param userId The _id of the user to check
 * @return {boolean} true if the given user is part of the admin collection, false if not
 */
export const userIsAdmin = function (userId) {
  check(userId, matchNonEmptyString)
  const { Admin } = require('../../../contexts/system/accounts/admin/Admin')
  return getCollection(Admin.name).find({ userId }).count() > 0
}
