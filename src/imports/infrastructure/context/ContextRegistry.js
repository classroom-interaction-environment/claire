import { check, Match } from 'meteor/check'
import { createLog } from '../../api/log/createLog'

const debug = createLog({ name: 'ContextRegistry', type: 'debug' })
const _contexts = new Map()
const _settings = new Map()

export const ContextRegistry = {

  name: 'ContextRegistry',

  validate (ctx) {
    check(ctx, Match.ObjectIncluding({
      name: String,
      label: String,
      icon: String
    }))

    return true
  },

  has (name) {
    return _contexts.has(name)
  },

  add (context, { createCollection = true, createMethods = true, createPublications = true } = {}) {
    debug('(add/register)', context.name)
    ContextRegistry.validate(context)
    check(createCollection, Boolean)
    check(createMethods, Boolean)
    check(createPublications, Boolean)

    const setting = { createCollection, createMethods, createPublications }
    _contexts.set(context.name, context)
    _settings.set(context.name, setting)
    return Boolean(_contexts.get(context.name) && _settings.get(context.name))
  },

  get (contextName) {
    return contextName && _contexts.get(contextName)
  },

  settings (contextName) {
    return contextName && _settings.get(contextName)
  },

  all ({ createCollection = false, createMethods = false, createPublications = false } = {}) {
    return Array.from(_contexts.values()).filter(context => {
      const settings = _settings.get(context.name)

      if (createCollection && !settings.createCollection) {
        return false
      }
      if (createMethods && !settings.createMethods) {
        return false
      }
      if (createPublications && !settings.createPublications) {
        return false
      }
      return true
    })
  },

  clear () {
    _contexts.clear()
    _settings.clear()
  }
}
