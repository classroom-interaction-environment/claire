import { check } from 'meteor/check'
import { confirmDialog } from '../../../ui/components/confirm/confirm'
import { getFilesCollection } from '../../../api/utils/getFilesCollection'

export const createDeleteFile = ({ context, onError, onSuccess }) => (fileId) => {
  check(fileId, String)

  const file = getFilesCollection(context.name).findOne(fileId)
  if (!file) return onError(new Error('errors.docNotFound'))

  const textOptions = { title: file.name }

  confirmDialog({ text: 'confirm.delete', type: 'danger', textOptions })
    .then(res => {
      if (!res) return

      Meteor.call(context.methods.remove.name, { _id: fileId }, (error) => {
        if (error) {
          return onError(error)
        }

        return onSuccess()
      })
    })
    .catch(e => onError(e))
}
