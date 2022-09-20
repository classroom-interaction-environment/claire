import { DocNotFoundError } from '../../errors/types/DocNotFoundError'

/**
 * Throws an error, if the given document is undefined or null
 * @param document
 * @param name
 * @param docId
 * @param userId
 */
export const ensureDocumentExists = ({ document, name, docId, userId }) => {
  if (typeof document === 'undefined' || document === null) {
    throw new DocNotFoundError('ensureDocumentExists.undefined', { context: name, userId, docId })
  }
}
