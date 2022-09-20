/* global Roles */
import { Meteor } from 'meteor/meteor'
import { stub, restore, isStubbed } from './stub'
import StubCollections from 'meteor/hwillson:stub-collections'

export const stubUser = function (userObj, userId, roles, group) {
  const userDefined = typeof userObj !== 'undefined'

  if (userDefined) {
    if (userObj !== null) {
      Meteor.users.upsert({ _id: userObj._id }, userObj)
      stub(Meteor, 'userId', () => userObj._id)
    }

    else {
      stub(Meteor, 'userId', () => null)
    }

    stub(Meteor, 'user', () => userObj)
  }

  if (!userDefined && typeof userId !== 'undefined') {
    stub(Meteor, 'user', () => userObj || null)
    stub(Meteor, 'userId', () => userId)
  }

  if (typeof roles !== 'undefined') {
    StubCollections.add([Meteor.roles])
    StubCollections.stub()
    stub(Roles, 'userIsInRole', (id, role, domain) => {
      if (userObj) {
        return id === userObj._id && roles.includes(role) && domain === group
      } else {
        return id === userId && roles.includes(role) && domain === group
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

  if (_id) {
    Meteor.users.remove(_id)
  }

  StubCollections.restore()
  restore(Roles, 'userIsInRole')
}
