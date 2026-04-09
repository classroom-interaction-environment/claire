import { callMethod } from '../../ui/controllers/document/callMethod'
import { noop } from '../../utils/noop'

const inProgress = new Set()
/**
 * Calls a given server-method and upserts to the result into the given
 * collection.
 *
 * Handles single and multiple docs.
 * @async
 * @function loadIntoCollection
 * @param name {string|{name:string}}
 * @param args {object=}
 * @param collection {Mongo.Collection}
 * @param prepare {function=}
 * @param receive {function=}
 * @param failure {function=}
 * @param success {function=}
 * @param debug {function=}
 * @param releaseTimeout
 */
export const loadIntoCollection = ({
  name,
  args = {},
  collection,
  prepare,
  receive,
  failure,
  success,
  debug = noop,
  releaseTimeout = 250
}) => {
  debug('loadIntoCollection called for', name, args)
  const methodName = name.name || name

  // skip if there is an ongoing loading for this method
  if (inProgress.has(methodName)) {
    return debug('[loadIntoCollection]:', methodName, 'is already busy')
  }

  debug(methodName, args)
  inProgress.add(methodName)

  const onSuccess = (docs) => {
    debug('on success', docs)
    docs = Array.isArray(docs)
      ? docs
      : [docs]

    for (const doc of docs) {
      collection.upsert(doc._id, { $set: doc })
    }

    if (typeof success === 'function') {
      success(docs)
    }
  }

  return callMethod({
    name: methodName,
    args: args,
    prepare: prepare,
    receive: () => {
      debug('releasing', methodName)
      // in any way we should release the method after timeout
      setTimeout(() => inProgress.delete(methodName), releaseTimeout)
      if (receive) {
        receive()
      }
    },
    failure: failure,
    success: docs => {
      try {
        onSuccess(docs)
      }
      catch (e) {
        failure(e)
      }
    }
  })
}
