import { check, Match } from 'meteor/check'
import { getUsersCollection } from '../../utils/getUsersCollection'
import { hasAtLeastRole } from './hasAtLeastRole'
import { Hierarchy } from './Hierarchy'

export const canInvite = async ({ userId, user, role, institution }) => {
  check(userId, String)
  check(role, String)
  check(institution, Match.Maybe(String))
  check(user, Match.Maybe(Object))

  let finalScope = institution

  if (!institution) {
    finalScope = user?.institution ?? await getUsersCollection().findOneAsync(userId)?.institution
  }

  if (!finalScope) {
    return false
  }

  switch (role) {
    case Hierarchy.admin:
    case Hierarchy.schoolAdmin:
      return hasAtLeastRole(userId, Hierarchy.admin, finalScope)
    case Hierarchy.teacher:
    case Hierarchy.curriculum:
      return hasAtLeastRole(userId, Hierarchy.schoolAdmin, finalScope)
    case Hierarchy.student:
      return hasAtLeastRole(userId, Hierarchy.teacher, finalScope)
    default:
      throw new Meteor.Error(400, 'roles.unknownRole', { role })
  }
}