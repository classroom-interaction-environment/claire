import { createMethodFactory } from 'meteor/leaonline:method-factory'
import { Schema } from '../../api/schema/Schema'
import { checkPermissions } from '../../api/mixins/checkPermissions'
import { logRuntimeEndpoints } from '../../api/mixins/logRuntimeEndpoints'

export const createMethod = createMethodFactory({
  schemaFactory: Schema.create,
  mixins: [checkPermissions, logRuntimeEndpoints]
})
