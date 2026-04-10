import { Meteor } from 'meteor/meteor'

export const onServer = x => Meteor.isServer ? x : undefined
