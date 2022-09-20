/* global describe it */
import { ContextRegistry } from '../ContextRegistry'
import { Random } from 'meteor/random'
import { expect } from 'chai'

describe(ContextRegistry.name, function () {
  beforeEach(function () {
    ContextRegistry.clear()
  })

  describe(ContextRegistry.validate.name, function () {
    it('validates a context agains a minimal schema', function () {
      const name = Random.id(6)
      const label = Random.id(6)
      const icon = Random.id(6)
      expect(() => ContextRegistry.validate({})).to.throw('Match error: Missing key \'name\'')
      expect(() => ContextRegistry.validate({ name, icon })).to.throw('Match error: Missing key \'label\'')
      expect(() => ContextRegistry.validate({ label, name })).to.throw('Match error: Missing key \'icon\'')
      expect(() => ContextRegistry.validate({ icon, label })).to.throw('Match error: Missing key \'name\'')

      expect(ContextRegistry.validate({ name: Random.id(), label: Random.id(), icon: Random.id() })).to.equal(true)
    })
  })
  describe(ContextRegistry.add.name, function () {
    it('adds a context with default options', function () {
      const context = { name: Random.id(), label: Random.id(), icon: Random.id(), schema: {} }
      const added = ContextRegistry.add(context)
      expect(added).to.equal(true)
      expect(ContextRegistry.settings(context.name)).to.deep.equal({
        createCollection: true,
        createMethods: true,
        createPublications: true
      })
    })
    it('adds a context with specific options', function () {
      const context = { name: Random.id(), label: Random.id(), icon: Random.id(), schema: {} }
      const added = ContextRegistry.add(context, {
        createPublications: false,
        createMethods: false,
        createCollection: false
      })
      expect(added).to.equal(true)
      expect(ContextRegistry.settings(context.name)).to.deep.equal({
        createCollection: false,
        createMethods: false,
        createPublications: false
      })
    })
  })
  describe(ContextRegistry.get.name, function () {
    it('returns a context, if it is registered', function () {
      expect(ContextRegistry.get(undefined)).to.equal(undefined)
      expect(ContextRegistry.get(Random.id())).to.equal(undefined)

      const context = { name: Random.id(), label: Random.id(), icon: Random.id(), schema: {} }
      ContextRegistry.add(context)

      expect(ContextRegistry.get(context.name)).to.equal(context)
    })
  })
  describe(ContextRegistry.settings.name, function () {
    it('returns a context-settings, if it is defined', function () {
      expect(ContextRegistry.settings(undefined)).to.equal(undefined)
      expect(ContextRegistry.settings(Random.id())).to.equal(undefined)

      const context = { name: Random.id(), label: Random.id(), icon: Random.id(), schema: {} }
      ContextRegistry.add(context)

      expect(ContextRegistry.settings(context.name)).to.deep.equal({
        createCollection: true,
        createMethods: true,
        createPublications: true
      })
    })
  })
  describe(ContextRegistry.all.name, function () {
    const getContexts = (length) => {
      const allContexts = []
      for (let i = 0; i < length; i++) {
        allContexts[i] = { name: Random.id(), label: Random.id(), icon: Random.id(), schema: {} }
      }
      return allContexts
    }

    it('returns all unfiltered contexts if no filter is given', function () {
      const contexts = getContexts(10)
      contexts.forEach(ContextRegistry.add)

      const all = ContextRegistry.all()
      expect(all.length).to.equal(contexts.length)
    })
    it('returns all contexts, filtered by settings', function () {
      const contexts = getContexts(10)

      let flag = false
      contexts.forEach(c => {
        flag = !flag
        ContextRegistry.add(c, { createCollection: flag })
      })

      const all = ContextRegistry.all({ createCollection: true })
      expect(all.length).to.equal(contexts.length / 2)

      all.forEach(c => {
        expect(ContextRegistry.settings(c.name).createCollection).to.equal(true)
      })
    })
  })
})
