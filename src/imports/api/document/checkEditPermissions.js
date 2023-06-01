import { userIsAdmin } from '../accounts/admin/userIsAdmin'
import { userIsCurriculum } from '../accounts/userIsCurriculum'
import { DocNotFoundError } from '../errors/types/DocNotFoundError'
import { PermissionDeniedError } from '../errors/types/PermissionDeniedError'

export const checkEditPermission = ({ doc, userId }) => {
  if (!doc) {
    throw new DocNotFoundError()
  }

  // curriculum docs always require curriculum role, event if
  // user is the document owner, since the role can be revoked
  if (doc._master && userIsCurriculum(userId)) {
    throw new PermissionDeniedError('errors.userNotCurriculum', { _id: doc._id, userId })
  }

  // if user is not owner of the doc and is not admin
  // then this is also not possible, at least in this check
  const shared = doc._shared || []
  if (doc.createdBy !== userId && !shared.includes(userId) && !userIsAdmin(userId)) {
    throw new PermissionDeniedError('errors.noPermission', { _id: doc._id, userId })
  }

  // otherwise silently return and let execution continue
}
