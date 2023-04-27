import { Admin } from '../../../../contexts/system/accounts/admin/Admin'
import { removeAdmin } from '../removeAdmin'
import {
  mockCollections,
  clearCollections,
  restoreAllCollections
} from '../../../../../tests/testutils/mockCollection'
import { Random } from 'meteor/random'
import { expect } from 'chai'
import { Users } from '../../../../contexts/system/accounts/users/User'

let AdminCollection
let UsersCollection

describe(removeAdmin.name, function () {
  before(function () {
    [AdminCollection, UsersCollection] = mockCollections(Admin, Users)
  })

  afterEach(function () {
    clearCollections(Admin, Users)
  })

  after(function () {
    restoreAllCollections()
  })

  it('throws if no userId is given', function () {
    expect(() => removeAdmin()).to.throw('Match error: Failed Match.Where validation')
    expect(() => removeAdmin('')).to.throw('Match error: Failed Match.Where validation')
  })

  it('throws if there is no user found for the given userId', function () {
    expect(() => removeAdmin(Random.id()))
      .to.throw('removeAdmin.failed')
      .with.property('reason', 'errors.userNotFound')
  })

  it('throws if the given userId is not in Admins', function () {
    const userId = UsersCollection.insert({ username: Random.id() })
    expect(() => removeAdmin(userId))
      .to.throw('removeAdmin.failed')
      .with.property('reason', 'removeAdmin.notAdmin')
  })

  it('removes the userId from the Admins', function () {
    const userId = UsersCollection.insert({ username: Random.id() })
    const adminId = AdminCollection.insert({ userId })
    expect(removeAdmin(userId)).to.equal(1)
    expect(AdminCollection.find(adminId).count()).to.equal(0)
  })
})
