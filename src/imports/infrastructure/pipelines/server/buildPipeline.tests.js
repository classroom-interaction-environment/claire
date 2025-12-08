/* eslint-env mocha */
import { Mongo } from 'meteor/mongo'
import { Random } from 'meteor/random'
import { FilesCollection } from 'meteor/ostrio:files'
import { expect } from 'chai'
import { buildPipeline } from './buildPipeline'
import { collectPublication } from '../../../../tests/testutils/collectPublication'
import { expectThrow } from '../../../../tests/testutils/expectThrow'

describe('buildPipeline (server)', () => {
  it('it creates a collection if defined', () => {
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
  it('it creates a filesCollection if defined', () => {
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
  it('it creates methods if defined', async () => {
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

    expect(await method._execute({ userId }, { title })).to.equal(true)
    await expectThrow({
      fn: () => method._execute({ userId }, {}),
      message: 'Title is required.'
    })
  })
  it('it creates publications, if defined', async () => {
    const options = {
      publications: true,
      collection: true
    }

    const userId = Random.id()
    const ctxName = Random.id(6)
    const title = Random.id(6)
    const pubName = `${ctxName}.publications.test`
    const context = {
      name: ctxName,
      schema: {
        title: String,
        userId: String
      },
      publications: {
        test: {
          name: pubName,
          isPublic: true,
          schema: {
            title: String
          },
          run ({ title }) {
            const { userId } = this
            return Collection.find({ title, userId })
          }
        }
      }
    }

    const env = { userId, error: expect.fail, ready: expect.fail }
    const products = buildPipeline(context, options)
    const Collection = products.collection
    const publication = products.publications[0]
    const docId = await Collection.insertAsync({ title, userId })
    const expectedDocs = await Collection.find().fetchAsync()
    expect(expectedDocs).to.have.lengthOf(1)
    const cursor = await publication.call(env, { title })
    const docs = await collectPublication(cursor)
    expect(docs).to.deep.equal(expectedDocs)
    expect(docs.length).to.equal(1)
    expect(docs[0]._id).to.equal(docId)
    expect(docs[0].title).to.equal(title)
  })
})
