import { Mongo } from 'meteor/mongo'
import { createLog } from '../../api/log/createLog'
import {assignToWindow} from '../../utils/assignToWindow'

const cache = new Map()

/**
 * Returns or creates a local {Mongo.Collection} by given name.
 *
 * The local collection has an additional {add} function, which simplifies
 * the upsert mechanism.
 *
 * @param name {String} the name of the collection
 * @param debug {boolean} optional debug messages
 * @return {Mongo.Collection} a local Mongo.Collection
 */
export const getLocalCollection = function (name, { debug } = {}) {
  if (!cache.has(name)) {
    if (debug) {
      logDebug('create new for', name)
    }
    const localCollection = new Mongo.Collection(null)

    localCollection.add = function (doc) {
      if (!doc._id || localCollection.find(doc._id).count() === 0) {
        return localCollection.insert(doc)
      }

      return localCollection.update(doc._id, { $set: doc })
    }

    cache.set(name, localCollection)
  }

  return cache.get(name)
}

assignToWindow({ getLocalCollection })

const logDebug = createLog({ name: getLocalCollection.name, type: 'debug' })
