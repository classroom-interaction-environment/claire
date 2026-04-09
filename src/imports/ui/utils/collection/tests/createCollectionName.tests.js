/* eslint-env mocha */
import { expect } from 'chai'
import { createCollectionName } from '../createCollectionName'

describe(createCollectionName.name, () => {
  it('creates a name with first uppercase char and Collection suffix', () => {
    const name = 'someName'
    expect(createCollectionName(name)).to.equal('SomeNameCollection')
  })
})
