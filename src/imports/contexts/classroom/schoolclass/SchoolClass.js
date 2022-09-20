/* global Roles */
import { Meteor } from 'meteor/meteor'
import { check } from 'meteor/check'
import { i18n } from '../../../api/language/language'
import { UserUtils } from '../../system/accounts/users/UserUtils'
import { onServer, onServerExec } from '../../../api/utils/archUtils'
import { getCollection } from '../../../api/utils/getCollection'
import { DocNotFoundError } from '../../../api/errors/types/DocNotFoundError'

const firstOption = i18n.get('form.selectOne')

export const SchoolClass = {
  name: 'schoolclass',
  label: 'schoolClass.title',
  icon: 'users',
  isClassroom: true,
  publicFields: {
    title: 1,
    teachers: 1,
    students: 1
  },
  dependencies: [],
  errors: {
    progressIncomplete: 'schoolClass.progressIncomplete',
    invalidSchoolYear: 'schoolClass.invalidSchoolYear',
    notFoundById: 'schoolClass.notFoundById',
    notMember: 'schoolClass.notMember',
    notTeacher: 'schoolClass.notTeacher',
    alreadyMember: 'schoolClass.alreadyMember',
    invalidRole: 'schoolClass.invalidRole'
  }
}

SchoolClass.schema = {
  title: {
    type: String,
    label: i18n.reactive('schoolClass.className')
  },
  timeFrame: {
    type: Object,
    optional: true,
    label: i18n.reactive('schoolClass.timeFrame')
  },
  'timeFrame.from': {
    type: Date,
    optional: true,
    label: i18n.reactive('schoolClass.from')
  },
  'timeFrame.to': {
    type: Date,
    optional: true,
    label: i18n.reactive('schoolClass.to')
  },
  teachers: {
    label: i18n.reactive('users.teachers'),
    type: Array,
    optional: true
  },
  'teachers.$': {
    type: String,
    label: i18n.reactive('common.entry'),
    autoform: {
      firstOption,
      options () {
        // TODO MAKE THIS RUN
        return Meteor.users.find({}, {
          fields: {
            _id: 1,
            username: 1
          }
        }).fetch().map(function (el) {
          return { value: el._id, label: el.username }
        })
      }
    }
  },
  students: {
    label: i18n.reactive('users.students'),
    type: Array,
    optional: true
  },
  'students.$': {
    type: String,
    label: i18n.reactive('common.entry'),
    autoform: {
      firstOption,
      options (userId) {
        return Meteor.users.findOne(userId, {
          fields: {
            _id: 1,
            username: 1
          }
        }).fetch().map(function (el) {
          return { value: el._id, label: el.username }
        })
      }
    }
  }
}

/**
 * @deprecated
 * @type {{}}
 */
SchoolClass.helpers = {}

function checkClassDoc (classDoc) {
  if (!classDoc) throw new DocNotFoundError(SchoolClass.name)
}

/**
 * @deprecated
 * @param classDoc
 * @param userId
 * @return {*}
 */

SchoolClass.helpers.isStudent = function isStudent ({ classDoc, userId } = {}) {
  checkClassDoc(classDoc)
  return !!(classDoc.students && classDoc.students.includes(userId))
}

/**
 * Checks, whether a given user is teacher of the class.
 * @deprecated
 * @param classDoc a school class document, must be defined
 * @param userId the _id of the user to be checked
 * @return {boolean} true if user is in teachers or owner of the class
 * @throws {Meteor.Error} is the classDoc is undefined or null
 */

SchoolClass.helpers.isTeacher = function isTeacher ({ classDoc, userId } = {}) {
  checkClassDoc(classDoc)
  if (classDoc.createdBy === userId) return true
  if (classDoc.teachers) {
    return classDoc.teachers.includes(userId)
  }
  return false
}

/**
 * Checks, whether a user is member of a given class.
 * @deprecated
 * @param classDoc a school class document, must be defined
 * @param userId the _id of the user to be checked
 * @return {boolean} true if user is member of the class, otherwise false
 * @throws {Meteor.Error} is the classDoc is undefined or null
 */

SchoolClass.helpers.isMember = function isMember ({ classDoc, userId } = {}) {
  const isStudent = SchoolClass.helpers.isStudent({ classDoc, userId })
  if (isStudent) return true
  return SchoolClass.helpers.isTeacher({ classDoc, userId })
}

/**
 * Adds a student to a class. TODO replace with standalone addUserToClass method
 * @deprecated
 * @param classId the id of the class to add the user
 * @param userId the id of the student to be added
 * @returns {number} 1 if added, 0 if not
 * @throws {DocNotFoundError} if there is no class by given id
 * @throws {PermissionDeniedError} if current user is not a teacher
 * @throws {PermissionDeniedError} if student to be added is already in class
 */

SchoolClass.helpers.addStudent = onServerExec(function () {
  const { InvocationChecker } = require('../../../api/utils/InvocationChecker')
  const { createGetDoc, createUpdateDoc } = require('../../../api/utils/documentUtils')
  const { PermissionDeniedError } = require('../../../api/errors/types/PermissionDeniedError')

  // we don't check ownership, because we use
  // the helpers to allow teachers, that are members
  // but not owners of the class to to add students
  const getClassDoc = createGetDoc(SchoolClass, { checkOwner: false })
  const updateClassDoc = createUpdateDoc(SchoolClass, { checkOwner: false })

  return function addStudent ({ classId, userId }) {
    check(classId, String)
    check(userId, String)
    InvocationChecker.ensureMethodInvocation()

    const classDoc = getClassDoc(classId)
    const teacherId = this.userId

    const isTeacher = SchoolClass.helpers.isTeacher({ classDoc, userId: teacherId })
    if (!isTeacher) {
      throw new PermissionDeniedError(SchoolClass.errors.notTeacher)
    }

    const isAlreadyStudent = SchoolClass.helpers.isStudent({ classDoc, userId })
    if (isAlreadyStudent) {
      throw new PermissionDeniedError(SchoolClass.errors.alreadyMember, { classId, userId })
    }

    return updateClassDoc(classDoc._id, { $addToSet: { students: userId } })
  }
})

/**
 * @deprecated
 */
SchoolClass.helpers.addTeacher = onServerExec(function () {
  const { InvocationChecker } = require('../../../api/utils/InvocationChecker')
  const { createGetDoc, createUpdateDoc } = require('../../../api/utils/documentUtils')
  const { PermissionDeniedError } = require('../../../api/errors/types/PermissionDeniedError')

  const getClassDoc = createGetDoc(SchoolClass, { checkOwner: false })
  const updateClassDoc = createUpdateDoc(SchoolClass, { checkOwner: false })

  return function addTeacher ({ classId, userId }) {
    check(classId, String)
    check(userId, String)
    InvocationChecker.ensureMethodInvocation()

    const classDoc = getClassDoc(classId)
    const teacherId = this.userId

    const creatorIsTeacher = SchoolClass.helpers.isTeacher({ classDoc, userId: teacherId })
    if (!creatorIsTeacher) {
      throw new PermissionDeniedError(SchoolClass.errors.notTeacher)
    }

    const isAlreadyTeacher = SchoolClass.helpers.isTeacher({ classDoc, userId })
    if (isAlreadyTeacher) {
      throw new PermissionDeniedError(SchoolClass.errors.alreadyMember, { classId, userId })
    }

    return updateClassDoc(classDoc._id, { $addToSet: { teachers: userId } })
  }
})

/**
 * @deprecated
 */
SchoolClass.helpers.removeStudent = onServerExec(function () {
  const { InvocationChecker } = require('../../../api/utils/InvocationChecker')
  const { createGetDoc, createUpdateDoc } = require('../../../api/utils/documentUtils')

  // we don't check ownership, because we use
  // the helpers to allow teachers, that are members
  // but not owners of the class to to add students
  const getClassDoc = createGetDoc(SchoolClass, { checkOwner: false })
  const updateClassDoc = createUpdateDoc(SchoolClass, { checkOwner: false })

  return function removeStudent ({ classId, userId }) {
    check(classId, String)
    check(userId, String)
    InvocationChecker.ensureMethodInvocation()

    const classDoc = getClassDoc(classId)
    const teacherId = this.userId

    const isTeacher = SchoolClass.helpers.isTeacher({ classDoc, userId: teacherId })
    if (!isTeacher) {
      throw new Meteor.Error('errors.permissionDenied', SchoolClass.errors.notTeacher)
    }

    const isStudent = SchoolClass.helpers.isStudent({ classDoc, userId })
    if (!isStudent) {
      throw new Meteor.Error('errors.permissionDenied', SchoolClass.errors.notMember, { classId, userId })
    }

    return updateClassDoc(classDoc._id, { $pull: { students: userId } })
  }
})

/**************************************************************
 *
 *  METHODS
 *
 **************************************************************/

SchoolClass.methods = {}

SchoolClass.methods.get = {
  name: 'schoolClass.methods.get',
  schema: {
    _id: String
  },
  run: onServer(function ({ _id }) {
    const { userId } = this
    const query = {
      $or: [
        { _id, students: userId },
        { _id, createdBy: userId }
      ]
    }
    return getCollection(SchoolClass.name).find(query, { limit: 1 }).fetch()
  }),
  timeInterval: 1000,
  numRequests: 10
}

/**
 * Returns all classes, I am associated with
 * @roles: all
 */

SchoolClass.methods.my = {
  name: 'schoolClass.methods.my',
  schema: {
    ids: {
      type: Array,
      optional: true
    },
    'ids.$': String
  },
  run: onServer(function ({ ids }) {
    const { userId } = this
    const query = {
      $or: [
        { students: userId },
        { teachers: userId },
        { createdBy: userId }
      ]
    }

    if (ids?.length) {
      query.$or[0]._id = { $in: ids }
      query.$or[1]._id = { $in: ids }
      query.$or[2]._id = { $in: ids }
    }

    return getCollection(SchoolClass.name).find(query).fetch()
  })
}

/**
 * Creates a new class
 * @roles: teacher
 */

SchoolClass.methods.create = {
  name: 'schoolClass.methods.create',
  schema: {
    title: SchoolClass.schema.title,
    timeFrame: SchoolClass.schema.timeFrame,
    'timeFrame.from': SchoolClass.schema['timeFrame.from'],
    'timeFrame.to': SchoolClass.schema['timeFrame.to']
  },
  role: UserUtils.roles.teacher,
  run: onServer(function createClass ({ title, timeFrame }) {
    const { userId } = this
    const SchoolClassCollection = getCollection(SchoolClass.name)
    const insert = { title, createdBy: userId }

    if (SchoolClassCollection.find(insert).count() > 0) {
      throw new Meteor.Error('create.error', 'schoolClass.exists', {
        key: 'title',
        type: 'valueAlreadyExists',
        value: title
      })
    }

    if (timeFrame) {
      insert.timeFrame = timeFrame
    }

    insert.students = []
    insert.teachers = [userId]

    return SchoolClassCollection.insert(insert)
  })
}

SchoolClass.methods.update = {
  name: 'schoolClass.methods.update',
  schema: {
    _id: String,
    title: SchoolClass.schema.title
  },
  role: UserUtils.roles.teacher,
  run: onServerExec(function () {
    import { checkEditPermission } from '../../../api/document/checkEditPermissions'

    return function createClass ({ _id, title }) {
      const { userId } = this
      const SchoolClassCollection = getCollection(SchoolClass.name)
      const doc = SchoolClassCollection.findOne(_id)

      // only admin can update non-owned docs
      checkEditPermission({ doc, userId })

      if (SchoolClassCollection.find({ title, createdBy: this.userId }).count() > 0) {
        throw new Meteor.Error('create.error', 'schoolClass.exists', {
          key: 'title',
          type: 'valueAlreadyExists',
          value: title
        })
      }

      return SchoolClassCollection.update(_id, { $set: { title } } )
    }
  })
}

/**
 * Deletes a class
 * @roles: teacher
 */

SchoolClass.methods.remove = {
  name: 'schoolClass.methods.remove',
  schema: {
    _id: String
  },
  roles: UserUtils.roles.teacher,
  run: onServerExec(function () {
    import { removeClass } from './methods/removeClass'
    return function ({ _id }) {
      const { userId, log } = this
      const classId = _id
      return removeClass({ classId, userId, log })
    }
  })
}

/**
 * Adds a single student to a class
 */

SchoolClass.methods.addStudent = {
  name: 'schoolClass.methods.addStudent',
  schema: {
    classId: String,
    userId: String
  },
  roles: UserUtils.roles.teacher,
  run: onServer(SchoolClass.helpers.addStudent)
}

/**
 * Removes a single student from a class.
 */

SchoolClass.methods.removeStudent = {
  name: 'schoolClass.methods.removeStudent',
  schema: {
    classId: String,
    userId: String
  },
  roles: UserUtils.roles.teacher,
  run: onServer(SchoolClass.helpers.removeStudent)
}

/**************************************************************
 *
 *  PUBLICATIONS
 *
 **************************************************************/

SchoolClass.publications = {}

/**
 * Publishes a single class, assuming I am associated with it
 * @roles: all
 */

SchoolClass.publications.single = {
  name: 'schoolClass.publications.single',
  schema: {
    _id: String
  },
  run: onServer(function ({ _id }) {
    const { userId } = this
    const query = {
      $or: [
        { _id, students: userId },
        { _id, createdBy: userId }
      ]
    }
    return getCollection(SchoolClass.name).find(query, { limit: 1 })
  }),
  timeInterval: 1000,
  numRequests: 10
}


SchoolClass.publications.my = {
  name: 'schoolClass.publications.my',
  schema: {},
  run: onServer(function () {
    const { userId } = this
    const query = {
      $or: [
        { students: userId },
        { teachers: userId },
        { createdBy: userId }
      ]
    }
    return getCollection(SchoolClass.name).find(query)
  })
}