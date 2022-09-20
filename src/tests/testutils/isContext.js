import { expect } from 'chai'

export const isContext = context => {
  expect(context.name).to.be.a('string')
  expect(context.label).to.be.a('string')
  expect(context.icon).to.be.a('string')
  expect(context.schema).to.be.a('object')
  expect(context.methods).to.be.a('object')
  expect(context.publications).to.be.a('object')

  // TODO check all methods, that there is no run method on client

  // TODO when all current tests pass to refactor
  // TODO collection access on contexts
  // expect(context.collection).to.be.a('function')
}
