import { check, Match } from 'meteor/check'
import { createGenericPluginRegistry } from './factories/createGenericPluginRegistry'

const internal = {
  dataTypes: () => {}
}

/**
 *
 * @type {{
 *  categories: Function,
 *  onLanguageChange: Function,
 *  translate: Function,
 *  translateReactive: Function,
 *  register: Function,
 *  load: Function,
 *  dataTypes: Function
 * }}
 */
export const ItemPlugins = createGenericPluginRegistry({

  /**
   * Registers or returns available dataTypes
   * @param value
   * @return {*}
   */
  dataTypes: function (value) {
    check(value, Match.Maybe(Function))

    if (value) {
      internal.dataTypes = value
    }

    return internal.dataTypes()
  }
})
