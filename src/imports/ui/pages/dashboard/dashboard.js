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
import { asyncTimeout } from '../../../api/utils/asyncTimeout'
import { loadLessonsForClass } from './common/loadLessonsForClass'
import { FormModal } from '../../components/forms/modal/formModal'
import { Unit } from '../../../contexts/curriculum/curriculum/unit/Unit'
import { Pocket } from '../../../contexts/curriculum/curriculum/pocket/Pocket'
import { Dimension } from '../../../contexts/curriculum/curriculum/dimension/Dimension'
import { LessonStates } from '../../../contexts/classroom/lessons/LessonStates'
import { ProfileImages } from '../../../contexts/files/image/ProfileImages'
import dashboardLanguage from './i18n/dashboardLang'
import '../../renderer/lesson/list/lessonListRenderer'
import './dashboard.html'
import { callMethod } from '../../controllers/document/callMethod'

const API = Template.dashboard.setDependencies({
  contexts: [SchoolClass, Lesson, Users, Pocket, ProfileImages, Dimension],
  language: dashboardLanguage
})

const formActions = createDashboardFormActions({ onError: API.notify, translate: API.translate })
const toDocId = doc => doc._id
Template.dashboard.onCreated(function () {
  const instance = this
  instance.state.set({
    selectedClass: null,
    showStudents: null,
    deleting: null,
    lessonsLoaded: {},
    lessonCounts: {}
  })

  const SchoolClassCollection = getLocalCollection(SchoolClass.name)

  // step 1: load my classes
  instance.autorun(async () => {
    const ids = instance.state.get('schoolClassUpdated')
    const args = {}
    if (ids) args.ids = ids

    await loadIntoCollection({
      name: SchoolClass.methods.my,
      args: args,
      failure: API.notify,
      collection: SchoolClassCollection
    })

    instance.state.set('schoolClassesComplete', true)

    const classIds = ids || SchoolClassCollection.find().map(toDocId)
    const lessonCounts = await callMethod({
      name: Lesson.methods.counts,
      args: { classIds },
      failure: API.notify
    })

    instance.state.set({ lessonCounts })
  })

  // step 2: load all dimensions
  loadIntoCollection({
    name: Dimension.methods.all,
    failure: API.notify,
    collection: getLocalCollection(Dimension.name)
  })
})
const byTitle = (a, b) => a.title.localeCompare(b.title)



Template.dashboard.helpers({
  classes () {
    const selector = { createdBy: Meteor.userId() }
    const options = { sort: byTitle }
    return getLocalCollection(SchoolClass.name).find(selector, options)
  },
  lessonsLoaded (classId) {
    return Template.getState('lessonsLoaded')[classId]
  },
  lessons (classId) {
    const selector = { createdBy: Meteor.userId(), classId }
    const options = { sort: { startedAt: -1, updatedAt: -1 } }
    const query = () => getLocalCollection(Lesson.name).find(selector, options)
    return cursor(query)
  },
  lessonCount (classId) {
    const selector = { createdBy: Meteor.userId(), classId }
    const count = getLocalCollection(Lesson.name).find(selector).count()
    if (count) {
      return count
    }

    const fixedCount = Template.getState('lessonCounts')[classId]
    if (fixedCount) {
      return fixedCount
    }

    return 0
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
  getLocalCollection(SchoolClass.name).remove({})
  getLocalCollection(Lesson.name).remove({})
  getLocalCollection(Unit.name).remove({})
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

    const classId = dataTarget(event, templateInstance)
    const classDoc = getLocalCollection(SchoolClass.name).findOne(classId)

    const UsersCollection = getLocalCollection(Users.name)
    const students = classDoc?.students || []
    const args = { classId }

    const skip = students.filter(studentId => UsersCollection.find(studentId).count())
    if (skip.length > 0) {
      args.skip = skip
    }

    await import('../../renderer/user/list/userListRenderer')

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
    const showStudents = { title }
    const sort = { 'presence.status': -1, lastName: 1 }

    showStudents.students = students && UsersCollection.find(
      { _id: { $in: students } },
      { sort }).fetch()
    showStudents.teachers = teachers && UsersCollection.find(
      { _id: { $in: teachers } },
      { sort }).fetch()

    // show modal already here
    templateInstance.state.set({ showStudents })

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

    // only load lessons for a class once
    if (templateInstance.state.get('lessonsLoaded')[classId]) {
      return
    }

    await loadLessonsForClass({ classId, onError: API.notify })

    const lessonsLoaded = templateInstance.state.get('lessonsLoaded')
    lessonsLoaded[classId] = true

    await asyncTimeout(300)
    templateInstance.state.set({ lessonsLoaded })
    return true
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
      : _id && getLocalCollection(target).findOne(_id)
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
      onClosed: definitions.onClosed
    })
  }
})
