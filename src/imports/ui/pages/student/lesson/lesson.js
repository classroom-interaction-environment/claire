import { Template } from 'meteor/templating'

import { Lesson } from '../../../../contexts/classroom/lessons/Lesson'
import { LessonStates } from '../../../../contexts/classroom/lessons/LessonStates'
import { Unit } from '../../../../contexts/curriculum/curriculum/unit/Unit'
import { lessonSubKeyStudent } from './lessonSubKeyStudent'
import { Group } from '../../../../contexts/classroom/group/Group'

import { loadStudentMaterial } from '../../../utils/loadStudentMaterial'
import { getLocalCollection } from '../../../../infrastructure/collection/getLocalCollection'
import { insertUpdate } from '../../../../api/utils/insertUpdate'
import { callMethod } from '../../../controllers/document/callMethod'
import { getCollection } from '../../../../api/utils/getCollection'
import { getMaterialContexts } from '../../../../contexts/material/initMaterial'
import { cursor } from '../../../../api/utils/cursor'
import { formatError } from '../../../../api/errors/both/formatError'

import lessonStudentLanguage from './i18n/lessonStudentLanguage'
import '../../../components/lesson/status/lessonStatus'
import './views/material/lessonMaterial'
import './lesson.html'

/*
 * This is the lesson HOC for students. It has the following purpose:
 *
 * - it loads the lessonDoc (sub)
 * - it loads the corresponding unit docs
 * - It loads necessary material (method),  based on the _ids,
 *    defined in lessonDoc.visibleStudent.
 * - It handles errors during loading in a user-friendly way
 */

const API = Template.lesson.setDependencies({
  contexts: [Lesson, Unit, Group].concat(getMaterialContexts()),
  language: lessonStudentLanguage,
  initMaterial: true
})

const LessonCollection = getCollection(Lesson.name)
const UnitCollection = getLocalCollection(Unit.name)

const byContext = (a, b) => a.context.localeCompare(b.context)
const toMaterial = reference => {
  const cache = getLocalCollection(reference.context)
  reference.document = cache.findOne(reference._id)
  return reference
}

Template.lesson.onCreated(function () {
  const instance = this

  instance.displayError = err => {
    const error = formatError(err)
    console.debug(error)
    instance.state.set({ error })
  }
  // subscribe to the lesson doc, as this changes often

  instance.autorun(() => {
    const data = Template.currentData()
    const lessonId = data.params.lessonId
    if (!lessonId) return

    API.subscribe({
      name: Lesson.publications.single,
      args: { _id: lessonId },
      key: lessonSubKeyStudent,
      callbacks: {
        onError: instance.displayError,
        onReady () {
          const lessonDoc = LessonCollection.findOne(lessonId)

          if (lessonDoc) {
            instance.state.set('visibleStudent', lessonDoc.visibleStudent)
            instance.state.set('lessonDoc', lessonDoc)
          }
        }
      }
    })

    API.subscribe({
      name: Group.publications.my,
      args: { lessonId },
      key: lessonSubKeyStudent,
      callbacks: {
        onError: instance.displayError,
        onReady () {
          console.debug('groups loaded')
        }
      }
    })
  })

  // load current visible material via methods

  instance.autorun(() => {
    const lessonDoc = instance.state.get('lessonDoc')
    const visibleStudent = lessonDoc?.visibleStudent

    // TODO use loadStudentMaterial function
    if (!visibleStudent || visibleStudent.length === 0) {
      instance.state.set('loadingMaterials', false)
      return
    }

    loadStudentMaterial({
      _id: lessonDoc._id,
      visibleStudent,
      prepare: () => instance.state.set('loadingMaterials', true),
      receive: () => instance.state.set('loadingMaterials', false),
      failure: instance.displayError,
      success: (material, hash) => {
        instance.state.set('materialUpdated', hash)
      }
    })
  })

  // get unit doc if not already loaded

  instance.autorun(() => {
    const lessonDoc = instance.state.get('lessonDoc')
    if (!lessonDoc || instance.state.get('unitDoc')) {
      return
    }

    const existingUnitDoc = UnitCollection.findOne(lessonDoc.unit)

    if (existingUnitDoc) {
      instance.state.set('unitDoc', existingUnitDoc)
      return
    }

    callMethod({
      name: Lesson.methods.units,
      args: { lessonIds: [lessonDoc._id] },
      failure: instance.displayError,
      success: unitDocs => {
        unitDocs.forEach(doc => insertUpdate(UnitCollection, doc))
        const unitDoc = UnitCollection.findOne(lessonDoc.unit)
        instance.state.set('unitDoc', unitDoc)
      }
    })
  })
})

Template.lesson.onDestroyed(function () {
  API.dispose(lessonSubKeyStudent)
})

Template.lesson.helpers({
  loadComplete() {
    return API.initComplete()
  },
  error () {
    return Template.getState('error')
  },
  groups (lessonDoc) {
    return cursor(() => getCollection(Group.name).find({ lessonId: lessonDoc._id }))
  },
  docNotFound () {
    return Template.getState('docNotFound')
  },
  isIdle (lessonDoc) {
    return LessonStates.isIdle(lessonDoc)
  },
  isComplete (lessonDoc) {
    return LessonStates.isCompleted(lessonDoc)
  },
  isRunning (lessonDoc) {
    return LessonStates.isRunning(lessonDoc)
  },
  lessonDoc () {
    const instance = Template.instance()
    const lessonDoc = instance.state.get('lessonDoc')
    const unitDoc = instance.state.get('unitDoc')
    const materialUpdated = instance.state.get('materialUpdated')

    if (!lessonDoc || !unitDoc) return

    lessonDoc.materialUpdated = materialUpdated
    lessonDoc.unit = unitDoc

    if (lessonDoc.visibleStudent) {
      // TODO place in helper
      lessonDoc.visibleStudent = lessonDoc.visibleStudent
        .map(toMaterial)
        .sort(byContext)
    }

    return lessonDoc
  },
  loadingMaterials () {
    return Template.getState('loadingMaterials')
  },
  notMaterialActive () {
    const lessonDoc = Template.getState('lessonDoc')
    return !lessonDoc?.visibleStudent?.length
  }
})
