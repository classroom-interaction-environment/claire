import { createCategoriesHandler } from './createCategoriesHandler'
import { createReactiveTranslateHandler } from './createReactiveTranslateHandler'
import { createLanguageChangeHandler } from './createLanguageChangeHandler'
import { createTranslateHandler } from './createTranslateHandler'
import { createRegisterHandler } from './createRegisterHandler'
import { createLoadHandler } from './createLoadHandler'

export const createGenericPluginRegistry = function (options = {}) {
  const { name, debug, ...additionalMethods } = options
  const ctx = {}
  const debugFn = debug
    ? (...args) => console.debug(name, ...args) // eslint-disable-line no-console
    : () => {}
  const internal = {
    categories: () => {},
    registered: new Map(),
    translate: x => x,
    languageChangeHandlers: []
  }

  /**
   * Host: Registers a function that returns all available/registered categories
   * Plugin: Call without args to receive all available categories
   * @param value {Function} optional pass a function that returns categories
   * @return {function(): Object}
   */
  ctx.categories = createCategoriesHandler({ target: internal })

  /**
   * Host: call this method with a language code to make plugins import their
   *       translations
   * Plugin: call with a function argument that imports tha language by isocode
   *         and returns a promise that resolves to the JSON object
   * @param value {String|Function}
   * @return {undefined|Promise<any[]>}
   */
  ctx.onLanguageChange = createLanguageChangeHandler({ target: internal })

  /**
   * Inject a translation processor that handles i18n compatible strings.
   * Call without arguments to get it and use it in the plugins.
   * @param value {Function} optional
   * @return {function():String}
   */
  ctx.translate = createTranslateHandler({ target: internal })

  /**
   * Returns a function to resolve reactively to a translated label.
   * @return {function(): function(): String}
   */
  ctx.translateReactive = createReactiveTranslateHandler({ target: internal })

  /**
   * Register a plugin by it's name and an async import function.
   * @param name {String} the name of the plugin
   * @param importFct {async Function} the function to dynamic-import the plugin
   */
  ctx.register = createRegisterHandler({ target: internal, debug: debugFn })

  /**
   * Loads all registered plugins, clears the register-cache and resolves them
   * into an array of objects.
   * @return {Promise<{name: any, plugin: any}[]>}
   */
  ctx.load = createLoadHandler({ target: internal })

  Object.entries(additionalMethods).forEach(([key, fn]) => {
    ctx[key] = fn.bind(internal)
  })

  return ctx
}
