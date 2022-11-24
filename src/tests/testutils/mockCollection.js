import { Mongo } from 'meteor/mongo'
import { Schema } from '../../imports/api/schema/Schema'
import Collection2 from 'meteor/aldeed:collection2'
import { Random } from 'meteor/random'
import { FilesCollection } from 'meteor/ostrio:files'

// XXX: backwards compat for pre 4.0 collection2
if (Collection2 && 'function' === typeof Collection2.load) {
  Collection2.load()
}

const originals = new Map()

Mongo.Collection.get = (name) => {
  return originals.get(name)
}

export const mockCollection = ({ name, schema } = {}, {
  noSchema = false,
  noDefaults = false,
  override = false,
  isFilesCollection = false
} = {}) => {
  let collection = Mongo.Collection.get(name)

  if (collection && override) {
    originals.delete(name)
  }

  if (collection) {
    return collection
  }

  else if (isFilesCollection) {
    const filesCollection = new FilesCollection({ collectionName: Random.id() })
    collection = filesCollection.collection
  }
  else {
    collection = new Mongo.Collection(null)
    collection._name = `${name}-mocked`
  }

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

export const restoreAllCollections = () => {
  clearAllCollections()
  originals.clear()
}

const clearCollection = ({ name }) => {
  const collection = originals.get(name)
  return collection && collection.remove({})
}

export const clearCollections = (...contexts) => {
  return contexts.map(c => clearCollection(c))
}

export const clearAllCollections = () => {
  originals.forEach(collection => collection.remove({}))
}