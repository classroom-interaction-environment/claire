import { isStudent } from './isStudent'
import { isTeacher } from './isTeacher'
import { isOwner } from './isOwner'

/**
 * Returns true if the given userId is either creator, in teachers or on
 * students located. Otherwise returns false.
 * Returns also false if classDoc or userId are falsy.
 * @param classDoc {object} class document
 * @param userId {string} the user's _id to use for the check
 * @return {boolean}
 */
export const isMemberOfClass = ({ classDoc, userId }) => {
  if (typeof classDoc !== 'object' || typeof userId !== 'string') {
    return false
  }

  if (isOwner(userId, classDoc)) {
    return true
  }

  if (isTeacher(userId, classDoc)) {
    return true
  }

  return isStudent(userId, classDoc)
}
