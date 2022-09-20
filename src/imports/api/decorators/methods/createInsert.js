import { getCollection } from '../../utils/getCollection'
import { isCurriculumDoc } from './isCurriculumDoc'
import { checkCurriculum } from './checkCurriculum'
import { hasOriginal } from './hasOriginal'
import { onServer } from '../../utils/archUtils'

/**
 * Creates a new insert method
 * @param name
 * @param schema
 * @param roles
 * @param isCurriculum
 * @return {{name: string, schema: *, timeInterval: number, numRequests: number, roles: *, run: *}}
 */
export const createInsert = ({ name, schema, roles, isCurriculum }) => {
  const methodName = `${name}.methods.insert`

  return {
    name: methodName,
    schema: schema,
    timeInterval: 1000,
    numRequests: 10,
    roles: roles,
    run: onServer(function (insertDoc) {
      const { userId, log } = this

      // 1. Curriculum check
      // ensure that curriculum docs only become master docs when curriculum mode
      // is enabled for this method and the current user has the permissions.
      // This also ensures, that non curriculum methods can't edit the curriculum.
      if (isCurriculumDoc(insertDoc)) {
        checkCurriculum({ isCurriculum, userId, doc: insertDoc })
      }

      // 2. Custom docs check
      // we flag any document, that is neither curriculum, nor refers to an
      // original document as a custom document for the current user
      else if (!hasOriginal(insertDoc)) {
        insertDoc._custom = true
      }

      log('insert doc', JSON.stringify(insertDoc || {}))
      const docId = getCollection(name).insert(insertDoc)
      log('docId', docId)
      return docId
    })
  }
}
