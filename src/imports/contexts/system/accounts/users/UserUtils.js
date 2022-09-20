import { check, Match } from 'meteor/check'
import { Meteor } from 'meteor/meteor'
import { Roles } from 'meteor/alanning:roles'
import { mapFromObject } from '../../../../api/utils/mapFromObject'
import { isomporph, onClient, onServer, } from '../../../../api/utils/archUtils'

const roleIndices = mapFromObject({
  admin: 0,
  schoolAdmin: 1,
  curriculum: 2,
  teacher: 3,
  student: 4
})

/**
 * User roles utility class
 * TODO rename to UserRoles
 */
export const UserUtils = {
  roles: {
    admin: 'admin',
    schoolAdmin: 'schoolAdmin',
    curriculum: 'curriculum',
    teacher: 'teacher',
    student: 'student',
  },
  getHighestRole (userId = Meteor.userId(), scope) {
    check(userId, String)
    check(scope, Match.Maybe(String))

    let finalScope
    if (!scope) {
      const user = Meteor.users.findOne(userId)
      finalScope = user.institution
    } else {
      finalScope = scope
    }

    if (this.hasRole(userId, this.roles.admin, finalScope)) return this.roles.admin
    if (this.hasRole(userId, this.roles.schoolAdmin, finalScope)) return this.roles.schoolAdmin
    if (this.hasRole(userId, this.roles.curriculum, finalScope)) return this.roles.curriculum
    if (this.hasRole(userId, this.roles.teacher, finalScope)) return this.roles.teacher
    if (this.hasRole(userId, this.roles.student, finalScope)) return this.roles.student
    throw new Meteor.Error('roles.userIsInNoRoles', userId)
  },
  /**
   * @deprecated TODO extract
   */
  canInvite (userId, role, scope) {
    check(userId, String)
    check(role, String)
    check(scope, Match.Maybe(String))

    let finalScope
    if (!scope) {
      const user = Meteor.users.findOne(userId)
      finalScope = user.institution
    } else {
      finalScope = scope
    }

    switch (role) {
      case this.roles.admin:
      case this.roles.schoolAdmin:
      case this.roles.sync:
        return this.hasAtLeastRole(userId, this.roles.admin, finalScope)
      case this.roles.teacher:
      case this.roles.curriculum:
        return this.hasAtLeastRole(userId, this.roles.schoolAdmin, finalScope)
      case this.roles.student:
        return this.hasAtLeastRole(userId, this.roles.teacher, finalScope)
      default:
        throw new Error('roles.unknownRole')
    }
  },
  roleExists (name) {
    return roleMap.get(name)
  },
  hasRole (userId = Meteor.userId(), role, scope) {
    check(userId, String)
    check(role, Match.OneOf(String, [String]))
    check(scope, Match.Maybe(String))
    return Roles.userIsInRole(userId, role, scope)
  },
  hasAtLeastRole (userId = Meteor.userId(), role) {
    check(userId, String)
    check(role, String)
    const highest = this.getHighestRole(userId)
    return roleIndices.get(highest) <= roleIndices.get(role)
  },
  _users: [],

  /**
   * @deprecated
   */
  users (userId) {
    if (userId) {
      this._users.push(userId)
    }
    return this._users
  },

  /**
   * @deprecated
   */
  hasUserSub (userId) {
    return this._users.indexOf(userId) > -1
  }
}

/**
 * Returns, whether a user fulfills the criteria of editing a curriculum.
 * This is true, if one of the following conditions apply:
 * - The user has the assigned role "curriculum" for the given scope
 * @param userId {String} the _id of the user
 * @param scope {String} the institutional scope of the curriculum permission
 * @return {Boolean} true / false
 */
UserUtils.isCurriculum = function (userId = Meteor.userId(), scope) {
  let finalScope
  if (!scope) {
    const user = Meteor.users.findOne(userId)
    finalScope = user.institution
  } else {
    finalScope = scope
  }

  if (
    UserUtils.hasRole(userId, UserUtils.roles.curriculum, finalScope) ||
    UserUtils.hasRole(userId, UserUtils.roles.schoolAdmin, finalScope)
  ) {
    return true
  }

  return UserUtils.isAdmin(userId)
}

UserUtils.isAdmin = isomporph({
  client: onClient(function () {
    return function isAdmin (userId = Meteor.userId()) {
      if (!userId) return false
      const user = Meteor.users.findOne(userId)
      if (!user) return false
      return Roles.userIsInRole(userId, UserUtils.roles.admin, user.institution)
    }
  }),

  server: onServer(function () {
    import { userIsAdmin } from '../../../../api/accounts/admin/userIsAdmin'

    return function isAdmin (userId = Meteor.userId()) {
      if (!userId) return false
      return userIsAdmin(userId)
    }
  })
})

const roleMap = mapFromObject(UserUtils.roles)
