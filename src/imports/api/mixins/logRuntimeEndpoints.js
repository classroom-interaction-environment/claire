import { logError } from '../errors/server/logerror'
import { createLog } from '../log/createLog'
import { Random } from 'meteor/random'

const createMethodId = () => Random.id(6)

export const logRuntimeEndpoints = function (options) {
  const { name } = options
  const isMethod = name.includes('.methods.')
  const isPublication = name.includes('.publications.')
  let endpointType = 'unknown'
  if (isMethod) {
    endpointType = 'method'
  }
  if (isPublication) {
    endpointType = 'publication'
  }

  const wrap = (originalFct, type) => function (...args) {
    const environment = this
    const methodId = createMethodId()
    const logName = `${endpointType}:${name} (${methodId})`
    const log = createLog({ name: logName })
    const error = createLog({ name: logName, type: 'error' })

    // if we allow method to use these logs we can better
    // associate them by the given method id
    environment.log = log
    environment.error = error

    log(type, 'invoked by', environment.userId)

    try {
      return originalFct.apply(environment, args)
    } catch (runtimeError) {
      // logError({
      //   error: methodRuntimeError,
      //   createdBy: environment.userId,
      //   createdAt: new Date(),
      //   isClient: false,
      //   isServer: true,
      //   isMethod: true,
      //   isPublication: false
      // })

      if (['Meteor.Error', 'ClientError'].includes(runtimeError.errorType || runtimeError.name)) {
        runtimeError.isClientSafe = true
        endpointType.isMethod = isMethod
        endpointType.isPublication = isPublication
        error(runtimeError) // client safe errors are not logged on the server
      }

      throw runtimeError
    }
  }

  options.run = wrap(options.run, 'run')
  if (options.validate) {
    options.validate = wrap(options.validate, 'validate')
  }

  return options
}
