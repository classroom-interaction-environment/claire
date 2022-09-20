import { check } from "meteor/check"
import { UnexpectedError } from '../../errors/types/UnexpectedError'
import { getCollection } from '../getCollection'
import { DocNotFoundError } from '../../errors/types/DocNotFoundError'

/**
 * Factory function to create a document-clone function, that includes several safety-checks (collection exists,
 * document exists, ownership).
 * @param name The name of the context, used to obtain the collection
 * @param checkOwner determines, whether the document is to be checked for ownership
 * @returns {function} A function to update documents by _id and modifier
 */
export const createDocCloner = function getClone ({ name } = {}) {
  check(name, String)

  /**
   * Clones a document by _id and modifier(s).
   * @param docId The _id if the supposed document to be cloned
   * @param $set optional modifier
   * @returns {String} docId of the new document, if the doc has been cloned, otherwise undefined
   * @throws {Meteor.Error} if no collection is found by the given context
   * @throws {Meteor.Error} if no doc is found by the given _id
   */

  function cloneDoc (docId, { $set } = {}) {
    const Collection = getCollection(name)

    const sourceDoc = Collection.findOne(docId)

    if (!sourceDoc) {
      throw new DocNotFoundError('createCloneDoc.sourceNotFound', { name, docId })
    }

    // if we clone a doc we always link to the original with this flag
    // note, that this link is only valid for one generation of ancestry
    sourceDoc._original = sourceDoc._id

    delete sourceDoc._id
    delete sourceDoc._master
    delete sourceDoc._custom
    delete sourceDoc.createdBy
    delete sourceDoc.createdAt
    delete sourceDoc.updatedBy
    delete sourceDoc.updatedAt

    const insertDoc = $set ? Object.assign({}, sourceDoc, $set) : sourceDoc

    // XXX: simple sanity check if we really have a new _id
    // Could be the case, when someone weirdly added the original _id to the $set
    const clonedDocId = Collection.insert(insertDoc)
    if (!clonedDocId || clonedDocId === docId) {
      throw new UnexpectedError('createCloneDoc.failed', { docId, clonedDocId })
    }

    return clonedDocId
  }

  return cloneDoc
}
