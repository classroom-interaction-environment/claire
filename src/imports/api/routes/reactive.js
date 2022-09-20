import { i18n } from '../language/language'

/**
 * @param label
 * @return {function(): *}
 */
export const reactive = label => () => i18n.get(label)
