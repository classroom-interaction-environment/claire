import { Meteor } from 'meteor/meteor'
import { UserUtils } from '../../system/accounts/users/UserUtils'
import { i18n } from '../../../api/language/language'
import { onServer, onServerExec } from '../../../api/utils/archUtils'
import { getCollection } from '../../../api/utils/getCollection'
import { loadLessonMaterial } from './methods/loadMaterial'

/**
 * The Lesson is a fundamental part of this application.
 * It is an aggregation of several Contexts like Unit, Phases and Material.
 * It is also projecting the state of a real lesson in classroom and reflecting certain states of visibility of Material
 * and responses, as well as artifacts and results from evaluation of responses.
 *
 * The concepts will be summarized in this documentation.
 */
export const Lesson = {
  name: 'lesson',
  label: 'school.lesson',
  icon: 'book',
  isClassroom: true
}

/**************************************************************
 *
 *  SCHEMA
 *
 **************************************************************/

/**
 * The schema represents the curricular postion (classId, unit, originalUnit), the state of a lesson,
 * as well as the controllable entities within.
 */

Lesson.schema = {

  /**
   * The class / course which is involved in this lesson.
   * Used to determine the involved students and teachers.
   */

  classId: {
    type: String,
    label: i18n.reactive('lesson.class')
  },

  /**
   * The unit is referring to the current (temporary) copy of a given original/master unit.
   * It will likely be subject of change and modification as part of the lesson preparation.
   */

  unit: {
    type: String,
    label: i18n.reactive('lesson.unit')
  },

  /**
   * The original unit is the master document, that is used as "blueprint" for this lesson.
   * This could also be a blank unit, which could either be used for a "quick session"
   * or as starting point for becoming a new master Unit.
   */

  unitOriginal: {
    type: String,
    label: i18n.reactive('lesson.unitOriginal'),
    optional: true
  },

  /**
   * Determines, if and when the lesson has been started, thus if it's "running"
   */

  startedAt: {
    type: Date,
    label: i18n.reactive('lesson.startedAt'),
    optional: true
  },

  /**
   * Determines, if and when the lesson has been completed, thus if it's "done"
   */

  completedAt: {
    type: Date,
    label: i18n.reactive('lesson.completedAt'),
    optional: true
  },

  /**
   * Points to a current phase as being active. Not necessarily required but can be helpful.
   */

  phase: {
    type: String,
    optional: true,
    label: i18n.reactive('curriculum.phase')
  },

  /**
   * References to material ids, which are considered to be displayed on the student's screens.
   */

  visibleStudent: {
    type: Array,
    optional: true,
    defaultValue: [],
    label: i18n.reactive('lesson.visibleStudent')
  },
  'visibleStudent.$': {
    type: Object
  },
  'visibleStudent.$._id': {
    type: String
  },
  'visibleStudent.$.context': {
    type: String
  },

  /**
   * References to material ids, which are considered to be displayed on the beamer.
   */

  visibleBeamer: {
    type: Array,
    optional: true,
    label: i18n.reactive('lesson.visibleStudent'),
    defaultValue: []
  },
  'visibleBeamer.$': {
    type: String
  },

  /**
   * Results from a evaluation of responses, for example a cluster.
   * Usually to be shared with the class or parts of the class after the lesson has been completed.
   */

  artifacts: {
    type: Array,
    optional: true,
    label: i18n.reactive('lesson.artifacts')
  },
  'artifacts.$': {
    type: String,
    optional: true,
    label: i18n.reactive('lesson.artifacts')
  },

  /**
   * Arbitrary uploads, which can occur at any stage of the lesson by any of the students.
   */

  uploads: {
    type: Array,
    optional: true,
    label: i18n.reactive('lesson.uploads')
  },
  'uploads.$': {
    type: String,
    optional: true,
    label: i18n.reactive('lesson.upload')
  }
}

/**************************************************************
 *
 *  FIELDS
 *
 **************************************************************/

Lesson.publicFields = {
  classId: 1,
  unit: 1,
  unitOriginal: 1,
  completedAt: 1,
  startedAt: 1,
  phase: 1,
  visibleStudent: 1,
  visibleBeamer: 1,
  artifacts: 1,
  uploads: 1
}

/**************************************************************
 *
 *  PUBLICATIONS
 *
 **************************************************************/

Lesson.publications = {}

Lesson.publications.my = {
  name: 'lesson.publication.my',
  schema: {},
  roles: UserUtils.roles.teacher,
  run: onServer(function () {
    const { userId } = this
    const query = {
      $or: [
        { createdBy: userId },
        { teachers: userId }
      ]
    }
    return getCollection(Lesson.name).find(query)
  })
}

Lesson.publications.myRunning = {
  name: 'lesson.publication.myRunning',
  schema: {},
  roles: UserUtils.roles.teacher,
  run: onServerExec(function () {
    return function () {
      const { userId } = this
      const query = {
        createdBy: userId,
        startedAt: { $exists: true },
        completedAt: { $exists: false }
      }
      return getCollection(Lesson.name).find(query)
    }
  })
}

/**
 * Publishes all Lessons, associated with a unit and which I have created
 * @roles teacher
 */

Lesson.publications.editor = {
  name: 'lesson.publications.editor',
  fields: {},
  schema: {
    unit: String
  },
  run: onServer(function ({ unit }) {
    const query = { unit, createdBy: this.userId }
    return getCollection(Lesson.name).find(query, { limit: 1 })
  }),
  role: UserUtils.roles.teacher,
  timeInterval: 1000,
  numRequests: 10
}

/**
 * Publishes a specific lesson, I have created
 * @roles teacher, student
 */

Lesson.publications.single = {
  name: 'lesson.publications.single',
  schema: {
    _id: String
  },
  run: onServerExec(function () {
    import { singleLesson } from './publications/singleLesson'

    return async function ({ _id }) {
      const { userId } = this
      return singleLesson({ lessonId: _id, userId })
    }
  }),
  timeInterval: 1000,
  numRequests: 10
}

/**
 * Publishes all lessons related to a class, where teacher is a member
 * @roles teacher
 */

Lesson.publications.byClass = {
  name: 'lesson.publications.byClass',
  timeInterval: 1000,
  numRequests: 20,
  roles: UserUtils.roles.teacher,
  schema: {
    classId: String
  },
  run: onServerExec(function () {
    import { lessonsByClassTeacher } from './publications/lessonsByClass'
    return async function ({ classId }) {
      const { userId } = this
      return lessonsByClassTeacher({ userId, classId })
    }
  })
}

/**
 * Publishes all lessons related to a class, where student is am member
 * @roles student
 */

Lesson.publications.byClassStudent = {
  name: 'lesson.publications.byClassStudent',
  timeInterval: 1000,
  numRequests: 20,
  schema: {
    classId: String
  },
  run: onServerExec(function () {
    import { lessonsByClassStudent } from './publications/lessonsByClass'

    return function ({ classId }) {
      const { userId } = this
      return lessonsByClassStudent({ classId, userId })
    }
  })
}

/**************************************************************
 *
 *  METHODS
 *
 **************************************************************/

Lesson.methods = {}

/**
 * Returns all Lessons, the current user has created
 * @roles teacher
 */

Lesson.methods.my = {
  name: 'lesson.methods.my',
  schema: {
    classId: {
      type: String,
      optional: true
    },
    ids: {
      type: Array,
      optional: true
    },
    'ids.$': String,
    skip: {
      type: Array,
      optional: true
    },
    'skip.$': String,
    completed: {
      type: Boolean,
      optional: true
    },
    units: {
      type: Array,
      optional: true
    },
    'units.$': String
  },
  role: UserUtils.roles.teacher,
  run: onServer(function ({ classId, ids = [], skip = [], completed, custom, units = [] }) {
    const query = { createdBy: this.userId }

    if (classId) {
      query.classId = classId
    }

    if (ids?.length) {
      query._id = { $in: ids }
    }

    if (skip?.length) {
      query._id = query._id || {}
      query._id.$nin = skip
    }

    if (completed === false) {
      query.completedAt = { $exists: false }
    }

    if (units?.length > 0) {
      query.unitOriginal = { $in: units }
    }

    this.log('query', JSON.stringify(query))
    return getCollection(Lesson.name).find(query).fetch()
  })
}

Lesson.methods.counts = {
  name: 'lesson.methods.counts',
  schema: {
    classIds: Array,
    'classIds.$': String
  },
  roles: UserUtils.roles.teacher,
  run: onServerExec(() => {
    import { countLessons } from './methods/countLessons'
    return async function ({ classIds }) {
      const { userId } = this
      return countLessons({ classIds, userId })
    }
  })
}

Lesson.methods.create = {
  name: 'lesson.methods.create',
  schema: {
    classId: String,
    unitId: String
  },
  roles: UserUtils.roles.teacher,
  run: onServerExec(function () {
    import { createLesson } from './methods/createLesson'

    return async function ({ classId, unitId }) {
      const { userId } = this
      return createLesson({ classId, unitId, userId })
    }
  })
}

Lesson.methods.remove = {
  name: 'lesson.methods.remove',
  schema: {
    _id: String
  },
  roles: UserUtils.roles.teacher,
  run: onServerExec(function () {
    import { removeLesson } from './methods/removeLesson'

    return function ({ _id }) {
      const { userId } = this
      return removeLesson({ lessonId: _id, userId })
    }
  })
}

Lesson.methods.start = {
  name: 'lesson.methods.start',
  schema: {
    _id: String
  },
  role: UserUtils.roles.teacher,
  run: onServerExec(() => {
    import { startLesson } from './methods/lessonActions'
    return async function ({ _id }) {
      const { userId } = this
      return startLesson({ userId, lessonId: _id })
    }
  })
}

Lesson.methods.complete = {
  name: 'lesson.methods.complete',
  schema: {
    _id: String
  },
  roles: UserUtils.roles.teacher,
  run: onServerExec(function () {
    import { completeLesson } from './methods/lessonActions'
    return async function ({ _id }) {
      const { userId } = this
      return completeLesson({ userId, lessonId: _id })
    }
  })
}

Lesson.methods.stop = {
  name: 'lesson.methods.stop',
  schema: {
    _id: String
  },
  roles: UserUtils.roles.teacher,
  run: onServerExec(function () {
    import { stopLesson } from './methods/lessonActions'
    return async function ({ _id }) {
      const { userId } = this
      return stopLesson({ userId, lessonId: _id })
    }
  })
}

Lesson.methods.resume = {
  name: 'lesson.methods.resume',
  schema: {
    _id: String
  },
  roles: UserUtils.roles.teacher,
  run: onServerExec(function () {
    import { resumeLesson } from './methods/lessonActions'
    return async function ({ _id }) {
      const { userId } = this
      return resumeLesson({ userId, lessonId: _id })
    }
  })
}

Lesson.methods.restart = {
  name: 'lesson.methods.restart',
  schema: {
    _id: String
  },
  roles: UserUtils.roles.teacher,
  run: onServerExec(function () {
    import { restartLesson } from './methods/restartLesson'
    return async function ({ _id }) {
      const { userId } = this
      return restartLesson({ userId, lessonId: _id })
    }
  })
}

Lesson.methods.toggle = {
  name: 'lesson.methods.toggle',
  schema: {
    _id: String,
    referenceId: String,
    context: String
  },
  roles: UserUtils.roles.teacher,
  run: onServerExec(function () {
    import { toggleLessonMaterial } from './methods/toggleLessonMaterial'
    return async function ({ _id, referenceId, context }) {
      const { userId } = this
      return toggleLessonMaterial({ lessonId: _id, userId, referenceId, context })
    }
  })
}

/**
 * Returns all units, associated with a given list of Lessons
 * @role student
 */

Lesson.methods.units = {
  name: 'lesson.methods.units',
  schema: {
    lessonIds: Array,
    'lessonIds.$': String
  },
  run: onServerExec(function () {
    import { unitsByLesson } from './methods/unitsByLesson'

    return function ({ lessonIds }) {
      const { userId } = this
      return unitsByLesson({ userId, lessonIds })
    }
  })
}

/**
 * Returns all material, associated with a given Lesson. Allows to skip already loaded material.
 * @role student
 */

Lesson.methods.material = {
  name: 'lesson.methods.material',
  schema: {
    _id: String,
    groupId: {
      type: String,
      optional: true
    },
    skip: {
      type: Array,
      optional: true
    },
    'skip.$': String
  },
  run: onServerExec(function () {
    import { loadLessonMaterial } from './methods/loadMaterial'
    return async function ({ _id, groupId, skip = [] }) {
      const { userId } = this
      return loadLessonMaterial({ lessonId: _id, groupId, userId, skip })
    }
  })
}
