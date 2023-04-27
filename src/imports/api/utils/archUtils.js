import { Meteor } from 'meteor/meteor'

export const onServer = x => Meteor.isServer ? x : undefined

export const onServerExec = fct => Meteor.isServer ? fct() : undefined

export const onClient = x => Meteor.isClient ? x : undefined

export const onClientExec = fct => Meteor.isClient ? fct() : undefined

// TODO rename to iife
export const auto = fct => fct()

export const isomporph = ({ client, server }) => {
  if (Meteor.isClient && client) {
    return client()
  }
  if (Meteor.isServer && server) {
    return server()
  }
  return null
}
