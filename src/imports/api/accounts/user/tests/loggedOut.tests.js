/* eslint-env mocha */
import { Meteor } from 'meteor/meteor'
import { loggedOut } from '../loggedOut'
import { stub, restoreAll } from '../../../../../tests/testutils/stub'
import { assert } from 'chai'
import { Random } from 'meteor/random'

describe('loggedOut', function () {
  let user
  beforeEach(function () {
    user = { _id: Random.id() }
  })

  afterEach(function () {
    restoreAll()
  })

  it('returns true for a not logged in user', function () {
    stub(Meteor, 'userId', () => {})
    stub(Meteor, 'user', () => {})
    assert.isTrue(loggedOut())
  })

  it('returns false for a logged in user', function () {
    stub(Meteor, 'userId', () => {})
    stub(Meteor, 'user', () => user)
    assert.isFalse(loggedOut())
  })

  it('returns false if userId already exists but publication is not ready yet', function () {
    stub(Meteor, 'userId', () => user._id)
    stub(Meteor, 'user', () => {})
    assert.isFalse(loggedOut())
  })
})
