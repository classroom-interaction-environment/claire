/**
 * checks, whether a user is one of the class teachers
 * @param userId
 * @param teachers
 * @return {*|boolean}
 */
export const isTeacher = (userId, { teachers = [] }) => userId && teachers.includes(userId)
