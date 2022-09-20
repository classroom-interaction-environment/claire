import { Material } from './Material'

/**
 * Determines, whether a context is material
 * @param context
 * @return {*}
 */

export const isMaterial = context => Material.hasIdentity(context)
