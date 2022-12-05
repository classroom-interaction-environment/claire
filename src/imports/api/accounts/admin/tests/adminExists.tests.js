import { Admin } from '../../../../contexts/system/accounts/admin/Admin'
import { adminExists } from '../adminExists'
import {
  clearCollections,
  restoreAllCollections, mockCollections
} from '../../../../../tests/testutils/mockCollection'
import { Random } from 'meteor/random'
import { expect } from 'chai'
import { Users } from '../../../../contexts/system/accounts/users/User'

let AdminCollection
let UsersCollection

describe(adminExists.name, function () {
  before(function () {
    [AdminCollection, UsersCollection] = mockCollections(Admin, Users)
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
    const userId = UsersCollection.insert({ username: Random.id() })
    AdminCollection.insert({ userId })
    expect(adminExists()).to.equal(true)
  })
})
