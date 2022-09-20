import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'

const _cache = new Map()

export const getCollection = function (contextOrName) {
  const name = typeof contextOrName === 'object'
    ? contextOrName.name
    : contextOrName

  let collection = _cache.get(name)

  if (!collection) {
    collection = Mongo.Collection.get(name)

    if (!collection) {
      throw new Meteor.Error('errors.collectionNotFound', name)
    }
    _cache.set(name, collection)
  }

  return collection
}
