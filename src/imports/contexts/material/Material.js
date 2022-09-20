import { createContextRegistry } from '../../infrastructure/datastructures/createContextRegistry'
import { DoubleMap } from '../../infrastructure/dataTypes/DoubleMap'
import { getLocalCollection } from '../../infrastructure/collection/getLocalCollection'

const contextMap = new DoubleMap()

export const Material = createContextRegistry({
  name: 'Material',

  /** @deprecated */
  setIdentity (context) {
    console.warn('[Material]: setIdentity is deprecated - ', context.name)
  },
  hasIdentity (context) {
    return context.isMaterial === true || typeof context.material === 'object'
  },
  hooks: {
    afterAdd (context) {
      if (context.fieldName) {
        contextMap.set(context.fieldName, context.name)
      }
    }
  }
})

/**
 * Some contexts define a field name, that differs from it's contextname.
 * Use this method to get the field name
 * @param contextName {String} name of the context
 * @return {String|undefined} the field name, if found
 */
Material.getFieldnameForContext = function getFieldnameForContext (contextName) {
  return contextMap.get(contextName)
}

/**
 * Some contexts define a field name, that differs from it's contextname.
 * Use this to get the context name by given field name.
 * @param fieldName {String} name of the document field
 * @return {String|undefined} the context name, if found
 */
Material.getContextNameForField = function getContextNameForField (fieldName) {
  return contextMap.get(fieldName)
}

/**
 * @deprecated TODO MOVE INTO OWN MODULE, DECOUPLE FROM MATERIAL
 * @param contextName
 * @param query
 * @param transform
 * @return {any}
 */
Material.getDocuments = function (contextName, query, transform) {
  const collection = getLocalCollection(contextName)
  if (!collection) throw new Error(`expected local collection by name ${contextName}`)

  return collection.find(query, transform).fetch()
}
