import { Tracker } from 'meteor/tracker'
import { Template } from 'meteor/templating'

import { Curriculum } from '../../../../../contexts/curriculum/Curriculum'
import { Schema } from '../../../../../api/schema/Schema'
import { Phase } from '../../../../../contexts/curriculum/curriculum/phase/Phase'
import { Unit } from '../../../../../contexts/curriculum/curriculum/unit/Unit'
import { SocialStateType } from '../../../../../contexts/curriculum/curriculum/types/SocialStateType'
import { i18n } from '../../../../../api/language/language'
import { LessonMaterial } from '../../../../controllers/LessonMaterial'
import { unitEditorSubscriptionKey } from '../../unitEditorSubscriptionKey'

import { formIsValid, formReset } from '../../../../components/forms/formUtils'
import { dataTarget } from '../../../../utils/dataTarget'
import { resolveMaterialReference } from '../../../../../contexts/material/resolveMaterialReference'
import { confirmDialog } from '../../../../components/confirm/confirm'
import { toUpdateDoc } from '../../../../utils/toUpdateDoc'
import { updateContextDoc } from '../../../../controllers/document/updateContextDoc'
import { insertContextDoc } from '../../../../controllers/document/insertContextDoc'
import { removeContextDoc } from '../../../../controllers/document/removeContextDoc'
import { $in } from '../../../../../api/utils/query/inSelector'
import { getCollection } from '../../../../../api/utils/getCollection'
import { getMaterialContexts } from '../../../../../contexts/material/initMaterial'
import { isCurriculumDoc } from '../../../../../api/decorators/methods/isCurriculumDoc'
import { phaseBaseSchema } from './phaseBaseSchema'
import Sortable from 'sortablejs'
import '../../../../generic/info/info'
import '../phaserenderer/phaseRenderer'
import './phases.css'
import './phases.html'

const defaultSchema = Curriculum.getDefaultSchema()
const API = Template.uephases.setDependencies({
  contexts: [...(new Set([Phase, Unit].concat(getMaterialContexts()))).values()]
})

const hiddenUnitSchema = (unitDoc) => ({
  type: String,
  regEx: Schema.provider.RegEx.Id,
  defaultValue: unitDoc._id,
  autoform: {
    type: 'hidden'
  }
})
const editSchema = {}

let createPhaseSchema
let createSchema

Template.uephases.onCreated(function onPhasesCreated () {
  const instance = this

  instance.autorun(() => {
    instance.state.set('loadComplete', false)
    const data = Template.currentData()
    const { unitDoc } = data

    createSchema = Object.assign({}, defaultSchema, phaseBaseSchema, {
      isGlobal: {
        type: Boolean,
        label: i18n.get('editor.unit.phases.isGlobal')
      },
      unit: hiddenUnitSchema(unitDoc)
    })

    delete createSchema.description
    createPhaseSchema = Schema.create(createSchema, { tracker: Tracker })

    const phasesList = unitDoc.phases || []
    if (phasesList) {
      let overallTime = 0
      phasesList.forEach(phaseId => {
        const phaseDoc = getCollection(Phase.name).findOne(phaseId)
        if (!phaseDoc) return
        overallTime += phaseDoc.period
      })

      instance.state.set('overallTime', {
        value: overallTime,
        danger: overallTime !== unitDoc.period
      })
      instance.state.set('loadComplete', true)
    }

    API.subscribe({
      key: unitEditorSubscriptionKey,
      name: Phase.publications.editor.name,
      args: { _id: $in(phasesList) },
      callbacks: {
        onReady () {
          instance.state.set('phaseSubComplete', true)
        },
        onError (e) {
          API.fatal(e)
        }
      }
    })

    instance.state.set('addPhase', false)
    instance.state.set('unitDoc', unitDoc)
  })

  instance.autorun(computation => {
    const unitDoc = instance.state.get('unitDoc')
    const { originalUnitDoc } = Template.currentData()
    const originalRequired = !!(unitDoc?._original)
    const originalProvided = originalRequired ? !!originalUnitDoc : true

    if (!unitDoc || !originalProvided) {
      return
    }

    LessonMaterial.load(unitDoc, result => {
      instance.state.set('materialLoadComplete', true)
    })

    if (originalUnitDoc) {
      LessonMaterial.load(originalUnitDoc, result => {
        API.debug(result)
      })
    }
  })
})

Template.uephases.onRendered(function onTemplateRendered () {
  const instance = this

  instance.autorun(() => {
    const complete = API.initComplete() &&
      instance.state.get('loadComplete') &&
      instance.state.get('phaseSubComplete') &&
      instance.state.get('materialLoadComplete')

    if (!complete || instance._sortableCreated) {
      return
    }

    setTimeout(() => {
      const tbody = document.querySelector('.uephase-table-body')
      Sortable.create(tbody, {
        handle: '.uephase-table-body-handle',
        ghostClass: 'bg-primary',
        animation: 150,
        swapThreshold: 1,
        onEnd: function (event) {
          const currentTarget = instance.$(event.item).data('target')
          const indices = []
          instance.$('.uephase-table-row').each(function (/* index, element */) {
            indices.push(instance.$(this).data('target'))
          })

          const unitDoc = instance.state.get('unitDoc')

          updateContextDoc({
            context: Unit,
            _id: unitDoc._id,
            doc: { phases: indices },
            prepare: () => instance.state.set('dragUpdate', currentTarget),
            receive: () => instance.state.set('dragUpdate', null),
            failure: er => API.notify(er),
            success: () => API.notify('editor.unit.unitUpdated')
          })
        }
      })
    }, 1000) // we use the timeout to give sortable enough time for proper init

    instance._sortableCreated = true
  })
})

Template.uephases.helpers({
  overallTime () {
    return Template.getState('overallTime')
  },
  phaseDoc (phaseId) {
    const doc = getCollection(Phase.name).findOne(phaseId)
    if (doc) {
      return doc
    }
    return { _id: phaseId }
  },
  phaseSchema () {
    return phaseBaseSchema
  },
  loadComplete () {
    return API.initComplete() && Template.getState('loadComplete') && Template.getState('phaseSubComplete') && Template.getState('materialLoadComplete')
  },
  unitDoc () {
    return Template.getState('unitDoc')
  },
  createPhaseSchema () {
    return createPhaseSchema
  },
  createPhaseSchemaDoc () {
    const unitDoc = Template.getState('unitDoc')
    return unitDoc && { unit: unitDoc._id }
  },
  addPhase () {
    return Template.getState('addPhase')
  },
  formType () {
    return Template.getState('submitting') ? 'disabled' : 'normal'
  },
  submitting () {
    return Template.getState('submitting')
  },
  isSelected (phaseId) {
    return Template.getState('selectedPhase') === phaseId
  },
  editDoc () {
    const editPhase = Template.getState('editPhase')
    if (!editPhase) return
    return getCollection(Phase.name).findOne(editPhase.phaseId)
  },
  editSchema (fieldName) {
    return editSchema[fieldName]
  },
  editPhase () {
    return Template.getState('editPhase')
  },
  socialState (value) {
    return SocialStateType.entry(value)
  },
  reference (refObj) {
    return resolveMaterialReference(refObj)
  },
  globalPhases () {
    const cursor = getCollection(Phase.name).find({ unit: { $exists: false } })

    if (cursor.count() > 0) {
      return cursor
    }
    else {
      return null
    }
  },
  hasUnit (unitId) {
    return !!unitId
  },
  editGlobal (phaseId) {
    return Template.getState('editGlobal')
  },
  dragUpdate (id) {
    return id && Template.getState('dragUpdate') === id
  },
  removing (index) {
    return Template.getState('removing') === index
  }
})

Template.uephases.events({
  'mouseover/mousedown/tap .uephase-table-row' (event, templateInstance) {
    const phaseId = dataTarget(event, templateInstance)
    templateInstance.state.set('selectedPhase', phaseId)
  },
  'mouseout/blur .uephase-table-row' (event, templateInstance) {
    const phaseId = dataTarget(event, templateInstance)
    const selectedPhase = templateInstance.state.get('selectedPhase')
    if (selectedPhase !== phaseId) return
    templateInstance.state.set('selectedPhase', null)
  },
  'click .uephases-select-button' (event, templateInstance) {
    event.preventDefault()
    templateInstance.$('#uniteditor-phases-select-modal').modal('show')
  },
  'click .phase-edit-link' (event, templateInstance) {
    event.preventDefault()
    const phaseId = dataTarget(event, templateInstance)
    const fieldName = dataTarget(event, templateInstance, 'field')
    const unitDoc = templateInstance.state.get('unitDoc')

    if (!phaseId || !fieldName || !unitDoc) {
      throw new Error('expected phaseId, fieldName and unitDoc')
    }

    // prepare schema
    if (!editSchema[fieldName]) {
      const fieldSchema = { unit: hiddenUnitSchema(unitDoc) }
      Object.keys(Phase.schema).forEach(key => {
        if (key.includes(fieldName)) {
          fieldSchema[key] = Phase.schema[key]
        }
      })
      editSchema[fieldName] = Schema.create(fieldSchema, { tracker: Tracker })
    }

    templateInstance.state.set('selectedPhase', phaseId)
    templateInstance.state.set('editPhase', { phaseId, fieldName })
    templateInstance.$('#uniteditor-phases-edit-modal').modal('show')
  },
  'click .uephases-remove-phase-button': async function (event, templateInstance) {
    event.preventDefault()
    const $target = templateInstance.$(event.currentTarget)
    const index = parseInt($target.data('index'), 10)
    const phaseId = $target.data('target')
    const phaseDoc = phaseId && getCollection(Phase.name).findOne(phaseId)
    const textOptions = { title: phaseDoc?.title }

    const confirmed = await confirmDialog({
      text: 'editor.unit.phases.confirmRemove',
      textOptions,
      codeRequired: false
    })
    if (!confirmed) return

    const unitDoc = templateInstance.state.get('unitDoc')
    const phases = unitDoc.phases || []
    phases.splice(index, 1)

    const removed = await updateContextDoc({
      context: Unit,
      _id: unitDoc._id,
      doc: { phases },
      prepare: () => templateInstance.state.set('removing', index),
      receive: () => !phaseId && templateInstance.state.set('removing', -1),
      failure: er => API.notify(er)
    })

    if (!removed) return

    if (!phaseId) {
      return API.notify('editor.unit.phases.phaseRemoved')
    }

    // only delete documents, when phaseId is given
    // which itself is only attached to the button
    // if it belongs to this unit. Global phases
    // won't be deleted this way
    removeContextDoc({
      context: Phase,
      _id: phaseId,
      receive: () => templateInstance.state.set('removing', -1),
      failure: er => API.notify(er),
      success: () => API.notify('editor.unit.phases.phaseRemoved')
    })
  },
  'click .uephases-insert-button' (event, templateInstance) {
    event.preventDefault()
    templateInstance.state.set('addPhase', true)
    templateInstance.$('#uniteditor-phase-create-modal').modal('show')
  },
  'click .uephases-add-phase-button' (event, templateInstance) {
    event.preventDefault()
    const $target = templateInstance.$(event.currentTarget)
    const phaseId = $target.data('target')
    const unitDoc = templateInstance.state.get('unitDoc')
    if (!unitDoc.phases) {
      unitDoc.phases = []
    }
    unitDoc.phases.push(phaseId)
    templateInstance.state.set('submitting', true)
  },
  'click .edit-global-phase-button' (event, templateInstance) {
    event.preventDefault()
    templateInstance.state.set('editGlobal', true)
  },
  'hidden.bs.modal #uniteditor-phases-edit-modal' (event, templateInstance) {
    templateInstance.state.set('selectedPhase', null)
    templateInstance.state.set('editPhase', null)
    templateInstance.state.set('editGlobal', false)
  },
  'hidden.bs.modal #uniteditor-phase-create-modal' () {
    formReset('uecreatePhaseForm')
  },
  'submit #editPhaseFieldForm' (event, templateInstance) {
    event.preventDefault()

    const { phaseId, fieldName } = templateInstance.state.get('editPhase')
    const schema = editSchema[fieldName]
    const formUpdateDoc = formIsValid(schema, 'editPhaseFieldForm', true)
    if (!formUpdateDoc) return

    const phaseDoc = getCollection(Phase.name).findOne(phaseId)
    const updateDoc = toUpdateDoc(phaseDoc, formUpdateDoc)

    updateContextDoc({
      context: Phase,
      _id: phaseDoc._id,
      doc: updateDoc,
      prepare: () => templateInstance.state.set('submitting', true),
      receive: () => templateInstance.state.set('submitting', false),
      failure: er => API.notify(er),
      success: () => {
        API.notify('editor.unit.unitUpdated')
        templateInstance.$('#uniteditor-phases-edit-modal').modal('hide')
      }
    })
  },
  'submit #uecreatePhaseForm': async function (event, templateInstance) {
    event.preventDefault()

    const insertDoc = formIsValid(createPhaseSchema, 'uecreatePhaseForm')
    if (!insertDoc) return

    // remove unit if declared as global phase
    if (insertDoc.isGlobal) {
      delete insertDoc.unit
    }
    delete insertDoc.isGlobal // TODO isGlobal -> _custom

    const unitDoc = templateInstance.state.get('unitDoc')

    // if this is curriculum mode, then all created material is master material
    if (isCurriculumDoc(unitDoc)) {
      insertDoc._master = true
    }

    const phaseId = await insertContextDoc({
      context: Phase,
      doc: insertDoc,
      prepare: () => {
        templateInstance.state.set('submitting', true)
        templateInstance.state.set('addPhase', true)
      },
      failure: err => {
        templateInstance.state.set('submitting', false)
        templateInstance.state.set('addPhase', false)
        formReset('uecreatePhaseForm')
        API.notify(err)
      }
    })

    if (!phaseId) return

    templateInstance.$('#uniteditor-phase-create-modal').modal('hide')
    API.notify('editor.unit.phases.phaseCreated')

    const phases = unitDoc.phases || []
    phases.push(phaseId)

    const updateDoc = { phases }

    updateContextDoc({
      context: Unit,
      _id: unitDoc._id,
      doc: updateDoc,
      receive: () => {
        templateInstance.state.set('submitting', false)
        templateInstance.state.set('addPhase', false)
      },
      failure: err => API.notify(err),
      success: () => {
        API.notify('editor.unit.unitUpdated')
        formReset('uecreatePhaseForm')
      }
    })
  }
})
