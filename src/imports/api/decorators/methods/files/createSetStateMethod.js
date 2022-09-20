import { onServer } from '../../../utils/archUtils'
import { getCollection } from '../../../utils/getCollection'

const allowed = ['master', 'custom']
const capitalize = (s, pos = 0) => (s && `${s[pos].toUpperCase()}${s.slice(1)}`) || ''

/**
 * This method is designed to be called on uploaded files, which are intended
 * to be {_master|_custom} files.
 *
 * This is because file upload behaves totally different
 * from the other insert mechanisms, as there is no Meteor method for insert
 * and thus no predefined { isCurriculum } environment.
 *
 * We therefore use this method together with tight permission restrictions in
 * order to actively set the {_master|_custom} state on a files document.
 *
 * @param context
 * @param type
 */

export const createSetStateMethod = (context, { type = 'master' } = {}) => {
  if (!allowed.includes(type)) {
    throw new TypeError(`Expected type to be one of ['master','custom'], got '${type}'`)
  }

  const typeName = capitalize(type)
  const methodNameType = `set${typeName}State`

  let createUpdate

  if (type === 'master') {
    createUpdate = value => value === true
      ? { $set: { _master: true } }
      : { $unset: { _master: 1 } }
  }

  if (type === 'custom') {
    createUpdate = value => value === true
      ? { $set: { _custom: true } }
      : { $unset: { _custom: 1 } }
  }

  return {
    name: `${context.name}.methods.${methodNameType}`,
    schema: {
      _id: String,
      value: Boolean
    },
    curriculum: type === 'master',
    run: onServer(
      /**
       * If the value is true it will set {_master|_custom} to true,
       * otherwise it removes the {_master|_custom} status.
       * @param _id {string} the id of the files document
       * @param value {boolean} the new master status
       * @return {number} 1 if successful
       */

      function ({ _id, value }) {
        const { userId, checkDoc } = this

        const filesCollection = getCollection(context.name)
        const filesDoc = filesCollection.findOne(_id)
        checkDoc(filesDoc, _id, userId)

        const updateDoc = createUpdate(value)

        return filesCollection.update(_id, updateDoc)
      }
    )
  }
}
