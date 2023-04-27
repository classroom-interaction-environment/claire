import { Mongo } from 'meteor/mongo'
import { insertHook, updateHook } from '../../infrastructure/collection/collectionHooks'
import { createLog } from '../../api/log/createLog'

export class FactoryCollection extends Mongo.Collection {
  constructor (...args) {
    super(...args)
    this.debug = () => {}
  }

  setDebug (value) {
    this.debug = value
      ? createLog({ name: this._name, type: 'debug', devOnly: true })
      : () => {}
  }

  insert (doc, callback, cb) {
    insertHook.call(this, doc, callback, cb, !!this.filesCollection)
    this.debug('insert', doc)
    return super.insert(doc, cb || callback)
  }

  update (query, modifier, options, callback) {
    this.debug('update', query, modifier, options)
    updateHook.call(this, query, modifier, options, callback, !!this.filesCollection)
    return super.update(query, modifier, options, callback)
  }
}
