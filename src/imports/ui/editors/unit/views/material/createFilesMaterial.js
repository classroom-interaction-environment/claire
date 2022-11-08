import { Unit } from '../../../../../contexts/curriculum/curriculum/unit/Unit'
import { callMethod } from '../../../../controllers/document/callMethod'
import { userIsCurriculum } from '../../../../../api/accounts/userIsCurriculum'
import { updateContextDoc } from '../../../../controllers/document/updateContextDoc'
import { isCurriculumDoc } from '../../../../../api/decorators/methods/isCurriculumDoc'

export const createFilesMaterial = async ({ unitDoc, field, removeId, viewState, insertDocId, templateInstance, API, onCreated }) => {
  // first we check, if we need to "make" this filesDoc a master material
  if (isCurriculumDoc(unitDoc) && userIsCurriculum()) {
    await callMethod({
      name: viewState.context.methods.setMasterState.name,
      args: { _id: insertDocId, value: true },
      failure: err => API.notify(err)
    })
  }

  else {
    await callMethod({
      name: viewState.context.methods.setCustomState.name,
      args: { _id: insertDocId, value: true },
      failure: err => API.notify(err)
    })
  }

  // update the unitDoc, too
  const updateDoc = { [field]: unitDoc[field] || [] }

  // remove old ref, if given and present
  if (removeId) {
    const removeIndex = updateDoc[field].indexOf(removeId)
    updateDoc[field].splice(removeIndex, 1)
  }

  updateDoc[field].push(insertDocId)

  await updateContextDoc({
    context: Unit,
    _id: unitDoc._id,
    doc: updateDoc,
    receive: () => templateInstance.state.set('processing', null),
    failure: er => API.notify(er),
    success: () => {
      API.notify('editor.unit.documentCreated')
      templateInstance.$('#uematerial-create-modal').modal('hide')
      if (onCreated) onCreated(insertDocId, unitDoc, viewState)
    }
  })
}
