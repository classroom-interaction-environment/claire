import { SchoolClass } from '../../../classroom/schoolclass/SchoolClass'
import { Lesson } from '../../../classroom/lessons/Lesson'
import { TaskResults } from '../TaskResults'
import { PermissionDeniedError } from '../../../../api/errors/types/PermissionDeniedError'
import { userIsAdmin } from '../../../../api/accounts/admin/userIsAdmin'
import { getCollection } from '../../../../api/utils/getCollection'

/**
 * Creates a query for all given references that contain the combination of lessonId, taskId and itemId.
 * @param references {object}
 * @param references.lessonId {string}
 * @param references.taskId {string}
 * @param references.itemId {string}
 * @returns {Mongo.Cursor}
 */
export const getAllTasksByItem = function run ({ references }) {
  const userId = this.userId
  const query = { $or: [] }

  references.forEach(({ lessonId, taskId, itemId }) => {
    if (!userIsAdmin(userId) && !Lesson.helpers.isTeacher({ userId, lessonId })) {
      throw new PermissionDeniedError(SchoolClass.errors.notMember)
    }

    query.$or.push({ lessonId, taskId, itemId })
  })

  return getCollection(TaskResults.name).find(query)
}
