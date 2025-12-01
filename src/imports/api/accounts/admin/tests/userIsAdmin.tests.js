import { Meteor } from 'meteor/meteor'
import { Random } from 'meteor/random'
import { Admin } from '../../../../contexts/system/accounts/admin/Admin'
import { userIsAdmin } from '../userIsAdmin'
import {
  clearCollections,
  mockCollections,
  restoreAllCollections
} from '../../../../../tests/testutils/mockCollection'
import { expect } from 'chai'
import { Users } from '../../../../contexts/system/accounts/users/User'

let AdminCollection
let UsersCollection

describe(userIsAdmin.name, () => {
  before(() => {
    [AdminCollection, UsersCollection] = mockCollections(Admin, Users)
  })
  afterEach(async () => {
    await clearCollections(Admin, Users)
  })
  after(async () => {
    await restoreAllCollections()
  })

  it('throws if userId is not given', async () => {
    const values = [false, null, undefined, 0, '']
    for (const val of values) {
      expect(await userIsAdmin(val)).to.equal(false)
    }
  })

  it('returns false if the user is not Admin', async () => {
    const userId =await UsersCollection.insertAsync({ username: Random.id() })
    expect(await userIsAdmin(Random.id())).to.equal(false)
    expect(await userIsAdmin(userId)).to.equal(false)
  })

  it('returns true if the user is in Admins', async () => {
    const userId = await UsersCollection.insertAsync({ username: Random.id() })
    await AdminCollection.insertAsync({ userId })
    expect(await userIsAdmin(userId)).to.equal(true)
  })
})
