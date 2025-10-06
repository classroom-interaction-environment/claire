import { Meteor } from 'meteor/meteor'
import { i18n } from '../../../api/language/language'
import { UserUtils } from '../../system/accounts/users/UserUtils'
import { onServer, onServerExec } from '../../../api/utils/archUtils'
import { getCollection } from '../../../api/utils/getCollection'

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
  /**
   * Extract into own namespace
   * @deprecated
   */
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

/**************************************************************
 *
 *  METHODS
 *
 **************************************************************/

SchoolClass.methods = {}

/**
 * Returns a single class, assuming I am associated with it
 */
SchoolClass.methods.get = {
  name: 'schoolClass.methods.get',
  schema: {
    _id: String
  },
  run: onServerExec(() => {
    import { getSchoolClass } from './methods/getSchoolClas'
    return async function ({ _id }) {
      const { userId } = this
      return getSchoolClass({ classId: _id, userId })
    }
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
  run: onServerExec(() => {
    import { getMyClasses } from './methods/getMyClasses'
    return async function myClasses ({ ids }) {
      const { userId } = this
      return getMyClasses({ userId, ids })
    }
  })
}

/**
 * Creates a new class, assuming I have the teacher role
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
  run: onServerExec(() => {
    import { createSchoolClass } from './helpers/createSchoolClass'
    return async function createClass ({ title, timeFrame }) {
      const { userId } = this
      return createSchoolClass({ title, timeFrame, userId })
    }
  })
}

/**
 * Updates the title of a class
 */
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

      return SchoolClassCollection.update(_id, { $set: { title } })
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
  run: onServerExec(() => {
    import { addStudent } from './methods/addStudent'

    return async function ({ classId, userId }) {
      const teacherId = this.userId
      return addStudent({ classId, userId, teacherId })
    }
  })
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
  run: onServerExec(() => {
    import { removeStudent } from './methods/removeStudent'
    return async function ({ classId, userId }) {
      const teacherId = this.userId
      return removeStudent({ classId, userId, teacherId })
    }
  })
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
  run: onServer(async function ({ _id }) {
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
  run: onServer(async function () {
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
