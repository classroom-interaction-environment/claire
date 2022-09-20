import { Schema } from '../schema/Schema'

/**
 * Creates a validator function from a given schema (with defaults),
 * that accepts any given key in the schema as optional property.
 * @param schema
 * @return {function(*=): *}
 */
export const createUpdateValidator = schema => {
  const updateDocBaseSchema = Object.assign({}, Schema.getDefault(), schema)
  const updateDocSchema = {}

  Object.keys(updateDocBaseSchema).forEach(key => {
    updateDocSchema[key] = Object.assign({}, updateDocBaseSchema[key], { optional: true })
  })

  const updateSchema = Schema.create({
    _id: { type: String },
    doc: Schema.create(updateDocSchema)
  })

  return updateDoc => updateSchema.validate(updateDoc)
}
