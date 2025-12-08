import { Mongo } from 'meteor/mongo'
import { Schema } from '../../imports/api/schema/Schema'
import { Random } from 'meteor/random'
import { FilesCollection } from 'meteor/ostrio:files'

const originals = new Map()

Mongo.Collection.get = (name) => {
  return originals.get(name)
}

export const mockCollection = ({ name, schema, isFilesCollection } = {}, {
  noSchema = false,
  noDefaults = false,
  override = false,
  isFilesCollection: explicitFilesCollection = false
} = {}) => {
  let collection = Mongo.Collection.get(name)

  if (collection && override) {
    originals.delete(name)
  }

  if (collection) {
    return collection
  }

  else if (isFilesCollection || explicitFilesCollection) {
    const filesCollection = new FilesCollection({ collectionName: Random.id() })
    collection = filesCollection.collection
  }
  else {
    collection = new Mongo.Collection(null)
  }

  collection._name = `${name}-mocked`

  if (schema && noSchema !== true) {
    const schemaInstance = noDefaults
      ? Schema.create(schema)
      : Schema.withDefault(schema)
    collection.attachSchema(schemaInstance)
  }

  originals.set(name, collection)

  return collection
}

export const mockCollections = (...collections) => {
  return collections.map(c => {
    return (Array.isArray(c))
      ? mockCollection(c[0], c[1])
      : mockCollection(c)
  })
}

export const restoreCollection = ({ name }) => {
  const collection = originals.get(name)
  return collection && originals.delete(name)
}

/**
 * Restores all mocked collections by clearing their data and removing them from the originals map.
 * @return {Promise<void>}
 */
export const restoreAllCollections = async () => {
  await clearAllCollections()
  originals.clear()
}

const clearCollection = async ({ name }) => {
  const collection = originals.get(name)
  return collection && collection.removeAsync({})
}

export const clearCollections = async (...contexts) => {
  for (const c of contexts) {
    await clearCollection(c)
  }
}

export const clearAllCollections = async () => {
  const all = Array.from(originals.values())
  for (const collection of all) {
      await collection.removeAsync({})
  }
}
