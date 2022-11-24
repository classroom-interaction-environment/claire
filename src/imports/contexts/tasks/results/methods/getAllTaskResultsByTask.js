import { SchoolClass } from '../../../classroom/schoolclass/SchoolClass'
import { Lesson } from '../../../classroom/lessons/Lesson'
import { PermissionDeniedError } from '../../../../api/errors/types/PermissionDeniedError'
import { createDocGetter } from '../../../../api/utils/document/createDocGetter'
import { getCollection } from '../../../../api/utils/getCollection'
import { TaskResults } from '../TaskResults'
import { LessonHelpers } from '../../../classroom/lessons/LessonHelpers'

const getLessonDoc = createDocGetter(Lesson)

/**
 * Returns all task results for a given task (presumed, that the user is teacher/member of the lesson).
 * @param lessonId
 * @param taskId
 * @returns {*}
 */
export const getAllTaskResultsByTask = function ({ lessonId, taskId }) {
  const { userId } = this
  const lessonDoc = getLessonDoc({ _id: lessonId })
  const isTeacher = lessonDoc.createdBy === userId

  if (!isTeacher && !LessonHelpers.isMemberOfLesson({ userId, lessonId })) {
    throw new PermissionDeniedError(SchoolClass.errors.notMember)
  }

  const query = { lessonId }

  if (!isTeacher) {
    query.createdBy = userId
  }

  if (taskId) {
    query.taskId = taskId
  }

  return getCollection(TaskResults.name).find(query)
}
