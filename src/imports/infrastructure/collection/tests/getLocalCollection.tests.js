/* eslint-env mocha */
import { Mongo } from 'meteor/mongo'
import { Random } from 'meteor/random'
import { expect } from 'chai'
import { getLocalCollection } from '../getLocalCollection'

describe(getLocalCollection.name, function () {
  it('creates a local collection if not defined', function () {
    const name = Random.id()
    const local = getLocalCollection(name)
    expect(local instanceof Mongo.Collection).to.equal(true)
    expect(Mongo.Collection.get(name)).to.equal(undefined)

    // should not create a new instance for same name
    const local2 = getLocalCollection(name)
    expect(local2).to.equal(local)
  })
  it('returns a collection with add function', function () {
    const name = Random.id()
    const local = getLocalCollection(name)

    const doc = { _id: Random.id() }
    expect(local.find().count()).to.equal(0)

    // insert
    expect(local.add(doc)).to.equal(doc._id)
    expect(local.find().count()).to.equal(1)

    // updazte
    expect(local.add(doc)).to.equal(1)
    expect(local.find().count()).to.equal(1) // will only update
  })
})
