/**
 * Takes an Error (as well as its variants) or a Meteor.Error and converts it into a unified format.
 * @param error that will be formatted
 */
export const formatError = function logError (error) {
  const formatted = {}
  formatted.name = error.error || error.name
  formatted.type = error.errorType || error.name
  formatted.message = typeof error.reason === 'string' ? error.reason : error.message
  formatted.stack = error.stack
  if (error.details && typeof error.details !== 'string') {
    formatted.details = JSON.stringify(error.details)
  }
  else {
    formatted.details = error.details
  }
  formatted.source = error.source
  formatted.isClient = false
  formatted.isMethod = false
  formatted.isPublication = false
  formatted.isServer = false
  return formatted
}
