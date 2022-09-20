import { Meteor } from 'meteor/meteor'

export const getHost = function () {
  if (Meteor.isServer) {
    return process.env.CURRICULUM_HOST || Meteor.settings.curriculum.host
  }

  return Meteor.isDevelopment ? Meteor.settings.public.curriculum.host : 'http://curriculum.caroapp.de'
}
