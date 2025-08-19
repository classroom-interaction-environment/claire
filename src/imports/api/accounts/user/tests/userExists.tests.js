/* eslint-env mocha */
import { stubUser, unstubUser } from '../../../../../tests/testutils/stubUser'
import { expect } from 'chai'
import { Random } from 'meteor/random'
import { userExists } from '../userExists'
import { clearCollections, mockCollections, restoreAllCollections } from '../../../../../tests/testutils/mockCollection'
import { Admin } from '../../../../contexts/system/accounts/admin/Admin'
import { Users } from '../../../../contexts/system/accounts/users/User'

describe(userExists.name, function () {
  before(function () {
    mockCollections(Admin, Users)
  })

  afterEach(function () {
    clearCollections()
  })

  after(function () {
    restoreAllCollections()
  })

  it('returns false if no user exists for given id', function () {
    expect(userExists({})).to.equal(false)
    expect(userExists({ userId: '' })).to.equal(false)
    expect(userExists({ userId: Random.id() })).to.equal(false)
  })

  it('returns true if the user exists', function () {
    const _id = Random.id()
    stubUser({ _id })
    expect(userExists({ userId: _id })).to.equal(true)
    unstubUser(true, true)
  })
})
