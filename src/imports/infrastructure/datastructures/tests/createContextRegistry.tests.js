/* eslint-env mocha */
import { createContextRegistry } from '../createContextRegistry'
import { Random } from 'meteor/random'
import { expect } from 'chai'

describe(createContextRegistry.name, function () {
  it('throws if options is not correct', function () {
    [
      ['name', {}],
      ['hasIdentity', { name: Random.id(6) }],
    ].forEach(([name, options]) => {
      expect(() => createContextRegistry(options))
        .to.throw(`Match error: Missing key '${name}'`)
    })
  })
  it('creates a new registry', function () {
    const name = Random.id(6)
    const reg = createContextRegistry({
      name: name,
      hasIdentity: () => name,
      foo: 'bar'
    })

    expect(reg.name).to.equal(name)
    expect(reg.hasIdentity()).to.equal(name)
    expect(reg.foo).to.equal('bar')
  })
  it('provides basic registry functionality', function () {
    const ctxName = Random.id(6)
    const regName = Random.id(6)
    const reg = createContextRegistry({
      name: regName,
      hasIdentity: c => c.isValid,
      hooks: {
        afterAdd (c) {
          expect(c).to.equal(ctx)
          hookCalled = true
        }
      }
    })

    let hookCalled = false
    const ctx = {
      name: ctxName,
      label: Random.id(6),
      icon: Random.id(6),
      alias: 'foo'
    }

    // expected errors
    expect(() => reg.add({}))
      .to.throw('Match error: Missing key \'name\'')
    expect(() => reg.add(ctx))
      .to.throw(`[${regName}]: expected [${ctxName}] to have identity for this registry`)

    ctx.isValid = true
    reg.add(ctx)

    // basic access
    expect(reg.get(ctxName)).to.equal(ctx)
    expect(reg.has(ctxName)).to.equal(true)
    expect(reg.hasIdentity(ctx)).to.equal(true)

    // iteration / multiples
    reg.forEach((entry, n) => {
      expect(entry).to.equal(ctx)
      expect(n).to.equal(ctxName)
    })

    expect(reg.all()).to.deep.equal([ctx])
    expect(hookCalled).to.equal(true)
  })
})
