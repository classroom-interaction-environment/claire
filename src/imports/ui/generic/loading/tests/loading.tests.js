/* eslint-env mocha */
import { assert } from 'chai'
import { Template } from 'meteor/templating'
import { $ } from 'meteor/jquery'
import { withRenderedTemplate } from '../../../../../tests/testutils/withRenderedTemplate'
import '../../../../startup/client/minimal/helpers'
import '../loading.js'

describe('loading', function () {
  beforeEach(function () {
    Template.registerHelper('_', key => key)
  })

  afterEach(function () {
    Template.deregisterHelper('_')
  })

  it('has an .alert class', function (done) {
    withRenderedTemplate(Template.loading, {}, el => {
      const target = $(el)
      assert.equal(target.find('.alert').length, 1)
      done()
    })
  })

  it('has a .loading-data-notification class', function (done) {
    withRenderedTemplate(Template.loading, {}, el => {
      const target = $(el)
      assert.equal(target.find('.loading-data-notification').length, 1)
      done()
    })
  })

  it('has a pulsing spinner icon', function (done) {
    withRenderedTemplate(Template.loading, {}, el => {
      const target = $(el)
      assert.equal(target.find('.fa-pulse').length, 1)
      assert.equal(target.find('.fa-spinner').length, 1)
      done()
    })
  })

  it('has no title if none specified', function (done) {
    withRenderedTemplate(Template.loading, {}, el => {
      const target = $(el)
      assert.equal(target.find('.loading-data-notification-title').length, 0)
      done()
    })
  })

  it('has a title if specified', function (done) {
    withRenderedTemplate(Template.loading, { title: 'test' }, el => {
      const target = $(el)
      assert.equal(target.find('.loading-data-notification-title').length, 1)
      done()
    })
  })
})
