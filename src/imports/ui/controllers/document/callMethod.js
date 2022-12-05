import { Meteor } from 'meteor/meteor'
import { check, Match } from 'meteor/check'
import { delayedCallback } from '../../utils/delayedCallback'
import { createLog } from '../../../api/log/createLog'

const debugLog = createLog({ name: 'callMethod', type: 'debug' })

/**
 * Provides a Promise that wraps a Meteor method call and allows to hook into several stages of the request.
 * @param name
 * @param connection
 * @param args
 * @param prepare
 * @param receive
 * @param success
 * @param timeout
 * @param failure
 * @param debug
 */
export const callMethod = ({
  name,
  connection = Meteor,
  args = {},
  timeout,
  prepare,
  receive,
  success,
  failure,
  debug
}) => {
  const methodName = typeof name === 'object' ? name.name : name
  check(methodName, String)
  check(args, Match.Maybe(Object))
  check(prepare, Match.Maybe(Function))
  check(receive, Match.Maybe(Function))
  check(success, Match.Maybe(Function))
  check(failure, Match.Maybe(Function))

  // at very first we prpeare the call,for example by setting some submission flags
  if (typeof prepare === 'function') {
    prepare()
  }

  if (debug) {
    debugLog(methodName, args)
  }

  // then we create the promise
  const promise = new Promise((resolve, reject) => {
    const cb = (error, result) => {
      if (debug) {
        debugLog('received', { error, result })
      }

      // call receive hook in any case the method has completed
      if (typeof receive === 'function') {
        receive()
      }

      if (error) {
        return reject(error)
      }

      return resolve(result)
    }

    const callback = Number.isSafeInteger(timeout) && timeout > 0
      ? delayedCallback(timeout, cb)
      : cb

    connection.call(methodName, args, callback)
  })

  if (typeof success === 'function') {
    promise.then(success)
  }

  if (typeof failure === 'function') {
    promise.catch(failure)
  }

  return promise
}
