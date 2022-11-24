import { Meteor } from 'meteor/meteor'
import { check } from 'meteor/check'
import { UserUtils } from '../../contexts/system/accounts/users/UserUtils'
import { getCollection } from './getCollection'
import { DocNotFoundError } from '../errors/types/DocNotFoundError'
import { UnexpectedError } from '../errors/types/UnexpectedError'
import { getFilesCollection } from './getFilesCollection'

/**
 * Checks ownership for a given document. Returns false if user is not given or the user does not own the document.
 * @deprecated use standalone method
 * @param document The document to be checked
 * @param userId the user that is to be checked as owner
 * @returns {boolean} true if owner, false otherwise
 */

export const ownerShip = (document, userId) => !!(userId && document && document.createdBy === userId)

/**
 * Factory function to create a document-getter that includes several safety-checks (collection exists,
 * document exists, ownership).
 * @deprecated use standalone method
 * @param name The name of the context, used to obtain the collection
 * @param checkOwner determines, whether the document is to be checked for ownership
 * @returns {function} A function to retrieve documents by _id
 */

export const createGetDoc = function ({ name } = {}, { checkOwner = true } = {}) {
  check(name, String)

  /**
   * Returns a document by a given _id.
   * @deprecated use standalone method
   * @param _id The id if the document to be returned.
   * @returns {Object} a document of a given collection, if found
   * @throws {Meteor.Error} if no collection is found by the given context
   * @throws {Meteor.Error} if no doc is found by the given _id
   * @throws {Meteor.Error} if current user is neither admin nor owner of the document.
   */

  function getDoc (_id) {
    // TODO update tests and uncomment:
    // if (!_id) throw new DocNotFoundError('errors.idUndefined', name)
    const Collection = getCollection(name)
    const document = Collection.findOne(_id)
    if (!document) throw new DocNotFoundError(_id, name)

    if (checkOwner && !(ownerShip(document, this.userId) || UserUtils.isAdmin(this.userId))) {
      throw new Meteor.Error('errors.permissionDenied', 'errors.notOwner', { _id, name, userId: this.userId })
    }

    return document
  }

  return getDoc
}

/**
 * Factory function to create a document-updater that includes several safety-checks (collection exists,
 * document exists, ownership).
 * @param name The name of the context, used to obtain the collection
 * @param checkOwner determines, whether the document is to be checked for ownership
 * @returns {function} A function to update documents by _id and modifier
 */
export const createUpdateDoc = function ({ name } = {}, { checkOwner = true } = {}) {
  check(name, String)

  /**
   * Updates a document by _id and modifier(s).
   * @deprecated use standalone method
   * @param _id The _id if the supposed document to be updated
   * @param $set optional modifier
   * @param $unset optional modifier
   * @param $addToSet optional modifier
   * @param $push optional modifier
   * @param $pull optional modifier
   * @returns {Number} 1 if the doc has been updated, 0 if not
   * @throws {Meteor.Error} if no modifier has been given
   * @throws {Meteor.Error} if no collection is found by the given context
   * @throws {Meteor.Error} if no doc is found by the given _id
   * @throws {Meteor.Error} if current user is neither admin nor owner of the document.
   */

  function updateDoc (_id, { $set, $unset, $addToSet, $push, $pull }) {
    if (!$set && !$unset && !$addToSet && !$push && !$pull) {
      throw new Meteor.Error('errors.insufficientArguments')
    }

    const Collection = getCollection(name)
    const document = Collection.findOne(_id)
    if (!document) throw new DocNotFoundError(_id)

    if (checkOwner && !(ownerShip(document, this.userId) || UserUtils.isAdmin(this.userId))) {
      throw new Meteor.Error('errors.permissionDenied', _id)
    }
    const modifier = {}
    if ($set) modifier.$set = $set
    if ($unset) modifier.$unset = $unset
    if ($addToSet) modifier.$addToSet = $addToSet
    if ($push) modifier.$push = $push
    if ($pull) modifier.$pull = $pull

    return Collection.update(_id, modifier)
  }

  return updateDoc
}

/**
 * Factory function to create a document-clone function, that includes several safety-checks (collection exists,
 * document exists, ownership).
 * @deprecated use standalone method
 * @param name The name of the context, used to obtain the collection
 * @param checkOwner determines, whether the document is to be checked for ownership
 * @returns {function} A function to update documents by _id and modifier
 */
export const createCloneDoc = function getClone ({ name } = {}) {
  check(name, String)

  /**
   * Clones a document by _id and modifier(s).
   * @param docId The _id if the supposed document to be cloned
   * @param $set optional modifier
   * @returns {String} docId of the new document, if the doc has been cloned, otherwise undefined
   * @throws {Meteor.Error} if no collection is found by the given context
   * @throws {Meteor.Error} if no doc is found by the given _id
   * @throws {Meteor.Error} if checkOwner is true and current user is neither admin nor owner of the document.
   */

  function cloneDoc (docId, { $set } = {}) {
    const Collection = getCollection(name)

    const sourceDoc = Collection.findOne(docId)

    if (!sourceDoc) {
      throw new DocNotFoundError('createCloneDoc.sourceNotFound', { name, docId })
    }

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

export const createRemoveDoc = function createRemoveDoc ({ name, isFilesCollection } = {}, { checkOwner = true, multiple = false } = {}) {
  check(name, String)

  if (multiple) {
    return function removeDocs (query) {
      const Collection = isFilesCollection
        ? getFilesCollection(name)
        : getCollection(name)
      const cursor = Collection.find(query)

      if (!cursor) {
        throw new DocNotFoundError(query, name)
      }

      if (checkOwner && !UserUtils.isAdmin(this.userId)) {
        cursor.forEach(document => {
          if (!ownerShip(document)) {
            throw new Meteor.Error('errors.permissionDenied', 'errors.notOwner', {
              _id: document._id,
              name,
              userId: this.userId
            })
          }
        })
      }

      let removed

      if (isFilesCollection) {
        removed = cursor.count()
        Collection.remove(query)
      }
      else {
        removed = Collection.remove(query)
      }

      return removed
    }
  }
  else {
    return function removeDoc (_id) {
      const Collection = isFilesCollection
        ? getFilesCollection(name)
        : getCollection(name)

      const document = Collection.findOne(_id)
      if (!document) throw new DocNotFoundError(_id, name)

      if (checkOwner && !(ownerShip(document, this.userId) || UserUtils.isAdmin(this.userId))) {
        throw new Meteor.Error('errors.permissionDenied', 'errors.notOwner', { _id, name, userId: this.userId })
      }

      let removed
      const query = { _id }
      if (isFilesCollection) {
        Collection.remove(query)
        removed = 1
      }
      else {
        removed = Collection.remove(query)
      }

      return removed
    }
  }
}
