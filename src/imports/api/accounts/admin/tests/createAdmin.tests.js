import { Admin } from '../../../../contexts/system/accounts/admin/Admin'
import { Users } from '../../../../contexts/system/accounts/users/User'
import { createAdmin } from '../createAdmin'
import {
  clearCollections,
  mockCollections,
  restoreAllCollections
} from '../../../../../tests/testutils/mockCollection'
import { Random } from 'meteor/random'
import { expect } from 'chai'
import { expectThrow } from '../../../../../tests/testutils/expectThrow'

let AdminCollection
let UsersCollection

describe(createAdmin.name, () => {
  before(() => {
    [AdminCollection, UsersCollection] = mockCollections(Admin, Users)
  })

  afterEach(async () => {
    await clearCollections(Admin, Users)
  })

  after(async () => {
    await restoreAllCollections()
  })

  it('throws if no userId is given', async () => {
    await expectThrow({
      fn: () => createAdmin(),
      message: 'Match error: Failed Match.Where validation'
    })
    await expectThrow({
      fn: () => createAdmin(''),
      message: 'Match error: Failed Match.Where validation'
    })
  })
  it('throws if there is no user found for the given userId', async () => {
    const userId = Random.id()
    await expectThrow({
      fn: () => createAdmin(userId),
      error: 'createAdmin.failed',
      reason: 'createAdmin.userNotFound',
      details: { adminId: userId }
    })
  })
  it('throws if the user is already an Admin',async () => {
    const userId = await UsersCollection.insertAsync({ username: Random.id() })
    await AdminCollection.insertAsync({ userId })
    await expectThrow({
      fn: () => createAdmin(userId),
      error: 'createAdmin.failed',
      reason: 'createAdmin.alreadyAdmin',
      details: { adminId: userId }
    })
  })
  it(`inserts a userId to the ${Admin.name} collections`, async () => {
    const userId = await UsersCollection.insertAsync({ username: Random.id() })
    const adminId = await createAdmin(userId)
    const adminDoc = await AdminCollection.findOneAsync(adminId)

    expect(adminId).to.be.a('string')
    expect(adminDoc.userId).to.equal(userId)
  })
})
