import { Mongo } from 'meteor/mongo'
import { Schema } from '../../imports/api/schema/Schema'

const _locals = {}

Mongo.Collection.get = name => _locals[name]

export const mockCollection = ({ name, schema } = {}, { noSchema = false, override = false } = {}) => {
  let collection = Mongo.Collection.get(name)

  if (collection) {
    collection.remove({})

    if (override) {
      delete _locals[name]
    }

    else {
      return collection
    }
  }

  collection = new Mongo.Collection(null)

  if (!noSchema) {
    const schemaInstance = Schema.withDefault(schema)
    collection.attachSchema(schemaInstance)
  }

  _locals[name] = collection

  return collection
}
