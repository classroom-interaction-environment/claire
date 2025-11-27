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
import { collectPublication } from '../../../../../tests/testutils/collectPublication'
import { expectThrow } from '../../../../../tests/testutils/expectThrow'
import { count } from '../../../../utils/count'

describe(Group.name, () => {
  let GroupCollection
  let UsersCollection

  before(() => {
    [GroupCollection, UsersCollection] = mockCollections(Group, Users, Admin)
  })

  afterEach(async () => {
    await clearCollections(Group, Users)
  })

  after(async () => {
    await restoreAllCollections()
  })

  const checkExists = (fn, { env = {}, idName = '_id' } = {}) => {
    it('throws if the group does not exist', async () => {
      const _id = Random.id()
      await expectThrow({
        fn: () => fn.call(env, { [idName]: _id }),
        error: DocNotFoundError.name,
        reason: 'getDocument.docUndefined',
        details: { query: { _id }, name: Group.name }
      })
    })
  }

  const checkPermission = (fn, { idName = '_id', reason = 'errors.noPermission' } = {}) => {
    it('throws if the user has no permission to edit the group', async () => {
      const groupDoc = createGroupDoc()
      const userId = Random.id()
      const env = { userId }
      const _id = await GroupCollection.insertAsync(groupDoc)
      await expectThrow({
        fn: () => fn.call(env, { [idName]: _id }),
        error: PermissionDeniedError.name,
        reason,
        details: { [idName]: _id, userId }
      })
    })
  }

  describe('methods', () => {
    describe(Group.methods.save.name, () => {
      const saveGroup = Group.methods.save.run

      checkExists(saveGroup)
      checkPermission(saveGroup)

      it('creates a new group doc', async () => {
        const env = {}
        const groupDoc = createGroupDoc({ title: 'foobar' })
        expect(await count(GroupCollection)).to.equal(0)
        const groupId = saveGroup.call(env, groupDoc)
        expect(await count(GroupCollection)).to.equal(1)
        const { _id, ...savedDoc } = await GroupCollection.findOneAsync(groupId)
        expect(savedDoc).to.deep.equal(groupDoc)
      })

      it('updates a group doc', async () => {
        const userId = Random.id()
        const groupDoc = createGroupDoc({ createdBy: userId })
        const env = { userId }
        const groupId = await GroupCollection.insertAsync(groupDoc)
        delete groupDoc._id
        delete groupDoc.title

        const updated = await saveGroup.call(env, { _id: groupId, title: 'foobar' })
        expect(updated).to.equal(1)

        const { _id, title, ...savedDoc } = await GroupCollection.findOneAsync(groupId)
        expect(title).to.equal('foobar')
        expect(savedDoc).to.deep.equal(groupDoc)
      })
    })
    describe(Group.methods.users.name, () => {
      const getUsers = Group.methods.users.run

      checkExists(getUsers, { idName: 'groupId' })
      checkPermission(getUsers, { idName: 'groupId', reason: 'group.notAMember' })

      it('returns all members of the group with restricted fields if user is member', async () => {
        const u1 = await UsersCollection.insertAsync({
          username: 'jane',
          firstName: 'jane',
          lastName: 'doe',
          emails: [{ address: 'jane@example.com' }],
          presence: { status: 'offline' },
          services: {}
        })
        const u2 = await UsersCollection.insertAsync({
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
        const groupId = await GroupCollection.insertAsync(groupDoc)

        for (const userId of allUsers) {
          const users = await getUsers.call({ userId }, { groupId })
          expect(users.length).to.equal(allUsers.length - 1) // except callee user
          expect(users[0]._id).to.not.equal(userId)
          const userDoc = await UsersCollection.findOneAsync(users[0]._id)
          delete userDoc.username
          delete userDoc.emails
          delete userDoc.services
          expect(users[0]).to.deep.equal(userDoc)
        }

        // teacher gets all users
        const allMembers = await getUsers.call({ userId: createdBy }, { groupId })
        expect(allMembers.length).to.equal(allUsers.length)
      })
    })
    describe(Group.methods.update.name, () => {
      const updateGroup = Group.methods.update.run
      checkExists(updateGroup)
      checkPermission(updateGroup)
      it('updates a group doc', async () => {
        const userId = Random.id()
        const groupDoc = createGroupDoc({ createdBy: userId })
        const env = { userId }
        const groupId = await GroupCollection.insertAsync(groupDoc)
        delete groupDoc._id
        delete groupDoc.title

        const updated = await updateGroup.call(env, { _id: groupId, title: 'foobar' })
        expect(updated).to.equal(1)

        const { _id, title, ...savedDoc } = await GroupCollection.findOneAsync(groupId)
        expect(title).to.equal('foobar')
        expect(savedDoc).to.deep.equal(groupDoc)
      })
    })
    describe(Group.methods.delete.name, () => {
      const deleteGroup = Group.methods.delete.run
      checkExists(deleteGroup)
      checkPermission(deleteGroup)
      it('deletes a group doc', async () => {
        const userId = Random.id()
        const groupDoc = createGroupDoc({ createdBy: userId })
        const env = { userId }
        const groupId = await GroupCollection.insertAsync(groupDoc)
        delete groupDoc._id
        delete groupDoc.title

        const removed = await deleteGroup.call(env, { _id: groupId })
        expect(removed).to.equal(1)
        expect(await GroupCollection.findOneAsync(groupId)).to.deep.equal(undefined)
      })
    })
    describe(Group.methods.toggleMaterial.name, () => {
      const toggleGroup = Group.methods.toggleMaterial.run
      checkExists(toggleGroup)
      checkPermission(toggleGroup)
      it('makes invisible material visible', async () => {
        const userId = Random.id()
        const materialId = Random.id()
        const contextName = 'foobar'
        const groupProps = { createdBy: userId, material: [materialId] }
        const groupInput = createGroupDoc(groupProps)
        const env = { userId }
        const groupId = await GroupCollection.insertAsync(groupInput)
        await toggleGroup.call(env, { _id: groupId, materialId, contextName })

        const groupDoc = await GroupCollection.findOneAsync(groupId)
        expect(groupDoc).to.deep.equal({
          _id: groupId,
          createdBy: userId,
          material: [materialId],
          title: groupInput.title,
          unitId: groupInput.unitId,
          isAdhoc: false,
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
      it('makes visible material invisible', async () => {
        const userId = Random.id()
        const materialId = Random.id()
        const contextName = 'foobar'
        const groupProps = {
          createdBy: userId,
          material: [materialId],
          visible: [{ _id: materialId, context: contextName }]
        }
        const groupInput = createGroupDoc(groupProps)
        const env = { userId }
        const groupId = await GroupCollection.insertAsync(groupInput)
        await toggleGroup.call(env, { _id: groupId, materialId, contextName })

        const groupDoc = await GroupCollection.findOneAsync(groupId)
        expect(groupDoc).to.deep.equal({
          _id: groupId,
          createdBy: userId,
          material: [materialId],
          title: groupInput.title,
          unitId: groupInput.unitId,
          isAdhoc: false,
          maxUsers: groupInput.maxUsers,
          users: groupInput.users,
          visible: []
        })
      })
    })
    describe(Group.methods.get.name, () => {
      const getGroups = Group.methods.get.run

      it('returns an empty Array  for empty or unknown ids', async () => {
        const userId = Random.id()
        const env = { userId }
        expect(await getGroups.call(env, { ids: [] })).to.deep.equal([])
        expect(await getGroups.call(env, { ids: [Random.id()] })).to.deep.equal([])
        const groupId = await GroupCollection.insertAsync(createGroupDoc())
        // case if user does not own the docs
        expect(await getGroups.call(env, { ids: [groupId] })).to.deep.equal([])
      })
      it('returns given group docs', async () => {
        const userId = Random.id()
        const env = { userId }
        const groupId = await GroupCollection.insertAsync(createGroupDoc({ createdBy: userId }))
        expect(await getGroups.call(env, { ids: [groupId] })).to.deep.equal([await GroupCollection.findOneAsync(groupId)])
      })
    })
  })

  describe('publications', () => {
    const myGroupsPub = Group.publications.my.run
    const singleGroupPub = Group.publications.single.run

    describe(Group.publications.my.name, () => {
      it('returns no docs if user is neither owner, nor member', async () => {
        const userId = Random.id()
        await GroupCollection.insertAsync(createGroupDoc())
        const pub = await collectPublication(await myGroupsPub.call({ userId }))
        expect(pub.length).to.equal(0)
      })
      it('returns all group docs that user has created', async () => {
        const userId = Random.id()
        const groupId = await GroupCollection.insertAsync(createGroupDoc({ createdBy: userId }))
        const pub = await collectPublication(await myGroupsPub.call({ userId }))
        expect(pub.length).to.equal(1)
        expect(pub[0]._id).to.equal(groupId)
      })
      it('returns all group docs that user is member', async () => {
        const userId = Random.id()
        const groupId = await GroupCollection.insertAsync(createGroupDoc({ users: [{ userId }] }))
        const pub = await collectPublication(await myGroupsPub.call({ userId }))
        expect(pub.length).to.equal(1)
        expect(pub[0]._id).to.equal(groupId)
      })
      it('filters group docs by classId', async () => {
        const userId = Random.id()
        const classId = Random.id()
        await GroupCollection.insertAsync(createGroupDoc({ users: [{ userId }] }))
        const groupId = await GroupCollection.insertAsync(createGroupDoc({ users: [{ userId }], classId }))
        const pub = await collectPublication(await myGroupsPub.call({ userId }, { classId }))
        expect(pub.length).to.equal(1)
        expect(pub[0]._id).to.equal(groupId)
      })
      it('filters group docs by unitId', async () => {
        const userId = Random.id()
        const unitId = Random.id()
        await GroupCollection.insertAsync(createGroupDoc({ createdBy: userId }))
        const groupId = await GroupCollection.insertAsync(createGroupDoc({ users: [{ userId }], unitId }))
        const pub = await collectPublication(await myGroupsPub.call({ userId }, { unitId }))
        expect(pub.length).to.equal(1)
        expect(pub[0]._id).to.equal(groupId)
      })
    })
    describe(Group.publications.single.name, () => {
      it('returns no docs if no _id matches', async () => {
        const userId = Random.id()
        const groupId = Random.id()
        await GroupCollection.insertAsync(createGroupDoc({ users: [{ userId }] }))
        const pub = await collectPublication(singleGroupPub.call({ userId }, { groupId }))
        expect(pub.length).to.equal(0)
      })
      it('returns no docs if user is not member', async () => {
        const userId = Random.id()
        const groupId = await GroupCollection.insertAsync(createGroupDoc())
        const pub = await collectPublication(singleGroupPub.call({ userId }, { groupId }))
        expect(pub.length).to.equal(0)
      })
      it('returns a group doc by _id if the student is member', async () => {
        const userId = Random.id()
        const groupId = await GroupCollection.insertAsync(createGroupDoc({ users: [{ userId }] }))
        const pub = await collectPublication(singleGroupPub.call({ userId }, { groupId }))
        expect(pub.length).to.equal(1)
        expect(pub[0]._id).to.equal(groupId)
      })
    })
  })
})
