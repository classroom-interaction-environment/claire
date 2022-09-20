import { logError } from '../errors/server/logerror'
import { createLog } from '../log/createLog'
import { Random } from 'meteor/random'

const createMethodId = () => Random.id(6)

export const logMethodRuntimeErrors = function (options) {
  const { name } = options

  const wrap = (originalFct, type) => function (...args) {
    const environment = this
    const methodId = createMethodId()
    const logName = `${name} (${methodId})`
    const log = createLog({ name: logName })
    const error = createLog({ name: logName, type: 'error' })

    // if we allow method to use these logs we can better
    // associate them by the given method id
    environment.log = log
    environment.error = error

    log(type, 'invoked by', environment.userId)

    try {
      return originalFct.apply(environment, args)
    } catch (methodRuntimeError) {
      // logError({
      //   error: methodRuntimeError,
      //   createdBy: environment.userId,
      //   createdAt: new Date(),
      //   isClient: false,
      //   isServer: true,
      //   isMethod: true,
      //   isPublication: false
      // })

      if (['Meteor.Error', 'ClientError'].includes(methodRuntimeError.errorType || methodRuntimeError.name)) {
        methodRuntimeError.isClientSafe = true
        error(methodRuntimeError) // client safe errors are not logged on the server
      }

      throw methodRuntimeError
    }
  }

  options.run = wrap(options.run, 'run')
  options.validate = wrap(options.validate, 'validate')

  return options
}
