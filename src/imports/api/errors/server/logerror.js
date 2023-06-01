import { Errors } from '../../../contexts/system/errors/Errors'
import { formatError } from '../both/formatError'
import { getCollection } from '../../utils/getCollection'

export const logError = function logError ({ error, createdBy, createdAt, isServer, isClient, isMethod, isPublication, source }) {
  try {
    const ErrorCollection = getCollection(Errors.name)
    const existingError = ErrorCollection.findOne({ stack: error.stack })
    if (existingError) {
      // add user and timestamp
      ErrorCollection.update(existingError._id, { $push: { history: { createdAt, createdBy } } })
      return existingError._id
    }
    else {
      const formattedError = formatError(error)
      formattedError.isServer = isServer || false
      formattedError.isClient = isClient || false
      formattedError.isMethod = isMethod || false
      formattedError.isPublication = isPublication || false
      formattedError.history = [{ createdBy, createdAt }]
      formattedError.source = source

      return ErrorCollection.insert(formattedError)
    }
  }
  catch (e) {
    console.warn('FATAL: Error while logging Error:')
    console.error(e)
    console.warn('original error:')
    console.error(error)
  }
}
