import dely from 'dely'

const timeouts = new Map()
timeouts.set(300, dely(300))

/**
 * Wraps a callback into a function that gets executed, if or once the time delay time has been exceeded
 * @param timeout {Number} the delay in miliseconds
 * @param cb {Function} th callback to be wrapped
 * @return {Function} the new callback wrapped in a delayed function call
 */
export const delayedCallback = (timeout, cb) => {
  if (!timeouts.has(timeout)) {
    timeouts.set(timeout, dely(timeout))
  }

  const wrap = timeouts.get(timeout)
  return wrap(cb)
}
