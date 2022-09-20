import { Meteor } from 'meteor/meteor'

const name = 'errors.notInvokedInMethod'

export class NotInMethodError extends Meteor.Error {
  static get name () {
    return name
  }

  constructor (reason, details) {
    super(name, reason, details)
  }
}
