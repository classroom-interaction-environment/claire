import { createGenericPluginRegistry } from './factories/createGenericPluginRegistry'

/**
 *
 * @type {{
 *  categories: Function,
 *  onLanguageChange: Function,
 *  translate: Function,
 *  translateReactive: Function,
 *  register: Function,
 *  load: Function
 * }}
 */
export const TaskElementPlugins = createGenericPluginRegistry()
