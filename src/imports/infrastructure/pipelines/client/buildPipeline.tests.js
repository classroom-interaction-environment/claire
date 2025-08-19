/* eslint-env mocha */
import { Random } from 'meteor/random'
import { Mongo } from 'meteor/mongo'
import { expect } from 'chai'
import { FilesCollection } from 'meteor/ostrio:files'
import { buildPipeline } from './buildPipeline'

describe(buildPipeline.name, function () {
  it('creates a new collection if defined', function () {
    const options = {
      collection: true
    }

    const context = {
      name: Random.id(6),
      schema: {
        title: String
      }
    }

    const products = buildPipeline(context, options)
    expect(products.collection instanceof Mongo.Collection).to.equal(true)
    expect(products.filesCollection).to.equal(null)
  })
  it('creates a files collection if defined', function () {
    const options = {
      filesCollection: true
    }

    const context = {
      name: Random.id(6),
      isFilesCollection: true,
      files: {
        type: 'custom',
        extensions: ['.abc'],
        accept: 'custom/abc',
        maxSize: 100000000,
        converter: file => file
      }
    }

    const products = buildPipeline(context, options)
    expect(products.filesCollection instanceof FilesCollection).to.equal(true)
    expect(products.collection).to.equal(null)
  })
})
