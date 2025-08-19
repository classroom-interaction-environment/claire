import { Meteor } from 'meteor/meteor'

export const onServerExec = fn => {
  if (Meteor.isServer) {
    return fn()
  }
}
