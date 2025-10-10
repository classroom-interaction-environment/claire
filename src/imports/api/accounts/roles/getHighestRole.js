import { Meteor } from 'meteor/meteor'
import { check, Match } from 'meteor/check'
import { Roles } from 'meteor/alanning:roles'
import { Hierarchy } from './Hierarchy'
import { getUsersCollection } from '../../utils/getUsersCollection'

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
  console.debug('getHighestRole', { userId, scope, finalScope }, '=>', roles)
  for (const role of hierarchyList) {
    if (roles.includes(role)) {
      console.debug('found highest role =>', role)
      return role
    }
  }

  throw new Meteor.Error('roles.userIsInNoRoles', userId)
}

const hierarchyList = Object.values(Hierarchy)