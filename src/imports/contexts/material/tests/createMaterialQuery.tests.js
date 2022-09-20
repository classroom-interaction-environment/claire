/* eslint-env mocha */
import { expect } from 'chai'
import { Random } from 'meteor/random'
import { createMaterialQuery } from '../createMaterialQuery'

describe(createMaterialQuery.name, function () {
  it('creates a new material query', function () {
    const ids = [Random.id(), Random.id()]
    const userId = Random.id()

    expect(createMaterialQuery(ids, userId)).to.deep.equal({
      _id: { $in: ids },
      _master: { $exists: false },
      createdBy: userId
    })

    expect(createMaterialQuery(ids, userId, true)).to.deep.equal({
      _id: { $in: ids },
      _master: true
    })
  })
})