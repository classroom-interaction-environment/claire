import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { Task } from '../../../../../contexts/curriculum/curriculum/task/Task'
import { Unit } from '../../../../../contexts/curriculum/curriculum/unit/Unit'
import { Phase } from '../../../../../contexts/curriculum/curriculum/phase/Phase'
import { MaterialSubviews } from '../material/MaterialSubviews'
import { unitEditorSubscriptionKey } from '../../unitEditorSubscriptionKey'
import { loadIntoCollection } from '../../../../../infrastructure/loading/loadIntoCollection'
import { getLocalCollection } from '../../../../../infrastructure/collection/getLocalCollection'
import { unique } from '../../../../../utils/array/unique'
import { $in } from '../../../../../api/utils/query/inSelector'
import { getCollection } from '../../../../../api/utils/getCollection'
import './tasks.html'
import { createSelectableMaterialEntriesQuery } from '../material/helpers/createSelectableMaterialEntriesQuery'
import { i18n } from '../../../../../api/language/language'
import { formIsValid } from '../../../../components/forms/formUtils'
import { isCurriculumDoc } from '../../../../../api/decorators/methods/isCurriculumDoc'
import { createMaterial } from '../material/createMaterial'
import { entries } from '../material/helpers/entries'
import { userIsCurriculum } from '../../../../../api/accounts/userIsCurriculum'
import { dataTarget } from '../../../../utils/dataTarget'
import { unitEditorIsMasterMode } from '../../utils/unitEditorIsMasterMode'
import { confirmDialog } from '../../../../components/confirm/confirm'

const Labels = {
  create: 'editor.unit.material.create',
  select: 'editor.unit.material.select',
  preview: 'editor.unit.material.preview'
}

const API = Template.uetasks.setDependencies({
  contexts: [Unit, Phase, Task],
  useForms: true
})

const TaskEditor = {
  loaded: false,
  load: async () => {
    if (TaskEditor.loaded) return
    await import('../../../task/taskEditor')
    TaskEditor.loaded = true
  }
}

Template.uetasks.onCreated(function () {
  const instance = this


  // ===========================================================================
  // 4. load subview
  // ===========================================================================
  const subView = MaterialSubviews.create({ name: Task.name })
  instance.getViewState = () => subView

  const { load } = subView
  load()
    .catch(e => API.fatal(e))
    .then(() => {
      subView.loaded = true
      instance.state.set('loadComplete', true)
    })

  instance.autorun(() => {
    const { unitDoc, originalUnitDoc } = Template.currentData()
    const originalRequired = !!(unitDoc?._original)
    const originalProvided = originalRequired ? !!originalUnitDoc : true
    if (!unitDoc || !originalProvided) return

    const taskIds = unitDoc[Task.fieldName] ?? []
    const originalIds = (originalUnitDoc || {})[Task.fieldName] ?? []
    const ids = unique([...taskIds, ...originalIds])
    if (ids.length === 0) return instance.state.set('dataComplete', true)
    console.debug('load tasks', ids)
    loadIntoCollection({
      name: Task.methods.all,
      collection: getLocalCollection(Task.name),
      args: { ids, fields: ['pages', 'footer', 'header'] },
      failure: API.fatal,
      success: () => {
        instance.state.set('dataComplete', true)
      }
    })
  })

  // ===========================================================================
  // 2. subscribe phases
  // ===========================================================================

  // if the unit doc changes we need to subscribe to the phases, because
  // we need on every material the option to add / remove it to/from phases
  instance.autorun(() => {
    const data = Template.currentData()
    const { unitDoc, originalUnitDoc } = data
    const phaseQuery = { _id: $in(unitDoc.phases || []) }
    const cb = {
      onReady: () => {
        const phases = (unitDoc.phases || []).map(phaseId => getCollection(Phase.name).findOne(phaseId))
        instance.state.set({
          phases: phases,
          phaseSubComplete: true
        })
      }
    }

    // get all phases that are currently linked by this unit
    API.subscribe({
      key: unitEditorSubscriptionKey,
      name: Phase.publications.editor.name,
      args: phaseQuery,
      callbacks: cb
    })

    // note, that data.originalUnitDoc may not be present
    // when editing unit master docs (curriculum docs)
    instance.state.set({ unitDoc, originalUnitDoc })
  })

  // ===========================================================================
  // Actions
  // ===========================================================================
  instance.edit = async ({ taskId, isMasterMaterial }) => {
    instance.state.set('selectForEdit', taskId)
    const viewState = instance.getViewState()
    const unitDoc = instance.state.get('unitDoc')
    const { context } = viewState
    const insertDoc = getLocalCollection(context.name).findOne(taskId)
    const isMasterMode = unitEditorIsMasterMode(unitDoc)

    if (isMasterMaterial && !isMasterMode) {
      let result
      try {
        result = await confirmDialog({ text: 'curriculum.cloneMaster' })
      } catch (e) {
        API.notify(e)
      }
      if (!result) return
      // we keep a reference to the original document
      // in order to identify clones from _master docs
      insertDoc._original = insertDoc._id

      // thus we can safely remove any _master related
      // fields and replace them on insert with new ones
      delete insertDoc._id
      delete insertDoc.createdBy
      delete insertDoc.createdAt
      delete insertDoc.updatedBy
      delete insertDoc.updatedAt
      delete insertDoc._master

      // give additional context to the onCreated hook
      // to allow contexts to decide, what to do when a new doc
      // is created
      const onCreated = (viewState.onCreated || viewState.hooks?.onCreated || function () {
      }).bind({
        isMasterMaterial,
        isMasterMode
      })

      try {
        await createMaterial({
          unitDoc,
          insertDoc,
          removeId: taskId,
          viewState,
          templateInstance: instance,
          onCreated,
          API: API
        })
      } catch (e) {
        API.notify(e)
      }
    }

    await TaskEditor.load()
    instance.state.set({ edit: insertDoc, selectForEdit: null })
  }
})

Template.uetasks.helpers({
  loadComplete () {
    const instance = Template.instance()
    return API.initComplete() &&
      instance.state.get('loadComplete') &&
      instance.state.get('phaseSubComplete') &&
      instance.state.get('dataComplete')
  },
  entryCount () {
    const unitDoc = Template.getState('unitDoc')
    if (!unitDoc || !unitDoc[Task.fieldName]) {
      return 0
    }
    return unitDoc[Task.fieldName].length
  },
  label (fieldName) {
    const viewState = Template.instance().getViewState()
    const title = i18n.get(viewState.context.label)
    const label = Labels[fieldName]
    return API.translate(label, { title })
  },
  selectEntries () {
    const instance = Template.instance()
    const unitDoc = instance.state.get('unitDoc')
    const originalUnitDoc = instance.state.get('originalUnitDoc')
    const viewState = instance.getViewState()
    return viewState && createSelectableMaterialEntriesQuery(viewState, unitDoc, originalUnitDoc)
  },
  processing (targetId) {
    return Template.getState('processing') === targetId
  },
  create () {
    return Template.getState('create')
  },
  creating () {
    return Template.getState('creating')
  },
  dontShowList () {
    return Template.getState('creating') || Template.getState('edit') || Template.getState('selectForEdit')
  },
  createMaterialSchema () {
    return Template.instance().getViewState().schema
  },
  formState () {
    const processing = Template.getState('processing')
    return processing ? 'disabled' : 'normal'
  },
  entries () {
    const instance = Template.instance()
    const unitDoc = instance.state.get('unitDoc')
    const viewState = instance.getViewState()
    return viewState && entries(viewState, unitDoc)
  },
  showHeaderButtons () {
    const instance = Template.instance()
    const unitDoc = instance.state.get('unitDoc')
    return unitDoc[Task.fieldName]?.length > 0 && !instance.state.get('creating') && !instance.state.get('edit') && !instance.state.get('selectForEdit')
  },
  showBigButtons () {
    const instance = Template.instance()
    const unitDoc = instance.state.get('unitDoc')
    return unitDoc[Task.fieldName]?.length === 0 && !instance.state.get('creating') && !instance.state.get('edit') && !instance.state.get('selectForEdit')
  },
  listRendererTemplate () {
    const sub = Template.instance().getViewState()
    return sub.listRenderer.template
  },
  preview () {
    const sub = Template.instance().getViewState()
    return sub.preview !== false
  },
  editable () {
    const sub = Template.instance().getViewState()
    return sub.editable !== false
  },
  withUnitDoc (entry) {
    const instance = Template.instance()
    const unitDoc = instance.state.get('unitDoc')
    const viewState = instance.getViewState()
    const context = viewState.context
    return Object.assign({}, entry, { unitDoc, context, parent: instance })
  },
  selectEntryModalData (entry) {
    return Object.assign({}, entry, { isModal: true })
  },
  isGlobal (materialDoc) {
    const originalUnitDoc = Template.getState('originalUnitDoc')
    const view = Template.getState('view')
    return !materialDoc._original &&
      (!originalUnitDoc || !(originalUnitDoc[view] || []).includes(materialDoc._id))
  },
  isTarget (id) {
    return Template.getState('targetMaterial') === id
  },
  edit () {
    return Template.getState('edit')
  },
  selectForEdit () {
    return Template.getState('selectForEdit')
  },
  editMaterialDoc () {
    return Template.getState('editMaterialDoc')
  },
  createInfo () {
    const viewState = Template.instance().getViewState()
    return viewState.info?.create
  },
  previewTemplate () {
    const viewState = Template.instance().getViewState()
    return viewState.previewRenderer.template
  },
  previewTarget () {
    const instance = Template.instance()
    const targetId = instance.state.get('previewTarget')
    const viewState = instance.getViewState()
    if (!viewState) {
      return null
    }

    const previewCtx = viewState.previewRenderer.previewData.call(viewState, targetId, instance)
    if (!previewCtx) {
      return null
    }

    previewCtx.print = !!instance.state.get('isPrintPreview')
    return previewCtx
  },
  phases () {
    return Template.getState('phases')
  },
  materialToLink () {
    return Template.getState('materialToLink')
  },
  linkedWithPhase (materialId, phaseDoc) {
    if (!phaseDoc || !phaseDoc.references) return
    return phaseDoc.references.find(entry => entry.document === materialId)
  },
  linkingPhase (phaseId) {
    return Template.getState('linkingPhase') === phaseId
  },
  canDeleteMaterial (materialDoc) {
    if (materialDoc._master) {
      return userIsCurriculum()
    }

    const userId = Meteor.userId()
    return (materialDoc.createdBy === userId || materialDoc.userId === userId)
  }
})

Template.uetasks.events({
  'click .uematerial-insert-button' (event, templateInstance) {
    event.preventDefault()
    templateInstance.state.set('create', true)
    const subView = templateInstance.getViewState()
    subView.hooks.formOpen('create')
    setTimeout(() => API.showModal('uematerial-create-modal'), 50)
  },
  'hidden.bs.modal #uematerial-create-modal' (event, templateInstance) {
    templateInstance.state.set('create', false)
  },
  'submit #createMaterialForm' (event, templateInstance) {
    event.preventDefault()

    const unitDoc = templateInstance.state.get('unitDoc')
    const viewState = templateInstance.getViewState()
    const { schema } = viewState
    const insertDoc = formIsValid(schema, 'createMaterialForm')
    if (!insertDoc) {
      return
    }

    // set flag
    templateInstance.state.set('creating', true)

    // if this is curriculum mode, then all created material is master material
    if (isCurriculumDoc(unitDoc)) {
      insertDoc._master = true
    }

    createMaterial({
      unitDoc,
      insertDoc,
      viewState,
      templateInstance,
      API,
      onCreated: taskId => {
        setTimeout(async () => {
          templateInstance.state.set('creating', false)
          await templateInstance.edit({ taskId, isMasterMaterial: !!insertDoc._master })
        }, 500)
      }
    })
  },
  'click .uematerial-cancel-edit-button' (event, templateInstance) {
    event.preventDefault()
    templateInstance.state.set('edit', null)
  },
  'click .uematerial-edit-button': async function (event, templateInstance) {
    event.preventDefault()
    const isMasterMaterial = dataTarget(event, templateInstance, 'master')
    const taskId = dataTarget(event, templateInstance)
    await templateInstance.edit({ taskId, isMasterMaterial })
  }
})