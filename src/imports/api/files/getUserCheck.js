import { Meteor } from 'meteor/meteor'

const userExists = (userId) => !!(userId && Meteor.users.find({ _id: userId}).count() > 0)

export const getUserCheck = function () {

  /**
   *
   */
  return function validateUser (user, file, type) {
    console.debug('[FilesCollection]: validate user for', file.name, type, user)
    if (!userExists(user?._id)) {
      console.debug('user does not exist')
      return false
    }

    const userIsOwner = user._id === file.userId
    const fileIsCurriculum = file._master === true

    if (type === 'upload') {
      // TODO validate content in meta {}
      return true
    }

    if (type === 'remove') {
      return userIsOwner
    }

    if (type === 'download') {
      console.debug('permit download')
      return true // TODO determine read access by lesson and class membership
    }

    throw new Error('unexpected code reach')
  }
}
