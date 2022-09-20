import { Meteor } from 'meteor/meteor'

export class Log {
  constructur ({ name, devOnly }) {
    this.name = name
    this.devOnly = devOnly
  }

  error () {
  }

  warn () {
  }

  info () {
  }

  log () {
  }

  debug () {
  }
}
