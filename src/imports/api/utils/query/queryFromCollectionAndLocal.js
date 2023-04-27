import { getCollection } from '../getCollection'
import { getLocalCollection } from '../../../infrastructure/collection/getLocalCollection'

export const queryFromCollectionAndLocal = (name, query) => {
  const collection = getCollection(name)
  const localCollection = getLocalCollection(name)
  const filesCollection = collection.filesCollection

  // we use a set to store unique ids and manage to skip already stored docs
  const ids = new Set()
  const allDocs = []

  // iterate subscribed collection first
  collection
    .find(query)
    .fetch()
    .forEach(t => {
      ids.add(t._id)
      allDocs.push({
        value: t._id,
        label: filesCollection ? t.name : t.title
      })
    })

  // then subscribe local collection
  localCollection
    .find(query)
    .fetch()
    .forEach(t => {
      if (ids.has(t._id)) return

      allDocs.push({
        value: t._id,
        label: filesCollection ? t.name : t.title
      })
    })

  // finally return merged documents from subscribed and local
  return allDocs
}
