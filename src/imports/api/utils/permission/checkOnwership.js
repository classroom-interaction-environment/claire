import { UserUtils } from '../../../contexts/system/accounts/users/UserUtils'
import { DocNotFoundError } from '../../errors/types/DocNotFoundError'
import { PermissionDeniedError } from '../../errors/types/PermissionDeniedError'
import { userIsCurriculum } from '../../accounts/userIsCurriculum'

/**
 *
 * @param collection
 * @param docId
 * @param userId
 * @return {any}
 */
export const checkOwnership = function (collection, docId, userId) {
  const cursor = collection.find(docId)
  const count = cursor.count()
  if (count !== 1) {
    throw new DocNotFoundError('', { docId, userId, count })
  }

  const document = cursor.fetch()[0]

  if (!userOwnsDocument(document, userId)) {
    throw new PermissionDeniedError('errors.youAreNowOwner', { userId, docId })
  }

  return document
}

export const userOwnsDocument = function (document, userId) {
  if (!document || !userId) return null

  // owners can always edit their documents
  if (document.createdBy === userId) {
    return document
  }

  // curriculum users have always acccess to curriculum docs
  if (document._master && userIsCurriculum(userId)) {
    return document
  }

  // administrators have always access to documents
  if (UserUtils.isAdmin(userId)) {
    return document
  }

  return null
}