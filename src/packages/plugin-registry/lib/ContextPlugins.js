import { createGenericPluginRegistry } from './factories/createGenericPluginRegistry'

export const ContextPlugins = createGenericPluginRegistry({
  name: 'ContextPlugins',
  debug: true,
  all: function (filter = {}) {
    const all = Array.from(this.registered.values())
    const filterKeys = Object.keys(filter)
    console.info(all, filterKeys)
    return all.filter(ctx => {
      if (filterKeys.length === 0) return true

      return filterKeys.every(key => {
        const expectedValue = filterKeys[key]
        const actualValue = ctx[key]

        return actualValue === expectedValue
      })
    })
  }
})
