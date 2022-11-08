import { createPublicationFactory } from 'meteor/leaonline:publication-factory'
import { Schema } from '../../api/schema/Schema'
import { checkPermissions } from '../../api/mixins/checkPermissions'
import { logError } from '../../api/errors/server/logerror'
import { addErrorDetails } from '../../api/errors/server/addErrorDetails'
import { createLog } from '../../api/log/createLog'
import { logRuntimeEndpoints } from '../../api/mixins/logRuntimeEndpoints'

export const createPublication = createPublicationFactory({
  schemaFactory: Schema.create,
  mixins: [checkPermissions, logRuntimeEndpoints],
  onError (publicationRuntimeError) {
    const env = this
    error('runtime error catch in publication [', env._name, ']')
    error(publicationRuntimeError)

    // assign id to it, so clients can point to a specific
    // error document, in case the error is too generic
    const errorId = logError({
      error: publicationRuntimeError,
      createdBy: env.userId,
      createdAt: new Date(),
      isClient: false,
      isServer: true,
      isMethod: false,
      isPublication: true,
      source: env._name
    })

    addErrorDetails(publicationRuntimeError, { errorId, source: env._name })

    publicationRuntimeError.source = env._name

    if (publicationRuntimeError.errorType === 'Meteor.Error' || publicationRuntimeError.isClientSafe) {
      return publicationRuntimeError
    }

    // simple schema validation error
    if (publicationRuntimeError.errorType === 'ClientError' && publicationRuntimeError.error === 'validation-error') {
      publicationRuntimeError.isClientSafe = true
      return publicationRuntimeError
    }
  }
})

const error = createLog({ name: createPublication.name, type: 'error' })
