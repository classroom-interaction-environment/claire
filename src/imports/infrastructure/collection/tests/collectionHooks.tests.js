/* eslint-env mocha */
/* global DDP */
import { Meteor } from 'meteor/meteor'
import { Random } from 'meteor/random'
import { insertHook, updateHook, getUpdateStamps } from '../collectionHooks'
import { expect, assert } from 'chai'
import { restoreAll, stub } from '../../../../tests/testutils/stub'

describe('collection hooks', function () {
  afterEach(function () {
    restoreAll()
  })

  it('getUpdateStamps', function () {
    const userId = Random.id()
    stub(Meteor, 'userId', () => userId)
    const updateStamps = getUpdateStamps()
    expect(updateStamps.updatedAt).to.be.instanceOf(Date)
    expect(updateStamps.updatedBy).to.equal('system')

    stub(DDP._CurrentMethodInvocation, 'get', () => ({ userId }))
    expect(getUpdateStamps().updatedBy).to.equal(userId)
  })

  it('insertHook alters the doc as expected', function () {
    const userId = Random.id()
    const title = Random.id()
    const doc = { title }

    stub(DDP._CurrentMethodInvocation, 'get', () => ({ userId }))
    insertHook(doc)

    expect(doc.createdAt).to.be.instanceOf(Date)
    expect(doc.updatedAt).to.be.instanceOf(Date)
    expect(doc.createdBy).to.equal(userId)
    expect(doc.updatedBy).to.equal(userId)
    expect(doc.title).to.equal(title)
  })

  it('updateHook alters the doc as expected', function () {
    const userId = Random.id()
    stub(DDP._CurrentMethodInvocation, 'get', () => ({ userId }))

    const query = {}
    const modifier = {}
    updateHook(query, modifier)
    expect(modifier.$set).to.be.a('object')

    expect(modifier.$set.updatedAt).to.be.instanceOf(Date)
    expect(modifier.$set.updatedBy).to.equal(userId)
  })

  it('updateHook cleans double update entries as expected', function () {
    const userId = Random.id()
    stub(DDP._CurrentMethodInvocation, 'get', () => ({ userId }))
    const modifier = {
      $unset: {
        updatedAt: '',
        updatedBy: ''
      }
    }

    updateHook(null, modifier)
    expect(modifier.$set).to.be.a('object')

    expect(modifier.$set.updatedAt).to.be.instanceOf(Date)
    expect(modifier.$set.updatedBy).to.equal(userId)
    assert.isUndefined(modifier.$unset.updatedAt)
    assert.isUndefined(modifier.$unset.updatedBy)
  })
})
