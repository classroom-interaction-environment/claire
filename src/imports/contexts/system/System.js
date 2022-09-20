import { createContextRegistry } from '../../infrastructure/datastructures/createContextRegistry'

export const System = createContextRegistry({
  name: 'System',
  setIdentity (context) {
    context.isSystem = true
    context.noDefaultSchema = true
    context.preventHooks = true
  },
  hasIdentity (context) {
    return context.isSystem === true
  }
})
