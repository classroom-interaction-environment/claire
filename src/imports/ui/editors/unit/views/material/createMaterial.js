import { Unit } from '../../../../../contexts/curriculum/curriculum/unit/Unit'
import { i18n } from '../../../../../api/language/language'
import { insertContextDoc } from '../../../../controllers/document/insertContextDoc'
import { updateContextDoc } from '../../../../controllers/document/updateContextDoc'
import { createFilesMaterial } from './createFilesMaterial'

/**
 * Creates a new material for this unit and adds it to the references.
 * @param unitDoc The unit document for which the material is created.
 * @param insertDoc The document for the new material.
 * @param removeId The original _id, if the material is a copy-replacement of a _master material.
 * @param viewState The current viewState we are in (e.g. task, link etc.)
 * @param templateInstance The current Template's instance
 * @param onCreated callback to fire, once the material has been created.
 */
export const createMaterial = ({ unitDoc, insertDoc, removeId, viewState, templateInstance, onCreated, API }) => {
  const { context } = viewState
  const { field } = viewState
  const title = insertDoc.title || insertDoc.name || i18n.get(context.label)

  if (context.filesCollection || context.isFilesCollection) {
    return createFilesMaterial({
      unitDoc: unitDoc,
      field: field,
      removeId: removeId,
      insertDocId: insertDoc._id,
      viewState: viewState,
      templateInstance: templateInstance,
      API: API,
      title: title,
      onCreated: onCreated
    })
  }

  let finalDoc = viewState.hooks.beforeInsert
    ? viewState.hooks.beforeInsert(insertDoc)
    : insertDoc

  if (!finalDoc) {
    finalDoc = insertDoc
  }

  insertContextDoc({
    context: context,
    doc: finalDoc,
    failure: err => {
      templateInstance.state.set('processing', null)
      API.notify(err)
    },
    success: insertDocId => {
      const updateDoc = { [field]: unitDoc[field] || [] }

      // remove old ref, if given and present
      if (removeId) {
        const removeIndex = updateDoc[field].indexOf(removeId)
        updateDoc[field].splice(removeIndex, 1)
      }

      updateDoc[field].push(insertDocId)

      updateContextDoc({
        context: Unit,
        _id: unitDoc._id,
        doc: updateDoc,
        receive: () => templateInstance.state.set('processing', null),
        failure: er => API.notify(er),
        success: () => {
          API.notify(i18n.get('editor.unit.documentCreated', { title }))
          templateInstance.$('#uematerial-create-modal').modal('hide')
          if (onCreated) onCreated(insertDocId, unitDoc, viewState)
        }
      })
    }
  })
}
