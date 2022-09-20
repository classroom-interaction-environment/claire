/* global AutoForm */

export const getSchemaField = (function () {
  if (Meteor.isClient) {
    return name => name &&  AutoForm && AutoForm.getFieldValue(name)
  }

  if (Meteor.isServer) {
    return function (name) {
      const self = this
      return self.field(name)
    }
  }
})()
