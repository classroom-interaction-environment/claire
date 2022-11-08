import { Meteor } from 'meteor/meteor'
import { Admin } from '../../../../contexts/system/accounts/admin/Admin'
import { removeAdmin } from '../removeAdmin'
import { mockCollection } from '../../../../../tests/testutils/mockCollection'
import { Random } from 'meteor/random'
import { expect } from 'chai'

const AdminCollection = mockCollection(Admin)

describe(removeAdmin.name, function () {
  beforeEach(function () {
    Meteor.users.remove({})
    AdminCollection.remove({})
  })

  it('throws if no userId is given', function () {
    expect(() => removeAdmin()).to.throw('Match error: Failed Match.Where validation')
    expect(() => removeAdmin('')).to.throw('Match error: Failed Match.Where validation')
  })

  it('throws if there is no user found for the given userId', function () {
    expect(() => removeAdmin(Random.id())).to.throw('removeAdmin.failed').with.property('reason', 'errors.userNotFound')
  })

  it('throws if the given userId is not in Admins', function () {
    const userId = Meteor.users.insert({ username: Random.id() })
    expect(() => removeAdmin(userId)).to.throw('removeAdmin.failed').with.property('reason', 'removeAdmin.notAdmin')
  })

  it('removes the userId from the Admins', function () {
    const userId = Meteor.users.insert({ username: Random.id() })
    const adminId = AdminCollection.insert({ userId })
    expect(removeAdmin(userId)).to.equal(1)
    expect(AdminCollection.find(adminId).count()).to.equal(0)
  })
})
