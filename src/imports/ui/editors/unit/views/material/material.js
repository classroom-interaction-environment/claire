import { Template } from 'meteor/templating'
import { Unit } from '../../../../../contexts/curriculum/curriculum/unit/Unit'
import { Phase } from '../../../../../contexts/curriculum/curriculum/phase/Phase'
import { unitEditorSubscriptionKey } from '../../unitEditorSubscriptionKey'
import { MaterialSubviews } from './MaterialSubviews'
import { formIsValid, formReset } from '../../../../components/forms/formUtils'
import { dataTarget } from '../../../../utils/dataTarget'
import { getCollection } from '../../../../../api/utils/getCollection'
import { updateContextDoc } from '../../../../controllers/document/updateContextDoc'
import { toUpdateDoc } from '../../../../utils/toUpdateDoc'
import { setQueryParams } from '../../../../../api/routes/params/setQueryParams'
import { $in } from '../../../../../api/utils/query/inSelector'
import { getMaterialContexts } from '../../../../../contexts/material/initMaterial'
import { loadIntoCollection } from '../../../../../infrastructure/loading/loadIntoCollection'
import { getLocalCollection } from '../../../../../infrastructure/collection/getLocalCollection'
import { getQueryParam } from '../../../../../api/routes/params/getQueryParam'
import { unique } from '../../../../../utils/array/unique'
import { createMaterialEvents } from '../common/createMaterialEvents'
import { createMaterialHelpers } from '../common/createMaterialHelpers'
import { createMaterialEdit } from '../common/createMaterialEdit'
import '../../../../renderer/phase/compact/compactPhases'
import './material.css'
import './material.html'

const API = Template.uematerial.setDependencies({
  contexts: unique([Phase, Unit].concat(getMaterialContexts())),
  useForms: true
})

Template.uematerial.onCreated(function onUeMaterialCreated () {
  const instance = this
  instance.subViews = new Map()

  instance.state.set('view', MaterialSubviews.defaultViewName())

  instance.autorun(c => {
    if (!API.initComplete()) {
      return
    }
    const subViewNames = MaterialSubviews.names().sort((a, b) => {
      const transA = API.translate(a.label)
      const transB = API.translate(b.label)
      return transA.localeCompare(transB)
    })
    instance.state.set({ subViewNames })
    c.stop()
  })

  instance.getViewState = () => {
    const viewName = instance.state.get('view')
    return instance.subViews.get(viewName)
  }

  instance.edit = createMaterialEdit({
    API,
    templateInstance: instance,
    onComplete: ({ insertDoc }) => {
      instance.state.set({
        edit: true,
        editMaterialDoc: insertDoc
      })
      API.showModal('uematerial-edit-modal')
    }
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
    return Template.getState('subViewNames')
  },
  active (name) {
    return Template.getState('view') === name
  },
  ...createMaterialHelpers({ API })
})

Template.uematerial.events({
  'click .uematerial-tab' (event, templateInstance) {
    event.preventDefault()
    const targetView = dataTarget(event, templateInstance)
    setQueryParams({ sub: targetView })
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
  },
  ...createMaterialEvents({ API })
})
