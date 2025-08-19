import { Meteor } from 'meteor/meteor'

export const onClientExec = fn => {
  if (Meteor.isClient) {
    return fn()
  }
}
