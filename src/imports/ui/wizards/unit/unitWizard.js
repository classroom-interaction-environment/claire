import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { Lesson } from '../../../contexts/classroom/lessons/Lesson'
import { Unit } from '../../../contexts/curriculum/curriculum/unit/Unit'
import { cursor } from '../../../api/utils/cursor'
import { loadIntoCollection } from '../../../infrastructure/loading/loadIntoCollection'
import { getLocalCollection } from '../../../infrastructure/collection/getLocalCollection'
import { unitCreateSchema } from '../../../contexts/curriculum/curriculum/unit/unitCreateSchema'
import { toOptions } from '../../utils/form/toOptions'
import unitWizardLanguage from './i18n/unitWizardLanguage'
import { Schema } from '../../../api/schema/Schema'
import { SchoolClass } from '../../../contexts/classroom/schoolclass/SchoolClass'
import { FormModal } from '../../components/forms/modal/formModal'
import { LessonStates } from '../../../contexts/classroom/lessons/LessonStates'
import { callMethod } from '../../controllers/document/callMethod'
import {getCollection} from '../../../api/utils/getCollection'
import { firstOption } from '../../../contexts/tasks/definitions/common/helpers'
import '../../components/lesson/status/lessonStatus'
import '../../components/documentState/documentState'
import './unitWizard.html'

const API = Template.unitWizard.setDependencies({
  contexts: [Lesson, Unit, SchoolClass],
  language: unitWizardLanguage
})

const sort = { sort: { updatedAt: -1 } }
const LessonCollection = getLocalCollection(Lesson.name)
const UnitCollection = getLocalCollection(Unit.name)
const SchoolClassCollection = getLocalCollection(SchoolClass.name)
const createUnitSchemaDefinitions = unitCreateSchema({ custom: true }, { withDefault: true })
createUnitSchemaDefinitions.classId = Object.assign({}, SchoolClass.schema.title, {
  autoform: {
    firstOption,
    options: toOptions({ collection: SchoolClassCollection })
  }
})
const createUnitSchema = Schema.create(createUnitSchemaDefinitions)

Template.unitWizard.onCreated(async function () {
  const instance = this

  API.subscribe({
    name: Lesson.publications.my,
    key: 'unitWizardKey',
    callbacks: {
      onError: API.notify
    }
  })

  const unitIds = new Set()
  const classIds = new Set()
  const lessons = {
    idle: new Set(),
    completed: new Set(),
    running: new Set()
  }

  instance.autorun(async () => {
    getCollection(Lesson.name).find({}, { sort: { updatedAt: -1 } }).forEach(lessonDoc => {
      if (LessonStates.isCompleted(lessonDoc)) {
        lessons.completed.add(lessonDoc.unit)
      } else if (LessonStates.isRunning(lessonDoc)) {
        lessons.running.add(lessonDoc.unit)
      } else {
        lessons.idle.add(lessonDoc.unit)
      }

      if (UnitCollection.find(lessonDoc.unit).count() === 0) {
        unitIds.add(lessonDoc.unit)
      }
      if (SchoolClassCollection.find(lessonDoc.classId).count() === 0) {
        classIds.add(lessonDoc.classId)
      }
    })

    if (unitIds.size > 0) {
      await loadIntoCollection({
        name: Unit.methods.my,
        args: {
          ids: [...unitIds.values()]
        },
        failure: API.fatal,
        collection: UnitCollection
      })
    }

    if (classIds.size > 0) {
      await loadIntoCollection({
        name: SchoolClass.methods.my,
        args: {
          ids: [...classIds.values()]
        },
        failure: API.fatal,
        collection: SchoolClassCollection
      })
    }

    const sort = { updatedAt: -1 }
    const idleUnits = UnitCollection.find({
      updatedBy: Meteor.userId(),
      _custom: true,
      _id: { $in: [...lessons.idle] }
    }, { sort }).fetch().map(unitDoc => {
      unitDoc.lesson = {}
      return unitDoc
    })
    const runningUnits = UnitCollection.find({
      updatedBy: Meteor.userId(),
      _custom: true,
      _id: { $in: [...lessons.running] }
    }, { sort }).fetch().map(unitDoc => {
      unitDoc.lesson = { startedAt: true }
      return unitDoc
    })
    const completedUnits = UnitCollection.find({
      updatedBy: Meteor.userId(),
      _custom: true,
      _id: { $in: [...lessons.completed] }
    }, { sort }).fetch().map(unitDoc => {
      unitDoc.lesson = { startedAt: true, completedAt: true }
      return unitDoc
    })

    instance.state.set({
      idleUnits,
      runningUnits,
      completedUnits,
      unitsLoaded: true
    })
  })
})

Template.unitWizard.onDestroyed(function () {
  API.dispose('unitWizardKey')
})

Template.unitWizard.helpers({
  loadComplete () {
    return API.initComplete() && Template.getState('unitsLoaded')
  },
  units () {
    const unitIds = Template.getState('unitIds')
    if (!unitIds || unitIds.length === 0) return

    return cursor(() => UnitCollection.find({
      createdBy: Meteor.userId(),
      _master: { $exists: false },
      _custom: { $exists: false }
    }, sort))
  },
  idleUnits () {
    return Template.getState('idleUnits')
  },
  runningUnits () {
    return Template.getState('runningUnits')
  },
  completedUnits () {
    return Template.getState('completedUnits')
  },
  masterUnits () {
    return cursor(() => UnitCollection.find({
      updatedBy: Meteor.userId(),
      _master: true
    }, sort))
  }
})

Template.unitWizard.events({
  'click .create-unit-btn' (event, templateInstance) {
    event.preventDefault()
    FormModal.show({
      action: 'create',
      schema: createUnitSchema,
      onError: API.failure,
      onSubmit: async ({ doc }) => {
        const { classId, ...unitDoc } = doc
        const unitId = await callMethod({
          name: Unit.methods.insert,
          args: unitDoc
        })

        const res = await callMethod({
          name: Lesson.methods.create,
          args: { classId, unit: unitId }
        })

        return { unitId: res.unitId, lessonId: res.lessonId, classId, originalUnit: unitId }
      },
      onClosed: ({ successful, result, classId }) => {
        if (successful) {
          const lessonIds = [result.lessonId]

          loadIntoCollection({
            name: Lesson.methods.my,
            args: { classId, ids: [result.lessonId] },
            collection: getLocalCollection(Lesson.name),
            failure: API.notify
          })

          loadIntoCollection({
            name: Lesson.methods.units,
            args: { lessonIds },
            collection: getLocalCollection(Unit.name),
            failure: API.notify
          })
        }
      }
    })
  }
})
