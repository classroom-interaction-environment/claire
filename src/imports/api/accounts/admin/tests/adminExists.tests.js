import { Meteor } from 'meteor/meteor'
import { Admin } from '../../../../contexts/system/accounts/admin/Admin'
import { adminExists } from '../adminExists'
import { mockCollection } from '../../../../../tests/testutils/mockCollection'
import { Random } from 'meteor/random'
import { expect } from 'chai'

const AdminCollection = mockCollection(Admin)

describe(adminExists.name, function () {
  beforeEach(function () {
    AdminCollection.remove({})
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
