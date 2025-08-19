import { Meteor } from 'meteor/meteor'
import { PermissionDeniedError } from '../../../errors/types/PermissionDeniedError'
import { DocNotFoundError } from '../../../errors/types/DocNotFoundError'
import { getFilesCollection } from '../../../utils/getFilesCollection'
import { userIsCurriculum } from '../../../accounts/userIsCurriculum'

/**
 * Creates a delete method, specifically designed for files, where not only
 * the filesDoc but also the corresponding storage objects are deleted.
 *
 * @param filesContext
 * @return {{name: string, schema: {_id: StringConstructor}, run: (function({_id?: *}): *)}}
 */
export const createDeleteFile = ({ filesContext }) => {
  return {
    name: `${filesContext.name}.methods.delete`,
    schema: { _id: String },
    run: function ({ _id }) {
      const { userId, log } = this
      log('(delete)', _id)

      // while default remove function will only target the collection,
      // this uses the FilesCollection's remove method, that also removes
      // the referenced file from the connected storage
      const FilesCollection = getFilesCollection(filesContext.name)
      const filesDoc = FilesCollection.findOne({ _id })

      if (!filesDoc) {
        throw new DocNotFoundError('files.notFound', _id)
      }

      if (!filesDoc._master && filesDoc.userId !== userId) {
        throw new PermissionDeniedError('errors.noPermission', _id)
      }

      if (filesDoc._master && !userIsCurriculum(userId)) {
        throw new PermissionDeniedError('errors.notInRole', _id)
      }

      const asyncRemove = Meteor.wrapAsync(FilesCollection.remove)
      const removed = asyncRemove.call(FilesCollection, { _id })

      log('removed', removed)
      return removed
    }
  }
}
