import { ContextRegistry } from '../../infrastructure/context/ContextRegistry'
import { createCollection } from '../../infrastructure/factories/createCollection'

ContextRegistry
  .all({ createCollection: true })
  .sort((a, b) => a.name.localeCompare(b.name))
  .forEach(context => createCollection(context))
