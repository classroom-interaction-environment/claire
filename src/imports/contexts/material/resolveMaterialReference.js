import { getCollection } from '../../api/utils/getCollection'
import { Material } from './Material'
import { getLocalCollection } from '../../infrastructure/collection/getLocalCollection'

export const resolveMaterialReference = refObj => {
  const { collection, document } = refObj

  if (!collection || !document) {
    return null
  }

  // since we support two ways to load material (subscribe or load) we also
  // need to support both ways to resolve the references here:
  // 1. use the collection (from subscriptions) as primary
  // 2. use the local collection (from method loading) as fallback
  // The collection is primary, because it always have the "latest" document
  // state via subscription, while the loaded doc could be outdated.
  const Context = Material.get(collection)
  const MaterialCollection = getCollection(collection)
  const LocalCollection = getLocalCollection(collection)
  const resolvedDocument = MaterialCollection.findOne(document) || LocalCollection.findOne(document)

  if (!resolvedDocument) {
    console.warn('could not resolve document for ', collection, document)
    console.info('May check subsc docs of this collection:', getCollection(collection).find().fetch())
    console.info('May check local docs of this collection:', getLocalCollection(collection).find().fetch())
  }

  return Object.assign({
    doc: resolvedDocument || {
      title: collection,
      name: collection,
      _id: document
    }
  }, Context)
}
