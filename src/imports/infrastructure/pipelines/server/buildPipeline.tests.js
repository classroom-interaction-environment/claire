/* eslint-env mocha */
import { Mongo } from 'meteor/mongo'
import { Random } from 'meteor/random'
import { FilesCollection } from 'meteor/ostrio:files'
import { expect } from 'chai'
import { buildPipeline } from './buildPipeline'
import { collectPublication } from '../../../../tests/testutils/collectPublication'

describe(buildPipeline.name, function () {
  it('it creates a collection if defined', function () {
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
  it('it creates a filesCollection if defined', function () {
    const options = { filesCollection: true }
    const context = {
      name: Random.id(6),
      isFilesCollection: true,
      files: {
        maxSize: 1000000,
        extensions: ['*']
      }
    }

    const products = buildPipeline(context, options)
    expect(products.filesCollection).to.be.instanceof(FilesCollection)
    expect(products.collection).to.equal(null)
  })
  it('it creates methods if defined', function () {
    const options = { methods: true }

    const ctxName = Random.id(6)
    const title = Random.id(6)
    const methodName = `${ctxName}.methods.test`
    const context = {
      name: ctxName,
      methods: {
        test: {
          name: methodName,
          isPublic: true,
          schema: { title: String },
          run (doc) {
            return doc.title === title
          }
        }
      }
    }

    const userId = Random.id()
    const products = buildPipeline(context, options)
    const method = products.methods[0]

    expect(method._execute({ userId }, { title })).to.equal(true)
    expect(() => method._execute({ userId }, {})).to.throw('form.validation.required')
  })
  it('it creates publications if defined', function () {
    const options = {
      publications: true,
      collection: true
    }

    const ctxName = Random.id(6)
    const title = Random.id(6)
    const pubName = `${ctxName}.publications.test`
    const context = {
      name: ctxName,
      schema: {
        title: String
      },
      publications: {
        test: {
          name: pubName,
          isPublic: true,
          schema: {},
          run () {
            return Collection.find()
          }
        }
      }
    }

    const products = buildPipeline(context, options)
    const Collection = products.collection

    const publication = products.publications[0]
    const docId = Collection.insert({ title })
    const docs = collectPublication(publication())

    expect(docs.length).to.equal(1)
    expect(docs[0]._id).to.equal(docId)
    expect(docs[0].title).to.equal(title)
  })
})
