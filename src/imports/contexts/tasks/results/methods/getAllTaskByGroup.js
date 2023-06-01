import { Group } from '../../../classroom/group/Group'
import { createDocGetter } from '../../../../api/utils/document/createDocGetter'
import { PermissionDeniedError } from '../../../../api/errors/types/PermissionDeniedError'
import { getCollection } from '../../../../api/utils/getCollection'
import { TaskResults } from '../TaskResults'

const getGroupDoc = createDocGetter(Group)

/**
 * Queries all task results for a given group by _id and item id.
 *
 * @param groupId {string}
 * @param itemId {string}
 * @returns {Mongo.Cursor}
 * @throws {PermissionDeniedError} if user is not in group
 */
export const getAllTasksByGroupAndItem = function ({ groupId, itemId }) {
  const { userId } = this

  // check if user is group member
  const groupDoc = getGroupDoc(groupId)
  const { users } = groupDoc

  if (!users || !users.length || !users.find(u => u && u.userId === userId)) {
    throw new PermissionDeniedError('group.notAMember', { userId, groupId })
  }

  const query = { groupId, itemId }
  return getCollection(TaskResults.name).find(query)
}
