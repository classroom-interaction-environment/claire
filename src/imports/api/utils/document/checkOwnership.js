import { PermissionDeniedError } from '../../errors/types/PermissionDeniedError'
import { userOwnsDocument } from '../permission/checkOnwership'

export const checkOwnership = ({ document, context, userId }) => {
  const docId = document._id

  if (!userOwnsDocument(document, userId)) {
    throw new PermissionDeniedError('errors.notOwner', { context, docId, userId })
  }
}
