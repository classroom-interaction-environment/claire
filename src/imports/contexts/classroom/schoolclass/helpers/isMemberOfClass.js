/**
 * Returns true if the given userId is either creator, in teachers or on
 * students located. Otherwise returns false.
 * Returns also false if classDoc or userId are falsy.
 * @param classDoc {object} class document
 * @param userId {string} the user's _id to use for the check
 * @return {boolean}
 */
export const isMemberOfClass = ({ classDoc, userId }) => classDoc && userId &&
  !!(classDoc.createdBy === userId ||
    (classDoc.teachers && classDoc.teachers.indexOf(userId) > -1) ||
    (classDoc.students && classDoc.students.indexOf(userId) > -1))
