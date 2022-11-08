/* global AutoForm */
import { ErrorTypes, Schema } from '../../../../api/schema/Schema'
import { SchoolClass } from '../../../../contexts/classroom/schoolclass/SchoolClass'
import { Lesson } from '../../../../contexts/classroom/lessons/Lesson'
import { Unit } from '../../../../contexts/curriculum/curriculum/unit/Unit'
import { Pocket } from '../../../../contexts/curriculum/curriculum/pocket/Pocket'
import { getLocalCollection } from '../../../../infrastructure/collection/getLocalCollection'
import { callMethod } from '../../../controllers/document/callMethod'
import { loadIntoCollection } from '../../../../infrastructure/loading/loadIntoCollection'
import { loadLessonsForClass } from '../common/loadLessonsForClass'
import { loadSelectableUnits } from '../../../../contexts/curriculum/loadSelectableUnits'
import { getCollection } from '../../../../api/utils/getCollection'

export const createDashboardFormActions = ({ onError, translate }) => {
  const formActions = {}

  // =====================================================================
  // SCHOOL CLASS
  // =====================================================================

  formActions[SchoolClass.name] = {}

  // Create schema is reused

  const createClassSchema = Schema.create({
    title: Object.assign({}, SchoolClass.schema.title, {
      custom () {
        if (!this.isSet) {
          return ErrorTypes.REQUIRED
        }
        else if (getCollection(SchoolClass.name).findOne({ title: this.value })) {
          return ErrorTypes.VALUE_EXISTS
        }
      }
    }),
    timeFrame: SchoolClass.schema.timeFrame,
    'timeFrame.from': SchoolClass.schema['timeFrame.from'],
    'timeFrame.to': SchoolClass.schema['timeFrame.to']
  })

  // CREATE
  // creates a new school class
  // there are three possible handlers
  // - create and create custom unit
  // - create and select master unit
  // - create and close

  const onCreateClassSubmit = async ({ doc }) => {
    const name = SchoolClass.methods.create
    const args = { title: doc.title }
    if (doc.timeFrame) {
      args.timeFrame = doc.timeFrame
    }
    const options = { name, args }
    const result = await callMethod(options)
    return [result]
  }

  formActions[SchoolClass.name].create = {
    action: 'create',
    schema: createClassSchema,
    handlers: {
      createCustom: {
        label: 'dashboard.createCustom',
        type: 'success',
        onSubmit: onCreateClassSubmit,
        onClosed: ({ successful, result, templateInstance }) => {
          if (successful) {
            templateInstance.state.set({ schoolClassUpdated: result })
            return {
              next: formActions[Unit.name].custom,
              bind: { classId: result[0] }
            }
          }
        }
      },
      useMaster: {
        label: 'dashboard.useMaster',
        type: 'secondary',
        onSubmit: onCreateClassSubmit,
        onClosed: ({ successful, result, templateInstance }) => {
          debugger
          if (successful) {
            templateInstance.state.set({ schoolClassUpdated: result })
            return {
              next: formActions[Unit.name].master,
              bind: { classId: result[0] }
            }
          }
        }
      },
      create: {
        label: 'dashboard.createOnlyClass',
        type: 'primary',
        onSubmit: onCreateClassSubmit,
        onClosed: ({ successful, result, templateInstance }) => {
          if (successful) {
            templateInstance.state.set({ schoolClassUpdated: result })
          }
        }
      }
    }
  }

  // UPDATE
  // edit a school class title

  formActions[SchoolClass.name].update = {
    action: 'update',
    schema: createClassSchema,
    doc ({ _id }) {
      return getCollection(SchoolClass.name).findOne(_id)
    },
    onSubmit: async prams => {
      const { _id, doc } = prams
      const name = SchoolClass.methods.update
      const args = { _id, title: doc.$set.title }
      const options = { name, args }
      const updated = await callMethod(options)
      return updated ? [_id] : []
    }
  }

  // REMOVE
  // LIST ALL LESSON NAMES

  formActions[SchoolClass.name].remove = {
    action: 'remove',
    schema: Schema.create({
      title: SchoolClass.schema.title,
      lessons: {
        type: Array,
        label: () => translate('lessons.title'),
        autoform: {
          type: 'docList',
          renderer: {
            template: 'lessonListRenderer',
            data: doc => {
              return {
                lesson: doc,
                showIcon: true,
                showStatus: false,
                showPocket: true,
                showTime: true
              }
            }
          }
        }
      },
      'lessons.$': String
    }),
    load: async ({ classId, onError }) => {
      await import('../../../forms/doclist/docList')
      await loadLessonsForClass({ classId, onError })
    },
    doc: ({ classId }) => {
      const classDoc = getCollection(SchoolClass.name).findOne(classId)
      const lessons = getCollection(Lesson.name)
        .find({ classId }, { sort: { startedAt: -1, updatedAt: -1 } })
        .fetch()

      return {
        title: classDoc.title,
        lessons
      }
    },
    validate: false,
    onSubmit: async ({ _id }) => {
      const name = SchoolClass.methods.remove
      const args = { _id }
      const options = { name, args }
      const removed = await callMethod(options)
      if (removed) {
        return _id
      }
    }
  }

  // =====================================================================
  // LESSONS
  // =====================================================================

  formActions[Unit.name] = {}

  formActions[Unit.name].remove = {
    action: 'remove',
    schema: Schema.create({
      class: {
        type: String,
        label: () => translate('schoolClass.title')
      },
      title: Unit.schema.title,
      period: Unit.schema.period,
      pocket: {
        type: String,
        label: () => translate('pocket.title')
      }
    }),
    doc: ({ lessonId, classId }) => {
      const lessonDoc = getCollection(Lesson.name).findOne(lessonId)
      const unitDoc = getLocalCollection(Unit.name).findOne(lessonDoc.unit)
      const classDoc = getCollection(SchoolClass.name).findOne(classId)
      const pocketDoc = getLocalCollection(Pocket.name).findOne(unitDoc.pocket)
      return {
        class: classDoc.title,
        title: unitDoc.title,
        period: unitDoc.period,
        pocket: pocketDoc ? pocketDoc.title : translate('unit.custom')
      }
    },
    validate: false,
    onSubmit: async ({ lessonId }) => {
      const name = Lesson.methods.remove
      const args = { _id: lessonId }
      const options = { name, args }
      const removed = await callMethod(options)
      if (removed) {
        return lessonId
      }
    }
  }

  /**
   * Common handler when creating a new unit.
   * @param onSubmitDoc
   * @returns {Promise<{classId: *, unitId: unknown, lessonId: unknown}>}
   */
  const createUnit = async (onSubmitDoc) => {
    const classId = onSubmitDoc.classId
    let unitId = onSubmitDoc.doc.unitId

    // if we create a custom unit there is no unitId yet
    // so we create a new _custom unit that will be blueprint for our lesson
    if (!unitId) {
      unitId = await callMethod({
        name: Unit.methods.insert,
        args: onSubmitDoc.doc
      })
    }

    const res = await callMethod({
      name: Lesson.methods.create,
      args: { classId, unit: unitId }
    })
    // we need to make sure we route into the correct unit so the unitId should
    // always be the one returned by lesson.methods.create, because this is
    // the one the lesson is actually linked to, while the orginal unitId might
    // not be the case
    return { unitId: res.unitId, lessonId: res.lessonId, classId, originalUnit: unitId }
  }

  const unitHandlers = {
    editInUnitEditor: {
      type: 'primary',
      label: 'actions.editInUnitEditor',
      onSubmit: createUnit,
      onClosed: ({ successful, result, templateInstance }) => {
        if (successful) {
          const { unitId } = result
          templateInstance.data.unitEditor({ unitId })
        }
      }
    },
    createNoEdit: {
      type: 'secondary',
      label: 'actions.createNoEdit',
      onSubmit: createUnit,
      onClosed: ({ successful, result, classId }) => {
        if (successful) {
          const lessonIds = [result.lessonId]

          loadIntoCollection({
            name: Lesson.methods.units,
            args: { lessonIds },
            collection: getLocalCollection(Unit.name),
            failure: onError
          })
        }
      }
    }
  }

  /**
   * Creates a custom unit (+lesson) for a given class
   * @type {{schema, handlers: {editInUnitEditor: {}, createNoEdit: {}}, action: string}}
   */
  formActions[Unit.name].custom = {
    action: 'create',
    schema: Schema.create({
      _custom: {
        type: Boolean,
        defaultValue: true,
        autoform: { type: 'hidden' }
      },
      title: Unit.schema.title,
      pocket: {
        type: String,
        defaultValue: '__custom__',
        autoform: { type: 'hidden' }
      },
      period: Unit.schema.period,
      index: {
        type: Number,
        defaultValue () {
          const pocket = AutoForm.getFieldValue('pocket')
          if (!pocket) return
          const count = getLocalCollection(Unit.name).find({ pocket }).count()
          return count + 1
        },
        autoform: {
          type: 'hidden'
        }
      }
    }),
    handlers: {
      editInUnitEditor: { ...unitHandlers.editInUnitEditor },
      createNoEdit: { ...unitHandlers.createNoEdit, ...{ label: 'actions.saveOnly' } }
    }
  }

  formActions[Unit.name].master = {
    action: 'create',
    load: async () => {
      await import('../../../forms/unit/unitSelect')
      await loadSelectableUnits({ onError })
    },
    schema: (params) => {
      const { classId } = params
      return Schema.create({
        unitId: {
          type: String,
          label: () => translate('unit.title'),
          autoform: {
            type: 'unitSelect',
            label: false,
            classId: classId
          }
        }
      })
    },
    xl: true,
    handlers: {
      editInUnitEditor: { ...unitHandlers.editInUnitEditor },
      createNoEdit: { ...unitHandlers.createNoEdit }
    }
  }

  return formActions
}
