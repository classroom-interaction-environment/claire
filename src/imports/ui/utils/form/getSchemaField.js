/* global AutoForm */
import { Meteor } from 'meteor/meteor'

export const getSchemaField = (() => {
  if (Meteor.isClient) {
    return name => name && AutoForm && AutoForm.getFieldValue(name)
  }

  if (Meteor.isServer) {
    return function (name) {
      return this.field(name)
    }
  }
})()
