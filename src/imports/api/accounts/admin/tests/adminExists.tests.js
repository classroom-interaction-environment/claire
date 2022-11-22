import { Meteor } from 'meteor/meteor'
import { Admin } from '../../../../contexts/system/accounts/admin/Admin'
import { adminExists } from '../adminExists'
import {
  clearCollections,
  mockCollections,
  restoreAllCollections
} from '../../../../../tests/testutils/mockCollection'
import { Random } from 'meteor/random'
import { expect } from 'chai'

let AdminCollection

describe(adminExists.name, function () {
  before(function () {
    AdminCollection = mockCollections(Admin)
  })

  afterEach(function () {
    clearCollections(Admin)
  })

  after(function () {
    restoreAllCollections()
  })

  it('returns false if no admin exists', function () {
    expect(adminExists()).to.equal(false)
  })

  it('returns true if an admin exists', function () {
    const userId = Meteor.users.insert({ username: Random.id() })
    AdminCollection.insert({ userId })
    expect(adminExists()).to.equal(true)
  })
})
