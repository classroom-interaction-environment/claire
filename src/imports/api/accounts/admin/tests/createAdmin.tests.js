import { Admin } from '../../../../contexts/system/accounts/admin/Admin'
import { createAdmin } from '../createAdmin'
import { mockCollection } from '../../../../../tests/testutils/mockCollection'
import { Random } from 'meteor/random'
import { expect } from 'chai'

const AdminCollection = mockCollection(Admin)

describe(createAdmin.name, function () {
  beforeEach(function () {
    Meteor.users.remove({})
    AdminCollection.remove({})
  })

  it('throws if no userId is given', function () {
    expect(() => createAdmin()).to.throw('Match error: Failed Match.Where validation')
    expect(() => createAdmin('')).to.throw('Match error: Failed Match.Where validation')
  })
  it('throws if there is no user found for the given userId', function () {
    expect(() => createAdmin(Random.id())).to.throw('userId is invalid in null insert')
  })
  it('throws if the user is already an Admin', function () {
    const userId = Meteor.users.insert({ username: Random.id() })
    AdminCollection.insert({ userId })
    expect(() => createAdmin(userId)).to.throw('createAdmin.failed').with.property('reason', 'createAdmin.alreadyAdmin')
  })
  it(`inserts a userId to the ${Admin.name} collections`, function () {
    const userId = Meteor.users.insert({ username: Random.id() })
    const adminId = createAdmin(userId)
    const adminDoc = AdminCollection.findOne(adminId)

    expect(adminId).to.be.a('string')
    expect(adminDoc.userId).to.equal(userId)
  })
})
