/* eslint-env mocha */
import { Roles } from 'meteor/alanning:roles'
import { Admin } from '../Admin'
import { Meteor } from 'meteor/meteor'
import { Random } from 'meteor/random'
import { Accounts } from 'meteor/accounts-base'
import { onServerExec } from '../../../../../api/utils/archUtils'
import { restoreAll, stub } from '../../../../../../tests/testutils/stub'
import { UserUtils } from '../../users/UserUtils'
import {
  clearAllCollections,
  mockCollections,
  restoreAllCollections
} from '../../../../../../tests/testutils/mockCollection'
import { expect } from 'chai'
import { UserFactory } from '../../../../../api/accounts/registration/UserFactory'
import { Users } from '../../users/User'
import { PermissionDeniedError } from '../../../../../api/errors/types/PermissionDeniedError'
import { DocNotFoundError } from '../../../../../api/errors/types/DocNotFoundError'

describe(Admin.name, function () {
  let AdminCollection
  let UsersCollection

  before(function () {
    [AdminCollection, UsersCollection] = mockCollections(Admin, Users)
  })

  afterEach(function () {
    restoreAll()
    clearAllCollections()
  })

  after(function () {
    restoreAllCollections()
  })

  onServerExec(function () {
    describe('methods', function () {
      describe(Admin.methods.createUser.name, function () {
        const createUser = Admin.methods.createUser.run

        it('creates a user and sends an enrollment email', function () {
          const userId = Random.id()
          stub(UserFactory, 'create', () => userId)
          stub(Accounts, 'sendEnrollmentEmail', () => userId)

          const created = createUser({})
          expect(created).to.equal(userId)
          expect(AdminCollection.find({ userId }).count()).to.equal(0)
        })
        it('throws if the user is not admin but role is admin', function () {
          const userId = UsersCollection.insert({ username: Random.id() })
          const env = { userId }
          const args = {
            firstName: Random.id(),
            lastName: Random.id(),
            email: Random.id(),
            institution: Random.id(),
            role: UserUtils.roles.admin
          }
          const expectThrow = expect(() => createUser.call(env, args))
            .to.throw(PermissionDeniedError.name)
          expectThrow.with.property('reason', 'roles.notAdmin')
          expectThrow.with.deep.property('details', { userId, ...args })
        })
        it('makes a user admin if the role is given and current user is admin', function () {
          stub(UserFactory, 'create', () => newUserId)
          stub(Accounts, 'sendEnrollmentEmail', () => newUserId)

          const userId = UsersCollection.insert({ username: Random.id() })
          const newUserId = UsersCollection.insert({ username: Random.id() })
          AdminCollection.insert({ userId })
          expect(AdminCollection.find({ userId }).count()).to.equal(1)

          const env = { userId }
          const created = createUser.call(env, { role: UserUtils.roles.admin })
          expect(created).to.equal(newUserId)
          expect(AdminCollection.find({ userId }).count()).to.equal(1)
          expect(AdminCollection.find({ userId: newUserId }).count()).to.equal(1)
        })
      })

      describe(Admin.methods.removeUser.name, function () {
        const removeUser = Admin.methods.removeUser.run

        it('throws if the user does not exists', function () {
          const _id = Random.id()
          const expectThrow = expect(() => removeUser({ _id }))
            .to.throw(DocNotFoundError.name)
          expectThrow.with.property('reason', 'user.notExist')
          expectThrow.with.deep.property('details', { _id })
        })

        it('throws if the users wants to delete themselves', function () {
          const _id = UsersCollection.insert({ username: Random.id() })
          const env = { userId: _id }
          const expectThrow = expect(() => removeUser.call(env, { _id }))
            .to.throw(PermissionDeniedError.name)
          expectThrow.with.property('reason', 'user.noSelfDelete')
          expectThrow.with.deep.property('details', { userId: _id, _id })
        })

        it('throws if the users is no admin but wants to remove an admin', function () {
          const execUserId = UsersCollection.insert({ username: Random.id() })
          const adminUserId = UsersCollection.insert({ username: Random.id() })
          AdminCollection.insert({ userId: adminUserId })
          const env = { userId: execUserId }
          const expectThrow = expect(() => removeUser.call(env, { _id: adminUserId }))
            .to.throw(PermissionDeniedError.name)
          expectThrow.with.property('reason', 'roles.notAdmin')
          expectThrow.with.deep.property('details', { userId: execUserId, _id: adminUserId })
        })

        it('removes the user', function () {
          const _id = UsersCollection.insert({ username: Random.id() })
          const { adminRemoved, rolesRemoved, userRemoved } = removeUser({ _id })
          expect(adminRemoved).to.equal(0)
          expect(rolesRemoved).to.equal(0)
          expect(userRemoved).to.equal(1)
        })

        it('removes the roles', function () {
          const _id = UsersCollection.insert({ username: Random.id() })
          stub(Meteor.roleAssignment, 'remove', () => 1)

          const { adminRemoved, rolesRemoved, userRemoved } = removeUser({ _id })
          expect(adminRemoved).to.equal(0)
          expect(rolesRemoved).to.equal(1)
          expect(userRemoved).to.equal(1)
        })

        it('removes the admin', function () {
          const execUserId = UsersCollection.insert({ username: Random.id() })
          AdminCollection.insert({ userId: execUserId })

          const adminUserId = UsersCollection.insert({ username: Random.id() })
          AdminCollection.insert({ userId: adminUserId })

          stub(Meteor.roleAssignment, 'remove', () => 1)

          const env = { userId: execUserId }
          const { adminRemoved, rolesRemoved, userRemoved } = removeUser.call(env, { _id: adminUserId })
          expect(adminRemoved).to.equal(1)
          expect(rolesRemoved).to.equal(1)
          expect(userRemoved).to.equal(1)
        })
      })

      describe(Admin.methods.reinvite.name, function () {
        const reinviteUser = Admin.methods.reinvite.run

        it('throws if the user does not exist', function () {
          const thrown = expect(() => reinviteUser({})).to.throw('errors.docNotFound')
          thrown.with.property('reason', 'errors.userNotExists')
          thrown.with.property('details', undefined)

          const userId = Random.id()
          const thrownWithId = expect(() => reinviteUser({ userId })).to.throw('errors.docNotFound')
          thrownWithId.with.property('reason', 'errors.userNotExists')
          thrownWithId.with.property('details', userId)
        })
        it('sends an enrollment email', function () {
          const userId = UsersCollection.insert({ username: Random.id() })
          stub(Accounts, 'sendEnrollmentEmail', () => userId)
          expect(reinviteUser({ userId })).to.equal(userId)
        })
      })

      describe(Admin.methods.updateRole.name, function () {
        const updateRole = Admin.methods.updateRole.run

        it('throws if the user does not exist', function () {
          const userId = Random.id()
          const env = { userId }
          const thrown = expect(() => updateRole.call(env, {})).to.throw('admin.updateRoleFailed')
          thrown.with.property('reason', Admin.errors.USER_NOT_FOUND)
          thrown.with.deep.property('details', { userId: undefined })
        })
        it('throws if the user wants to change their own role', function () {
          const userId = Random.id()
          const env = { userId }

          const thrownWithId = expect(() => updateRole.call(env, env)).to.throw('admin.updateRoleFailed')
          thrownWithId.with.property('reason', 'admin.noOwnRolesChangeAllowed')
          thrownWithId.with.deep.property('details', { userId })
        })
        it('throws if the role does not exist', function () {
          const userId = UsersCollection.insert({ username: Random.id() })
          const role = Random.id()
          const group = Random.id()
          const thrownWithId = expect(() => updateRole({ userId, role, group })).to.throw('admin.updateRoleFailed')
          thrownWithId.with.property('reason', 'roles.unknownRole')
          thrownWithId.with.deep.property('details', { userId, role, group })
        })
        it('updates the user\'s role', function () {
          const userId = UsersCollection.insert({ username: Random.id() })
          const role = Random.id()
          const group = Random.id()

          stub(Roles, 'setUserRoles', () => true)
          stub(Roles, 'userIsInRole', () => userId)
          stub(UserUtils, 'roleExists', () => true)

          expect(updateRole({ userId, role, group })).to.equal(1)
        })
        it('makes admin if not already admin and will be admin', function () {
          const execUserId = UsersCollection.insert({ username: Random.id() })
          const env = { userId: execUserId }
          AdminCollection.insert({ userId: execUserId })

          const newAdminUserId = UsersCollection.insert({ username: Random.id() })
          const role = UserUtils.roles.admin

          stub(Roles, 'setUserRoles', () => true)
          stub(Roles, 'userIsInRole', () => newAdminUserId)
          stub(UserUtils, 'roleExists', () => true)

          expect(AdminCollection.find({ userId: newAdminUserId }).count()).to.equal(0)
          expect(updateRole.call(env, { userId: newAdminUserId, role })).to.equal(1)
          expect(AdminCollection.find({ userId: newAdminUserId }).count()).to.equal(1)
        })
        it('removes admin if already admin and will be non-admin', function () {
          const execUserId = UsersCollection.insert({ username: Random.id() })
          const oldAdminUserId = UsersCollection.insert({ username: Random.id() })
          const env = { userId: execUserId }
          AdminCollection.insert({ userId: execUserId })
          AdminCollection.insert({ userId: oldAdminUserId })

          const role = UserUtils.roles.teacher

          stub(Roles, 'setUserRoles', () => true)
          stub(Roles, 'userIsInRole', () => oldAdminUserId)
          stub(UserUtils, 'roleExists', () => true)

          expect(AdminCollection.find({ userId: oldAdminUserId }).count()).to.equal(1)
          expect(updateRole.call(env, { userId: oldAdminUserId, role })).to.equal(1)
          expect(AdminCollection.find({ userId: oldAdminUserId }).count()).to.equal(0)
        })
      })

      describe(Admin.methods.users.name, function () {
        it('returns all users', function () {
          const users = [
            {
              _id: Random.id(), services: {}
            }, {
              _id: Random.id(), services: {}
            }, {
              _id: Random.id(), services: {}
            }]

          users.forEach(entry => {
            UsersCollection.insert(entry)
          })

          const ids = users.map(({ _id }) => _id)

          Admin.methods.users.run({ ids }).forEach((userDoc, index) => {
            const expectedUser = users[index]
            expect(userDoc._id).to.equal(expectedUser._id)
            expect(userDoc.services).to.equal(undefined)
          })
        })
      })
    })
  })
})
