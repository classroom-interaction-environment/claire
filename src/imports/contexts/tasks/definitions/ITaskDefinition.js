/**
 * Interface-style decorator to ensure implementation.
 *
 * The Interface defines as followed:
 *
 * @code
 * {
 *   isTaskDefinition: Boolean;
 *   get: () => Context;
 *   has: () => Boolean;
 *   schema: Schema;
 *   getMaterialContexts: () => [Context];
 * }
 *
 * TODO use classes here or function composition
 *
 * @deprecated
 * @param context
 * @param map
 * @constructor
 */
export const ITaskDefinition = (context, map) => {
  context.isTaskDefinition = true
  context.get = context.get || (name => map.get(name))
  context.has = context.has || (name => map.has(name))
  context.schema = context.schema || ((name, injectables) => {
    const entry = map.get(name)
    const schema = entry?.schema

    if (typeof schema === 'function') {
      return schema(injectables)
    }

    return schema
  })

  context.getMaterialContexts = context.getMaterialContexts || (({ filter = () => true } = {}) => Array.from(map.values()).filter(filter))
}
