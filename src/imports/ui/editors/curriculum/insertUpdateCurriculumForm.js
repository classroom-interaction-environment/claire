import { formIsValid, formReset } from '../../components/forms/formUtils'
import { toUpdateDoc } from '../../utils/toUpdateDoc'
import { insertContextDoc } from '../../controllers/document/insertContextDoc'
import { updateContextDoc } from '../../controllers/document/updateContextDoc'

/**
 * Handles the result of a mixed form that is used both for insert and update
 * @param context The related context for method calls
 * @param schema The related schema for validation
 * @param formName The name of the form
 * @param updateName The name of the "updating new document" property
 * @param editDocName The name of the edit doc property
 * @param modalName The id-name of the modal
 * @param templateInstance The template instance
 * @param onSuccess
 */
export const insertUpdateCurriculumForm = ({ context, schema, formName, updateName, editDocName, modalName, templateInstance, API, onSuccess }) => {
  const original = templateInstance.state.get(editDocName)
  const _id = original?._id
  const _onError = API.notify
  const _onSuccess = () => {
    formReset(formName)
    if (modalName) API.hideModal(modalName)
    templateInstance.state.set(editDocName, null)
    API.notify(true)
    if (onSuccess) onSuccess()
  }

  if (!_id) {
    const insertDoc = formIsValid(schema, formName)
    insertDoc._master = true

    return insertContextDoc({
      context: context,
      doc: insertDoc,
      prepare: () => templateInstance.state.set('updating', updateName),
      receive: () => templateInstance.state.set('updating', null),
      failure: _onError,
      success: _onSuccess
    })
  }

  const updateDoc = formIsValid(schema, formName, true)
  const transformed = toUpdateDoc(original, updateDoc)

  updateContextDoc({
    context: context,
    _id: _id,
    doc: transformed,
    prepare: () => templateInstance.state.set('updating', _id),
    receive: () => templateInstance.state.set('updating', null),
    failure: _onError,
    success: _onSuccess
  })
}