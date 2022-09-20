/* eslint-env mocha */
import { expect } from 'chai'
import { createCollectionName } from '../createCollectionName'

describe(createCollectionName.name, function () {
  it('creates a name with first uppercase char and Collection suffix', function () {
    const name = 'someName'
    expect(createCollectionName(name)).to.equal('SomeNameCollection')
  })
})
