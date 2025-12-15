import { getLocalCollection } from '../../../../../infrastructure/collection/getLocalCollection'
import { unitEditorIsMasterMode } from '../../utils/unitEditorIsMasterMode'
import { confirmDialog } from '../../../../components/confirm/confirm'
import { createMaterial } from '../material/createMaterial'
import { noop } from '../../../../../utils/noop'

export const createMaterialEdit = ({ API, templateInstance, onBefore = noop, onComplete = noop }) => {
  return async ({ materialId, isMasterMaterial, redirect }) => {
    await onBefore({ materialId, isMasterMaterial, redirect, templateInstance, API })
    const viewState = templateInstance.getViewState()
    const unitDoc = templateInstance.state.get('unitDoc')
    const { context } = viewState
    const insertDoc = getLocalCollection(context.name).findOne(materialId)
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
        redirect,
        isMasterMaterial,
        isMasterMode
      })

      try {
        await createMaterial({
          unitDoc,
          insertDoc,
          removeId: materialId,
          viewState,
          templateInstance,
          onCreated,
          API: API
        })
      } catch (e) {
        API.notify(e)
      }
    }

    await onComplete({ materialId, isMasterMaterial, redirect, templateInstance, API, insertDoc })
  }
}