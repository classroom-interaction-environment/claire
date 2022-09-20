import { Schema } from '../../schema/Schema'
import { createClone } from './createClone'
import { createGetAll } from './createGetAll'
import { createFindOne } from './createFindOne'
import { createRemove } from './createRemove'
import { createUpdate } from './createUpdate'
import { createInsert } from './createInsert'
import { createUpdateValidator } from '../../validation/createUpdateValidator'

// TODO move this files to decorators

const assignSchema = (expected, fallback = {}) => Object.assign({}, Schema.getDefault(), (expected || fallback))
const curriclumSchema = {
  _master: {
    type: Boolean,
    optional: true,
  }
}

/**
 * @deprecated
 * @param name
 * @param schema
 * @param methods
 * @return {boolean}
 */
export const createCurriculumMethods = function createCurriculumMethods ({ name, schema, methods }) {
  const methodsDefKeys = Object.keys(methods)
  const methodDefs = methodsDefKeys
    .map(key => methods[key])
    .filter(methodDef => typeof methodDef.run !== 'function')

  if (methodDefs.length === 0) {
    return false
  }

  const collectionName = name
  const options = { isCurriculum: true }

  methodsDefKeys.forEach(methodsDefKey => {
    const methodDef = methods[methodsDefKey]
    if (methodDef.run) return

    switch (methodsDefKey) {
      case 'insert':
        methodDef.run = createInsert(collectionName, options)
        methodDef.schema = assignSchema(methodDef.schema, schema, curriclumSchema)
        break
      case 'update':
        methodDef.run = createUpdate(collectionName, options)
        methodDef.schema = assignSchema(methodDef.schema)
        methodDef.validate = createUpdateValidator(schema)
        break
      case 'remove':
        methodDef.run = createRemove(collectionName, options)
        methodDef.schema = methodDef.schema || { _id: String }
        break
      case 'findOne':
      case 'get':
        methodDef.run = createFindOne(collectionName, options)
        methodDef.schema = methodDef.schema || { _id: String }
        break
      case 'all':
      case 'getAll':
        methodDef.run = createGetAll(collectionName, options)
        methodDef.schema = {
          ids: {
            type: Array,
            optional: true
          },
          'ids.$': String
        }
        break
      case 'clone':
        methodDef.run = createClone(collectionName, options)
        methodDef.schema = methodDef.schema || { _id: String }
        break
      default:
        throw new Error(`undefined run definitions for method [${methodDef.name}]`)
    }
  })

  return true
}
