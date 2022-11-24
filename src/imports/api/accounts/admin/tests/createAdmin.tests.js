import { Admin } from '../../../../contexts/system/accounts/admin/Admin'
import { Users } from '../../../../contexts/system/accounts/users/User'
import { createAdmin } from '../createAdmin'
import {
  clearCollection, clearCollections,
  mockCollections,
  restoreAllCollections
} from '../../../../../tests/testutils/mockCollection'
import { Random } from 'meteor/random'
import { expect } from 'chai'

let AdminCollection
let UsersCollection

describe(createAdmin.name, function () {
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
    expect(() => createAdmin()).to.throw('Match error: Failed Match.Where validation')
    expect(() => createAdmin('')).to.throw('Match error: Failed Match.Where validation')
  })
  it('throws if there is no user found for the given userId', function () {
    expect(() => createAdmin(Random.id())).to.throw('userId is invalid')
  })
  it('throws if the user is already an Admin', function () {
    const userId = UsersCollection.insert({ username: Random.id() })
    AdminCollection.insert({ userId })
    expect(() => createAdmin(userId)).to.throw('createAdmin.failed').with.property('reason', 'createAdmin.alreadyAdmin')
  })
  it(`inserts a userId to the ${Admin.name} collections`, function () {
    const userId = UsersCollection.insert({ username: Random.id() })
    const adminId = createAdmin(userId)
    const adminDoc = AdminCollection.findOne(adminId)

    expect(adminId).to.be.a('string')
    expect(adminDoc.userId).to.equal(userId)
  })
})
