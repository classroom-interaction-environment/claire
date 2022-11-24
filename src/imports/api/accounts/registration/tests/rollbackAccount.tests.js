import { Random } from 'meteor/random'
import { Admin } from '../../../../contexts/system/accounts/admin/Admin'
import { Users } from '../../../../contexts/system/accounts/users/User'
import { rollbackAccount } from '../rollbackAccount'
import {
  clearCollections,
  mockCollections,
  restoreAllCollections
} from '../../../../../tests/testutils/mockCollection'
import { expect } from 'chai'



describe(rollbackAccount.name, function () {
  let AdminCollection
  let UsersCollection

  before(function () {
    [AdminCollection, UsersCollection] = mockCollections(Admin, Users)
  })
  afterEach(function () {
    clearCollections(Admin, Users)
  })
  after(function () {
    restoreAllCollections()
  })
  it('removes a user from the account system', function () {
    const userId = UsersCollection.insert({ username: Random.id() })
    expect(UsersCollection.find(userId).count()).to.equal(1)
    const { userRemoved, adminRemoved, rolesRemoved } = rollbackAccount(userId)
    expect(userRemoved).to.equal(1)
    expect(adminRemoved).to.equal(0)
    expect(rolesRemoved).to.equal(0)
    expect(UsersCollection.find(userId).count()).to.equal(0)
  })
  it('removes all roles from the user', function () {
    const userId =UsersCollection.insert({ username: Random.id() })
    const role = Random.id()
    const scope = Random.id()

    Roles.createRole(role)
    Roles.addUsersToRoles(userId, role)
    Roles.addUsersToRoles(userId, role, scope)

    expect(Meteor.roleAssignment.find({ 'user._id': userId }).count()).to.equal(2)
    expect(Roles.userIsInRole(userId, role)).to.equal(true)
    expect(Roles.userIsInRole(userId, role, scope)).to.equal(true)

    const { userRemoved, rolesRemoved, adminRemoved } = rollbackAccount(userId)
    expect(userRemoved).to.equal(1)
    expect(adminRemoved).to.equal(0)
    expect(rolesRemoved).to.equal(2)

    expect(Meteor.roleAssignment.find({ 'user._id': userId }).count()).to.equal(0)
    expect(Roles.userIsInRole(userId, role)).to.equal(false)
    expect(Roles.userIsInRole(userId, role, scope)).to.equal(false)
  })
  it('removes Admin status', function () {
    const userId = UsersCollection.insert({ username: Random.id() })
    AdminCollection.insert({ userId })

    const { userRemoved, rolesRemoved, adminRemoved } = rollbackAccount(userId)
    expect(userRemoved).to.equal(1)
    expect(adminRemoved).to.equal(1)
    expect(rolesRemoved).to.equal(0)

    expect(AdminCollection.find({ userId }).count()).to.equal(0)
  })
})
