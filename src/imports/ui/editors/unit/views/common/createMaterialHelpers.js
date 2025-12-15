import { Template } from 'meteor/templating'
import { entries } from '../material/helpers/entries'
import { createSelectableMaterialEntriesQuery } from '../material/helpers/createSelectableMaterialEntriesQuery'
import { i18n } from '../../../../../api/language/language'
import { userIsCurriculum } from '../../../../../api/accounts/userIsCurriculum'
import { Meteor } from 'meteor/meteor'

const Labels = {
  create: 'editor.unit.material.create',
  select: 'editor.unit.material.select',
  preview: 'editor.unit.material.preview'
}

export const createMaterialHelpers = ({ API }) => {
  return {
    // ctx
    label (fieldName) {
      const viewState = Template.instance().getViewState()
      const title = i18n.get(viewState.context.label)
      const label = Labels[fieldName]
      return API.translate(label, { title })
    },
    isGlobal (materialDoc) {
      const originalUnitDoc = Template.getState('originalUnitDoc')
      const view = Template.getState('view')
      return !materialDoc._original &&
        (!originalUnitDoc || !(originalUnitDoc[view] || []).includes(materialDoc._id))
    },
    // entries
    entries () {
      const instance = Template.instance()
      const unitDoc = instance.state.get('unitDoc')
      const viewState = instance.getViewState()
      return viewState && entries(viewState, unitDoc)
    },
    entryCount (fieldName) {
      const unitDoc = Template.getState('unitDoc')
      if (!unitDoc || !unitDoc[fieldName]) { return 0 }
      return unitDoc[fieldName].length
    },
    selectEntries () {
      const instance = Template.instance()
      const unitDoc = instance.state.get('unitDoc')
      const originalUnitDoc = instance.state.get('originalUnitDoc')
      const viewState = instance.getViewState()
      return viewState && createSelectableMaterialEntriesQuery(viewState, unitDoc, originalUnitDoc)
    },
    // forms
    formState () {
      const processing = Template.getState('processing')
      return processing ? 'disabled' : 'normal'
    },
    processing (targetId) {
      return Template.getState('processing') === targetId
    },
    isTarget (id) {
      return Template.getState('targetMaterial') === id
    },
    // create
    create () {
      return Template.getState('create')
    },
    creating () {
      return Template.getState('creating')
    },
    createInfo () {
      const viewState = Template.instance().getViewState()
      return viewState.info?.create
    },
    createMaterialSchema () {
      return Template.instance().getViewState().schema
    },
    // renderer for material type
    listRendererTemplate () {
      const sub = Template.instance().getViewState()
      return sub.listRenderer.template
    },
    withUnitDoc (entry) {
      const instance = Template.instance()
      const unitDoc = instance.state.get('unitDoc')
      const viewState = instance.getViewState()
      const context = viewState.context
      return Object.assign({}, entry, { unitDoc, context, parent: instance })
    },
    // select existing
    selectEntryModalData (entry) {
      return Object.assign({}, entry, { isModal: true })
    },
    // edit
    editable () {
      const sub = Template.instance().getViewState()
      return sub.editable !== false
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
    // delete
    canDeleteMaterial (materialDoc) {
      if (materialDoc._master) {
        return userIsCurriculum()
      }

      const userId = Meteor.userId()
      return (materialDoc.createdBy === userId || materialDoc.userId === userId)
    },
    // phases
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
    // preview
    preview () {
      const sub = Template.instance().getViewState()
      return sub.preview !== false
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
      console.debug('previewCtx', previewCtx)
      return previewCtx
    },
  }
}