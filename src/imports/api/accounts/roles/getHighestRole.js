import { Meteor } from 'meteor/meteor'
import { check, Match } from 'meteor/check'
import { Roles } from 'meteor/alanning:roles'
import { Hierarchy } from './Hierarchy'
import { getUsersCollection } from '../../utils/getUsersCollection'
import { PermissionDeniedError } from '../../errors/types/PermissionDeniedError'

export const getHighestRole = async (userId = Meteor.userId(), scope) => {
  check(userId, String)
  check(scope, Match.Maybe(String))

  let finalScope
  if (!scope) {
    const user = await getUsersCollection().findOneAsync(userId)
    finalScope = user.institution
  }
  else {
    finalScope = scope
  }

  const roles = await Roles.getRolesForUserAsync(userId, finalScope)
  for (const role of hierarchyList) {
    if (roles.includes(role)) {
      return role
    }
  }

  throw new PermissionDeniedError('roles.userIsInNoRoles', { userId })
}

const hierarchyList = Object.values(Hierarchy)