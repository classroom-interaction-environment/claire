import { UserUtils } from '../../../contexts/system/accounts/users/UserUtils'
import { onServer } from '../../utils/archUtils'
import { $in } from '../../utils/query/inSelector'
import { getCollection } from '../../utils/getCollection'

export const createGetMaster = ({ name }) => {
  const methodName = `${name}.methods.getMaster`
  const schema = {
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
  }
  return {
    name: methodName,
    schema: schema,
    role: UserUtils.roles.teacher,
    numRequests: 1,
    timeInterval: 300,
    run: onServer(function ({ ids = [], skip = [] }) {
      const query = {}
      query._master = true

      if (ids?.length) {
        query._id = $in(ids)
      }

      if (skip?.length) {
        query._id = query._id || {}
        query._id.$nin = skip
      }

      return getCollection(name).find(query).fetch()
    })
  }
}