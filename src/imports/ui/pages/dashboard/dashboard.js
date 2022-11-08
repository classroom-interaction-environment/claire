import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { SchoolClass } from '../../../contexts/classroom/schoolclass/SchoolClass'
import { Lesson } from '../../../contexts/classroom/lessons/Lesson'
import { Users } from '../../../contexts/system/accounts/users/User'
import { loadIntoCollection } from '../../../infrastructure/loading/loadIntoCollection'
import { getLocalCollection } from '../../../infrastructure/collection/getLocalCollection'
import { cursor } from '../../../api/utils/cursor'
import { dataTarget } from '../../utils/dataTarget'
import { createDashboardFormActions } from './forms/dashboardForms'
import { callMethod } from '../../controllers/document/callMethod'
import { getCollection } from '../../../api/utils/getCollection'
import { FormModal } from '../../components/forms/modal/formModal'
import { Unit } from '../../../contexts/curriculum/curriculum/unit/Unit'
import { Pocket } from '../../../contexts/curriculum/curriculum/pocket/Pocket'
import { Dimension } from '../../../contexts/curriculum/curriculum/dimension/Dimension'
import { LessonStates } from '../../../contexts/classroom/lessons/LessonStates'
import { ProfileImages } from '../../../contexts/files/image/ProfileImages'
import dashboardLanguage from './i18n/dashboardLang'
import { Collapse } from 'bootstrap'
import '../../components/confirm/confirm'
import '../../renderer/lesson/list/lessonListRenderer'
import './dashboard.html'

const API = Template.dashboard.setDependencies({
  contexts: [SchoolClass, Lesson, Users, Pocket, ProfileImages, Dimension],
  language: dashboardLanguage
})

const formActions = createDashboardFormActions({ onError: API.notify, translate: API.translate })
const toDocId = doc => doc._id
const byTitle = (a, b) => a.title.localeCompare(b.title)

Template.dashboard.onCreated(function () {
  const instance = this
  instance.state.set({
    selectedClass: null,
    showStudents: null,
    deleting: null,
    lessonsLoaded: {},
    lessonCounts: {}
  })

  // STEP 1
  // we need live updates on classes, for example
  // when managing users or adding/removing them
  API.subscribe({
    name: SchoolClass.publications.my,
    key: 'dashboardSubKey',
    callbacks: {
      onError: API.fatal,
      onReady: () => {
        // After subscription is complete, we load all dimensions
        // this does not require live updates, so we load them statically.
        // We do that here in order to prioritize display of classes
        const DimensionCollection = getLocalCollection(Dimension.name)
        loadIntoCollection({
          name: Dimension.methods.all,
          failure: API.notify,
          args: { skip: DimensionCollection.find().map(toDocId) },
          collection: DimensionCollection
        })
      }
    }
  })

  instance.updateLessonCounts = () => {
    const classIds = getCollection(SchoolClass.name).find().map(toDocId)
    if (classIds.length === 0) { return }

    // once we got all classes we can call for the lesosn counts
    callMethod({
      name: Lesson.methods.counts,
      args: { classIds },
      failure: API.notify,
      success: lessonCounts => instance.state.set({ lessonCounts })
    })
  }

  // STEP 2
  // get initial counts for the lessons from method
  // so we can display these without subscriptions required
  instance.autorun(() => instance.updateLessonCounts())

  // STEP 3
  // if a class is opened / extended, we need live updates on the lessons
  instance.autorun(() => {
    const classId = instance.state.get('classId')
    const classDoc = classId && getCollection(SchoolClass.name).findOne(classId)

    if (!classId || typeof classDoc !== 'object') {
      // unset / cleanup
      instance.state.set('lessonsLoaded', null)
      API.unsubscribe(Lesson.publications.byClass)
      return
    }

    API.subscribe({
      name: Lesson.publications.byClass,
      args: { classId },
      key: 'dashboardSubKey',
      callbacks: {
        onError: API.notify,
        onReady: () => {
          // at this point we load the units in order to get the titles
          // and several static definitions of the lessons, such as dimensions, objectives etc.
          const UnitCollection = getLocalCollection(Unit.name)
          const ids = getCollection(Lesson.name).find({ classId }).map(lessonDoc => lessonDoc.unit)
          const skip = UnitCollection.find({ _id: { $in: ids } }).map(toDocId)

          if (ids.length === 0) {
            return
          }
          loadIntoCollection({
            name: Unit.methods.all,
            args: { ids, skip },
            failure: API.notify,
            collection: UnitCollection
          })
        }
      }
    })
  })

  // when a students invitation modal is active then we have
  // to get the users (but no need to subscribe here)
  instance.autorun(async () => {
    const classId = instance.state.get('studentsClassId')
    const classDoc = classId && getCollection(SchoolClass.name).findOne(classId)

    if (!classId || typeof classDoc !== 'object') {
      // unset / cleanup
      return
    }

    const UsersCollection = getLocalCollection(Users.name)
    const students = classDoc?.students || []
    const args = { classId: classDoc }

    const skip = students.filter(studentId => UsersCollection.find(studentId).count())
    if (skip.length > 0) {
      args.skip = skip
    }

    if (students.length > 0 && skip.length !== students.length) {
      await loadIntoCollection({
        name: Users.methods.byClass,
        args: { classId, skip },
        collection: UsersCollection,
        failure: API.notify
      })
    }

    // we create a light version of the class doc to pass
    // it to the user renderer in the modal
    const { teachers, title } = classDoc
    const showStudents = { _id: classId, title }
    const sort = { 'presence.status': -1, lastName: 1 }

    showStudents.students = students && UsersCollection.find(
      { _id: { $in: students } },
      { sort }).fetch()
    showStudents.teachers = teachers && UsersCollection.find(
      { _id: { $in: teachers } },
      { sort }).fetch()

    // show modal already here
    instance.state.set({ showStudents })

    // optional: load profile images
    const ProfileImagesCollection = getLocalCollection(ProfileImages.name)
    const skipProfileImages = []
    const userProfileImages = []
    showStudents.students.concat(showStudents.teachers).forEach(userDoc => {
      if (userDoc.profileImage) {
        userProfileImages.push(userDoc.profileImage)
      }
      if (ProfileImagesCollection.find(userDoc.profileImage).count()) {
        skipProfileImages.push(userDoc.profileImage)
      }
    })

    if (userProfileImages.length > 0 && skipProfileImages.length !== userProfileImages.length) {
      const profileImageArgs = { classId }
      if (skipProfileImages.length > 0) {
        profileImageArgs.skip = skipProfileImages
      }

      await loadIntoCollection({
        name: ProfileImages.methods.byClass,
        args: profileImageArgs,
        collection: getLocalCollection(ProfileImages.name),
        failure: API.notify
      })
    }
  })
})

Template.dashboard.helpers({
  loadComplete () {
    return API.initComplete()
  },
  classes () {
    const selector = { createdBy: Meteor.userId() }
    const options = { sort: byTitle }
    return getCollection(SchoolClass.name).find(selector, options)
  },
  lessonsLoaded (classId) {
    return Template.getState('lessonsLoaded') === classId
  },
  lessons (classId) {
    const selector = { classId }
    const options = { sort: { startedAt: -1, updatedAt: -1 } }
    const query = () => getCollection(Lesson.name).find(selector, options)
    return cursor(query)
  },
  lessonCount (classId) {
    const isCurrent = Template.getState('classId') === classId
    if (isCurrent) {
      return getCollection(Lesson.name).find({ classId }).count()
    }
    const fixedCount = Template.getState('lessonCounts')[classId]
    return fixedCount ?? 0
  },
  classUsers (classDoc) {
    if (!classDoc || !classDoc.students) {
      return 0
    }
    return classDoc.students.length
  },
  studentsCount (students = []) {
    return students.length
  },
  schoolClassCtxName () {
    return SchoolClass.name
  },
  unitCtxName () {
    return Unit.name
  },
  unitDoc (unitId) {
    return getLocalCollection(Unit.name).findOne(unitId)
  },
  lessonIsNotIdle (lessonDoc) {
    return !LessonStates.isIdle(lessonDoc)
  },
  lessonIsRunning (lessonDoc) {
    return LessonStates.isRunning(lessonDoc)
  },
  showStudentsDoc () {
    return Template.getState('showStudents')
  },
  inviteOptions () {
    const classId = Template.getState('inviteClass')
    if (classId) {
      const institution = Meteor.user()?.institution
      return {
        classId,
        institution
      }
    }
  },
  deleting () {

  },
  invitationModalVisible () {
    return Template.instance().state.get('invitationModalVisible')
  }
})

Template.dashboard.onDestroyed(function () {
  getLocalCollection(Lesson.name).remove({})
  getLocalCollection(Unit.name).remove({})
  API.dispose('dashboardSubKey')
})

Template.dashboard.events({
  'click .create-class-btn' (event, templateInstance) {
    event.preventDefault()
  },
  // ------------------------------------------------------------------------------------------------------
  // STUDENTS
  // ------------------------------------------------------------------------------------------------------
  'click .toggle-students-button': async (event, templateInstance) => {
    event.preventDefault()
    API.showModal('showStudentsModal')
    await import('../../renderer/user/list/userListRenderer')
    const classId = dataTarget(event, templateInstance)
    templateInstance.state.set({ studentsClassId: classId })
  },
  'hidden.bs.modal #showStudentsModal' (event, templateInstance) {
    templateInstance.state.set('studentsClassId', null)
  },
  // ------------------------------------------------------------------------------------------------------
  // INVITATION
  // ------------------------------------------------------------------------------------------------------
  'click .invite-to-class-button': async (event, templateInstance) => {
    event.preventDefault()
    API.showModal('inviteToClassModal')
    await import('../../components/inviteStudents/inviteStudents')
    const classId = dataTarget(event, templateInstance)
    templateInstance.state.set({
      invitationModalVisible: true,
      inviteClass: classId
    })
  },
  'hidden.bs.modal #inviteToClassModal' (event, templateInstance) {
    templateInstance.state.set({
      invitationModalVisible: false,
      inviteClass: null
    })
  },
  // ------------------------------------------------------------------------------------------------------
  // LESSONS
  // ------------------------------------------------------------------------------------------------------
  'click .load-lessons': async (event, templateInstance) => {
    const classId = dataTarget(event, templateInstance, 'class')
    const currentClassId = templateInstance.state.get('classId')
    const isCurrent = classId && currentClassId === classId

    if (currentClassId && !isCurrent) {
      const target = templateInstance.$(`.collapse[data-class="${currentClassId}"]`)
      const openCollapse = new Collapse(target.get(0), { toggle: false })
      openCollapse.hide()
    }

    const selectedClass = isCurrent
      ? { classId: null }
      : { classId }
    templateInstance.state.set(selectedClass)
  },
  // ------------------------------------------------------------------------------------------------------
  // FORM
  // ------------------------------------------------------------------------------------------------------
  'click .form-btn': async (event, templateInstance) => {
    event.preventDefault()

    const target = dataTarget(event, templateInstance)
    const classId = dataTarget(event, templateInstance, 'class')
    const lessonId = dataTarget(event, templateInstance, 'lesson')
    const key = dataTarget(event, templateInstance, 'action')
    const definitions = formActions[target][key]
    const load = definitions.load
    const _id = dataTarget(event, templateInstance, 'id')
    const doc = definitions.doc
      ? definitions.doc
      : _id && (
        getCollection(target).findOne(_id) ||
        getLocalCollection(target).findOne(_id))
    const { action, schema } = definitions

    FormModal.show({
      title: SchoolClass.label,
      action: action,
      load: load,
      schema: schema,
      doc: doc,
      bind: { _id, templateInstance, classId, target, key, lessonId },
      onError: API.failure,
      custom: definitions.handlers,
      onSubmit: definitions.onSubmit,
      onClosed: (options, ...args) => {
        templateInstance.updateLessonCounts()
        if (typeof definitions.onClosed === 'function') {
          return definitions.onClosed(options, ...args)
        }
      }
    })
  }
})
