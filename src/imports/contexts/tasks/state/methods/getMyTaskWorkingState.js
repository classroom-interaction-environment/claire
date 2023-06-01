import { Features } from '../../../../api/config/Features'
import { getCollection } from '../../../../api/utils/getCollection'
import { TaskWorkingState } from '../TaskWorkingState'

export const getMyTaskWorkingState = function ({ lessonId, taskId, groupId }) {
  const createdBy = this.userId
  const query = { lessonId, createdBy }

  if (taskId) {
    query.taskId = taskId
  }

  if (groupId) {
    Features.ensure('groups')
    query.groupId = groupId
  }

  return getCollection(TaskWorkingState.name).find(query)
}
