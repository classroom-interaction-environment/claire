import { Meteor } from 'meteor/meteor'

const name = 'errors.unexpected'

export class UnexpectedError extends Meteor.Error {
  static get name () {
    return name
  }

  constructor (reason, details) {
    super(name, reason, details)
  }
}
