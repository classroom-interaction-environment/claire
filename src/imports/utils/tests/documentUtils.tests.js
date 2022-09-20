/* global describe it afterEach */
import { Random } from 'meteor/random'
import { ownerShip, createGetDoc, createUpdateDoc, createCloneDoc } from '../../api/utils/documentUtils'
import { mockCollection } from '../../../tests/testutils/mockCollection'
import { UserUtils } from '../../contexts/system/accounts/users/UserUtils'
import { stub, restoreAll } from '../../../tests/testutils/stub'
import { expect } from 'chai'

describe('documentUtils', function () {
  afterEach(function () {
    restoreAll()
  })

  describe(ownerShip.name, function () {
    it('returns false if no doc exists', function () {
      expect(ownerShip()).to.equal(false)
    })
    it('returns false if not user is given', function () {
      expect(ownerShip({})).to.equal(false)
    })
    it('returns false if user is not owner of the doc', function () {
      expect(ownerShip({ createdBy: Random.id() }, Random.id())).to.equal(false)
    })
    it('returns true if user is owner of the doc', function () {
      const userId = Random.id()
      expect(ownerShip({ createdBy: userId }, userId)).to.equal(true)
    })
  })

  describe(createGetDoc.name, function () {
    const name = Random.id()
    const Context = { name }
    const Collection = mockCollection(Context, { noSchema: true })

    it('creates a getter function for a given context', function () {
      const getDoc = createGetDoc(Context)
      expect(getDoc).to.be.a('function')
    })

    it('throws if no collection is found by the given context', function () {
      const randomName = Random.id()
      const getDoc = createGetDoc({ name: randomName })
      expect(() => getDoc(Random.id())).to.throw('collectionNotFound', randomName)
    })
    it('throws if no doc is found by the given _id', function () {
      const getDoc = createGetDoc(Context, { noSchema: true })
      const docId = Random.id()
      expect(() => getDoc(docId)).to.throw('docNotFound', docId)
    })
    it('throws if current user is not owner of the document', function () {
      const getDoc = createGetDoc(Context)
      const docId = Collection.insert({ createdBy: Random.id() })

      stub(UserUtils, 'isAdmin', () => false)

      const exec = function () {
        return getDoc.call({ userId: Random.id() }, docId)
      }
      expect(exec).to.throw('permissionDenied', docId)
    })
    it('skips owner check if desired', function () {
      const getDoc = createGetDoc(Context, { checkOwner: false })
      const userId = Random.id()
      const docId = Collection.insert({ createdBy: userId })
      const expectedDoc = Collection.findOne(docId)

      const doc = getDoc.call({ userId }, docId)
      expect(doc).to.deep.equal(expectedDoc)
    })
    it('returns a document by given _id', function () {
      const getDoc = createGetDoc(Context)
      const userId = Random.id()
      const docId = Collection.insert({ createdBy: userId })
      const expectedDoc = Collection.findOne(docId)

      stub(UserUtils, 'isAdmin', () => true)

      const doc = getDoc.call({ userId }, docId)
      expect(doc).to.deep.equal(expectedDoc)
    })
  })

  describe(createUpdateDoc.name, function () {
    const name = Random.id()
    const Context = { name }
    const Collection = mockCollection(Context, { noSchema: true })

    it('creates a getter function for a given context', function () {
      const updateDoc = createUpdateDoc(Context)
      expect(updateDoc).to.be.a('function')
    })
    it('throws if no modifiers are given', function () {
      const updateDoc = createUpdateDoc(Context, { noSchema: true })
      const docId = Random.id()
      expect(() => updateDoc(docId, {})).to.throw('insufficientArguments')
    })
    it('throws if no collection is found by the given context', function () {
      const randomName = Random.id()
      const updateDoc = createUpdateDoc({ name: randomName })
      const modifier = { $set: { foo: 'bar' } }
      expect(() => updateDoc(Random.id(), modifier)).to.throw('collectionNotFound', randomName)
    })
    it('throws if no doc is found by the given _id', function () {
      const updateDoc = createUpdateDoc(Context, { noSchema: true })
      const docId = Random.id()
      const modifier = { $set: { foo: 'bar' } }
      expect(() => updateDoc(docId, modifier)).to.throw('docNotFound', docId)
    })
    it('throws if current user is not owner of the document', function () {
      const updateDoc = createUpdateDoc(Context)
      const docId = Collection.insert({ createdBy: Random.id() })
      const modifier = { $set: { foo: 'bar' } }

      stub(UserUtils, 'isAdmin', () => false)

      const exec = function () {
        return updateDoc.call({ userId: Random.id() }, docId, modifier)
      }
      expect(exec).to.throw('permissionDenied', docId)
    })
    it('skips owner check if desired', function () {
      const updateDoc = createUpdateDoc(Context, { checkOwner: false })
      const userId = Random.id()
      const modifier = { $set: { foo: 'bar' } }

      const docId = Collection.insert({ createdBy: userId })
      const expectedDoc = Collection.findOne(docId)
      expectedDoc.foo = 'bar'

      const updated = updateDoc.call({ userId: Random.id() }, docId, modifier)
      expect(updated).to.equal(1)

      const updatedDoc = Collection.findOne(docId)
      expect(updatedDoc).to.deep.equal(expectedDoc)
    })
    it('updates a document by given _id', function () {
      const updateDoc = createUpdateDoc(Context, { checkOwner: false })
      const userId = Random.id()
      const modifier = { $set: { foo: 'bar' } }

      const docId = Collection.insert({ createdBy: userId })
      const expectedDoc = Collection.findOne(docId)
      expectedDoc.foo = 'bar'

      const updated = updateDoc.call({ userId }, docId, modifier)
      expect(updated).to.equal(1)

      const updatedDoc = Collection.findOne(docId)
      expect(updatedDoc).to.deep.equal(expectedDoc)
    })
  })

  describe(createCloneDoc.name, function () {
    const name = Random.id()
    const Context = { name }
    const Collection = mockCollection(Context, { noSchema: true })

    it('creates a clone function for a given context', function () {
      const cloneDoc = createCloneDoc(Context)
      expect(cloneDoc).to.be.a('function')
    })

    it('throws if no collection is found by the given context', function () {
      const randomName = Random.id()
      const cloneDoc = createCloneDoc({ name: randomName })
      expect(() => cloneDoc(Random.id())).to.throw('collectionNotFound', randomName)
    })
    it('throws if no doc is found by the given _id', function () {
      const cloneDoc = createCloneDoc(Context, { noSchema: true })
      const docId = Random.id()
      expect(() => cloneDoc(docId)).to.throw('docNotFound', docId)
    })
    it('skips owner check if desired', function () {
      const cloneDoc = createCloneDoc(Context, { checkOwner: false })
      const userId = Random.id()
      const docId = Collection.insert({ createdBy: userId })
      const expectedDoc = Collection.findOne(docId)

      const doc = cloneDoc.call({ userId }, docId)
      expect(doc).to.not.equal(expectedDoc)
    })
    it('returns a document by given _id', function () {
      const cloneDoc = createCloneDoc(Context)
      const userId = Random.id()
      const docId = Collection.insert({ createdBy: userId })
      const expectedDoc = Collection.findOne(docId)

      stub(UserUtils, 'isAdmin', () => true)

      const doc = cloneDoc.call({ userId }, docId)
      expect(doc).to.not.equal(expectedDoc)
    })
  })
})
