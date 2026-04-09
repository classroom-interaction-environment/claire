/**
 * Wraps a function and logs a deprecation warning when it's called.
 * @param fn {function}
 * @param explicitName {string=} Optional explicit name for the function
 * @return {function(...[*]): *} wrapped function
 */
export const deprecate = (fn, explicitName) => {
  const name = explicitName || fn.name || 'function'
  return function (...args) {
    console.warn(`DEPRECATION WARNING: ${name} is deprecated and will be removed in future versions.`)
    return fn.apply(this, args)
  }
}
