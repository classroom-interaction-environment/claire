import { getCollection } from '../../api/utils/getCollection'
import { Material } from './Material'

/**
 * Loads material from a source list into a destination Object.
 * // TODO recursive until no deps are there anymore + security of 100 iterations
 * @async
 * @param source
 * @param destination
 * @param dependencies
 */
export const loadMaterial = async ({ source = {}, destination = {}, dependencies = {} }) => {
  for (const ctxName of Object.keys(source)) {
    const contextName = ctxName === 'imagefiles'
      ? 'imageFiles'
      : ctxName

    const materialDocIds = source[contextName]

    // if there is no material attached to this context, we can safely skip
    if (!materialDocIds || materialDocIds.length === 0) {
      // destination[contextName] = 0
      console.warn('skipping empty material context', contextName)
      continue
    }

    const materialCollection = getCollection(contextName)
    const materialQuery = {
      _id: { $in: source[contextName] }
    }
    const documents = await materialCollection.find(materialQuery).fetchAsync()
    console.debug('[loadMaterial]:', contextName, 'documents;', documents.length)

    if (documents.length !== materialDocIds.length) {
      destination.notFound = destination.notFound || []
      for (const materialId of materialDocIds) {
        if (!documents.find(doc => doc._id === materialId)) {
          destination.notFound.push({
            context: contextName,
            _id: materialId
          })
        }
      }
    }

    // a context may have dependencies and implement an own function to resolve
    // them, which in such case we use to map them into the dependencies object
    const materialContext = Material.get(contextName)

    if (materialContext?.material?.resolveDependencies) {
      for (const doc of documents) {
        materialContext.material.resolveDependencies(doc, dependencies)
      }
    }

    if (!destination[contextName]) {
      destination[contextName] = []
    }

    destination[contextName].push(...documents)
  }
}
