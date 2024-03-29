import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { createLog } from '../../../../api/log/createLog'

if (Meteor.settings.patch?.admin) {
  const info = createLog({ name: 'patch admin' })
  const oldAdmins = new Mongo.Collection('Admins')
  const rawCollection = oldAdmins.rawCollection()

  if (oldAdmins.find().count() > 0) {
    info('found deprecated admin collection, will migrate')
    rawCollection.rename('admin')
  }

  rawCollection.drop()
}
