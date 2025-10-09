import { Meteor } from 'meteor/meteor'
import { UserRoles } from './roles/UserRoles'
import { getUsersCollection } from '../utils/getUsersCollection'
import { hasRole } from './roles/hasRole'
import { isAdmin } from './roles/isAdmin'

/**
 * Returns, whether a user fulfills the criteria of editing a curriculum.
 * This is true, if one of the following conditions apply:
 * - The user has the assigned role "curriculum" for the given scope
 * @param userId {String} the _id of the user
 * @param scope {String} the institutional scope of the curriculum permission
 * @return {Promise<Boolean>} true / false
 */
export const userIsCurriculum = async (userId = Meteor.userId(), scope) => {
  let finalScope
  if (!scope) {
    const user = getUsersCollection().findOneAsync(userId)
    finalScope = user.institution
  }
  else {
    finalScope = scope
  }

  if (
    await hasRole(userId, UserRoles.curriculum, finalScope) ||
    await hasRole(userId, UserRoles.schoolAdmin, finalScope)
  ) {
    return true
  }

  return isAdmin(userId)
}
