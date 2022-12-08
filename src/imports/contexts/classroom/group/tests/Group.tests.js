/* eslint-env mocha */
import { Random } from 'meteor/random'
import { Group } from '../Group'
import { expect } from 'chai'
import { mockCollections, restoreAllCollections, clearCollections } from '../../../../../tests/testutils/mockCollection'
import { Users } from '../../../system/accounts/users/User'
import { createGroupDoc } from '../../../../../tests/testutils/doc/createGroupDoc'
import { DocNotFoundError } from '../../../../api/errors/types/DocNotFoundError'
import { PermissionDeniedError } from '../../../../api/errors/types/PermissionDeniedError'
import { Admin } from '../../../system/accounts/admin/Admin'

describe(Group.name, function () {
  let GroupCollection
  let UsersCollection

  before(function () {
    [GroupCollection, UsersCollection] = mockCollections(Group, Users, Admin)
  })

  afterEach(function () {
    clearCollections(Group, Users)
  })

  after(function () {
    restoreAllCollections()
  })

  const checkExists = (fn) => {
    it('throws if the group does not exist', function () {
      const _id = Random.id()
      const thrown = expect(() => fn({ _id }))
        .to.throw(DocNotFoundError.name)
      thrown.with.property('reason', 'getDocument.docUndefined')
      thrown.with.deep.property('details', { query: { _id }, name: Group.name })
    })
  }

  const checkPermission = (fn) => {
    it('throws if the user has no permission to edit the group', function () {
      const groupDoc = createGroupDoc()
      const userId = Random.id()
      const env = { userId }
      const _id = GroupCollection.insert(groupDoc)
      const thrown = expect(() => fn.call(env, { _id }))
        .to.throw(PermissionDeniedError.name)
      thrown.with.property('reason', 'errors.noPermission')
      thrown.with.deep.property('details', { _id, userId })
    })
  }

  describe('methods', function () {
    describe(Group.methods.save.name, function () {
      const saveGroup = Group.methods.save.run

      checkExists(saveGroup)
      checkPermission(saveGroup)

      it('creates a new group doc', function () {
        const groupDoc = createGroupDoc({ title: 'foobar' })
        expect(GroupCollection.find().count()).to.equal(0)
        const groupId = saveGroup(groupDoc)
        expect(GroupCollection.find().count()).to.equal(1)
        const { _id, ...savedDoc } = GroupCollection.findOne(groupId)
        expect(savedDoc).to.deep.equal(groupDoc)
      })

      it('updates a group doc', function () {
        const userId = Random.id()
        const groupDoc = createGroupDoc({ createdBy: userId })
        const env = { userId }
        const groupId = GroupCollection.insert(groupDoc)
        delete groupDoc._id
        delete groupDoc.title

        const updated = saveGroup.call(env, { _id: groupId, title: 'foobar' })
        expect(updated).to.equal(1)

        const { _id, title, ...savedDoc } = GroupCollection.findOne(groupId)
        expect(title).to.equal('foobar')
        expect(savedDoc).to.deep.equal(groupDoc)
      })
    })
    describe(Group.methods.users.name, function () {
      const getUsers = Group.methods.users.run

      it('throws if the group does not exist', function () {
        const _id = Random.id()
        const thrown = expect(() => getUsers({ groupId: _id }))
          .to.throw(DocNotFoundError.name)
        thrown.with.property('reason', 'getDocument.docUndefined')
        thrown.with.deep.property('details', { query: { _id }, name: Group.name })
      })
      it('throws if not a member and not owner', function () {
        const userId = Random.id()
        const groupDoc = createGroupDoc()
        const groupId = GroupCollection.insert(groupDoc)
        const thrown = expect(() => getUsers.call({ userId }, { groupId }))
          .to.throw(PermissionDeniedError.name)
        thrown.with.property('reason', 'group.notAMember')
        thrown.with.deep.property('details', { groupId, userId })
      })
      it('returns all members of the group with restricted fields if user is member', function () {
        const u1 = UsersCollection.insert({
          username: 'jane',
          firstName: 'jane',
          lastName: 'doe',
          emails: [{ address: 'jane@example.com' }],
          presence: { status: 'offline' },
          services: {}
        })
        const u2 = UsersCollection.insert({
          username: 'john',
          firstName: 'john',
          lastName: 'doe',
          emails: [{ address: 'john@example.com' }],
          presence: { status: 'online' },
          services: {}
        })
        const allUsers = [u1, u2]
        const createdBy = Random.id()
        const groupDoc = createGroupDoc({ createdBy, users: allUsers.map(userId => ({ userId })) })
        const groupId = GroupCollection.insert(groupDoc)

        allUsers.forEach(userId => {
          const users = getUsers.call({ userId }, { groupId })
          expect(users.length).to.equal(allUsers.length - 1) // except callee user
          expect(users[0]._id).to.not.equal(userId)
          const userDoc = UsersCollection.findOne(users[0]._id)
          delete userDoc.username
          delete userDoc.emails
          delete userDoc.services
          expect(users[0]).to.deep.equal(userDoc)
        })

        // teacher gets all users
        const allMembers = getUsers.call({ userId: createdBy }, { groupId })
        expect(allMembers.length).to.equal(allUsers.length)
      })
    })
    describe(Group.methods.update.name, function () {
      const updateGroup = Group.methods.update.run
      checkExists(updateGroup)
      checkPermission(updateGroup)
      it('updates a group doc', function () {
        const userId = Random.id()
        const groupDoc = createGroupDoc({ createdBy: userId })
        const env = { userId }
        const groupId = GroupCollection.insert(groupDoc)
        delete groupDoc._id
        delete groupDoc.title

        const updated = updateGroup.call(env, { _id: groupId, title: 'foobar' })
        expect(updated).to.equal(1)

        const { _id, title, ...savedDoc } = GroupCollection.findOne(groupId)
        expect(title).to.equal('foobar')
        expect(savedDoc).to.deep.equal(groupDoc)
      })
    })
    describe(Group.methods.delete.name, function () {
      const deleteGroup = Group.methods.delete.run
      checkExists(deleteGroup)
      checkPermission(deleteGroup)
      it('deletes a group doc', function () {
        const userId = Random.id()
        const groupDoc = createGroupDoc({ createdBy: userId })
        const env = { userId }
        const groupId = GroupCollection.insert(groupDoc)
        delete groupDoc._id
        delete groupDoc.title

        const removed = deleteGroup.call(env, { _id: groupId })
        expect(removed).to.equal(1)
        expect(GroupCollection.findOne(groupId)).to.deep.equal(undefined)
      })
    })
    describe(Group.methods.toggleMaterial.name, function () {
      const toggleGroup = Group.methods.toggleMaterial.run
      checkExists(toggleGroup)
      checkPermission(toggleGroup)
      it('makes invisible material visible', function () {
        const userId = Random.id()
        const materialId = Random.id()
        const contextName = 'foobar'
        const groupProps = { createdBy: userId, material: [materialId] }
        const groupInput = createGroupDoc(groupProps)
        const env = { userId }
        const groupId = GroupCollection.insert(groupInput)
        toggleGroup.call(env, { _id: groupId, materialId, contextName })

        const groupDoc = GroupCollection.findOne(groupId)
        expect(groupDoc).to.deep.equal({
          _id: groupId,
          createdBy: userId,
          material: [materialId],
          title: groupInput.title,
          lessonId: groupInput.lessonId,
          maxUsers: groupInput.maxUsers,
          users: groupInput.users,
          visible: [
            {
              _id: materialId,
              context: contextName
            }
          ]
        })
      })
      it('makes visible material invisible', function () {
        const userId = Random.id()
        const materialId = Random.id()
        const contextName = 'foobar'
        const groupProps = { createdBy: userId, material: [materialId], visible: [{ _id: materialId, context: contextName }] }
        const groupInput = createGroupDoc(groupProps)
        const env = { userId }
        const groupId = GroupCollection.insert(groupInput)
        toggleGroup.call(env, { _id: groupId, materialId, contextName })

        const groupDoc = GroupCollection.findOne(groupId)
        expect(groupDoc).to.deep.equal({
          _id: groupId,
          createdBy: userId,
          material: [materialId],
          title: groupInput.title,
          lessonId: groupInput.lessonId,
          maxUsers: groupInput.maxUsers,
          users: groupInput.users,
          visible: []
        })
      })
    })
    describe(Group.methods.get.name, function () {
      const getGroups = Group.methods.get.run

      it('returns an empty Array  for empty or unknown ids', function () {
        expect(getGroups({ ids: [] })).to.deep.equal([])
        expect(getGroups({ ids: [Random.id()] })).to.deep.equal([])
        const groupId = GroupCollection.insert(createGroupDoc())
        // case if user does not own the docs
        expect(getGroups({ ids: [groupId] })).to.deep.equal([])
      })
      it('returns given group docs', function () {
        const userId = Random.id()
        const env = { userId }
        const groupId = GroupCollection.insert(createGroupDoc({ createdBy: userId }))
        expect(getGroups.call(env, { ids: [groupId] })).to.deep.equal([GroupCollection.findOne(groupId)])
      })
    })
  })
})
