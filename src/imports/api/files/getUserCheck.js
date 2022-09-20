import { Meteor } from 'meteor/meteor'

function userExists (userId) {
  return !!(userId && Meteor.users.findOne(userId))
}

export const getUserCheck = function () {
  return function validateUser (user, file, type) {
    if (!userExists(user && user._id)) {
      return false
    }

    const isOwner = user._id === file.userId

    if (type === 'upload') {
      // TODO validate content in meta {}
      return true
    }

    if (type === 'remove') {
      return isOwner
    }

    if (type === 'download') {
      return true // TODO determine read access by lesson and class membership
    }

    throw new Error('unexpected code reach')
  }
}
