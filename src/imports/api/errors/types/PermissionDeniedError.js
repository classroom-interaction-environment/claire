import { Meteor } from 'meteor/meteor'

const name = 'errors.permissionDenied'
const notInRole = 'errors.notInRole'

export class PermissionDeniedError extends Meteor.Error {
  static get name () {
    return name
  }

  static get notInRole () {
    return notInRole
  }

  constructor (reason, details) {
    super(name, reason, details)
  }
}
