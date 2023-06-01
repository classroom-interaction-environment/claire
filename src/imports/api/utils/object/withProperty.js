/**
 * Ensures that a property exists on a given object
 * @param target {object}
 * @param name {string}
 * @param factory {function|*}
 * @return {object}
 * @throws {Error} if target is not an object
 */
export const withProperty = (target, name, factory) => {
  const type = typeof target
  if (type !== 'object') {
    throw new Error(`Expected object, get ${type}`)
  }

  if (name in target) {
    return target
  }

  if (typeof factory === 'function') {
    return factory(target, name)
  }
  else {
    const descriptor = Object.create(null)
    descriptor.value = factory
    descriptor.enumerable = true
    descriptor.writable = true
    descriptor.configurable = true
    Object.defineProperty(target, name, descriptor)
  }

  return target
}
