import merge from 'deepmerge'
import { i18n } from '../../../../api/language/language'

const translate = (...args) => () => i18n.get(...args)

/**
 * Merge all given schemas
 */
export const assign = (...schemas) => merge.all(schemas)

/**
 * Editor Schema (edt = editor) that is used to create the editor form.
 */
export const editSchema = (...defs) => merge.all(defs.map(definition => definition.edit({ translate })))

/**
 * Item schema that is used with values from the editor form in order to build the item.
 */
export const itemSchema = (...defs) => (itemDoc) => merge.all(defs.map(definition => definition.item(itemDoc, { translate })))

/**
 * Merges all loaders into a single fn => promise.all
 * @param defs
 * @return {function(): Promise<Awaited<unknown>[]>}
 */
export const itemLoad = (...defs) => {
  const loaders = new Set()
  defs.forEach(def => {
    if (typeof def.load === 'function') {
      loaders.add(def.load)
    }
  })
  // skip creating a loader
  if (loaders.size === 0) {
    return
  }

  return () => Promise.all([...loaders.values()].map(toCallValue))
}

const toCallValue = fn => fn()

/**
 * TODO move into own file in api/utils
 * Create a SimpleSchema compliant option from a given context
 */
export const option = context => ({ value: context.name, label: context.label })

/**
 * TODO move into own file in api/utils
 * Default first option (Select one) for options list
 */
export const firstOption = () => i18n.get('form.selectOne')
