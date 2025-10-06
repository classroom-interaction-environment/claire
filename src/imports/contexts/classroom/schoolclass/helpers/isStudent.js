/**
 * Checks, whether a user is a student of a given class
 * @param userId
 * @param students
 * @return {*|boolean}
 */
export const isStudent = (userId, { students = [] }) => userId && students.includes(userId)
