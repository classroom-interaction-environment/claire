import { callMethod } from '../../ui/controllers/document/callMethod'

const inProgress = new Set()

/**
 * Calls a given server-method and upserts to the result into the given
 * collection.
 *
 * Handles single and multiple docs.
 *
 * @param name
 * @param args
 * @param collection
 * @param prepare
 * @param receive
 * @param failure
 * @param success
 * @param debug
 * @param releaseTimeout
 */
export const loadIntoCollection = ({ name, args = {}, collection, prepare, receive, failure, success, debug, releaseTimeout = 250 }) => {
  const methodName = name.name || name

  // skip if there is an ongoing loading for this method
  if (inProgress.has(methodName)) {
    return console.warn('[loadIntoCollection]:', methodName, 'is alread busy')
  }

  console.debug('[loadIntoCollection]:', methodName, args)
  inProgress.add(methodName)

  const onSuccess = (docs) => {
    docs = Array.isArray(docs)
      ? docs
      : [docs]

    console.debug('[loadIntoCollection]:', methodName, 'received', docs.length, 'docs')
    docs.forEach(doc => collection.upsert(doc._id, { $set: doc }))

    if (typeof success === 'function') {
      success(docs)
    }
  }

  return callMethod({
    name: methodName,
    args: args,
    prepare: prepare,
    receive: () => {
      // in any way we should release the method after timeout
      setTimeout(() => inProgress.delete(methodName), releaseTimeout)
      if (receive) { receive() }
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
