import { Material } from './Material'
import { getCollection } from '../../api/utils/getCollection'
import { getLocalCollection } from '../../infrastructure/collection/getLocalCollection'

/**
 * Resolves a referenced material by context's collection name and document query.
 * Prefers subs-collection over local collection by default.
 *
 * TODO throw errors instead of returning null
 *
 * @param refObj {object}
 * @param refObj.collection {string} name of the corresponding material collection
 * @param refObj.document {object|string} query to get the document
 * @param options {object}
 * @param options.preferLocal {boolean=false}
 * @return {null|object}
 */
export const resolveMaterialReference = (refObj, { preferLocal = false } = {}) => {
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
  const resolvedDocument = preferLocal
    ? MaterialCollection.findOne(document) || LocalCollection.findOne(document)
    : MaterialCollection.findOne(document) || LocalCollection.findOne(document)

  if (!resolvedDocument) {
    console.warn('could not resolve document for ', collection, document)
    return null
  }

  return Object.assign({
    doc: resolvedDocument || {
      title: collection,
      name: collection,
      _id: document
    }
  }, Context)
}
