import { createRemoveReferences } from '../material/createRemoveReferences'
import { getCollection } from '../../../../../api/utils/getCollection'
import { Phase } from '../../../../../contexts/curriculum/curriculum/phase/Phase'
import { dataTarget } from '../../../../utils/dataTarget'
import { getLocalCollection } from '../../../../../infrastructure/collection/getLocalCollection'
import { i18n } from '../../../../../api/language/language'
import { unitEditorIsMasterMode } from '../../utils/unitEditorIsMasterMode'
import { userIsCurriculum } from '../../../../../api/accounts/userIsCurriculum'
import { confirmDialog } from '../../../../components/confirm/confirm'
import { updateContextDoc } from '../../../../controllers/document/updateContextDoc'
import { Unit } from '../../../../../contexts/curriculum/curriculum/unit/Unit'
import { Meteor } from 'meteor/meteor'
import { formIsValid } from '../../../../components/forms/formUtils'
import { isCurriculumDoc } from '../../../../../api/decorators/methods/isCurriculumDoc'
import { createMaterial } from '../material/createMaterial'
import { noop } from '../../../../../utils/noop'

export const createMaterialEvents = ({ API, onMaterialCreated = noop }) => {
  const removeReferences = createRemoveReferences(getCollection(Phase.name))

  return {
    // MODALS
    'hidden.bs.modal #uematerial-create-modal' (_event, templateInstance) {
      templateInstance.state.set('create', false)
    },
    'hidden.bs.modal #uematerial-preview-modal' (_event, templateInstance) {
      templateInstance.state.set('previewTarget', null)
    },

    // BUTTONS
    'click .uematerial-insert-button' (event, templateInstance) {
      event.preventDefault()
      templateInstance.state.set('create', true)
      const subView = templateInstance.getViewState()
      subView.hooks.formOpen('create')
      setTimeout(() => API.showModal('uematerial-create-modal'), 50)
    },
    'click .uematerial-select-button' (event, _templateInstance) {
      event.preventDefault()
      API.showModal('uematerial-select-modal')
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
    'click .uematerial-edit-button': async (event, templateInstance) => {
      event.preventDefault()
      const isMasterMaterial = dataTarget(event, templateInstance, 'master')
      const redirect = dataTarget(event, templateInstance, 'redirect')
      const materialId = dataTarget(event, templateInstance)
      await templateInstance.edit({ materialId, isMasterMaterial, redirect })
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
                }, (err, _phaseDoc) => {
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
    // FORMS
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
        onCreated: (materialId) => {
          setTimeout(() => {
            templateInstance.state.set('creating', false)
            onMaterialCreated({ materialId, templateInstance, isMasterMaterial: !!insertDoc._master })
          }, 500)
        }
      })
    },
  }
}