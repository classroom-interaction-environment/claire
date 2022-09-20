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
  hasIdentity: ctx => id,
  add: () => {}
})

describe('ContextBuilder', function () {
  afterEach(function () {
    ContextBuilder.flush()
  })

  describe(ContextBuilder.addContext.name, function () {
    it('throws if object is not a valid context', function () {
      expect(() => ContextBuilder.addContext({}))
        .to.throw('Match error: Missing key \'name\'')
      expect(() => ContextBuilder.addContext({ name: Random.id() }))
        .to.throw('Match error: Missing key \'label\'')
      expect(() => ContextBuilder.addContext({
        name: Random.id(),
        label: Random.id()
      }))
        .to.throw('Match error: Missing key \'icon\'')
    })
    it('adds a context', function () {
      const ctx = randomContext()
      ContextBuilder.addContext(ctx)

      let called = false
      ContextBuilder.buildAll(function (context) {
        expect(context).to.equal(ctx)
        called = true
      })

      expect(called).to.equal(true)
    })
  })
  describe(ContextBuilder.addRegistry.name, function () {
    it('throws if not a valid registry', function () {
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
    it('adds a registry', function () {
      const id = Random.id(6)
      const registry = randomRegistry(id)
      const context = randomContext()
      let called = false
      const pipelines = [function (ctx) {
        expect(ctx).to.equal(context)
        called = true
      }]
      ContextBuilder.addRegistry(registry, { pipelines })
      ContextBuilder.addContext(context)
      ContextBuilder.buildAll(function () {})
      expect(called).to.equal(true)
    })
  })
  describe(ContextBuilder.flush.name, function () {
    it('clears all registered contexts and registries')
  })
})
