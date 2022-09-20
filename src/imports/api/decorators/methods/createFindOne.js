import { getCollection } from '../../utils/getCollection'
import { onServer } from '../../utils/archUtils'

/**
 * Creates a get method for a single doc.
 * Note that it does not check for curriculum roles and docs because
 * curriculum content is always readable by anyone.
 *
 * @param name
 * @param roles
 * @param isOwner
import { getCollection } from '../../../../../api/utils/getCollection' * @return {{name: string, schema: {_id: StringConstructor}, roles, run: *}}
 */
export const createFindOne = ({ name, roles, isOwner } = {}) => {
  const methodName = `${name}.methods.get`

  return {
    name: methodName,
    schema: { _id: String },
    roles: roles,
    run: onServer(function ({ _id }) {
      const { userId, checkDoc, checkOwner, log } = this
      const collection = getCollection(name)

      log('get', JSON.stringify({ _id, isOwner }))

      const doc = collection.findOne(_id)
      checkDoc(doc, _id, userId)

      if (isOwner) {
        checkOwner(doc)
      }

      return doc
    })
  }
}
