/* eslint.env mocha */
import { loggedIn } from '../loggedIn'
import { assert } from 'chai'
import { Random } from 'meteor/random'
import { stub, restoreAll, overrideStub } from '../../../../../tests/testutils/stub'

describe('loggedIn', function () {
  let user

  beforeEach(function () {
    user = { _id: Random.id(), username: Random.id() }
  })

  afterEach(function () {
    restoreAll()
  })

  it('returns false on a logged out user', function () {
    stub(Meteor, 'userId', () => {})
    stub(Meteor, 'user', () => {})
    assert.isFalse(loggedIn())
  })

  it('returns true on a logged in user', function () {
    stub(Meteor, 'userId', () =>  {})
    stub(Meteor, 'user', () => user)
    assert.isTrue(loggedIn())
  })

  it('returns true on  a logged in but maybe not yet subscribed user', function () {
    stub(Meteor, 'userId', () =>  user._id)
    stub(Meteor, 'user', () => {})
    assert.isTrue(loggedIn())
  })
})
