import { check } from 'meteor/check'

import { matchNonEmptyString } from '../../utils/check/matchNonEmptyString'

let AdminCollection

/**
 * Determines, whether a given user (by id) is an Admin, independent from the assigned roles.
 * @param userId The _id of the user to check
 * @return {boolean} true if the given user is part of the admin collection, false if not
 */

export const userIsAdmin = function (userId) {
  check(userId, matchNonEmptyString)

  if (!AdminCollection) {
    (function () {
      import { getCollection } from '../../utils/getCollection'
      import { Admin } from '../../../contexts/system/accounts/admin/Admin'

      AdminCollection = getCollection(Admin.name)
    })()
  }

  return AdminCollection.find({ userId }).count() > 0
}
