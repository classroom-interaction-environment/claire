/* eslint-env mocha */
import { Random } from 'meteor/random'
import { expect } from 'chai'
import { ContextBuilder } from '../ContextBuilder'

const randomContext = () => ({
  name: Random.id(6),
  label: `${Random.id(6)}.${Random.id(6)}`,
  icon: Random.id(6)
})

const randomRegistry = (id = Random.id(6)) => ({
  name: Random.id(6),
  hasIdentity: _ctx => id,
  add: () => {}
})

describe('ContextBuilder', () => {
  afterEach(() => {
    ContextBuilder.flush()
  })

  describe(ContextBuilder.addContext.name, () => {
    it('throws if object is not a valid context', () => {
      expect(() => ContextBuilder.addContext({}))
        .to.throw('Match error: Missing key \'name\'')
      expect(() => ContextBuilder.addContext({
        icon: Random.id(),
        label: Random.id()
      }))
        .to.throw('Match error: Missing key \'name\'')
    })
    it('adds a context', () => {
      const ctx = randomContext()
      ContextBuilder.addContext(ctx)

      let called = false
      ContextBuilder.buildAll((context) => {
        expect(context).to.equal(ctx)
        called = true
      })

      expect(called).to.equal(true)
    })
  })
  describe(ContextBuilder.addRegistry.name, () => {
    it('throws if not a valid registry', () => {
      expect(() => ContextBuilder.addRegistry({}))
        .to.throw('Match error: Missing key \'name\'')
      expect(() => ContextBuilder.addRegistry({ name: Random.id() }))
        .to.throw('Match error: Missing key \'hasIdentity\'')
      expect(() => ContextBuilder.addRegistry({
        name: Random.id(),
        hasIdentity: () => {}
      }))
        .to.throw('Match error: Missing key \'add\'')
    })
    it('adds a registry', () => {
      const id = Random.id(6)
      const registry = randomRegistry(id)
      const context = randomContext()
      let called = false
      const pipelines = [(ctx) => {
        expect(ctx).to.equal(context)
        called = true
      }]
      ContextBuilder.addRegistry(registry, { pipelines })
      ContextBuilder.addContext(context)
      ContextBuilder.buildAll(() => {})
      expect(called).to.equal(true)
    })
  })
  describe(ContextBuilder.flush.name, () => {
    it('clears all registered contexts and registries')
  })
})
