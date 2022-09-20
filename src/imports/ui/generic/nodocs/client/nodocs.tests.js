/* eslint-env mocha */
import { assert } from 'meteor/practicalmeteor:chai'
import { Template } from 'meteor/templating'
import { $ } from 'meteor/jquery'
import { withRenderedTemplate } from '../../../test-helpers.js'

import { nodocsClassName } from '../nodocs.js'

describe('ui/components/nodocs', function () {
  beforeEach(function () {
    Template.registerHelper('_', key => key)
  })

  afterEach(function () {
    Template.deregisterHelper('_')
  })

  it('has a specific className to be identified', function (done) {
    withRenderedTemplate(Template.nodocs, {}, el => {
      const target = $(el)
      assert.equal(target.find('.' + nodocsClassName).length, 1)
      done()
    })
  })
})
