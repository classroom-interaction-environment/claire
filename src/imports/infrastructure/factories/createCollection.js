import { createCollectionFactory } from 'meteor/leaonline:collection-factory'
import { Schema } from '../../api/schema/Schema'
import { FactoryCollection } from './FactoryCollection'

const schemaFactory = Schema.create
const collectionFactory = createCollectionFactory({ schemaFactory, custom: FactoryCollection })

export const createCollection = function ({ name, schema, isFilesCollection, debug, explicit, preventHooks, noDefaultSchema }, { connection, idGeneration, transform, defineMutationMethods } = {}) {
  const collectionSchema = noDefaultSchema
    ? schema
    : Object.assign({}, Schema.getDefault(), schema)

  const options = { name, schema: collectionSchema }

  if (connection) options.connection = connection
  if (idGeneration) options.idGeneration = idGeneration
  if (transform) options.transform = transform
  if (defineMutationMethods) options.defineMutationMethods = defineMutationMethods

  const collection = collectionFactory(options)

  collection.setDebug(debug)

  return collection
}
