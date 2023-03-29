import parseRange from 'range-parser'
import { H5pError } from '@lumieducation/h5p-server'

/**
 * Retrieves a range that was specified in the HTTP request headers. Returns
 * undefined if no range was specified.
 * @param req the connect request
 */
export const getRange = (req) => (fileSize) => {
  if (!req.headers.range) {
    return undefined
  }

  const range = parseRange(fileSize, req.headers.range)
  if (range) {
    if (range === -2) {
      throw new H5pError('malformed-request', {}, 400)
    }
    if (range === -1) {
      throw new H5pError('unsatisfiable-range', {}, 416)
    }
    if (range.length > 1) {
      throw new H5pError('multipart-ranges-unsupported', {}, 400)
    }

    return range[0]
  }
  return undefined
}
