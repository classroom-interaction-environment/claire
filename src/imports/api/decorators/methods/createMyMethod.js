import { $in } from '../../utils/query/inSelector'
import { onServer } from '../../utils/archUtils'
import { getCollection } from '../../utils/getCollection'
import { DefaultFields } from '../../defaults/schema'

const defaultPublicFields = { ...DefaultFields }

export const createMyMethod = ({ name, publicFields = {}, schema, isFilesCollection }) => {
  const methodName = `${name}.methods.my`
  const methodSchema = {
    limit: {
      type: Number,
      max: 1000,
      optional: true
    },
    ids: {
      type: Array,
      optional: true
    },
    'ids.$': String
  }
  const mySchema = Object.assign(methodSchema)

  return {
    name: methodName,
    schema: mySchema,
    run: onServer(function ({ limit, ids, ...customFields }) {
      const { userId, log } = this
      const collection = getCollection(name)
      const fsQuery = isFilesCollection
        ? { userId }
        : { createdBy: userId }

      const query = Object.assign(customFields, fsQuery)

      if (ids?.length) {
        query._id = $in(ids)
      }

      const projection = { fields: Object.assign({}, defaultPublicFields, publicFields) }

      if (limit) {
        projection.limit = limit
      }

      const cursor = collection.find(query, projection)
      log(JSON.stringify(query), '=>', cursor.count())

      // we often create documents as "fork" of originals, so we need to
      // publish the originals, too!
      const uniqueOriginals = new Set()
      cursor.forEach(doc => {
        if (typeof doc._original === 'string') {
          uniqueOriginals.add(doc._original)
        }
      })

      // skip, if there are no originals
      // with the initial cursor
      if (uniqueOriginals.size === 0) {
        return cursor.fetch()
      }

      // we need to merge the query with our new added ids
      const originals = Array.from(uniqueOriginals)
      const originalsQuery = { _id: $in(originals) }
      const mergedQuery = { $or: [query, originalsQuery] }

      return collection.find(mergedQuery, projection).fetch()
    }),
    timeInterval: 10000,
    numRequests: 100
  }
}
