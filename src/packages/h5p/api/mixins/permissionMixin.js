import { Meteor } from 'meteor/meteor'

export const permissionMixin = options => {
  const originalRun = options.run
  const { permissions } = options

  options.run = function (...args) {
    const env = this
    const user = env.userId && Meteor.users.findOne(env.userId)

    if (!env.userId || !user) {
      throw new Meteor.Error('permissionDenied', 'notLoggedIn')
    }

    if (permissions && !Object.keys(permissions).every(permission => user.privileges[permission])) {
      throw new Meteor.Error('permissionDenied', 'insufficientPrivileges')
    }

    env.user = user
    return originalRun.call(env, ...args)
  }

  return options
}
