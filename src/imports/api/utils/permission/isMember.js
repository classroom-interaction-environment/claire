import { isOwner } from './isOwner'
import { isTeacher } from './isTeacher'
import { isStudent } from './isStudent'

/**
 * Checks, whether a user is member of a given class
 * @param userId
 * @param createdBy
 * @param teachers
 * @param students
 * @return {*|boolean}
 */
export const isMember = (userId, { createdBy, teachers, students }) =>
  isOwner(userId, { createdBy }) || isTeacher(userId, { teachers }) || isStudent(userId, { students })
