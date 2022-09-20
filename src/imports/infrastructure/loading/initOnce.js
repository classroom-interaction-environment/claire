import { ReactiveVar } from 'meteor/reactive-var'
import { setFatalError } from '../../ui/components/fatal/fatal'

const cache = new Map()

/**
 * Calls an async (init-) function once and returns a ReactiveVar that resolves
 * to {true} once the function's execution has completed.
 * @param asyncInitFunc
 * @param completeOnError
 * @param onError
 * @return {any}
 */
export const initOnce = function (asyncInitFunc, { onError, debug = () => {}, name, options } = {}) {
  if (cache.has(asyncInitFunc)) {
    return cache.get(asyncInitFunc)
  }

  const initialized = new ReactiveVar(false)
  cache.set(asyncInitFunc, initialized)

  asyncInitFunc(options)
    .catch(e => {
      debug('[loadOnce]: failed with error:')
      debug(e)

      setFatalError(e)
      // TODO SEND ERROR

      if (onError) { onError(e) }
    })
    .finally(() => {
      debug('[loadOnce]: loaded', name)
      initialized.set(true)
    })

  return initialized
}
