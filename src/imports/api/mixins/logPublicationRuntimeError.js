import { logError } from '../errors/server/logerror'

export const logPublicationRuntimeErrors = function (options) {
  const { run } = options

  options.run = function (...args) {
    const environment = this
    try {
      return run.apply(environment, args)
    }
    catch (publicationRuntimeError) {
      logError({
        error: publicationRuntimeError,
        createdBy: environment.userId,
        createdAt: new Date(),
        isClient: false,
        isServer: true,
        isMethod: false,
        isPublication: true
      })

      publicationRuntimeError.isSanitized = true

      // finally set publication to ready and set error object
      environment.error(publicationRuntimeError)
    }
  }

  return options
}
