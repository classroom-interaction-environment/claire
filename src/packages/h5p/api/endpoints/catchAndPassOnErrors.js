import { undefinedOrTrue } from '../../utils/undefinedOrTrue'
import { createLog } from '../../../../imports/api/log/createLog'

/**
 * Calls the function passed to it and catches errors it throws. These errors
 * are then passed to the next(...) function for proper error handling.
 * You can disable error catching by setting options.handleErrors to false
 * @param handler The function to call
 * @param handleErrors whether to handle errors
 */
export const catchAndPassOnErrors = ({ name, method, handler, handleErrors }) => {
  const fnName = `(${method})${name}`
  const log = createLog({ name: fnName, type: 'debug' })
  return async (req, res, next) => {
    log(`[${method}][${name}]: run`, JSON.stringify(req.params))
    if (undefinedOrTrue(handleErrors)) {
      try {
        return await handler(req, res)
      }
      catch (error) {
        console.error(`[${fnName}]: error catched`, error)
        return next(error)
      }
    }
    return handler(req, res)
  }
}
