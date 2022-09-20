import { getCollection } from '../../api/utils/getCollection'
import { Material } from './Material'

/**
 * Loads material from a source list into a destination Object.
 * // TODO recursive until no deps are there anymore + security of 100 iterations
 * @param source
 * @param destination
 * @param dependencies
 */
export const loadMaterial = function ({ source = {}, destination = {}, dependencies = {} }) {
  Object.keys(source).forEach(contextName => {
    const materialDocIds = source[contextName]

    // if there is no material attached to this context, we can safely skip
    if (!materialDocIds || materialDocIds.length === 0) {
      //destination[contextName] = 0
      return
    }

    const materialCollection = getCollection(contextName)
    const materialQuery = {
      _id: { $in: source[contextName] }
    }

    const documents = materialCollection.find(materialQuery).fetch()

    if (documents.length !== materialDocIds.length) {
      destination['notFound'] = destination['notFound'] || []
      materialDocIds.forEach(materialId => {
        if (!documents.find(doc => doc._id === materialId)) {
          destination['notFound'].push({
            context: contextName,
            _id: materialId
          })
        }
      })
    }

    // a context may have dependencies and implement an own function to resolve
    // them, which in such case we use to map them into the dependencies object
    const materialContext = Material.get(contextName)

    if (materialContext?.material?.resolveDependencies) {
      documents.forEach(doc => materialContext.material.resolveDependencies(doc, dependencies))
    }

    if (!destination[contextName]) {
      destination[contextName] = []
    }

    destination[contextName].push(...documents)
  })
}
