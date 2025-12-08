import { check, Match } from 'meteor/check'
import { getUsersCollection } from '../../utils/getUsersCollection'
import { hasAtLeastRole } from './hasAtLeastRole'
import { Hierarchy } from './Hierarchy'

/**
 *
 * @param options {object}
 * @param options.userId {string}
 * @param options.role {string}
 * @param options.user {object=}
 * @param options.institution {string=}
 * @return {Promise<boolean>}
 */
export const canInvite = async (options) => {
  check(options, Match.ObjectIncluding({
    userId: String,
    role: String,
    institution: Match.Maybe(String),
    user: Match.Maybe(Object)
  }))

  const { userId, user, role, institution } = options
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