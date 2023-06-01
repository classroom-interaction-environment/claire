import { Lesson } from './Lesson'
import { SchoolClass } from '../schoolclass/SchoolClass'
import { createDocGetter } from '../../../api/utils/document/createDocGetter'
import { PermissionDeniedError } from '../../../api/errors/types/PermissionDeniedError'
import { isMemberOfClass } from '../schoolclass/helpers/isMemberOfClass'

const getLessonDoc = createDocGetter(Lesson)
const getClassDoc = createDocGetter(SchoolClass)

/**
 * Utility functions for common checks around lessons.
 */
export const LessonHelpers = {}

/**
 * @param lessonDoc
 * @param taskId
 * @return {*|boolean}
 */
LessonHelpers.taskIsEditable = function taskIsEditable ({ lessonDoc = {}, taskId, groupDoc = {} }) {
  const isEditable = ref => ref._id === taskId
  return (lessonDoc.visibleStudent || []).some(isEditable) || (groupDoc.visible || []).some(isEditable)
}

/**
 * Gets a classDoc, if given user is student
 * @param classId The _id of classDoc, where the user should be member of
 * @param userId the id of the user
 * @returns {classDoc}
 */

LessonHelpers.getClassDocIfStudent = function getClassDocIfStudent ({ userId, classId }) {
  const classDoc = getClassDoc(classId)

  if (!isMemberOfClass({ classDoc, userId })) {
    throw new PermissionDeniedError(SchoolClass.errors.notMember, { userId, classId })
  }

  return classDoc
}

/**
 * Checks if the given user is member of a given lesson
 * use isMemberOfClass
 * @param userId
 * @param lessonId
 * @param returnDocs
 * @return {boolean}
 */
LessonHelpers.isMemberOfLesson = function isMemberOfLesson ({ userId, lessonId } = {}, { returnDocs = false } = {}) {
  const lessonDoc = getLessonDoc(lessonId)
  const { classId } = lessonDoc
  const classDoc = classId && getClassDoc(classId)
  return isMemberOfClass({ classDoc, userId })
}

LessonHelpers.isMemberOfClass = ({ classDoc, userId }) => isMemberOfClass({ classDoc, userId })

/**
 * Checks if the given user is teacher of the lesson, or if not, being teacher of the class.
 * @param userId The user to be checked
 * @param lessonId the id of the lesson document
 * @return {boolean} true if creator of lesson or class or member of class teachers
 */
LessonHelpers.isTeacher = function isTeacher ({ userId, lessonId }, { returnDocs = false } = {}) {
  const lessonDoc = getLessonDoc(lessonId)
  if (lessonDoc.createdBy === userId) return true

  const { classId } = lessonDoc
  const classDoc = getClassDoc(classId)
  const isTeacher = SchoolClass.helpers.isTeacher({ classDoc, userId })
  return returnDocs
    ? isTeacher && { lessonDoc, classDoc }
    : isTeacher
}

/**
 * @param userId
 * @param lessonId
 * @param returnDocs
 * @return {*}
 */
LessonHelpers.isStudentOfLesson = function isStudentOfLesson ({ userId, lessonId }, { returnDocs = false } = {}) {
  const lessonDoc = getLessonDoc(lessonId)
  const { classId } = lessonDoc
  const classDoc = getClassDoc(classId)
  const isStudent = !!(userId && classDoc.students && classDoc.students.indexOf(userId) > -1)
  return returnDocs
    ? isStudent && { lessonDoc, classDoc }
    : isStudent
}

/**
 * Gets lessonDoc and classDoc if the userId is a teacher
 * @param userId
 * @param lessonId
 * @return {{lessonDoc: object, classDoc: object}}
 */

LessonHelpers.docsForTeacher = function docsForTeacher ({ userId, lessonId }) {
  const lessonDoc = getLessonDoc(lessonId)
  const classDoc = getClassDoc(lessonDoc.classId)

  if (!SchoolClass.helpers.isTeacher({ classDoc, userId })) {
    throw new PermissionDeniedError(SchoolClass.errors.notTeacher, { userId, lessonId })
  }
  return { lessonDoc, classDoc }
}

/**
 * Returns lessonDoc and classDoc if user is a student of the class
 * @param userId
 * @param lessonId
 * @return {{lessonDoc: *, classDoc: *}}
 */

LessonHelpers.docsForStudent = function docsForStudent ({ userId, lessonId }) {
  const lessonDoc = getLessonDoc(lessonId)
  const classDoc = getClassDoc(lessonDoc.classId)
  if (!SchoolClass.helpers.isStudent({ classDoc, userId })) {
    throw new PermissionDeniedError(SchoolClass.errors.notMember)
  }
  return { lessonDoc, classDoc }
}
