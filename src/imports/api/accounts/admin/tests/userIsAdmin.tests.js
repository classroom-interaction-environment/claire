import { Meteor } from 'meteor/meteor'
import { Random } from 'meteor/random'
import { Admin } from '../../../../contexts/system/accounts/admin/Admin'
import { userIsAdmin } from '../userIsAdmin'
import { mockCollection } from '../../../../../tests/testutils/mockCollection'
import { expect } from 'chai'

const AdminCollection = mockCollection(Admin)

describe(userIsAdmin.name, function () {
  beforeEach(function () {
    Meteor.users.remove({})
    AdminCollection.remove({})
  })

  it('throws if no userId is given', function () {
    expect(() => userIsAdmin()).to.throw('Match error: Failed Match.Where validation')
    expect(() => userIsAdmin('')).to.throw('Match error: Failed Match.Where validation')
  })

  it('returns false if the user is not Admin', function () {
    const userId = Meteor.users.insert({ username: Random.id() })
    expect(userIsAdmin(Random.id())).to.equal(false)
    expect(userIsAdmin(userId)).to.equal(false)
  })

  it('returns true if the user is in Admins', function () {
    const userId = Meteor.users.insert({ username: Random.id() })
    AdminCollection.insert({ userId })
    expect(userIsAdmin(userId)).to.equal(true)
  })
})
