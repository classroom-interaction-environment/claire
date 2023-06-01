import { Meteor } from 'meteor/meteor'
import { Roles } from 'meteor/alanning:roles'
import { stub, restore, isStubbed } from './stub'
import { getUsersCollection } from '../../imports/api/utils/getUsersCollection'

export const stubUser = function (userObj, userId, roles, institution) {
  const userIsDefined = typeof userObj !== 'undefined'
  const UsersCollection = getUsersCollection()

  if (userIsDefined) {
    if (userObj !== null) {
      UsersCollection.upsert({ _id: userObj._id }, { $set: { ...userObj } })
      stub(Meteor, 'userId', () => userObj._id)
    }

    else {
      stub(Meteor, 'userId', () => null)
    }

    stub(Meteor, 'user', () => userObj)
  }

  if (!userIsDefined && typeof userId !== 'undefined') {
    stub(Meteor, 'user', () => userObj || null)
    stub(Meteor, 'userId', () => userId)
  }

  if (typeof roles !== 'undefined') {
    stub(Roles, 'userIsInRole', (id, role, domain) => {
      if (userObj) {
        return id === userObj._id && roles.includes(role) && domain === institution
      }
      else {
        return id === userId && roles.includes(role) && domain === institution
      }
    })
  }
  return userObj ? userObj._id : userId
}

export const unstubUser = (user, userId) => {
  let _id

  if (user && isStubbed(Meteor, 'user')) {
    _id = Meteor.user()?._id
    restore(Meteor, 'user')
  }

  if (userId && isStubbed(Meteor, 'userId')) {
    _id = _id || Meteor.userId()
    restore(Meteor, 'userId')
  }

  getUsersCollection().remove(_id)
  restore(Roles, 'userIsInRole')
}
