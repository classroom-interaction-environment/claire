import { Meteor } from 'meteor/meteor'

const name = 'errors.docNotFound'

export class DocNotFoundError extends Meteor.Error {
  static get name () {
    return name
  }

  constructor (reason, details) {
    super(name, reason, details)
  }
}
