export const DefaultMethods = {
  createGet (context) {
    const name = context.name
    return {
      name: `${name}.methods.get`,
      schema: { _id: String },
      timeInterval: 500,
      numRequests: 10
    }
  },
  createGetAll (context) {
    const name = context.name
    return {
      name: `${name}.methods.getAll`,
      schema: {},
      timeInterval: 500,
      numRequests: 1
    }
  },
  createInsert (context) {
    const name = context.name
    return {
      name: `${name}.methods.insert`,
      timeInterval: 1000,
      numRequests: 100
    }
  },
  createUpdate (context) {
    const name = context.name
    return {
      name: `${name}.methods.update`,
      timeInterval: 1000,
      numRequests: 100
    }
  },
  createRemove (context) {
    const name = context.name
    return {
      name: `${name}.methods.remove`,
      timeInterval: 1000,
      numRequests: 100
    }
  },
  createClone (context) {
    const name = context.name
    return {
      name: `${name}.methods.clone`,
      timeInterval: 1000,
      numRequests: 1
    }
  },
  create (context, { createGet = true, createGetAll = false, createInsert = true, createUpdate = true, createRemove = true, createClone = false } = {}) {
    const definitions = {}
    if (createGet) {
      definitions.get = DefaultMethods.createGet(context)
    }
    if (createGetAll) {
      definitions.all = DefaultMethods.createGetAll(context)
    }
    if (createInsert) {
      definitions.insert = DefaultMethods.createInsert(context)
    }
    if (createUpdate) {
      definitions.update = DefaultMethods.createUpdate(context)
    }
    if (createRemove) {
      definitions.remove = DefaultMethods.createRemove(context)
    }
    if (createClone) {
      definitions.clone = DefaultMethods.createClone(context)
    }
    return definitions
  }
}
