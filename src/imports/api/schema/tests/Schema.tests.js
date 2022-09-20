/* eslint-env mocha */
import { Schema } from '../Schema'
import { expect } from 'chai'
import { Defaults } from '../../defaults/Defaults'
import SimpleSchema from 'simpl-schema'

Schema.extendOptions(Defaults.schemaOptions())

describe(Schema.name, function () {
  afterEach(function () {
    Schema.setDefault(Defaults.schema())
  })

  describe(Schema.create.name, function () {
    it('creates a schema product', function () {
      const definition = { foo: 'bar' }
      const schema = Schema.create(definition)
      expect(schema).to.be.instanceof(SimpleSchema)
      expect(schema._schema).to.deep.equal({
        foo: {
          label: 'Foo',
          optional: false,
          type: {
            definitions: [
              { type: 'bar' }
            ]
          }
        }
      })
    })
  })
  describe(Schema.setDefault.name, function () {
    it('sets a default schema', function () {
      const defaultObj = { foo: 'bar' }
      expect(Schema.setDefault(defaultObj)).to.equal(defaultObj)
    })
  })
  describe(Schema.getDefault.name, function () {
    it('gets a copy of the default', function () {
      const defaultObj = { foo: 'bar' }
      Schema.setDefault(defaultObj)
      expect(Schema.getDefault()).to.not.equal(defaultObj)
      expect(Schema.getDefault()).to.deep.equal(defaultObj)
    })
  })
  describe(Schema.withDefault.name, function () {
    it('creates a schema with default', function () {
      const defaultObj = { foo: 'bar' }
      Schema.setDefault(defaultObj)
      const schema = Schema.withDefault({ bar: 'baz' })
      expect(schema).to.be.instanceof(SimpleSchema)
      expect(schema._schema).to.deep.equal({
        foo: {
          label: 'Foo',
          optional: false,
          type: {
            definitions: [
              { type: 'bar' }
            ]
          }
        },
        bar: {
          label: 'Bar',
          optional: false,
          type: {
            definitions: [
              { type: 'baz' }
            ]
          }
        }
      })
    })
  })
})
