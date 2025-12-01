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

describe(adminExists.name, () => {
  before(() => {
    [AdminCollection, UsersCollection] = mockCollections([Admin, { noSchema: true}], Users)
  })

  afterEach(async () => {
    await clearCollections(Admin)
  })

  after(async () => {
    await restoreAllCollections()
  })

  it('returns false if no admin exists', async () => {
    expect(await adminExists()).to.equal(false)
  })

  it('returns true if an admin exists', async () => {
    const userId = await UsersCollection.insertAsync({ username: Random.id() })
    await AdminCollection.insertAsync({ userId })
    expect(await adminExists()).to.equal(true)
  })
})
