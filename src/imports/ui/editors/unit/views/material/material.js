import { Template } from 'meteor/templating'
import { Meteor } from 'meteor/meteor'

import { i18n } from '../../../../../api/language/language'
import { Unit } from '../../../../../contexts/curriculum/curriculum/unit/Unit'
import { Phase } from '../../../../../contexts/curriculum/curriculum/phase/Phase'
import { unitEditorSubscriptionKey } from '../../unitEditorSubscriptionKey'
import { MaterialSubviews } from './MaterialSubviews'

import { formIsValid, formReset } from '../../../../components/forms/formUtils'
import { dataTarget } from '../../../../utils/dataTarget'
import { getCollection } from '../../../../../api/utils/getCollection'
import { confirmDialog } from '../../../../components/confirm/confirm'
import { updateContextDoc } from '../../../../controllers/document/updateContextDoc'
import { toUpdateDoc } from '../../../../utils/toUpdateDoc'
import { setQueryParams } from '../../../../../api/routes/params/setQueryParams'
import { userIsCurriculum } from '../../../../../api/accounts/userIsCurriculum'
import { createRemoveReferences } from './createRemoveReferences'
import { $in } from '../../../../../api/utils/query/inSelector'
import { unitEditorIsMasterMode } from '../../utils/unitEditorIsMasterMode'
import { createMaterial } from './createMaterial'
import { isCurriculumDoc } from '../../../../../api/decorators/methods/isCurriculumDoc'
import { createSelectableMaterialEntriesQuery } from './helpers/createSelectableMaterialEntriesQuery'
import { entries } from './helpers/entries'
import { getMaterialContexts } from '../../../../../contexts/material/initMaterial'
import { loadIntoCollection } from '../../../../../infrastructure/loading/loadIntoCollection'
import { getLocalCollection } from '../../../../../infrastructure/collection/getLocalCollection'
import { getQueryParam } from '../../../../../api/routes/params/getQueryParam'

import '../../../../renderer/phase/compact/compactPhases'
import './material.css'
import './material.html'

const API = Template.uematerial.setDependencies({
  contexts: [...(new Set([Phase, Unit].concat(getMaterialContexts()))).values()],
  useForms: true
})

const Labels = {
  create: 'editor.unit.material.create',
  select: 'editor.unit.material.select',
  preview: 'editor.unit.material.preview'
}

const removeReferences = createRemoveReferences(getCollection(Phase.name))

Template.uematerial.onCreated(function onUeMaterialCreated () {
  const instance = this
  instance.subViews = new Map()
  instance.state.set('view', MaterialSubviews.defaultViewName())
  instance.state.set('subviewNames', MaterialSubviews.names())

  instance.getViewState = () => {
    const viewName = instance.state.get('view')
    return instance.subViews.get(viewName)
  }

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
  // 3. determine subview by query
  // ===========================================================================

  instance.autorun(() => {
    const queryParam = getQueryParam('sub')
    const currentQueryParam = instance.state.get('view')

    if (!queryParam) {
      instance.state.set('view', MaterialSubviews.defaultViewName())
    }

    else if (!MaterialSubviews.exists(queryParam)) {
      return setQueryParams({ sub: null })
    }

    else if (queryParam !== currentQueryParam) {
      instance.state.set('view', queryParam)
    }
  })

  // ===========================================================================
  // 4. load subview
  // ===========================================================================

  // Reactively retrieve the current view state and load the respective
  // templates, as well as subscribe to the data / documents (if necessary)
  // This function gets triggered when the previous autorun updates the parameter
  instance.autorun(() => {
    const currentView = instance.state.get('view')

    if (!instance.subViews.has(currentView)) {
      const subView = MaterialSubviews.create({ name: currentView })
      instance.subViews.set(currentView, subView)
    }

    const subView = instance.subViews.get(currentView)
    const { load, loaded } = subView

    if (!loaded) {
      instance.state.set('loadComplete', false)
      load()
        .catch(e => API.fatal(e))
        .then(() => {
          subView.loaded = true
          instance.subViews.set(currentView, subView)
          instance.state.set('loadComplete', true)
        })
    }

    else {
      instance.state.set('loadComplete', true)
    }
  })

  // ===========================================================================
  //  LOAD MATERIAL
  // ===========================================================================

  /**
   * Loads material into a local collection
   * @param ids
   * @param onComplete
   */
  instance.loadMaterial = ({ ids, onComplete }) => {
    const currentView = instance.state.get('view')
    const ctx = MaterialSubviews.getContext(currentView)
    API.log('load into collection', ctx.name)

    loadIntoCollection({
      name: ctx.methods.all,
      collection: getLocalCollection(ctx.name),
      args: { ids },
      failure: API.fatal,
      success: () => {
        setTimeout(() => onComplete(), 500)
      }
    })
  }

  // the lesson material is separately loaded, once the material has all been
  // initialized and is ready

  instance.autorun(() => {
    const unitDoc = instance.state.get('unitDoc')
    const currentView = instance.state.get('view')
    const { originalUnitDoc } = Template.currentData()
    const originalRequired = !!(unitDoc?._original)
    const originalProvided = originalRequired ? !!originalUnitDoc : true

    if (!currentView || !unitDoc || !API.initComplete() || !originalProvided) {
      return
    }

    const ctx = MaterialSubviews.getContext(currentView)
    const { fieldName } = ctx
    const materialIds = unitDoc[fieldName] || []
    const originalIds = (originalUnitDoc || {})[fieldName] || []
    const allIds = new Set([...materialIds, ...originalIds])

    if (allIds.size === 0) {
      return instance.state.set('dataComplete', true)
    }

    instance.loadMaterial({
      ids: [...allIds.values()],
      onComplete: () => instance.state.set('dataComplete', true)
    })
  })
})

Template.uematerial.onDestroyed(function () {
  const instance = this
  // MAYBE we could read the user profile for an entry "save positions" or
  // MAYBE similar, which indicates that the user wants to preserve the tab
  setQueryParams({ sub: null })
  instance.subViews.clear()
})

Template.uematerial.helpers({
  loadComplete () {
    const instance = Template.instance()

    return API.initComplete() &&
      instance.state.get('loadComplete') &&
      instance.state.get('phaseSubComplete') &&
      instance.state.get('dataComplete')
  },
  subviewNames () {
    return Template.getState('subviewNames')
  },
  active (name) {
    return Template.getState('view') === name
  },
  entryCount (fieldName) {
    const unitDoc = Template.getState('unitDoc')
    if (!unitDoc || !unitDoc[fieldName]) { return 0 }
    return unitDoc[fieldName].length
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
  entries () {
    const instance = Template.instance()
    const unitDoc = instance.state.get('unitDoc')
    const viewState = instance.getViewState()
    return viewState && entries(viewState, unitDoc)
  },
  withUnitDoc (entry) {
    const instance = Template.instance()
    const unitDoc = instance.state.get('unitDoc')
    const viewState = instance.getViewState()
    const context = viewState.context
    return Object.assign({}, entry, { unitDoc, context, parent: instance })
  },
  selectEntries () {
    const instance = Template.instance()
    const unitDoc = instance.state.get('unitDoc')
    const originalUnitDoc = instance.state.get('originalUnitDoc')
    const viewState = instance.getViewState()
    return viewState && createSelectableMaterialEntriesQuery(viewState, unitDoc, originalUnitDoc)
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
  label (fieldName) {
    const viewState = Template.instance().getViewState()
    const title = i18n.get(viewState.context.label)
    const label = Labels[fieldName]
    return i18n.get(label, { title })
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
  edit () {
    return Template.getState('edit')
  },
  editMaterialDoc () {
    return Template.getState('editMaterialDoc')
  },
  createMaterialSchema () {
    return Template.instance().getViewState().schema
  },
  createInfo () {
    const viewState = Template.instance().getViewState()
    return viewState.info?.create
  },
  formState () {
    const processing = Template.getState('processing')
    return processing ? 'disabled' : 'normal'
  },
  previewTemplate () {
    const viewState = Template.instance().getViewState()
    return viewState.previewRenderer.template
  },
  previewTarget () {
    const instance = Template.instance()
    const targetId = instance.state.get('previewTarget')
    const viewState = instance.getViewState()
    if (!viewState) { return null }

    const previewCtx = viewState.previewRenderer.previewData.call(viewState, targetId, instance)
    if (!previewCtx) { return null }

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

Template.uematerial.events({
  'click .uematerial-tab' (event, templateInstance) {
    event.preventDefault()
    const targetView = dataTarget(event, templateInstance)
    setQueryParams({ sub: targetView })
  },
  'click .uematerial-preview-button' (event, templateInstance) {
    event.preventDefault()
    const targetId = dataTarget(event, templateInstance)
    templateInstance.state.set('previewTarget', targetId)
    API.showModal('uematerial-preview-modal')
  },
  'click .uematerial-link-to-phase-button' (event, templateInstance) {
    event.preventDefault()
    const materialToLink = dataTarget(event, templateInstance)
    templateInstance.state.set('materialToLink', materialToLink)
    API.showModal('uematerial-linkphase-modal')
  },
  'click .uematerial-phaselink-button' (event, templateInstance) {
    event.preventDefault()

    const phaseId = dataTarget(event, templateInstance, 'phase')

    const materialId = templateInstance.state.get('materialToLink')
    const viewState = templateInstance.getViewState()
    const { context } = viewState

    const phaseDoc = getCollection(Phase.name).findOne(phaseId)
    let references = phaseDoc.references || []

    if (references.find(el => el.document === materialId)) {
      references = references.filter(el => el.document !== materialId)
    }
    else {
      references.push({ collection: context.name, document: materialId })
    }

    updateContextDoc({
      context: Phase,
      _id: phaseId,
      doc: { references },
      prepare: () => templateInstance.state.set('linkingPhase', phaseId),
      receive: () => templateInstance.state.set('linkingPhase', null),
      failure: er => API.notify(er)
    }).catch(e => API.notify(e))
  },
  'hidden.bs.modal #uematerial-preview-modal' (event, templateInstance) {
    templateInstance.state.set('previewTarget', null)
  },
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
  'hidden.bs.modal #uematerial-edit-modal' (event, templateInstance) {
    templateInstance.state.set('editMaterialDoc', null)
    templateInstance.state.set('edit', false)
  },
  'click .uematerial-cancel-insert-button' (event, templateInstance) {
    event.preventDefault()
    formReset('createMaterialForm')
    API.hideModal('uematerial-create-modal')

    const subView = templateInstance.getViewState()
    subView.hooks.formClosed('create')
  },
  'click .uematerial-select-button' (event, templateInstance) {
    event.preventDefault()
    templateInstance.$('#uematerial-select-modal').modal('show')
  },
  'click .uematerial-add-button' (event, templateInstance) {
    event.preventDefault()
    const targetId = dataTarget(event, templateInstance)
    const unitDoc = templateInstance.state.get('unitDoc')
    const viewState = templateInstance.getViewState()
    const { field } = viewState

    if (!unitDoc[field]) {
      unitDoc[field] = []
    }

    const updateDoc = {
      [field]: unitDoc[field] || []
    }
    unitDoc[field].push(targetId)

    updateContextDoc({
      context: Unit,
      _id: unitDoc._id,
      doc: updateDoc,
      prepare: () => templateInstance.state.set('processing', targetId),
      receive: () => templateInstance.state.set('processing', null),
      failure: er => API.notify(er),
      success: () => API.notify('editor.unit.unitUpdated')
    }).catch(e => API.notify(e))
  },
  'click .uematerial-edit-button' (event, templateInstance) {
    event.preventDefault()

    const isMasterMaterial = dataTarget(event, templateInstance, 'master')
    const redirect = dataTarget(event, templateInstance, 'redirect')
    const removeId = dataTarget(event, templateInstance)
    const viewState = templateInstance.getViewState()
    const unitDoc = templateInstance.state.get('unitDoc')
    const { context } = viewState
    const insertDoc = getLocalCollection(context.name).findOne(removeId)
    const isMasterMode = unitEditorIsMasterMode(unitDoc)

    if (isMasterMaterial && !isMasterMode) {
      return confirmDialog({ text: 'curriculum.cloneMaster' })
        .catch(e => API.notify(e))
        .then(result => {
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
          const onCreated = (viewState.onCreated || viewState.hooks?.onCreated || function () {}).bind({
            redirect,
            isMasterMaterial,
            isMasterMode
          })

          createMaterial({
            unitDoc,
            insertDoc,
            removeId,
            viewState,
            templateInstance,
            onCreated,
            API: API
          }).catch(e => API.notify(e))
        })
    }

    templateInstance.state.set('edit', true)
    setTimeout(() => {
      templateInstance.state.set('editMaterialDoc', insertDoc)
      templateInstance.$('#uematerial-edit-modal').modal('show')
    }, 50)
  },
  'click .uematerial-remove-button' (event, templateInstance) {
    event.preventDefault()

    const targetId = dataTarget(event, templateInstance)
    const unitDoc = templateInstance.state.get('unitDoc')
    const viewState = templateInstance.getViewState()
    const { field } = viewState

    const { context } = viewState
    const materialDoc = getLocalCollection(context.name).findOne(targetId)
    const title = materialDoc.title || materialDoc.name || i18n.get(context.label)
    const textOptions = { title }

    // material can be fully deleted if
    // - its own material or
    // - it's a copy
    // - it's a master doc and
    // - this is a master unit and
    // - the user is a curriculum user
    const deleteMaterial =
      materialDoc._custom ||
      materialDoc._original ||
      (materialDoc._master &&
        unitEditorIsMasterMode(unitDoc) &&
        userIsCurriculum())

    const confirmOptions = deleteMaterial
      ? {
          text: 'editor.unit.material.confirmDelete',
          textOptions,
          codeRequired: true,
          type: 'danger'
        }
      : {
          text: 'editor.unit.material.confirmRemove',
          textOptions,
          codeRequired: false,
          type: 'secondary'
        }

    confirmDialog(confirmOptions)
      .then(result => {
        if (!result) return

        // set "processing" state after confirm
        // or it would indicate already some processing
        // even if unwanted
        templateInstance.state.set('processing', targetId)

        const index = unitDoc[field].indexOf(targetId)
        if (index === -1) {
          return API.notify({
            message: 'editor.unit.material.unexpected',
            type: 'error'
          })
        }

        const updateDoc = { [field]: unitDoc[field] }
        updateDoc[field].splice(index, 1)

        updateContextDoc({
          context: Unit,
          _id: unitDoc._id,
          doc: updateDoc,
          receive: () => templateInstance.state.set('processing', null),
          failure: er => API.notify(er),
          success: () => {
            API.notify('editor.unit.unitUpdated')

            // remove reference from phase only if we have
            // been successful with "updating" the unit doc
            // if there is any that references this material
            if (unitDoc.phases?.length) {
              removeReferences({
                phases: unitDoc.phases,
                field: field,
                targetId: targetId
              }, (err, phaseDoc) => {
                if (err) {
                  return API.notify(err)
                }
                else {
                  return API.notify('editor.unit.material.unlinkedFromPhase')
                }
              })
            }

            // only delete documents, when the use case permits it, will be
            // checked on the server for permissions etc., too
            if (deleteMaterial) {
              Meteor.call(context.methods.remove.name, { _id: targetId }, (err) => {
                if (err) {
                  API.notify(err)
                }
                else {
                  getLocalCollection(context.name).remove({ _id: targetId })
                  API.notify(i18n.get('editor.unit.material.deleted', { title }))
                }
              })
            }
          }
        })
      })
      .catch(e => API.notify(e))
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
      onCreated: () => {
        setTimeout(() => {
          templateInstance.state.set('creating', false)
        }, 500)
      }
    })
  },
  'submit #editMaterialForm' (event, templateInstance) {
    event.preventDefault()
    const materialDoc = templateInstance.state.get('editMaterialDoc')
    const viewState = templateInstance.getViewState()
    const { schema } = viewState
    const validationDoc = formIsValid(schema, 'editMaterialForm', true)
    if (!validationDoc) {
      return
    }

    updateContextDoc({
      context: viewState.context,
      _id: materialDoc._id,
      doc: toUpdateDoc(materialDoc, validationDoc),
      prepare: () => templateInstance.state.set('processing', materialDoc._id),
      receive: () => templateInstance.state.set('processing', null),
      failure: er => API.notify(er),
      success: () => {
        templateInstance.loadMaterial({
          ids: [materialDoc._id],
          onComplete: () => {
            API.hideModal('uematerial-edit-modal')
            API.notify('editor.unit.unitUpdated')
          }
        })
      }
    })
  }
})
