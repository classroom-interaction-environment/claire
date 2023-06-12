import { Router } from '../Router'

/**
 * Gets a param from the current route by name
 * @param name {string}
 * @return {string|undefined}
 */
export const getParam = name => Router.param(name)
