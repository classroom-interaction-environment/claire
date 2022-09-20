import { checkOwnership } from '../../utils/permission/checkOnwership'
import { getCollection } from '../../utils/getCollection'
import { checkCurriculum } from './checkCurriculum'
import { curriculumQuery } from './curriculumQuery'
import { onServer } from '../../utils/archUtils'

/**
 * Create a method that removes a document of a specific collection by
 * given _id
 *
 * If not a delete flag (force) is given it will only be archived.
 *
 * @param name
 * @param isOwner
 * @param isCurriculum
 * @return {{name: string, schema: {_id: StringConstructor}, run: *}}
 */
export const createRemove = ({ name, roles, isOwner, isCurriculum } = {}) => {
  const methodName = `${name}.methods.remove`

  return {
    name: methodName,
    schema: {
      _id: String,
      force: {
        type: Boolean,
        optional: true
      }
    },
    roles: roles,
    run: onServer(function ({ _id, force }) {
      const { userId, log } = this
      const collection = getCollection(name)

      if (isOwner) {
        checkOwnership(collection, _id, userId)
      }

      const query = curriculumQuery({ _id })
      const editCurriculumAttempt = collection.find(query).count() > 0

      if (editCurriculumAttempt) {
        log('check curriculum edit permissions')
        checkCurriculum({ isCurriculum, userId, _id })
      }

      if (!force) {
        // TODO implement archive system
        // return collection.update({ _id }, { $set: { _archived: new Date() } })
      }

      log('remove', _id)
      return collection.remove({ _id })
    })
  }
}
