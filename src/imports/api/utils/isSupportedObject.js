import { isObject } from './check/isObject'

/**
 * A supported property (like schema, methods, publications) is an Object with
 * at least 1 child property.
 * @param obj
 * @return {boolean}
 */

export const isSupportedObject = obj => isObject(obj) && Object.keys(obj).length > 0
