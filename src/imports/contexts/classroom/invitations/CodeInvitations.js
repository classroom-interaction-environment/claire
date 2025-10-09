/* global btoa atob */
import { Meteor } from 'meteor/meteor'
import { i18n } from '../../../api/language/language'
import { UserUtils } from '../../system/accounts/users/UserUtils'
import { SchoolClass } from '../schoolclass/SchoolClass'
import { getCollection } from '../../../api/utils/getCollection'
import { onServer, onServerExec } from '../../../api/utils/archUtils'
import { getSchemaField } from '../../../ui/utils/form/getSchemaField'
import { getLocalCollection } from '../../../infrastructure/collection/getLocalCollection'
import { verifyInvitation } from './methods/verifyInvitation'
import { getInvitationOffset } from './validation/getInvitationOffset'

const mappedRoles = Object.values(UserUtils.roles).map(role => ({
  value: role,
  label: i18n.reactive(`roles.${role}`)
}))

const optionalUserType = () => {
  const maxUsers = getSchemaField('maxUsers')
  return (maxUsers && maxUsers === 1)
    ? 'text'
    : 'hidden'
}

const getSchoolClass = (function () {
  if (Meteor.isServer) {
    return () => getCollection(SchoolClass.name)
  }

  if (Meteor.isClient) {
    return () => getLocalCollection(SchoolClass.name)
  }
})()

export const CodeInvitation = {
  name: 'codeInvitation',
  label: 'codeInvitation.title',
  icon: 'envelope',
  isClassroom: true,
  MAX_EXPIRY: 7
}

/**
 * Will soon be an own module
 * @deprecated
 */
CodeInvitation.status = {
  pending: {
    value: 'pending',
    label: 'codeInvitation.pending',
    icon: 'envelope',
    type: 'secondary'
  },
  expired: {
    value: 'expired',
    label: 'codeInvitation.expired',
    icon: 'times',
    type: 'danger'
  },
  complete: {
    value: 'complete',
    label: 'codeInvitation.complete',
    icon: 'check',
    type: 'success'
  }
}

/**
 * Will soon be an own module
 * @deprecated
 */
CodeInvitation.errors = {
  expirationExceeded: 'codeInvitation.expirationExceeded',
  removeNoPermission: 'codeInvitation.removeNoPermission',
  maxUsersExceeded: 'codeInvitation.maxUsersExceeded',
  invalidQueryParams: 'codeInvitation.invalidQueryParams',
  insufficientRole: 'codeInvitation.insufficientRole',
  invalidCode: 'codeInvitation.invalidCode',
  invalidLink: 'codeInvitation.invalidLink',
  invalidLinkReason: 'codeInvitation.invalidLinkReason',
  institutionMismatch: 'codeInvitation.institutionMismatch',
  alreadyClassMember: 'codeInvitation.alreadyClassMember'
}

CodeInvitation.schema = {
  code: {
    type: String,
    label: i18n.reactive('codeInvitation.code')
  },
  expires: {
    type: Number,
    label: i18n.reactive('codeInvitation.expirationDays'),
    min: 1,
    max: 7,
    autoform: {
      defaultValue: 1,
      hint: () => {
        if (!global.AutoForm) return
        const value = AutoForm.getFieldValue('expires') || 1
        const offset = getInvitationOffset(new Date(), value)
        const expirationDate = new Date(offset).toLocaleString()
        return `${i18n.get('codeInvitation.expiresAt')} ${expirationDate}`
      }
    }
  },
  invalid: {
    type: Boolean,
    optional: true,
    defaultValue: false,
    autoform: {
      type: 'hidden'
    }
  },
  registeredUsers: {
    type: Array,
    label: i18n.reactive('codeInvitation.registeredUsers'),
    optional: true,
    autoform: {
      type: 'hidden'
    }
  },
  'registeredUsers.$': {
    type: String
  },
  maxUsers: {
    type: Number,
    label: i18n.reactive('codeInvitation.maxUsers'),
    min: 1,
    max: 50
  },
  role: {
    type: String,
    label: i18n.reactive('codeInvitation.role'),
    autoform: {
      firstOption: () => i18n.reactive('form.selectOne'),

      // users will only be able to invite users with a role below their own
      options: function () {
        const userId = Meteor.userId()
        const highest = UserUtils.getHighestRole(userId)

        if (highest === UserUtils.roles.admin) {
          return mappedRoles
        }

        const index = mappedRoles.findIndex(entry => entry.value === highest)
        return mappedRoles.slice(index + 1, mappedRoles.length)
      }
    }
  },
  institution: {
    type: String,
    label: i18n.reactive('codeInvitation.institution'),
    autoform: {
      defaultValue () {
        const user = Meteor.user()
        if (!UserUtils.isAdmin(user._id)) {
          return user.institution
        }
      },
      type: () => {
        const userId = Meteor.userId()
        return UserUtils.isAdmin(userId)
          ? 'text'
          : 'hidden'
      }
    }
  },
  classId: {
    type: String,
    optional () {
      // if role is not student, then it's always true
      const role = getSchemaField.call(this, 'role')

      if (role !== UserUtils.roles.student) {
        return true
      }

      // for students it is only optional if there are no classes to select from
      const createdBy = Meteor.userId()
      const cursor = getSchoolClass().find({ createdBy })

      return cursor.count() === 0
    },
    label: i18n.reactive('schoolClass.title'),
    autoform: {
      type: () => {
        const role = getSchemaField('role')
        if (!role || role !== UserUtils.roles.student) {
          return 'hidden'
        }

        return 'select'
      },
      firstOption: () => i18n.get('form.selectOne'),
      options () {
        const userId = Meteor.userId()
        if (!userId) {
          return []
        }

        const allCourses = getSchoolClass().find({ createdBy: userId }, { sort: { title: 1 } }).map(doc => ({
          value: doc._id,
          label: doc.title
        }))

        allCourses.push({
          value: 'new',
          label: `+ ${i18n.get('schoolClass.createNew')}`
        })

        return allCourses
      }
    }
  },
  firstName: {
    type: String,
    label: i18n.reactive('userProfile.firstName'),
    optional: true,
    autoform: {
      type: optionalUserType
    }
  },
  lastName: {
    type: String,
    label: i18n.reactive('userProfile.lastName'),
    optional: true,
    autoform: {
      type: optionalUserType
    }
  },
  email: {
    type: String,
    label: i18n.reactive('userProfile.email'),
    optional: true,
    autoform: {
      type: optionalUserType
    }
  }
}

CodeInvitation.createCodeSchema = { ...CodeInvitation.schema }
delete CodeInvitation.createCodeSchema.code
delete CodeInvitation.createCodeSchema.registeredUsers
delete CodeInvitation.createCodeSchema['registeredUsers.$']

CodeInvitation.publicFields = {
  code: 1,
  registeredUsers: 1,
  maxUsers: 1,
  expires: 1,
  role: 1,
  firstName: 1,
  lastName: 1,
  email: 1,
  institution: 1,
  classId: 1
}

/**
 *
 *  PUBLICATIONS
 *
 */

CodeInvitation.publications = {}

CodeInvitation.publications.myCodes = {
  name: 'codeInvitations.publications.myCodes',
  schema: {},
  run: onServerExec(function () {
    import { userIsAdmin } from '../../../api/accounts/admin/userIsAdmin'

    return async function () {
      const { userId } = this
      const query = {}

      if (!await userIsAdmin(userId)) {
        query.createdBy = userId
      }

      return getCollection(CodeInvitation.name).find(query)
    }
  })
}

/**
 * Returns the current invitation document for a given class.
 * For non-admins this will never return documents the user don't own
 * @param classId {String} the id of the class to load invitations
 */
CodeInvitation.publications.getInvitationForClass = {
  name: 'codeInvitations.publications.getInvitationForClass',
  schema: { classId: String },
  roles: [UserUtils.roles.admin, UserUtils.roles.schoolAdmin, UserUtils.roles.teacher],
  run: onServerExec(function () {
    import { userIsAdmin } from '../../../api/accounts/admin/userIsAdmin'

    return async function ({ classId }) {
      const { userId } = this
      const query = { classId }

      if (!await userIsAdmin(userId)) {
        query.createdBy = userId
      }

      const transform = { hint: { $natural: -1 }, limit: 1 }

      return getCollection(CodeInvitation.name).find(query, transform)
    }
  })
}

CodeInvitation.publications.class = {
  name: 'codeInvitations.publications.class',
  schema: {
    classId: String
  },
  run: onServerExec(function () {
    import { userIsAdmin } from '../../../api/accounts/admin/userIsAdmin'

    return async function ({ classId }) {
      const { userId } = this
      const query = { classId }

      if (!await userIsAdmin(userId)) {
        query.createdBy = userId
      }

      return getCollection(CodeInvitation.name).find(query, {
        limit: 1,
        sort: { createdAt: -1 }
      })
    }
  })
}

/**
 *
 *  METHODS
 *
 */

CodeInvitation.methods = {}

/**
 * Creates a new invitation. Note the Schema to see which fields are required.
 */
CodeInvitation.methods.create = {
  name: 'codeInvitations.methods.create',
  schema: CodeInvitation.createCodeSchema,
  roles: [UserUtils.roles.admin, UserUtils.roles.schoolAdmin, UserUtils.roles.curriculum, UserUtils.roles.teacher],
  run: onServerExec(function () {
    import { createInvitation } from './methods/createInvitation'
    return function (createDoc) {
      const { userId } = this
      return createInvitation({ userId, createDoc })
    }
  })
}

/**
 * Verifies a given codeDoc and returns it's relevant information for registration, if valid.
 * Throws Error on invalid documents.
 */

CodeInvitation.methods.verify = {
  name: 'codeInvitations.methods.verify',
  schema: {
    code: String
  },
  isPublic: true,
  run: onServerExec(function () {
    import { verifyInvitation } from './methods/verifyInvitation'
    return function ({ code }) {
      return verifyInvitation({ code })
    }
  })
}

/**
 * Sets a given codeDoc as invalid, independent from it's current state.
 */

CodeInvitation.methods.forceExpire = {
  name: 'codeInvitations.methods.forceExpire',
  roles: [UserUtils.roles.admin, UserUtils.roles.schoolAdmin, UserUtils.roles.teacher],
  schema: { _id: String },
  run: onServerExec(function () {
    import { forceExpire } from './methods/forceExpire'

    return function ({ _id }) {
      const { userId } = this
      return forceExpire({ codeDocId: _id, userId })
    }
  })
}

/**
 * Removes a code doc from collection, ADMIN ONLY!
 */

CodeInvitation.methods.remove = {
  name: 'codeInvitations.methods.remove',
  roles: [UserUtils.roles.admin, UserUtils.roles.schoolAdmin],
  schema: { _id: String },
  run: onServer(function ({ _id }) {
    return getCollection(CodeInvitation.name).removeAsync(_id)
  })
}

/**
 *  Adds a user to a given class, if the class is defined in the code doc
 */

CodeInvitation.methods.addToClass = {
  name: 'codeInvitations.methods.addToClass',
  roles: [UserUtils.roles.admin, UserUtils.roles.schoolAdmin, UserUtils.roles.teacher, UserUtils.roles.student],
  schema: { code: String },
  run: onServerExec(function () {
    import { Users } from '../../system/accounts/users/User'
    import { createDocGetter } from '../../../api/utils/document/createDocGetter'


    return async function ({ code }) {

    }
  })
}
