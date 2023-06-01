import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { SchoolClass } from '../../../../../contexts/classroom/schoolclass/SchoolClass'
import { Lesson } from '../../../../../contexts/classroom/lessons/Lesson'
import { Users } from '../../../../../contexts/system/accounts/users/User'
import { LessonStates } from '../../../../../contexts/classroom/lessons/LessonStates'
import { Unit } from '../../../../../contexts/curriculum/curriculum/unit/Unit'
import { Pocket } from '../../../../../contexts/curriculum/curriculum/pocket/Pocket'
import { ProfileImages } from '../../../../../contexts/files/image/ProfileImages'
import { cursor } from '../../../../../api/utils/cursor'
import { getLocalCollection } from '../../../../../infrastructure/collection/getLocalCollection'
import { removeContextDoc } from '../../../../controllers/document/removeContextDoc'
import { dataTarget } from '../../../../utils/dataTarget'
import { confirmDialog } from '../../../../components/confirm/confirm'
import { loadIntoCollection } from '../../../../../infrastructure/loading/loadIntoCollection'

import '../../../../renderer/user/list/userListRenderer'
import '../../../../components/lesson/status/lessonStatus'
import '../../../../components/inviteStudents/inviteStudents'
import '../../../../renderer/lesson/list/lessonListRenderer'
import './classes.html'

const API = Template.myClasses.setDependencies({
  contexts: [SchoolClass, Lesson, Unit, Pocket, ProfileImages, Users]
})

const UsersCollection = getLocalCollection(Users.name)
const SchoolClassCollection = getLocalCollection(SchoolClass.name)
const LessonCollection = getLocalCollection(Lesson.name)
const UnitCollection = getLocalCollection(Unit.name)

Template.myClasses.onCreated(function () {
  const instance = this
  instance.state.set('selectedClasses', {})
  instance.state.set('showStudents', null)
  instance.state.set('deleting', null)

  instance.autorun(() => {
    const showStudentsClassId = instance.state.get('showStudentsClassId')
    if (!showStudentsClassId) {
      instance.state.set('usersReady', true)
      return
    }

    loadIntoCollection({
      name: Users.methods.byClass,
      args: { classId: showStudentsClassId },
      collection: getLocalCollection(Users.name),
      failure: API.notify,
      success: () => instance.state.set('usersReady', true)
    })
  })

  instance.autorun(() => {
    const showStudentsClassId = instance.state.get('showStudentsClassId')
    if (!showStudentsClassId) {
      instance.state.set('profileImagesReady', true)
      return
    }

    loadIntoCollection({
      name: ProfileImages.methods.byClass,
      args: { classId: showStudentsClassId },
      collection: getLocalCollection(ProfileImages.name),
      failure: API.notify,
      success: () => {
        const classDoc = SchoolClassCollection.findOne(showStudentsClassId)
        if (!classDoc) {
          instance.state.set('profileImagesReady', true)
        }

        // we create a light version of the class doc to pass
        // it to the user renderer in the modal
        const { students, teachers, title } = classDoc
        const showStudents = { title }
        const sort = {
          'presence.status': -1,
          lastName: 1
        }

        showStudents.students = students && UsersCollection.find({ _id: { $in: students } }, { sort }).fetch()
        showStudents.teachers = teachers && UsersCollection.find({ _id: { $in: teachers } }, { sort }).fetch()

        instance.state.set({ showStudents })
        instance.state.set('profileImagesReady', true)
      }
    })
  })
})

Template.myClasses.helpers({
  loadComplete () {
    const instance = Template.instance()
    return instance.state.get('usersReady') && instance.state.get('profileImagesReady')
  },
  classes () {
    return cursor(() => SchoolClassCollection.find({ createdBy: Meteor.userId() }, { sort: { updatedAt: -1 } }))
  },
  lessons (classId) {
    const projection = {
      sort: {
        updatedAt: -1,
        startedAt: -1,
        completedAt: -1
      }
    }
    return LessonCollection.find({ classId }, projection)
    // TODO check if this is still needed
    // .map(lessonDoc => {
    // lessonDoc.unitOriginal = UnitCollection.findOne(lessonDoc.unitOriginal)
    // lessonDoc.unit = UnitCollection.findOne(lessonDoc.unit) || lessonDoc.unit
    // lessonDoc.unit.pocket = PocketCollection.findOne(lessonDoc.unit.pocket)
    // return lessonDoc
    // })
  },
  lessonIsNotIdle (lessonDoc) {
    return !LessonStates.isIdle(lessonDoc)
  },
  lessonIsRunning (lessonDoc) {
    return LessonStates.isRunning(lessonDoc)
  },
  classUsers (classDoc) {
    if (!classDoc) return 0

    const students = (classDoc.students && classDoc.students.length) || 0
    const teachers = (classDoc.teachers && classDoc.teachers.length) || 0
    return students + teachers
  },
  lessonsForClass (classId) {
    return LessonCollection.find({ classId })
  },
  selectedClass (_id) {
    return Template.getState('selectedClasses')[_id]
  },
  showStudentsDoc () {
    return Template.getState('showStudents')
  },
  inviteOptions () {
    const classId = Template.getState('inviteClass')
    if (classId) {
      const institution = Meteor.user().institution
      return {
        classId,
        institution
      }
    }
  },
  deleting (lessonId) {
    return Template.getState('deleting') === lessonId
  },
  getUsers (usersList) {
    return usersList && usersList.map(userId => UnitCollection.findOne(userId))
  }
})

Template.myClasses.events({
  'click .toggle-students-button' (event, templateInstance) {
    event.preventDefault()
    const classId = dataTarget(event, templateInstance)
    templateInstance.state.set('showStudentsClassId', classId)
    API.showModal('showStudentsModal')
  },
  'click .select-class-button' (event, templateInstance) {
    event.preventDefault()
    const classId = dataTarget(event, templateInstance)
    const selectedClasses = templateInstance.state.get('selectedClasses')
    selectedClasses[classId] = true
    templateInstance.state.set('selectedClasses', selectedClasses)
  },
  'click .delete-schoolclass-button': async (event, templateInstance) => {
    event.preventDefault()
    const result = await confirmDialog({
      text: 'schoolClass.confirmRemove',
      codeRequired: true,
      type: 'danger'
    })

    if (!result) { return }

    const _id = dataTarget(event, templateInstance)

    removeContextDoc({
      context: SchoolClass,
      _id: _id,
      prepare: templateInstance.state.set('deleting', _id),
      receive: templateInstance.state.set('deleting', false),
      failure: API.notify,
      success: () => API.notify(true)
    })
  },
  'click .delete-lesson-button': async (event, templateInstance) => {
    event.preventDefault()
    const result = await confirmDialog({
      text: 'lesson.confirmRemove',
      codeRequired: true,
      type: 'danger'
    })

    if (!result) return

    const _id = dataTarget(event, templateInstance)

    removeContextDoc({
      context: Lesson,
      _id: _id,
      prepare: templateInstance.state.set('deleting', _id),
      receive: templateInstance.state.set('deleting', false),
      failure: API.notify,
      success: () => API.notify(true)
    })
  },
  'click .back-to-list-button' (event, templateInstance) {
    event.preventDefault()
    const classId = dataTarget(event, templateInstance)
    const selectedClasses = templateInstance.state.get('selectedClasses')
    selectedClasses[classId] = false
    templateInstance.state.set('selectedClasses', selectedClasses)
  },
  'click .invite-to-class-button' (event, tempalteInstance) {
    event.preventDefault()
    const classId = dataTarget(event, tempalteInstance)
    tempalteInstance.state.set('inviteClass', classId)
    API.showModal('inviteToClassModal')
  }
})
