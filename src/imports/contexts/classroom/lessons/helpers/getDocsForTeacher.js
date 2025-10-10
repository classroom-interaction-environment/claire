import { checkIsTeacher } from './checkIsTeacher'
import { PermissionDeniedError } from '../../../../api/errors/types/PermissionDeniedError'
import { SchoolClass } from '../../schoolclass/SchoolClass'
import { createDocGetter } from '../../../../api/utils/document/createDocGetter'
import { Lesson } from '../Lesson'

let getLessonDoc
let getClassDoc

/**
 * Gets lessonDoc and classDoc for a given userId and lessonId,
 * if the user is teacher of the class or admin
 * @private
 * @param userId
 * @param lessonId
 * @return {Promise<{classDoc: Object, lessonDoc: Object}>}
 */
export const getDocsForTeacher = async ({ userId, lessonId }) => {
  if (!getLessonDoc) getLessonDoc = createDocGetter({ name: Lesson.name })
  if (!getClassDoc) getClassDoc = createDocGetter({ name: SchoolClass.name })
  const lessonDoc = await getLessonDoc(lessonId)
  const classDoc = await getClassDoc(lessonDoc.classId)

  if (!await checkIsTeacher({ classDoc, userId })) {
    throw new PermissionDeniedError(SchoolClass.errors.notTeacher, { userId, lessonId })
  }

  return { lessonDoc, classDoc }
}
