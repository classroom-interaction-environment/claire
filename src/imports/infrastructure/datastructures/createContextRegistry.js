import { check, Match } from 'meteor/check'
import { createInfoLog } from '../../api/log/createLog'
import { isContext } from './isContext'

/**
 * Creates a new (repository-style) Registry for contexts.
 * Uses a map underneath and provides limited access to it's data.
 *
 * @param options {Object} the option
 * @param options.name {string} name of the context
 * @param options.map {Map|undefined} a {Map} instance, if you want to provide your own
 * @param options.setIdentity {function}
 * @param options.hasIdentity {function}
 * @param options.hooks {object|undefined} optional hooks
 * @param options.hooks.afterAdd {function|undefined} optional hook that allows
 *        to review the context after it has been added to this registry
 * @param options.props {object|undefined} ...props => any further custom props
 * @return {{add, get, has, forEach }}
 */

export const createContextRegistry = (options) => {
  check(options, Match.ObjectIncluding({
    name: String,
    map: Match.Maybe(Map),
    setIdentity: Match.Maybe(Function), // TODO deprecate
    hasIdentity: Function
  }))

  const {
    name,
    map = new Map(),
    setIdentity,
    hasIdentity,
    hooks = {},
    ...props
  } = options

  const info = createInfoLog(name)
  const aliases = new Map()
  const internalHooks = {
    afterAdd: hooks.afterAdd || (() => {})
  }

  return {
    name: name,
    info: createInfoLog(name, { devOnly: false }),
    add: function (context) {
      check(context, Match.ObjectIncluding(isContext()))

      info('(add)', context.name)

      if (!hasIdentity(context)) {
        throw new Error(`[${name}]: expected [${context.name}] to have identity for this registry`)
      }

      map.set(context.name, context)

      // XXX BACK-COMPAT with old context names
      if (context.alias) {
        console.warn('replace old alias', context.alias, 'with', context.name)
        aliases.set(context.alias, context)
      }

      internalHooks.afterAdd(context)
      return this
    },
    get (name) {
      return map.get(name)
    },
    alias (name) {
      return aliases.get(name)
    },
    has (name) {
      return map.has(name)
    },
    forEach (fn) {
      map.forEach(fn)
    },
    all: function () {
      return Array.from(map.values())
    },
    size () {
      return map.size
    },
    /** @deprecated */
    setIdentity: setIdentity,
    hasIdentity: hasIdentity,
    ...props
  }
}
