import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { onClientExec } from './archUtils'

export const getCollection = function (contextOrName) {
  const name = typeof contextOrName === 'object'
    ? contextOrName.name
    : contextOrName

  const collection = Mongo.Collection.get(name)

  if (!collection) {
    const all = Mongo.Collection.getAll()
    throw new Meteor.Error('errors.collectionNotFound', 'getCollection.notFoundByName', { name, all })
  }

  return collection
}

// TODO move into client startup somewhere
onClientExec(function () {
  import { assignToWindow } from '../../utils/assignToWindow'
  assignToWindow({ getCollection })
})
