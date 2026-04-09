import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { onClientExec } from './archUtils'

export const getCollection = (contextOrName) => {
  const name = typeof contextOrName === 'object'
    ? contextOrName.name
    : contextOrName

  const collection = Mongo.Collection.get(name)

  if (!collection) {
    throw new Meteor.Error('errors.collectionNotFound', `getCollection.notFoundByName${name}`, { name })
  }

  return collection
}

// TODO move into client startup somewhere
onClientExec(() => {
  const { assignToWindow } = require('../../utils/assignToWindow')
  assignToWindow({ getCollection })
})
