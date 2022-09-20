import { UserUtils } from '../../../contexts/system/accounts/users/UserUtils'
import { getCollection } from '../../utils/getCollection'
import { $in } from '../../utils/query/inSelector'
import { onServer } from '../../utils/archUtils'

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
      'skip.$': String
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

    return function ({ ids = [], skip = [] }) {
      const { userId, log } = this
      const collection = getCollection(name)
      const masterDocsQuery = {}
      const customDocsQuery = {}
      const query = { $or: [masterDocsQuery, customDocsQuery] }

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

      if (!UserUtils.isAdmin(userId)) {
        customDocsQuery.createdBy = userId
      }

      log('get all', JSON.stringify(query), '=>', collection.find(query).count())
      return collection.find(query).fetch()
    }
  }

  // is this is not part of the curriculum we don't need any _master flags
  // se we just return queries for the current user.
  return function ({ ids = [], skip = [] }) {
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

    if (!UserUtils.isAdmin(userId)) {
      query.createdBy = userId
    }

    const cursor = collection.find(query)
    log('get all', query, '=>', cursor.count())
    return cursor.fetch()
  }
}