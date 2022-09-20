export const createInQuery = field => (values = []) => ({ [field]: { $in: values } })
export const createExistsQuery = field => (value = false) => ({ [field]: { $exists: value } })

export const $existsQuery = (...values) => fieldName => createExistsQuery(fieldName).call(...values)
export const $inQuery = (...values) => fieldName => createInQuery(fieldName).call(...values)

export const createQueryComposer = (config) => {
  const transformedConfig = {}
  Object.keys(config).forEach(fieldName => {
    const factoryFunction = config[fieldName]
    transformedConfig[fieldName] = factoryFunction(fieldName)
  })

  return {
    compose (queryConfig) {
      const finalQuery = {}
      Object.keys(queryConfig).forEach(fieldName => {
        const value = queryConfig[fieldName]
        Object.assign(finalQuery, transformedConfig[fieldName](value))
      })
      return finalQuery
    }
  }
}

export const composeQuery = (config) => {
  const query = {}
  Object.keys(config).forEach(fieldName => {
    const factoryFunction = config[fieldName]
    Object.assign(query, factoryFunction(fieldName))
  })
  return query
}
