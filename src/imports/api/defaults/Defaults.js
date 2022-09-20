import { DefaultFields, DefaultSchema } from './schema'

export const Defaults = {
  schema: () => DefaultSchema,
  fields: () => DefaultFields,
  schemaOptions: () => ['autoform', 'displayType', 'resolve']
}
