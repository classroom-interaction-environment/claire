/* global btoa atob */
import { Meteor } from 'meteor/meteor'
import { check, Match } from 'meteor/check'
import { Random } from 'meteor/random'
import { i18n } from '../../../api/language/language'
import { UserUtils } from '../../system/accounts/users/UserUtils'
import { SchoolClass } from '../schoolclass/SchoolClass'
import { PermissionDeniedError } from '../../../api/errors/types/PermissionDeniedError'
import { DocNotFoundError } from '../../../api/errors/types/DocNotFoundError'
import { getCollection } from '../../../api/utils/getCollection'
import { onClient, onServer, onServerExec } from '../../../api/utils/archUtils'
import { getSchemaField } from '../../../ui/utils/form/getSchemaField'
import { getLocalCollection } from '../../../infrastructure/collection/getLocalCollection'
import { getUsersCollection } from '../../../api/utils/getUsersCollection'

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
        const offset = CodeInvitation.helpers.getOffset(new Date(), value)
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

    return function () {
      const { userId } = this
      const query = {}

      if (!userIsAdmin(userId)) {
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

    return function ({ classId }) {
      const { userId } = this
      const query = { classId }

      if (!userIsAdmin(userId)) {
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

    return function ({ classId }) {
      const { userId } = this
      const query = { classId }

      if (!userIsAdmin(userId)) {
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
 * Will soon be an own module
 * @deprecated
 */
CodeInvitation.helpers = {}

/**
 * Creates a compressed version of URL query containing invitation credentials.
 * @param code required - The invitation code
 * @param firstName optional - The first name of the user
 * @param lastName optional - The last name of the user
 * @param email optional - Email of the user
 * @param institution optional - The institution the users are related to
 * @return {string} A commpressed encoded URI component
 */

CodeInvitation.helpers.createURLQuery = onClient(function ({ code, firstName, lastName, email, institution }) {
  const params = { code }

  if (firstName) params.firstName = firstName
  if (lastName) params.lastName = lastName
  if (email) params.email = email
  if (institution) params.institution = institution

  const jsonData = JSON.stringify(params)
  return encodeURIComponent(btoa(jsonData))
})

/**
 * Decompresses and decodes a URL query parameter, created via {createURLQuery}
 * @param queryParams The isolated queryparameter
 * @return {Object} the parses code doc credentials
 */

CodeInvitation.helpers.parseURLQuery = onClient(function (queryParams) {
  const decoded = decodeURIComponent(queryParams)
  const decompressed = atob(decoded)
  const parsed = JSON.parse(decompressed)
  if (!parsed || !parsed.code) {
    throw new Meteor.Error(CodeInvitation.errors.invalidQueryParams)
  }
  return parsed
})

/**
 * Calculates a future date as unix timestamp
 * @param date A date instance
 * @param days the number of days to add
 * @return {number} the unix timestamp as integer
 */

CodeInvitation.helpers.getOffset = function getOffset (date, days) {
  const offset = days * 86400000 // days in ms
  return date.getTime() + offset
}

/**
 * Returns the time left in ms between now and the expiration date
 * @param createdAt - the creation date of the doc
 * @param expires - the number of days until expiration
 * @return {number} a unix timestamp as integer
 */

CodeInvitation.helpers.timeLeft = function timeLeft (createdAt, expires) {
  const now = new Date().getTime()
  const expirationDate = CodeInvitation.helpers.getOffset(new Date(createdAt), expires)
  return expirationDate - now
}

/**
 * Checks, whether a code doc is expired. Checks for validity and expiration date.
 * @param codeDoc {object}
 * @param codeDoc.invalid {boolean=} - the invalid flag for force-expired docs
 * @param codeDoc.createdAt {Date} - the creation date of the doc
 * @param codeDoc.expires {Number} - the number of days until expiration
 * @return {boolean} true if
 */

CodeInvitation.helpers.isExpired = function isExpired (codeDoc) {
  check(codeDoc, Match.ObjectIncluding({
    createdAt: Date,
    expires: Number
  }))

  const { invalid, createdAt, expires } = codeDoc

  if (invalid) {
    return true
  }

  const now = new Date().getTime()
  const expirationDate = CodeInvitation.helpers.getOffset(new Date(createdAt), expires)
  return (now - expirationDate) >= 0
}

/**
 * Checks, whether a code document is considered complete. This is the case when all users have fulfilled their
 * invitation with a registration. It does not differentiate , whether a registration failed or succeeded.
 * @param codeDoc {object}
 * @param codeDoc._id {string} the _id of the current code doc
 * @param codeDoc.registeredUsers {[string]=} the current registered users
 * @param codeDoc.maxUsers {Number} the number of maxmimum allowed registrations
 * @return {boolean} true if max users is exactly reached, otherwise false
 * @throws {Meteor.Error} if parameters are not contained or validated
 * @throws {Meteor.Error} in case the registered users amount has exceeded the max users
 */
CodeInvitation.helpers.isComplete = function isComplete (codeDoc) {
  check(codeDoc, Match.ObjectIncluding({
    _id: String,
    maxUsers: Number,
  }))
  const { _id, registeredUsers, maxUsers } = codeDoc

  if (!Array.isArray(registeredUsers) || !registeredUsers.length) {
    return false
  }
  else if (registeredUsers.length > maxUsers) {
    throw new Meteor.Error(CodeInvitation.errors.maxUsersExceeded, _id)
  }
  else {
    return registeredUsers.length === maxUsers
  }
}

/**
 * Returns if a doc is considered to be active and pending to be completed
 * @param doc The code document to be checked
 * @return {boolean} true if not expired and not complete
 */
CodeInvitation.helpers.isPending = function isPending (doc) {
  return !CodeInvitation.helpers.isExpired(doc) && !CodeInvitation.helpers.isComplete(doc)
}

/**
 * Returns the considered status of a code document
 * @param createdAt
 * @param expires
 * @param registeredUsers
 * @param maxUsers
 * @param _id
 * @return {*}
 */
CodeInvitation.helpers.getStatus = function getStatus ({
  invalid,
  createdAt,
  expires,
  registeredUsers,
  maxUsers,
  _id
}) {
  const isExpired = CodeInvitation.helpers.isExpired({
    invalid,
    createdAt,
    expires
  })
  const isComplete = CodeInvitation.helpers.isComplete({
    _id,
    registeredUsers,
    maxUsers
  })

  if (!isExpired && !isComplete) return CodeInvitation.status.pending
  if (isComplete) return CodeInvitation.status.complete
  if (isExpired) return CodeInvitation.status.expired
  throw new Error(`Unexpected undefined state for invitation document [${_id}]`)
}

/**
 * Validates a given code or codeDoc and returns true if the code is valid to be used, otherwise false
 * @param codeOrCodeDoc either a codeDoc or code to find a codeDoc
 * @return {boolean}
 */

CodeInvitation.helpers.validate = function validate (codeOrCodeDoc) {
  if (!codeOrCodeDoc) return false

  const codeDoc = typeof codeOrCodeDoc === 'object'
    ? codeOrCodeDoc
    : getCollection(CodeInvitation.name).findOne({ code: codeOrCodeDoc })

  if (!codeDoc) {
    return false
  }

  const isExpired = CodeInvitation.helpers.isExpired(codeDoc)
  const isComplete = CodeInvitation.helpers.isComplete(codeDoc)
  return !isExpired && !isComplete
}

CodeInvitation.helpers.getCodeDoc = function getCodeDoc (code) {
  return getCollection(CodeInvitation.name).findOne({ code })
}

CodeInvitation.helpers.addUserToInvitation = onServerExec(function () {
  return function addUserToInvitation (codeOrCodeDoc, userId) {
    const codeDoc = typeof codeOrCodeDoc === 'object'
      ? codeOrCodeDoc
      : CodeInvitation.helpers.getCodeDoc(codeOrCodeDoc)

    const registeredUsers = codeDoc.registeredUsers || []
    if (registeredUsers.length >= codeDoc.maxUsers) {
      throw new Error(CodeInvitation.errors.maxUsersExceeded)
    }

    registeredUsers.push(userId)
    return getCollection(CodeInvitation.name).update(codeDoc._id, {
      $set: { registeredUsers }
    })
  }
})

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
    import { createDocGetter } from '../../../api/utils/document/createDocGetter'
    import { userIsAdmin } from '../../../api/accounts/admin/userIsAdmin'

    const getClassDoc = createDocGetter(SchoolClass)

    return function (createDoc) {
      const { userId } = this

      if (!UserUtils.canInvite(userId, createDoc.role)) {
        throw new Meteor.Error(
          'codeInvitation.createFailed',
          CodeInvitation.errors.insufficientRole,
          { userId, role: createDoc.role }
        )
      }

      // check if institution matches
      const user = getUsersCollection().findOne(userId)
      const { institution } = user

      if (institution !== createDoc.institution && !userIsAdmin(userId)) {
        throw new Meteor.Error(
          'codeInvitation.createFailed',
          CodeInvitation.errors.institutionMismatch,
          { institution: createDoc.institution, userId }
        )
      }

      const insertDoc = {
        code: Random.id(4),
        expires: createDoc.expires,
        role: createDoc.role,
        firstName: createDoc.firstName,
        lastName: createDoc.lastName,
        email: createDoc.email,
        institution: createDoc.institution,
        registeredUsers: [],
        maxUsers: createDoc.maxUsers,
        classId: createDoc.classId
      }

      // verify class ownership
      if (createDoc.role === UserUtils.roles.student) {
        const { classId } = insertDoc
        const classDoc = getClassDoc(classId)

        if (!SchoolClass.helpers.isTeacher({ classDoc, userId })) {
          throw new PermissionDeniedError('schoolClass.notTeacher', { classId, userId })
        }
      }
      // otherwise remove class entirely
      else {
        delete insertDoc.classId
      }

      return getCollection(CodeInvitation.name).insert(insertDoc)
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
    import { createDocGetter } from '../../../api/utils/document/createDocGetter'

    const getCodeDoc = createDocGetter({ name: CodeInvitation.name, optional: true })
    const getClassDoc = createDocGetter({ name: SchoolClass.name })

    return function ({ code }) {
      const codeDoc = getCodeDoc({ code })

      if (!codeDoc || CodeInvitation.helpers.isExpired(codeDoc) || CodeInvitation.helpers.isComplete(codeDoc)) {
        throw new Meteor.Error(CodeInvitation.errors.invalidLink, CodeInvitation.errors.invalidLinkReason)
      }

      let classDoc

      if (codeDoc.classId) {
        classDoc = getClassDoc(codeDoc.classId)
      }

      return {
        firstName: codeDoc.firstName,
        lastName: codeDoc.lastName,
        role: codeDoc.role,
        institution: codeDoc.institution,
        email: codeDoc.email,
        classId: codeDoc.classId,
        className: classDoc?.title
      }
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
    import { createGetDoc } from '../../../api/utils/documentUtils'

    return function ({ _id }) {
      const { userId } = this
      const opts = { checkOwner: !UserUtils.isAdmin(userId) }
      createGetDoc(CodeInvitation, opts).call({ userId }, _id)

      return getCollection(CodeInvitation.name).update(_id, {
        $set: { invalid: true }
      })
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
    return getCollection(CodeInvitation.name).remove(_id)
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

    const getClassDoc = createDocGetter(SchoolClass)

    return function ({ code }) {
      // 1st validate code
      const isValid = CodeInvitation.helpers.validate(code)
      if (!isValid) {
        throw new PermissionDeniedError(CodeInvitation.errors.invalidCode)
      }

      // 2nd validate user
      const userId = this.userId
      const user = getUsersCollection().findOne(userId)
      if (!Users.helpers.verify(user)) {
        console.warn('warning adding unverified user', user._id)
        // throw new PermissionDeniedError('user.notVerified')
      }

      const codeDoc = CodeInvitation.helpers.getCodeDoc(code)
      if (!codeDoc) throw new DocNotFoundError(code)

      // 3rd get class doc
      const { classId } = codeDoc
      const classDoc = getClassDoc(classId)

      // 4th validate if user is already member
      const isStudent = SchoolClass.helpers.isMember({ classDoc, userId })
      if (isStudent) {
        throw new PermissionDeniedError(CodeInvitation.errors.alreadyClassMember, JSON.stringify({
          classId,
          userId
        }))
      }

      // 5th check roles match
      const { role } = codeDoc
      if (!UserUtils.hasRole(userId, role, user.institution)) {
        throw new PermissionDeniedError(PermissionDeniedError.notInRole, role)
      }

      // 6th add to class
      const thisContext = { userId: codeDoc.createdBy }
      if (role === UserUtils.roles.teacher) {
        SchoolClass.helpers.addTeacher.call(thisContext, { classId, userId })
      }
      else if (role === UserUtils.roles.student) {
        const added = SchoolClass.helpers.addStudent.call(thisContext, {
          classId,
          userId
        })
        if (!added) throw new Meteor.Error(500)
        getUsersCollection().update(userId, { $set: { 'ui.classId': classId } })
      }
      else {
        throw new PermissionDeniedError(SchoolClass.errors.invalidRole, role)
      }

      // add
      CodeInvitation.helpers.addUserToInvitation.call(thisContext, code, userId)
      return true
    }
  })
}
