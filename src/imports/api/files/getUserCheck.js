import { Meteor } from 'meteor/meteor'
import { createLog } from '../log/createLog'
import { userIsCurriculum } from '../accounts/userIsCurriculum'

const userExists = (userId) => !!(userId && Meteor.users.find({ _id: userId }).count() > 0)
const debug = createLog({ name: 'validateUser', type: 'debug' })

export const getUserCheck = function () {
  return function validateUser (user, file, type) {
    debug('for', file.name, type, user?.emails)
    const userId = user?._id

    if (!userExists(userId)) {
      debug('user does not exist, deny', type, file.name)
      return false
    }

    const userIsOwner = user._id === file.userId
    const fileIsCurriculum = file._master === true

    if (type === 'upload') {
      if (fileIsCurriculum && !userIsCurriculum(userId)) {
        debug('upload to curriculum as as non-curriculum user denied')
        return false
      }

      // TODO validate content in meta {}
      debug('permitted upload')
      return true
    }

    if (type === 'remove') {
      return userIsOwner
    }

    if (type === 'download') {
      debug('download permitted')
      return true // TODO determine read access by lesson and class membership
    }

    throw new Error('unexpected code reach')
  }
}
