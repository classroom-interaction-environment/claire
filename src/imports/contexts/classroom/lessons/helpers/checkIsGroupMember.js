import { isGroupMember } from '../../group/helpers/isGroupMember'
import { PermissionDeniedError } from '../../../../api/errors/types/PermissionDeniedError'

export const checkIsGroupMember = (userId, groupDoc) => {
  if (!isGroupMember(userId, groupDoc)) {
    throw new PermissionDeniedError('group.notAMember', { userId, groupId: groupDoc._id })
  }
}
