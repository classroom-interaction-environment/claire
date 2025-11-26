import { Lesson } from './Lesson'
import { SchoolClass } from '../schoolclass/SchoolClass'
import { createDocGetter } from '../../../api/utils/document/createDocGetter'
import { PermissionDeniedError } from '../../../api/errors/types/PermissionDeniedError'
import { isMemberOfClass } from '../schoolclass/helpers/isMemberOfClass'
import { deprecate } from '../../../infrastructure/functions/deprecate'
import { isTeacher } from '../schoolclass/helpers/isTeacher'
import { isStudent } from '../schoolclass/helpers/isStudent'
import { isOwner } from '../schoolclass/helpers/isOwner'

const getLessonDoc = createDocGetter(Lesson)
const getClassDoc = createDocGetter(SchoolClass)

/**
 * Utility functions for common checks around lessons.
 * @deprecated
 */
export const LessonHelpers = {}

/**
 * @param lessonDoc
 * @param taskId
 * @return {*|boolean}
 */
LessonHelpers.taskIsEditable = deprecate(({ lessonDoc = {}, taskId, groupDoc = {} }) => {
  const isEditable = ref => ref._id === taskId
  return (lessonDoc.visibleStudent || []).some(isEditable) || (groupDoc.visible || []).some(isEditable)
})

/**
 * Gets a classDoc, if given user is student
 * @param classId The _id of classDoc, where the user should be member of
 * @param userId the id of the user
 * @returns {classDoc}
 */

LessonHelpers.getClassDocIfStudent = deprecate(async ({ userId, classId }) => {
  const classDoc = await getClassDoc(classId)

  if (!isMemberOfClass({ classDoc, userId })) {
    throw new PermissionDeniedError(SchoolClass.errors.notMember, { userId, classId })
  }

  return classDoc
})

/**
 * Checks if the given user is member of a given lesson
 * use isMemberOfClass
 * @param userId
 * @param lessonId
 * @param returnDocs
 * @return {boolean}
 */
LessonHelpers.isMemberOfLesson = deprecate(async ({ userId, lessonId } = {}, { returnDocs = false } = {}) => {
  const lessonDoc = await getLessonDoc(lessonId)
  const { classId } = lessonDoc
  const classDoc = classId && await  getClassDoc(classId)
  return isMemberOfClass({ classDoc, userId })
})

/**
 * @deprecated
 * @type {(function({classDoc: Object, userId: string}): boolean)|*}
 */
LessonHelpers.isMemberOfClass = deprecate(isMemberOfClass, 'LessonHelpers.isMemberOfClass')

/**
 * Checks if the given user is teacher of the lesson, or if not, being teacher of the class.
 * @param userId The user to be checked
 * @param lessonId the id of the lesson document
 * @return {boolean} true if creator of lesson or class or member of class teachers
 */
LessonHelpers.isTeacher = deprecate(async ({ userId, lessonId }, { returnDocs = false } = {}) => {
  const lessonDoc = await getLessonDoc(lessonId)
  if (lessonDoc.createdBy === userId) return true

  const { classId } = lessonDoc
  const classDoc = await getClassDoc(classId)
  const userIsTeacher = isTeacher(userId, classDoc) || isOwner(userId, classDoc)
  return returnDocs
    ? userIsTeacher && { lessonDoc, classDoc }
    : userIsTeacher
})

/**
 * @param userId
 * @param lessonId
 * @param returnDocs
 * @return {*}
 */
LessonHelpers.isStudentOfLesson = deprecate(async ({ userId, lessonId }, { returnDocs = false } = {}) => {
  const lessonDoc = getLessonDoc(lessonId)
  const { classId } = lessonDoc
  const classDoc = getClassDoc(classId)
  const isStudent = !!(userId && classDoc.students && classDoc.students.indexOf(userId) > -1)
  return returnDocs
    ? isStudent && { lessonDoc, classDoc }
    : isStudent
})

/**
 * Gets lessonDoc and classDoc if the userId is a teacher
 * @deprecated
 * @param userId
 * @param lessonId
 * @return {{lessonDoc: object, classDoc: object}}
 */

LessonHelpers.docsForTeacher = deprecate(async ({ userId, lessonId }) => {
  const lessonDoc = await getLessonDoc(lessonId)
  const classDoc = await getClassDoc(lessonDoc.classId)

  if (!isTeacher(userId, classDoc)) {
    throw new PermissionDeniedError(SchoolClass.errors.notTeacher, { userId, lessonId })
  }
  return { lessonDoc, classDoc }
})

/**
 * Returns lessonDoc and classDoc if user is a student of the class
 * @param userId
 * @param lessonId
 * @return {{lessonDoc: *, classDoc: *}}
 */

LessonHelpers.docsForStudent = deprecate(async ({ userId, lessonId }) => {
  const lessonDoc = await getLessonDoc(lessonId)
  const classDoc = await getClassDoc(lessonDoc.classId)
  if (!isStudent(userId, classDoc)) {
    throw new PermissionDeniedError(SchoolClass.errors.notMember)
  }
  return { lessonDoc, classDoc }
})
