import { createMethodFactory } from 'meteor/leaonline:method-factory'
import { Schema } from '../../api/schema/Schema'
import { checkPermissions } from '../../api/mixins/checkPermissions'
import { logRuntimeEndpoints } from '../../api/mixins/logRuntimeEndpoints'
import { asyncReadyMixin } from '../../api/mixins/asyncReadyMixin'

export const createMethod = createMethodFactory({
  schemaFactory: Schema.create,
  mixins: [asyncReadyMixin, checkPermissions, logRuntimeEndpoints]
})
