import { Meteor } from 'meteor/meteor'
import { Users } from '../User'

export const getUser = function getUser ({ _id, userId }) {
  const userDoc = Meteor.users.findOne(_id)
  if (!userDoc) {
    throw new Meteor.Error(Users.errors.invalidUser, 'user.notFound', _id)
  }

  // for others remove presence and emails
  if (_id !== userId) {
    delete userDoc.presence
    delete userDoc.emails
  }

  // always remove services
  delete userDoc.services
  return userDoc
}
