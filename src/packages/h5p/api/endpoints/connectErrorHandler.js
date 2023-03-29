import { AggregateH5pError, AjaxErrorResponse, H5pError } from '@lumieducation/h5p-server'
import { Cookies } from 'meteor/ostrio:cookies'
import { H5PTranslation } from '../H5PTranslation'

// Deliberately left unused, so that cookies work in the request.
// eslint-disable-next-line no-unused-vars
const cookies = new Cookies()

/**
 * An Express middleware that converts NodeJs error objects into error responses
 * the H5P client can understand. Add this middleware as the last entry in your
 * express application and make sure all routes don't throw errors but pass them
 * to the next(...) function. (You must do this manually in async functions!)
 * @param languageOverride the language to use when returning errors.
 */
export function errorHandler (languageOverride) {
  // eslint-disable-next-line no-unused-vars
  return async (err, req, res, next) => {
    let statusCode = 500
    let statusText = ''
    let detailsList
    let clientErrorId = ''

    if (err instanceof H5pError) {
      statusCode = err.httpStatusCode
      const lng =
        languageOverride && languageOverride !== 'auto'
          ? languageOverride
          : req.Cookies.get('h5p-editor-lang') ||
          H5PTranslation.getLocale() // We get the editor
      // language of the user from a cookie we set in h5pEditor.js earlier.
      statusText = H5PTranslation.translate(lng, err.errorId, err.replacements)
      clientErrorId = err.clientErrorId || ''

      if (err instanceof AggregateH5pError) {
        detailsList = err.getErrors().map((e) => ({
          code: e.errorId,
          message: H5PTranslation.translate(lng, e.errorId, e.replacements)
        }))
      }
    }
    else {
      statusText = err.message
    }
    res.writeHead(statusCode, { 'Content-Type': 'application/json' })
    res.write(
      JSON.stringify(
        new AjaxErrorResponse(
          clientErrorId,
          statusCode,
          statusText,
          detailsList
        )
      )
    )
    res.end()
  }
}
