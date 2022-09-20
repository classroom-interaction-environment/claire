import { checkOwnership } from '../../utils/permission/checkOnwership'
import { getCollection } from '../../utils/getCollection'
import { checkCurriculum } from './checkCurriculum'
import { isCurriculumDoc } from './isCurriculumDoc'
import { curriculumQuery } from './curriculumQuery'
import { onServer } from '../../utils/archUtils'
import { Schema } from '../../schema/Schema'
import { toOptionalSchema } from '../../schema/toOptionalSchema'

/**
 *
 * @param name
 * @param schema
 * @param roles
 * @param isOwner
 * @param isCurriculum
 * @return {{name: string, schema: *, roles: *, timeInterval: number, numRequests: number, run: *}}
 */
export const createUpdate = ({ name, schema, roles, isOwner, isCurriculum }) => {
  const methodName = `${name}.methods.update`
  const updateSchema = toOptionalSchema(schema)
  const idSchema = Schema.create({ _id: String })
  return {
    name: methodName,
    schema: schema,
    roles: roles,
    timeInterval: 1000,
    numRequests: 10,
    validate: onServer(function (updateDoc) {
      const { _id, doc } = updateDoc
      idSchema.validate({ _id })
      updateSchema.validate(doc)
    }),
    run: onServer(function ({ _id, doc }) {
      const { userId, log } = this
      const collection = getCollection(name)

      // ownership-check can be defined at method creation,
      // so this method always throws, in case the user
      // tries to edit a document she doesn't own
      if (isOwner) {
        checkOwnership(collection, _id, userId)
      }

      // prevent attempts to manipulate curriculum docs from outside of a
      // curriculum method (for example from a unit editor method etc.)
      const query = curriculumQuery({ _id })
      const editCurriculum = isCurriculumDoc(doc) || collection.find(query).count() > 0

      if (editCurriculum) {
        log('check curriculum edit permissions')
        checkCurriculum({ isCurriculum, userId, _id })
      }

      log(`update ${_id} with ${JSON.stringify(doc)}`)
      const update = collection.update(_id, { $set: doc })
      log(`update ${update ? 'successful' : 'failed'}`)

      return update
    })
  }
}
