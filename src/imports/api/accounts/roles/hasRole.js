import { Meteor } from 'meteor/meteor'
import { check, Match } from 'meteor/check'
import { Roles } from 'meteor/alanning:roles'

/**
 * Checks if user has a given role
 * @param userId
 * @param role
 * @param scope
 * @return {Promise<boolean>}
 */
export const hasRole = (userId = Meteor.userId(), role, scope) => {
  check(userId, String)
  check(role, Match.OneOf(String, [String]))
  check(scope, Match.Maybe(String))
  return Roles.userIsInRoleAsync(userId, role, scope)
}