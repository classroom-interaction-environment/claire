import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { Lesson } from '../../../contexts/classroom/lessons/Lesson'
import { SchoolClass } from '../../../contexts/classroom/schoolclass/SchoolClass'
import { LessonViewStates } from './viewStates'
import { MyStudents } from '../../controllers/MyStudents'
import { LessonMaterial } from '../../controllers/LessonMaterial'
import { Users } from '../../../contexts/system/accounts/users/User'
import { TimeUnit } from '../../../contexts/curriculum/curriculum/types/TimeUnit'
import { Group } from '../../../contexts/classroom/group/Group'
import { TaskWorkingState } from '../../../contexts/tasks/results/TaskWorkingState'
import { LessonStates } from '../../../contexts/classroom/lessons/LessonStates'
import { ProfileImages } from '../../../contexts/files/image/ProfileImages'
import { Unit } from '../../../contexts/curriculum/curriculum/unit/Unit'
import { Phase } from '../../../contexts/curriculum/curriculum/phase/Phase'
import { lessonSubKey } from './lessonSubKey'
import { Material } from '../../../contexts/material/Material'

import { dataTarget } from '../../utils/dataTarget'
import { findUnassociatedMaterial } from '../../../api/utils/findUnassociatedMaterial'
import { callMethod } from '../../controllers/document/callMethod'
import { getCollection } from '../../../api/utils/getCollection'
import { getLocalCollection } from '../../../infrastructure/collection/getLocalCollection'
import { loadIntoCollection } from '../../../infrastructure/loading/loadIntoCollection'
import lessonLanguage from './i18n/lessonLanguage'

import '../../components/lesson/status/lessonStatus'
import './views/info/info'
import './views/safeguard/lessonSafeguard'
import './views/material/lessonMaterial'
import './lesson.html'

const _lessonViewStates = Object.values(LessonViewStates)

const API = Template.lesson.setDependencies({
  contexts: [ProfileImages, Unit, Lesson, Phase, SchoolClass, Users],
  language: lessonLanguage
})

const LessonCollection = getCollection(Lesson.name)
const SchoolClassCollection = getCollection(SchoolClass.name)
const UsersCollection = getLocalCollection(Users.name)

Template.lesson.onCreated(function () {
  const onError = err => API.fatal(err)
  const instance = this
  instance.state.set('view', LessonViewStates.material.name)

  // ============================================================================
  // SUBSCRIPTIONS
  //
  // We will subscribe to documents, that often change:
  //
  // - lessonDoc
  // - classDoc
  // - users
  // - profile images
  // - task working states (progress for edited tasks)
  //
  // ============================================================================

  // lessonDoc

  instance.autorun(function () {
    const data = Template.currentData()
    const { lessonId } = data.params
    if (!lessonId) {
      return
    }

    API.subscribe({
      name: Lesson.publications.single,
      args: { _id: lessonId },
      key: lessonSubKey,
      callbacks: {
        onError,
        onReady () {
          const lessonDoc = LessonCollection.findOne(lessonId)
          const { classId } = lessonDoc
          MyStudents.setClass(classId)
          instance.state.set({ lessonDoc })
        }
      }
    })
  })

  // task working state

  instance.autorun(() => {
    const lessonDoc = instance.state.get('lessonDoc')
    if (!lessonDoc) return
    if (LessonStates.isIdle(lessonDoc)) {
      return instance.state.set('taskWorkingStatesSubReady', true)
    }

    const lessonId = lessonDoc._id

    API.subscribe({
      name: TaskWorkingState.publications.byLesson,
      args: { lessonId },
      key: lessonSubKey,
      callbacks: {
        onError,
        onReady () {
          instance.state.set('taskWorkingStatesSubReady', true)
        }
      }
    })
  })


  // classDoc

  instance.autorun(() => {
    const lessonDoc = instance.state.get('lessonDoc')
    if (!lessonDoc) return

    const { classId } = lessonDoc
    API.subscribe({
      name: SchoolClass.publications.single,
      args: { _id: classId },
      key: lessonSubKey,
      callbacks: {
        onError
      }
    })
  })

  // ============================================================================
  // METHOD CALLS
  //
  // For "static" documents, that won't change, we will use a Meteor method to
  // load them:
  //
  // - unitDoc
  // - phases
  // - material
  //
  // ============================================================================


  // users

  instance.autorun(() => {
    const lessonDoc = instance.state.get('lessonDoc')
    const classId = lessonDoc?.classId
    const classDoc = classId && SchoolClassCollection.findOne(classId)

    if (!classDoc) return

    loadIntoCollection({
      name: Users.methods.byClass,
      args: { classId },
      collection: UsersCollection,
      failure: API.notify,
      success: () => instance.state.set('usersReady', true)
    })
  })

  // profile images

  instance.autorun(() => {
    const lessonDoc = instance.state.get('lessonDoc')
    if (!lessonDoc) return

    loadIntoCollection({
      name: ProfileImages.methods.byClass,
      args: { classId: lessonDoc.classId },
      collection: getLocalCollection(ProfileImages.name),
      failure: API.notify,
      success: () => instance.state.set('profileImagesReady', true)
    })
  })

  // the material is only loaded ONCE, when the unitDoc is available
  // otherwise we would load the material on every update the lessonDoc rceives
  instance.autorun(computation => {
    const lessonDoc = instance.state.get('lessonDoc')
    if (!lessonDoc?.unit) return

    const unitId = lessonDoc.unit

    callMethod({
      name: Unit.methods.get,
      args: { _id: unitId },
      failure: onError,
      success: unitDoc => {
        instance.state.set({ unitDoc })
        loadTeacherMaterial(unitDoc, instance)
        computation.stop()
      }
    })
  })

  instance.autorun(function () {
    const data = Template.currentData()
    const { lessonId } = data.params
    if (!lessonId) {
      return
    }

    API.subscribe({
      name: Group.publications.my,
      args: { lessonId },
      key: lessonSubKey,
      callbacks: {
        onError: API.fatal,
        onReady: () => instance.state.set({ groupSubscriptionComplete: true })
      }
    })
  })
})

Template.lesson.helpers({
  viewStates () {
    return _lessonViewStates
  },
  active (viewName) {
    return Template.getState('view') === viewName
  },
  loadComplete () {
    if (!API.initComplete()) {
      return false
    }

    const instance = Template.instance()
    return instance.state.get('lessonDoc') &&
      instance.state.get('usersReady') &&
      instance.state.get('taskWorkingStatesSubReady') &&
      instance.state.get('unitDoc')
  },
  unit () {
    return Template.getState('unitDoc')
  },
  classDoc () {
    const lessonDoc = Template.getState('lessonDoc')
    return lessonDoc && SchoolClassCollection.findOne(lessonDoc.classId)
  },
  lessonDoc () {
    return Template.getState('lessonDoc')
  },
  timeUnit (num) {
    return TimeUnit.resolve(num)
  },
  completed () {
    const doc = Template.getState('lessonDoc')
    return doc && doc.completed
  },
  lessonUploads () {
    // return LessonUploadsCollection.find()
  },
  lesson () {
    return Template.getState('lessonDoc')
  },
  currenTemplate () {
    const view = Template.getState('view')
    return view && LessonViewStates[view] && LessonViewStates[view].template
  },
  currentData () {
    const instance = Template.instance()
    const lessonDoc = instance.state.get('lessonDoc')
    const classDoc = lessonDoc && SchoolClassCollection.findOne(lessonDoc.classId)
    const unitDoc = instance.state.get('unitDoc')
    const unassociatedMaterial = instance.state.get('unassociatedMaterial')
    return { lessonDoc, classDoc, unitDoc, unassociatedMaterial }
  },
  inviteOptions () {
    const lessonDoc = Template.getState('lessonDoc')
    const toggleInvite = Template.getState('invitationModalVisible')

    if (!toggleInvite || !lessonDoc) {
      return
    }
    const { classId } = lessonDoc
    const institution = Meteor.user().institution
    return { classId, institution }
  },
  invitationModalVisible () {
    return Template.instance().state.get('invitationModalVisible')
  }
})

Template.lesson.events({
  'click .lesson-main-tab' (event, templateInstance) {
    event.preventDefault()
    const target = dataTarget(event, templateInstance)
    templateInstance.state.set('view', target)
  },
  'click .show-invitations-button' (event, templateInstance) {
    event.preventDefault()
    import('../../components/inviteStudents/inviteStudents')
      .then(() => {
        templateInstance.state.set('invitationModalVisible', true)
        templateInstance.$('#inviteToClassModal').modal('show')
      })
      .catch(e => API.notify(e))
  },
  'hidden.bs.modal #inviteToClassModal' (event, templateInstance) {
    templateInstance.state.set('invitationModalVisible', false)
  }
})

function loadTeacherMaterial (unitDoc, templateInstance) {
  if (!unitDoc) {
    return templateInstance.state.set('docNotFound', true)
  }

  LessonMaterial.load(unitDoc, (err, material) => {
    API.debug('material loaded', err, material)

    // update the phases on the unit document
    if (unitDoc.phases && unitDoc.phases.length > 0) {
      unitDoc.phases = unitDoc.phases
        .map(phaseId => {
          const materialDocs = Material.getDocuments(Phase.name, phaseId)
          const phaseDoc = materialDocs[0]
          if (!phaseDoc) {
            console.warn('expected phase doc by phaseId', phaseId, 'got', phaseDoc)
          }
          return phaseDoc
        })
        // there is sometimes the case that the value above results in a null value
        // which completely crashes the further processing chain
        .filter(phase => !!phase)
    }

    const unassociatedMaterial = findUnassociatedMaterial(unitDoc)
    templateInstance.state.set({ unassociatedMaterial, unitDoc })
  })
}
