import { check, Match } from 'meteor/check'
import { createInfoLog } from '../../api/log/createLog'
import { isContext } from './isContext'
import { isRegistry } from './isRegistry'

const contextMap = new Map()
const registryMap = new Map()
const info = createInfoLog('ContextBuilder')

/**
 * Creates contexts by running them through registered pipelines.
 *
 * For each context category there is a specific Registriy (for example
 * Material for all Material types, Files for all File types.
 *
 * By adding a registry we can obtain all it's related pipelines.
 *
 * The final build process detects the pipelines for a given context
 * automatically and thus create contexts for multiple categories.
 *
 * A pipeline is used to decorate or mutate the context according to
 * the specific categorie's needs.
 *
 * For example, some pipelines define standard CRUD methods for a context,
 * others simply add the context to the related Registry.
 *
 * By doing so you can define many contexts for the same category and define
 * common category-specific properties or methods without inheritance.
 */

export const ContextBuilder = {}

/**
 * If you have multiple contexts to run though build pipelines you can
 * register them with this method and finally run {ContextBuilder.runAll}
 *
 * @param context {Object} a context instance
 * @return {ContextBuilder} self for chaining
 */
ContextBuilder.addContext = function add (context) {
  check(context, Match.ObjectIncluding(isContext()))

  if (!contextMap.has(context.name)) {
    contextMap.set(context.name, { context })
  }

  return this
}

/**
 * Adds a Registry with it's associated pipelines
 * @param registry {Registry} the Registry instance
 * @param options {object|undefined} options argument
 * @param options.pipelines {[function]|undefined} a queue-like list of pipelines
 * @return {ContextBuilder} self for chaining
 */
ContextBuilder.addRegistry = function (registry, options = {}) {
  check(registry, Match.ObjectIncluding(isRegistry()))
  check(options, Match.ObjectIncluding({
    pipelines: Match.Maybe([Function])
  }))

  const { pipelines } = options
  if (!registryMap.has(registry.name)) {
    registryMap.set(registry.name, { registry, pipelines: pipelines || [] })
  }

  return this
}

/**
 * Runs {ContextBuilder.build} for all contexts, registered via
 * {ContextBuilder.add} against a given build function.
 * @param buildFct
 */
ContextBuilder.buildAll = function (buildFct) {
  info('run build process')
  contextMap.forEach(({ context }) => {
    ContextBuilder.build(context, buildFct)
  })
}

/**
 * Runs the context through all pipelines that are associated with it (by
 * category; detected via Registries) and finally calls a build callback, which
 * passes the context to the factory you provide.
 *
 * @param context {Object} the context instance
 * @param buildCallback {Function} a function where the context will be passed
 *        as argument and where you can call your factories to create Methods,
 *        Publications, Collections etc.
 */
ContextBuilder.build = function (context, buildCallback) {
  check(context, Match.ObjectIncluding(isContext()))
  check(buildCallback, Function)

  const contextInfo = createInfoLog(context.name)
  const allPipelines = []

  // we go through all registries and check for any pipelines
  registryMap.forEach(({ registry, pipelines }) => {
    if (registry.hasIdentity(context)) {
      allPipelines.push(...pipelines)
      registry.add(context)
    }
  })

  contextInfo(`start build with ${allPipelines.length + 1} pipelines`)
  allPipelines.forEach(pipeline => {
    pipeline.call(null, context)
  })

  buildCallback.call(null, context)
}

/**
 * Clears all registered contexts, registries and pipelines.
 */
ContextBuilder.flush = function () {
  info('flush all')
  contextMap.clear()
  registryMap.clear()
}
