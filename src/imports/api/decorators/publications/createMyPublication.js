import { onServer } from '../../utils/archUtils'
import { getCollection } from '../../utils/getCollection'
import { $in } from '../../utils/query/inSelector'

export const createMyPublication = function ({ name, publicFields, schema, isFilesCollection }) {
  return {
    name: `${name}.publications.my`,
    schema: Object.assign({
      limit: {
        type: Number,
        max: 1000,
        optional: true
      }
    }, schema),
    run: onServer(function ({ limit, customFields = {} }) {
      const fsQuery = isFilesCollection ? { userId: this.userId } : { createdBy: this.userId }
      let query = Object.assign(customFields, fsQuery)

      const projection = {
        fields: publicFields || {}
      }

      if (limit) projection.limit = limit

      const collection = getCollection(name)
      const cursor = collection.find(query, projection)

      // we often create documents as "fork" of originals, so we need to
      // publish the originals, too!
      const uniqueOriginals = new Set()
      cursor.forEach(doc => {
        if (typeof doc._original === 'string') {
          uniqueOriginals.add(doc._original)
        }
      })

      // we need to merge the query with our new added ids
      const originals = Array.from(uniqueOriginals)

      if (originals.length) {
        const originalsQuery = { _id: $in(originals) }
        query = { $or: [query, originalsQuery] }
      }

      return collection.find(query, projection)
    }),
    timeInterval: 10000,
    numRequests: 100
  }
}
