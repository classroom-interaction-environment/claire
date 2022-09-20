/* eslint-env mocha */
import { Random } from 'meteor/random'
import { expect } from 'chai'
import { createPipeline } from '../createPipeline'
import { stub, restoreAll } from '../../../../tests/testutils/stub'

describe(createPipeline.name, function () {
  afterEach(function () {
    restoreAll()
  })

  it('creates a new custom pipeline', function () {
    const pName = Random.id(6)
    const ctx = {
      name: Random.id(6)
    }

    stub(console, 'info', (contextName, pipelineName, text) => {
      expect(contextName).to.equal(`[${ctx.name}]:`)
      expect(pipelineName).to.equal(pName)
      expect(text).to.equal('pipeline exec')
    })

    const pipe = createPipeline(pName, function (context, api, options) {
      expect(context).to.equal(ctx)
      expect(options).to.deep.equal({})
      expect(api.info).to.be.a('function')
      expect(api.log).to.be.a('function')
    }, { quiet: true })
    pipe(ctx)
  })
})