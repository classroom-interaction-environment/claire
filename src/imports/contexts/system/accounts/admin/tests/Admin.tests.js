/* eslint-env mocha */
import { Admin } from '../Admin'
import { Meteor } from 'meteor/meteor'
import { Random } from 'meteor/random'
import { Accounts } from 'meteor/accounts-base'
import { onServerExec } from '../../../../../api/utils/archUtils'
import { restoreAll, stub } from '../../../../../../tests/testutils/stub'
import { UserUtils } from '../../users/UserUtils'
import { mockCollection } from '../../../../../../tests/testutils/mockCollection'
import { expect } from 'chai'
import { UserFactory } from '../../../../../api/accounts/registration/UserFactory'

const AdminCollection = mockCollection(Admin)

describe(Admin.name, function () {
  onServerExec(function () {
    describe('methods', function () {
      beforeEach(function () {
        AdminCollection.remove({})
        Meteor.users.remove({})
      })

      afterEach(function () {
        restoreAll()
      })

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
        it('makes a user admin if the role is given', function () {
          const userId = Random.id()
          stub(UserFactory, 'create', () => userId)
          stub(Accounts, 'sendEnrollmentEmail', () => userId)
          stub(Meteor.users, 'find', () => ({ count: () => 1 }))

          const created = createUser({ role: UserUtils.roles.admin })
          expect(created).to.equal(userId)
          expect(AdminCollection.find({ userId }).count()).to.equal(1)
        })
      })
      describe(Admin.methods.removeUser.name, function () {
        const remove = Admin.methods.removeUser.run

        it('throws if the user does not exists', function () {
          expect(() => remove({})).throw(Admin.errors.REMOVE_USER_NOT_EXISTS)
            .with.property('details', undefined)

          const _id = Random.id()
          expect(() => remove({ _id })).throw(Admin.errors.REMOVE_USER_NOT_EXISTS)
            .with.property('details', _id)
        })

        it('removes the user', function () {
          const _id = Random.id()
          stub(Meteor.users, 'find', () => ({ count: () => 1 }))
          stub(Meteor.users, 'remove', () => 1)

          const { adminRemoved, rolesRemoved, userRemoved } = remove({ _id })
          expect(adminRemoved).to.equal(0)
          expect(rolesRemoved).to.equal(0)
          expect(userRemoved).to.equal(1)
        })

        it('removes the roles', function () {
          const _id = Random.id()
          stub(Meteor.users, 'find', () => ({ count: () => 1 }))
          stub(Meteor.roleAssignment, 'remove', () => 1)

          const { adminRemoved, rolesRemoved, userRemoved } = remove({ _id })
          expect(adminRemoved).to.equal(0)
          expect(rolesRemoved).to.equal(1)
          expect(userRemoved).to.equal(0)
        })

        it('removes the admin', function () {
          const _id = Random.id()
          stub(Meteor.users, 'find', () => ({ count: () => 1 }))
          stub(AdminCollection, 'remove', () => 1)

          const { adminRemoved, rolesRemoved, userRemoved } = remove({ _id })
          expect(adminRemoved).to.equal(1)
          expect(rolesRemoved).to.equal(0)
          expect(userRemoved).to.equal(0)
        })
      })
      describe(Admin.methods.reinvite.name, function () {
        const reinvite = Admin.methods.reinvite.run

        it('throws if the user does not exist', function () {
          const thrown = expect(() => reinvite({})).to.throw('errors.docNotFound')
          thrown.with.property('reason', 'errors.userNotExists')
          thrown.with.property('details', undefined)

          const userId = Random.id()
          const thrownWithId = expect(() => reinvite({ userId })).to.throw('errors.docNotFound')
          thrownWithId.with.property('reason', 'errors.userNotExists')
          thrownWithId.with.property('details', userId)
        })
        it('sends an enrollment email', function () {
          const userId = Random.id()
          stub(Meteor.users, 'find', () => ({ count: () => 1 }))
          stub(Accounts, 'sendEnrollmentEmail', () => userId)
          expect(reinvite({ userId })).to.equal(userId)
        })
      })
      describe(Admin.methods.updateRole.name, function () {
        const updateRole = Admin.methods.updateRole.run

        it('throws if the user does not exist', function () {
          const thrown = expect(() => updateRole({})).to.throw('admin.updateRoleFailed')
          thrown.with.property('reason', Admin.errors.USER_NOT_FOUND)
          thrown.with.property('details', undefined)

          const userId = Random.id()
          const thrownWithId = expect(() => updateRole({ userId })).to.throw('admin.updateRoleFailed')
          thrownWithId.with.property('reason', Admin.errors.USER_NOT_FOUND)
          thrownWithId.with.property('details', userId)
        })
        it('throws if the role does not exist', function () {
          const userId = Random.id()
          const role = Random.id()
          stub(Meteor.users, 'find', () => ({ count: () => 1 }))
          const thrownWithId = expect(() => updateRole({ userId, role })).to.throw('admin.updateRoleFailed')
          thrownWithId.with.property('reason', 'roles.unknownRole')
          thrownWithId.with.property('details', role)
        })
        it('updates the user\'s role', function () {
          const userId = Random.id()
          const role = Random.id()

          stub(Meteor.users, 'find', () => ({ count: () => 1 }))
          stub(Roles, 'setUserRoles', () => true)
          stub(Roles, 'userIsInRole', () => userId)
          stub(UserUtils, 'roleExists', () => true)

          expect(updateRole({ userId, role })).to.equal(userId)
        })
        it('makes admin if not already admin and will be admin', function () {
          const userId = Random.id()
          const role = UserUtils.roles.admin

          stub(Meteor.users, 'find', () => ({ count: () => 1 }))
          stub(Meteor.users, 'findOne', () => ({ _id: userId }))
          stub(Roles, 'setUserRoles', () => true)
          stub(Roles, 'userIsInRole', () => userId)
          stub(UserUtils, 'roleExists', () => true)

          expect(AdminCollection.find().count()).to.equal(0)
          expect(updateRole({ userId, role })).to.equal(userId)
          expect(AdminCollection.find({ userId }).count()).to.equal(1)
        })
        it('remoes admin if already admin and will be non-admin', function () {
          const userId = Random.id()
          const role = Random.id()

          stub(Meteor.users, 'find', () => ({ count: () => 1 }))
          stub(Meteor.users, 'findOne', () => ({ _id: userId }))
          stub(Roles, 'setUserRoles', () => true)
          stub(Roles, 'userIsInRole', () => userId)
          stub(UserUtils, 'roleExists', () => true)

          AdminCollection.insert({ userId })
          expect(AdminCollection.find().count()).to.equal(1)
          expect(updateRole({ userId, role })).to.equal(userId)
          expect(AdminCollection.find().count()).to.equal(0)
        })
      })

      describe(Admin.methods.users.name, function () {
        it('returns all users', function () {
          const users = [{ _id: Random.id(), services: {} }, { _id: Random.id(), services: {} }, {
            _id: Random.id(),
            services: {}
          }]
          users.forEach(entry => {
            Meteor.users.insert(entry)
          })

          Admin.methods.users.run().forEach((userDoc, index) => {
            const expectedUser = users[index]
            expect(userDoc._id).to.equal(expectedUser._id)
            expect(userDoc.services).to.equal(undefined)
          })
        })
      })
    })
  })
})
