import crypto from 'crypto'
import {createLog} from '../log/createLog'

const debugLog = createLog({ name: 'insertUpdate', type: 'debug' })

const sortedProps = (doc) => {
  let obj = ''
  Object.keys(doc).sort().forEach(key => {
    const value = doc[key]
    const strValue = value && value.toString()
    obj += `"${key}":"${strValue}",`
  })
  return `{${obj}}`
}

const hash = (doc = {}) => {
  const hashGen = crypto.createHash('md5')
  const strDoc = sortedProps(doc)
  return hashGen.update(strDoc).digest('hex')
}

const areEqual = (doc1, doc2, debug) => {
  const h1 = hash(doc1)
  const h2 = hash(doc2)

  if (debug && h1 !== h2) {
    debugLog(`Hash 1: ${h1}`)
    debugLog(`Hash 2: ${h2}`)
  }

  return h1 === h2
}

/**
 * Inserts a doc into a collection or updates the doc, if it already exists.
 * @param collection the collection to insert/update
 * @param doc doc to insert/update
 * @param debug optional flag to add debugging
 */

export const insertUpdate = function insertUpdate (collection, doc, hash, debug) {
  if (!doc) {
    throw new Error('undefined doc')
  }
  try {
    // if there is no doc present by given _id
    // we always want to insert the doc
    const existingDoc = collection.findOne(doc._id)
    if (!existingDoc) {
      const insertDocId = collection.insert(doc)
      if (debug) {
        debugLog(`[${collection._name}]: insert ${insertDocId}`)
      }
      return insertDocId
    }

    // skip if our documents are equal in their signature
    if (hash && areEqual(doc, existingDoc, debug)) {
      return
    }

    // update the doc
    const docId = doc._id
    delete doc._id
    const updated = collection.update(docId, { $set: doc })
    if (debug) {
      debugLog(`[${collection._name}]: update ${docId} ${updated}`)
    }
    return updated
  }
  catch (e) {
    console.error(e)
  }
}
