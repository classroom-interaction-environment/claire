import { check } from 'meteor/check'
import { getCollection } from '../../utils/getCollection'
import { matchNonEmptyString } from '../../utils/check/matchNonEmptyString'
import { Admin } from '../../../contexts/system/accounts/admin/Admin'

/**
 * Determines, whether a given user (by id) is an Admin, independent from the assigned roles.
 * @async
 * @param userId The _id of the user to check
 * @return {Promise<boolean>} true if the given user is part of the admin collection, false if not
 */
export const userIsAdmin = async (userId) => {
  check(userId, matchNonEmptyString)
  const count = await getCollection(Admin.name).countDocuments({ userId })
  return count > 0
}
