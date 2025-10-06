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
export const checkOwnership = async (collection, docId, userId) => {
  const cursor = collection.find(docId)
  const count = cursor.count()
  if (count !== 1) {
    throw new DocNotFoundError('', { docId, userId, count })
  }

  const document = cursor.fetch()[0]

  if (!await userOwnsDocument(document, userId)) {
    throw new PermissionDeniedError('errors.youAreNowOwner', { userId, docId })
  }

  return document
}

export const userOwnsDocument = async (document, userId) => {
  if (!document || !userId) {
    return null
  }

  // owners can always edit their documents
  if (document.createdBy === userId) {
    return document
  }

  // curriculum users have always acccess to curriculum docs
  if (document._master && await userIsCurriculum(userId)) {
    return document
  }

  // administrators have always access to documents
  if (await UserUtils.isAdmin(userId)) {
    return document
  }

  return null
}
