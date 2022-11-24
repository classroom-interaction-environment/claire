import { Meteor } from 'meteor/meteor'
import { auto, onClient, onServer, onServerExec } from '../../../../api/utils/archUtils'
import { AdminErrors } from './AdminErrors'
import { UserUtils } from '../users/UserUtils'

export const Admin = {
  name: 'admin',
  label: 'admins.title',
  icon: 'user',
  publicFields: {
    _id: 1,
    userId: 1
  }
}

Admin.schema = {
  userId: {
    type: String,

    /**
     * Checks, if a user exists by given userId
     * @return {string|undefined}
     */

    custom: auto(function () {
      import { userExists } from '../../../../api/accounts/user/userExists'

      return function () {
        if (!userExists({ userId: this.value })) {
          return 'admin.userDoesNotExist'
        }
      }
    })
  }
}

/**
 * @deprecated
 */
Admin.errors = AdminErrors

Admin.methods = {}

Admin.methods.reinvite = {
  name: 'admin.methods.reinvite',
  schema: {
    userId: String
  },
  roles: [UserUtils.roles.admin, UserUtils.roles.schoolAdmin],
  run: onServerExec(function () {
    import { Accounts } from 'meteor/accounts-base'
    import { userExists } from '../../../../api/accounts/user/userExists'

    return function ({ userId }) {
      if (!userExists({ userId })) {
        throw new Meteor.Error('errors.docNotFound', 'errors.userNotExists', userId)
      }

      return Accounts.sendEnrollmentEmail(userId)
    }
  })
}

Admin.methods.createUser = {
  name: 'admin.methods.createUser',
  roles: [UserUtils.roles.admin, UserUtils.roles.schoolAdmin],
  schema: (function () {
    const {
      emailSchema,
      firstNameSchema,
      roleSchema,
      institutionSchema,
      lastNameSchema
    } = require('../../../../api/accounts/registration/registerUserSchema')

    return {
      role: roleSchema(),
      firstName: firstNameSchema(),
      lastName: lastNameSchema(),
      email: emailSchema({ label: true }),
      institution: institutionSchema()
    }
  })(),
  run: onServerExec(function () {
    import { Accounts } from 'meteor/accounts-base'
    import { UserFactory } from '../../../../api/accounts/registration/UserFactory'
    import { createAdmin } from '../../../../api/accounts/admin/createAdmin'
    import { userIsAdmin } from '../../../../api/accounts/admin/userIsAdmin'
    import { PermissionDeniedError } from '../../../../api/errors/types/PermissionDeniedError'
    import { correctName } from '../../../../api/utils/correctName'

    return function ({ role, firstName, lastName, email, institution }) {
      const willBeAdmin = role === UserUtils.roles.admin
console.debug(this.userId, { willBeAdmin })
      // deny any attempt to create a new admin from a non-admin account
      if (willBeAdmin && !userIsAdmin(this.userId)) {
        throw new PermissionDeniedError('roles.notAdmin', {
          userId: this.userId,
          firstName,
          lastName,
          email,
          role,
          institution
        })
      }

      const options = { trim: true, upperCase: true }
      const newUserId = UserFactory.create({
        firstName: correctName(firstName, options),
        lastName: correctName(lastName, options),
        institution: correctName(institution, options),
        email,
        role
      })

      if (willBeAdmin) {
        createAdmin(newUserId)
      }

      // send email but return new user's id
      Accounts.sendEnrollmentEmail(newUserId)
      return newUserId
    }
  })
}

Admin.methods.removeUser = {
  name: 'admin.methods.removeUser',
  roles: [UserUtils.roles.admin, UserUtils.roles.schoolAdmin],
  schema: {
    _id: String // TODO change to userId
  },
  run: onServerExec(function () {
    import { rollbackAccount } from '../../../../api/accounts/registration/rollbackAccount'
    import { userExists } from '../../../../api/accounts/user/userExists'
    import { userIsAdmin } from '../../../../api/accounts/admin/userIsAdmin'
    import { PermissionDeniedError } from '../../../../api/errors/types/PermissionDeniedError'
    import { DocNotFoundError } from '../../../../api/errors/types/DocNotFoundError'

    return function ({ _id }) {
      if (!userExists({ userId: _id })) {
        throw new DocNotFoundError('user.notExist', { _id })
      }

      // can't self delete in any case
      if (_id === this.userId) {
        throw new PermissionDeniedError('user.noSelfDelete', { userId: this.userId, _id })
      }

      // only admin can remove admins
      if (userIsAdmin(_id) && !userIsAdmin(this.userId)) {
        throw new PermissionDeniedError('roles.notAdmin', { userId: this.userId, _id })
      }

      return rollbackAccount(_id)
    }
  })
}

Admin.methods.updateRole = {
  name: 'admin.methods.updateRole',
  roles: [UserUtils.roles.admin, UserUtils.roles.schoolAdmin],
  schema: (function () {
    import { roleSchema } from '../../../../api/accounts/registration/registerUserSchema'

    return {
      userId: {
        type: String,
        autoform: onClient({ type: 'hidden' })
      },
      role: roleSchema(),
      group: {
        type: String,
        autoform: onClient({ type: 'hidden' })
      }
    }
  })(),
  run: onServerExec(function () {
    import { Roles } from 'meteor/alanning:roles'
    import { createAdmin } from '../../../../api/accounts/admin/createAdmin'
    import { removeAdmin } from '../../../../api/accounts/admin/removeAdmin'
    import { userExists } from '../../../../api/accounts/user/userExists'
    import { userIsAdmin } from '../../../../api/accounts/admin/userIsAdmin'
    import { getCollection } from '../../../../api/utils/getCollection'
    import { Users } from '../users/User'

    return function ({ userId, role, group }) {
      if (this.userId === userId) {
        throw new Meteor.Error('admin.updateRoleFailed', 'admin.noOwnRolesChangeAllowed', { userId })
      }

      if (!userExists({ userId })) {
        throw new Meteor.Error('admin.updateRoleFailed', Admin.errors.USER_NOT_FOUND, { userId })
      }

      if (!UserUtils.roleExists(role)) {
        throw new Meteor.Error('admin.updateRoleFailed', 'roles.unknownRole', { userId, role, group })
      }

      Roles.setUserRoles(userId, [role], group)

      const willBeAdmin = role === UserUtils.roles.admin
      const isAdmin = userIsAdmin(userId)

      if (willBeAdmin && !isAdmin) {
        createAdmin(userId)
      }

      if (isAdmin && !willBeAdmin) {
        removeAdmin(userId)
      }

      if (!Roles.userIsInRole(userId, role, group)) {
        throw new Meteor.Error('admin.updateRoleFailed', 'roles.notAssigned', { userId, role, group })
      }

      return getCollection(Users.name).update(userId, { $set: { role } })
    }
  })
}

Admin.methods.users = {
  name: 'admin.methods.users',
  roles: [UserUtils.roles.admin, UserUtils.roles.schoolAdmin],
  schema: {
    ids: {
      type: Array,
      optional: true
    },
    'ids.$': String
  },
  run: onServerExec(function () {
    import { Users } from '../users/User'
    import { getCollection } from '../../../../api/utils/getCollection'

    return function ({ ids }) {
      const query = {}
      if (ids?.length) {
        query._id = { $in: ids }
      }
      return getCollection(Users.name).find(query, { fields: { services: 0 } }).fetch()
    }
  })
}

Admin.methods.getInstitutions = {
  name: 'admin.methods.getInstitutions',
  roles: [UserUtils.roles.schoolAdmin],
  schema: {},
  run: onServerExec(function () {
    import { getAllInstitutions } from './getAllInstitutions'
    return function () {
      const { userId } = this

      return getAllInstitutions({ userId })
    }
  })
}

Admin.publications = {}

Admin.publications.usersByInstitution = {
  name: 'admin.publications.usersByInstitution',
  schema: {
    institution: String
  },
  roles: [UserUtils.roles.schoolAdmin],
  run: onServer(function ({ institution }) {
    return Meteor.users.find({ institution }, {
      fields: {
        username: 1,
        emails: 1,
        firstName: 1,
        lastName: 1,
        roles: 1,
        role: 1,
        presence: 1,
        institution: 1
      }
    })
  })
}
