import { Schema } from './Schema'

export const toOptionalSchema = (schema) => {
  if (!schema) return {}

  const copy = { ...schema }

  Object.entries(copy).forEach(([key, value]) => {
    const newValue = typeof value === 'function'
      ? { type: value }
      : { ...value }
    newValue.optional = true
    copy[key] = newValue
  })

  return Schema.create(copy)
}
