import { DocNotFoundError } from '../../errors/types/DocNotFoundError'
import { PermissionDeniedError } from '../../errors/types/PermissionDeniedError'
import { userIsCurriculum } from '../../accounts/userIsCurriculum'
import { userIsAdmin } from '../../accounts/admin/userIsAdmin'

/**
 *
 * @param collection
 * @param docId
 * @param doc
 * @param userId
 * @return {any}
 */
export const checkOwnership = async ({ doc, collection, docId, userId}) => {
  const document = doc ?? await collection.findOneAsync(docId)
  if (!document) {
    throw new DocNotFoundError('', { docId, userId })
  }

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
  if (await userIsAdmin(userId)) {
    return document
  }

  return null
}
