import { Mongo } from 'meteor/mongo'
import { EJSON } from 'meteor/ejson'

class ClientCollection {
  constructor ({ mongoCollection, localCollection, insert, update, remove } = {}) {
    this.mongoCollection = mongoCollection
    this.localCollection = localCollection
    this.methods = { insert, update, remove }
  }

  find (selector, options) {
    const strategy = options.strategy || 'mongo'
    return strategy === 'mongo'
      ? this.mongoCollection.find(selector, options)
      : this.localCollection.find(selector, options)
  }

  findOne (selector, options = {}) {
    const mongoDoc = this.mongoCollection.findOne(selector, options)
    const localDoc = this.localCollection.findOne(selector, options)

    if (mongoDoc && !localDoc) return mongoDoc
    if (!mongoDoc && localDoc) return localDoc
    if (!mongoDoc && !localDoc) return undefined

    if (EJSON.stringify(mongoDoc) === EJSON.stringify(localDoc)) {
      return mongoDoc
    }

    // if we have a mismatch on docs we need to define by which strategy we
    // want the document. Default is from mongo / subs
    const strategy = options.strategy || 'mongo'
    return strategy === 'mongo'
      ? mongoDoc
      : localDoc
  }

  insert (doc, callback = () => {}) {
    const { insert } = this.methods
    if (insert) {
      insert(doc, (err, docId) => {
        if (err) return callback(err)

        callback(undefined, docId)
        return this.localCollection.insert({ _id: docId, ...doc })
      })
    }

    else {
      return this.localCollection.insert(doc)
    }
  }

  update (selector, options, callback = () => {}) {
    const { update } = this.methods

    if (update) {
      update(selector, options, (err, updated) => {
        if (err) return callback(err)

        callback(undefined, updated)
        return this.localCollection.update(selector, options)
      })
    }

    else {
      return this.localCollection.update(selector, options)
    }
  }

  remove (selector, callback = () => {}) {
    const { remove } = this.methods

    if (remove) {
      remove(selector, (err, removed) => {
        if (err) return callback(err)

        callback(undefined, removed)
        return this.localCollection.remove(selector)
      })
    }

    else {
      return this.localCollection.remove(selector)
    }
  }
}
