import { Meteor } from 'meteor/meteor'
import { UserUtils } from '../../system/accounts/users/UserUtils'
import { i18n } from '../../../api/language/language'
import { PermissionDeniedError } from '../../../api/errors/types/PermissionDeniedError'
import { onServer, onServerExec } from '../../../api/utils/archUtils'
import { getCollection } from '../../../api/utils/getCollection'

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
    import { userIsAdmin } from '../../../api/accounts/admin/userIsAdmin'
    import { LessonHelpers } from './LessonHelpers'

    return function ({ _id }) {
      const { userId } = this
      const isMember = LessonHelpers.isMemberOfLesson({
        userId,
        lessonId: _id
      })
      if (!isMember && !userIsAdmin(userId)) {
        throw new PermissionDeniedError('lesson.notAMember')
      }

      return getCollection(Lesson.name).find({ _id }, { limit: 1 })
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
    import { SchoolClass } from '../schoolclass/SchoolClass'

    return function ({ classId }) {
      const userId = this.userId
      const classDoc = getCollection(SchoolClass.name).findOne({ _id: classId })
      const isTeacher = SchoolClass.helpers.isTeacher({ userId, classDoc })
      this.log({ isTeacher })
      return isTeacher
        ? getCollection(Lesson.name).find({ classId })
        : null
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
    import { LessonHelpers } from './LessonHelpers'

    return function ({ classId }) {
      const userId = this.userId
      const classDoc = LessonHelpers.getClassDocIfStudent({ userId, classId })
      return getCollection(Lesson.name).find({ classId: classDoc && classDoc._id })
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
  run: onServer(function ({ classIds }) {
    const { userId } = this
    const out = Object.create(null)
    const LessonCollection = getCollection(Lesson.name)

    classIds.forEach(classId => {
      const query = { classId, createdBy: userId }
      out[classId] = LessonCollection.find(query).count()
    })

    return out
  })
}

Lesson.methods.create = {
  name: 'lesson.methods.create',
  schema: {
    classId: String,
    unit: String
  },
  roles: UserUtils.roles.teacher,
  run: onServerExec(function () {
    import { createLesson } from './methods/createLesson'

    return function ({ classId, unit }) {
      const { userId } = this
      return createLesson({ classId, unit, userId })
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
      const { userId, log } = this
      const lessonId = _id
      return removeLesson({ lessonId, userId, log })
    }
  })
}

Lesson.methods.start = {
  name: 'lesson.methods.start',
  schema: {
    _id: String
  },
  role: UserUtils.roles.teacher,
  run: onServerExec(function () {
    import { LessonStates } from './LessonStates'
    import { LessonErrors } from './LessonErrors'
    import { LessonHelpers } from './LessonHelpers'
    import { createUpdateDoc } from '../../../api/utils/documentUtils'

    const updateLesson = createUpdateDoc(Lesson, { checkOwner: false })

    /**
     * Starts a lesson by _id.
     * @throws Meteor.Error if the lesson is not found by _id
     * @throws Meteor.Error if the lesson is not owned by the user
     * @throws Meteor.Error if the lesson is not in idle state
     * @param _id The _id of the target lesson
     * @return {Boolean} A boolean value, whether the operation has been successful
     */
    function startLesson ({ _id }) {
      const userId = this.userId
      const { lessonDoc } = LessonHelpers.docsForTeacher({
        userId,
        lessonId: _id
      })

      if (!LessonStates.canStart(lessonDoc)) {
        throw new Meteor.Error(LessonErrors.unexpectedState, 'lesson.errors.expectedIdle')
      }

      const startedAt = new Date()
      return !!updateLesson.call(this, lessonDoc._id, { $set: { startedAt } })
    }

    return startLesson
  })
}

Lesson.methods.complete = {
  name: 'lesson.methods.complete',
  schema: {
    _id: String
  },
  roles: UserUtils.roles.teacher,
  run: onServerExec(function () {
    import { createUpdateDoc } from '../../../api/utils/documentUtils'
    import { LessonStates } from './LessonStates'
    import { LessonHelpers } from './LessonHelpers'

    const updateLesson = createUpdateDoc(Lesson, { checkOwner: false })

    /**
     * Completes a lesson by _id
     * @throws Meteor.Error if lesson is not in running state
     * @param _id The _id of the target lesson
     * @return {Boolean} A boolean value, whether the operation has been successful
     */

    function completeLesson ({ _id }) {
      const userId = this.userId
      const { lessonDoc } = LessonHelpers.docsForTeacher({
        userId,
        lessonId: _id
      })

      if (!LessonStates.canComplete(lessonDoc)) {
        throw new Meteor.Error('lesson.errors.unexpectedState', 'lesson.errors.expectedRunning')
      }

      // this is our indicator for the lesson being completed
      const completedAt = new Date()

      // we also unset all visible materials, to prevent any runtime issues
      // with current opened materials on the student views, that could arise
      // during the state changing from running to completed
      const visibleStudent = []

      return !!updateLesson.call(this, _id, { $set: { completedAt, visibleStudent } })
    }

    return completeLesson
  })
}

Lesson.methods.stop = {
  name: 'lesson.methods.stop',
  schema: {
    _id: String
  },
  roles: UserUtils.roles.teacher,
  run: onServerExec(function () {
    import { LessonErrors } from './LessonErrors'
    import { LessonStates } from './LessonStates'
    import { LessonHelpers } from './LessonHelpers'
    import { createUpdateDoc } from '../../../api/utils/documentUtils'

    const updateLesson = createUpdateDoc(Lesson, { checkOwner: false })

    /**
     * Stops a lesson by _id
     * @throws Meteor.Error if lesson is not in running state
     * @param _id The _id of the target lesson
     * @return {Boolean} A boolean value, whether the operation has been successful
     */

    function stopLesson ({ _id }) {
      const userId = this.userId
      const { lessonDoc } = LessonHelpers.docsForTeacher({
        userId,
        lessonId: _id
      })

      if (!LessonStates.isRunning(lessonDoc)) {
        throw new Meteor.Error(LessonErrors.unexpectedState)
      }

      return updateLesson.call(this, lessonDoc._id, { $unset: { startedAt: 1 } })
    }

    return stopLesson
  })
}

Lesson.methods.resume = {
  name: 'lesson.methods.resume',
  schema: {
    _id: String
  },
  roles: UserUtils.roles.teacher,
  run: onServerExec(function () {
    import { LessonStates } from './LessonStates'
    import { LessonErrors } from './LessonErrors'
    import { LessonHelpers } from './LessonHelpers'
    import { createUpdateDoc } from '../../../api/utils/documentUtils'

    const updateLesson = createUpdateDoc(Lesson, { checkOwner: false })

    /**
     * Resumes a lesson by _id
     * @throws Meteor.Error if lesson is not in completed state
     * @param _id The _id of the target lesson
     * @return {Boolean} A boolean value, whether the operation has been successful
     */

    function resumeLesson ({ _id }) {
      const userId = this.userId
      const { lessonDoc } = LessonHelpers.docsForTeacher({
        userId,
        lessonId: _id
      })
      if (!LessonStates.canResume(lessonDoc)) throw new Meteor.Error(LessonErrors.unexpectedState)
      return updateLesson.call(this, lessonDoc._id, { $unset: { completedAt: 1 } })
    }

    return resumeLesson
  })
}

Lesson.methods.restart = {
  name: 'lesson.methods.restart',
  schema: {
    _id: String
  },
  roles: UserUtils.roles.teacher,
  run: onServerExec(function () {
    import { LessonRuntime } from './runtime/LessonRuntime'
    import { LessonStates } from './LessonStates'
    import { LessonHelpers } from './LessonHelpers'
    import { createUpdateDoc } from '../../../api/utils/documentUtils'

    const updateLesson = createUpdateDoc(Lesson)

    /**
     * Restartes a lesson by _id and removes all data that has been generated during the lesson run
     * TODO also check here if an inversion of control is possible, since we
     * TODO will definitely have to expand the list of contexts that will be used here
     * @throws Meteor.Error if lesson is not in running state and also not in completed state
     * @param _id The _id of the target lesson
     * @return {object} A boolean value, whether the operation has been successful
     */
    function restartLesson ({ _id }) {
      const { userId, log } = this
      const { lessonDoc } = LessonHelpers.docsForTeacher({
        userId,
        lessonId: _id
      })

      if (!LessonStates.canRestart(lessonDoc)) {
        throw new Meteor.Error(
          'lesson.errors.unexpectedState',
          'lesson.errors.expectedRestartable',
          { lessonId: _id, userId }
        )
      }

      const options = { lessonId: _id, userId }
      const runtimeDocs = LessonRuntime.removeDocuments(options)
      const groupDocs = LessonRuntime.resetGroups(options)
      const beamerReset = LessonRuntime.resetBeamer(options)
      const lessonReset = !!updateLesson.call(this, _id, {
        $unset: {
          phase: 1,
          startedAt: 1,
          completedAt: 1,
          artifacts: 1,
          uploads: 1,
          visibleStudent: 1,
          visibleBeamer: 1
        }
      })

      const result = { runtimeDocs, beamerReset, lessonReset, groupDocs }
      log(result)
      return result
    }

    return restartLesson
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
    import { LessonStates } from './LessonStates'
    import { LessonErrors } from './LessonErrors'
    import { LessonHelpers } from './LessonHelpers'
    import { createUpdateDoc } from '../../../api/utils/documentUtils'
    import { createDocGetter } from '../../../api/utils/document/createDocGetter'

    const updateLesson = createUpdateDoc(Lesson)

    function toggleLessonMaterial ({ _id, referenceId, context }) {
      const { userId } = this
      const { lessonDoc } = LessonHelpers.docsForTeacher({
        userId,
        lessonId: _id
      })

      if (!LessonStates.canToggle(lessonDoc)) {
        throw new Meteor.Error('lesson.errors.unexpectedState', 'lesson.errors.expectedToggleAble')
      }

      // use doc getter to ensure reference doc exists
      createDocGetter({ name: context })(referenceId)

      const index = (lessonDoc.visibleStudent || []).findIndex(reference => reference._id === referenceId)
      const transform = {}
      const target = { _id: referenceId, context }

      // if we found no document, we add it to the list
      if (index === -1) {
        transform.$push = { visibleStudent: target }
      }

      // if we found it we remove it
      else if (index > -1) {
        transform.$pull = { visibleStudent: target }
      }

      // in case of unexpected state we throw
      else {
        throw new Meteor.Error(LessonErrors.unexpectedMaterialIndex, index)
      }

      return !!updateLesson.call(this, _id, transform)
    }

    return toggleLessonMaterial
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
    import { SchoolClass } from '../schoolclass/SchoolClass'
    import { Unit } from '../../curriculum/curriculum/unit/Unit'
    import { $in } from '../../../api/utils/query/inSelector'
    import { LessonHelpers } from './LessonHelpers'

    /**
     * Getss all associated units by a given set of lessons (via lesson ids)
     * @param lessonIds
     * @return {*}
     */

    return function unitsByLessons ({ lessonIds }) {
      const { userId } = this

      const classIds = new Set()
      const unitsIds = new Set()
      const lessonDocs = getCollection(Lesson.name).find({ _id: $in(lessonIds) })

      lessonDocs.forEach(doc => {
        classIds.add(doc.classId)
      })

      const classDocs = getCollection(SchoolClass.name).find({ _id: $in(classIds) }).fetch()
      const validQuery = lessonDocs.fetch().every(lessonDoc => {
        const { classId } = lessonDoc
        const classDoc = classDocs.find(({ _id }) => _id === classId)

        if (!classDoc) {
          return false
        }

        return LessonHelpers.isMemberOfClass({ classDoc, userId })
      })

      if (!validQuery) {
        throw new Meteor.Error('errors.permissionDenied', SchoolClass.errors.notMember, { userId })
      }

      lessonDocs.forEach(doc => {
        unitsIds.add(doc.unit)
      })

      return getCollection(Unit.name).find({ _id: $in(unitsIds) }).fetch()
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
    import { Group } from '../group/Group'
    import { SchoolClass } from '../schoolclass/SchoolClass'
    import { LessonStates } from './LessonStates'
    import { LessonErrors } from './LessonErrors'
    import { LessonHelpers } from './LessonHelpers'
    import { createDocGetter } from '../../../api/utils/document/createDocGetter'
    import { loadMaterial } from '../../material/loadMaterial'

    const getClassDoc = createDocGetter(SchoolClass)
    const getGroupDoc = createDocGetter({ name: Group.name })

    /**
     * Loads material relevant for a lesson.
     * Allows to skip already loaded material
     * @param userId
     * @param _id
     * @param skip
     * @throws Meteor.Error if the lesson does not exists by given _id
     * @throws Meteor.Error if the no class is found for the linked classId
     * @throws Meteor.Error if the user is not member of the linked class
     * @throws Meteor.Error if a collection is not found by context, referenced in the material
     * @throws Meteor.Error if the document is not found by _id, referenced in the material
     * @return {undefined|{}} an Object containing all referenced documents, otherwise undefined
     */

    function lessonMaterial ({ _id, groupId, skip = [] }) {
      const { userId, log } = this

      // first we need the lesson doc for any further steps
      const { lessonDoc } = LessonHelpers.docsForStudent({
        userId,
        lessonId: _id
      })

      // check if the lesson has an appropriate state
      if (!LessonStates.canToggle(lessonDoc)) {
        throw new Meteor.Error(LessonErrors.unexpectedState, 'lesson.errors.expectedRunningOrComplete')
      }

      const groupDoc = groupId && getGroupDoc(groupId)
      const allReferences = (lessonDoc.visibleStudent || []).concat(groupDoc?.visible || [])
      log(allReferences)
      // if nothing to display, abort
      if (allReferences.length === 0) {
        return
      }

      // check class membership
      const { classId } = lessonDoc
      getClassDoc(classId)

      // prepare the material for loading multiple docs
      // the source list will be in the form of
      // { contextName1: [_id1, _id2, ...], ... }
      const materialSourceList = {}

      allReferences.forEach(ref => {
        if (!materialSourceList[ref.context]) {
          materialSourceList[ref.context] = []
        }

        if (!skip.includes(ref._id)) {
          materialSourceList[ref.context].push(ref._id)
        }
      })

      // load the material
      const dependencies = {}
      const material = {}

      loadMaterial({
        source: materialSourceList,
        destination: material,
        dependencies: dependencies,
        skip: skip
      })

      loadMaterial({
        source: dependencies,
        destination: material,
        skip: skip
      })

      return material
    }

    return lessonMaterial
  })
}
