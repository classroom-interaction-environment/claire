import { getCollection } from '../../utils/getCollection'
import { $in } from '../../utils/query/inSelector'
import { onServer } from '../../utils/archUtils'
import { userIsAdmin } from '../../accounts/admin/userIsAdmin'

/**
 *
 * @param name
 * @param roles
 * @param isCurriculum
 * @return {{name: string, schema: {ids: {type: ArrayConstructor, optional: boolean}, 'ids.$': StringConstructor}, roles: *, numRequests: number, timeInterval: number, run: *}}
 */
export const createGetAll = ({ name, roles, isCurriculum }) => {
  const methodName = `${name}.methods.all`

  return {
    name: methodName,
    schema: {
      ids: {
        type: Array,
        optional: true
      },
      'ids.$': String,
      skip: {
        type: Array,
        optional: true
      },
      'skip.$': String,
      // omit field names to exclude them from the result
      fields: {
        type: Array,
        optional: true
      },
      'fields.$': {
        type: String
      }
    },
    roles: roles,
    numRequests: 1,
    timeInterval: 250,
    run: onServer(getRunFct({ name, isCurriculum }))
  }
}

const getRunFct = ({ name, isCurriculum }) => {
  if (isCurriculum) {
    // if this is curriculum then we need to allow to retrieve all _master docs
    // because the curriculum is a "semi-public" entity: all registered users
    // should be able to read all curriculum documents

    return async function ({ ids = [], skip = [], fields = [] }) {
      if (ids !== null && !ids?.length) {
        return []
      }

      const { userId, log } = this
      const collection = getCollection(name)
      const masterDocsQuery = {}
      const customDocsQuery = {}

      if (ids?.length > 0) {
        customDocsQuery._id = $in(ids)
        masterDocsQuery._id = $in(ids)
      }

      if (skip?.length > 0) {
        customDocsQuery._id = customDocsQuery._id || {}
        customDocsQuery._id.$nin = skip
        masterDocsQuery._id = masterDocsQuery._id || {}
        masterDocsQuery._id.$nin = skip
      }

      masterDocsQuery._master = { $exists: true }

      if (!await userIsAdmin(userId)) {
        customDocsQuery.createdBy = userId
      }

      const query = { $or: [masterDocsQuery, customDocsQuery] }
      const options = {}
      if (fields.length) {
        options.fields = {}
        fields.forEach(name => {
          options.fields[name] = 0
        })
      }
      const docs = await collection.find(query, options).fetchAsync()
      log('get all', JSON.stringify(query), '=>', docs.length)
      return docs
    }
  }

  // is this is not part of the curriculum we don't need any _master flags
  // se we just return queries for the current user.
  return async function ({ ids = [], skip = [] }) {
    const { userId, log } = this
    const collection = getCollection(name)
    const query = {}

    if (ids?.length > 0) {
      query._id = $in(ids)
    }

    if (skip?.length > 0) {
      query._id = query._id || {}
      query._id.$nin = skip
    }

    if (!await userIsAdmin(userId)) {
      query.createdBy = userId
    }

    const docs = await collection.find(query).fetchAsync()
    log('get one', JSON.stringify(query), '=>', docs.length)
    return docs
  }
}
