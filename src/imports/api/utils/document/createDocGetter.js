import { check, Match } from 'meteor/check'
import { getCollection } from '../getCollection'
import { DocNotFoundError } from '../../errors/types/DocNotFoundError'

/**
 * Factory function to create a document-getter that includes several safety-checks (collection exists,
 * document exists, ownership).
 * @param name The name of the context, used to obtain the collection
 * @param {boolean} optional use to skip doc not found errors
 * @returns {function} A function to retrieve documents by query
 */

export const createDocGetter = function ({ name, optional = false }) {
  check(name, String)
  check(optional, Match.Maybe(Boolean))

  let collection = null

  /**
   * Returns a document by a given _id.
   * @param query {String|Object} The id if the document to be returned.
   * @returns {Object} a document of a given collection, if found
   * @throws {Meteor.Error} if no collection is found by the given context
   * @throws {Meteor.Error} if no doc is found by the given _id
   * @throws {Meteor.Error} if current user is neither admin nor owner of the document.
   */

  function getDocument (query) {
    if (!['string', 'object'].includes(typeof query)) {
      throw new DocNotFoundError('getDocument.invalidQuery', { name, query })
    }

    collection = collection || getCollection(name)

    const document = collection.findOne(query)

    if (!optional && !document) {
      throw new DocNotFoundError('getDocument.docUndefined', { name, query })
    }

    return document
  }

  return getDocument
}