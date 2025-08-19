import { getRange } from '../endpoints/getRange'
import { pipeStreamToPartialResponse } from '../endpoints/pipeStreamToPartialResponse'
import { pipeStreamToResponse } from '../endpoints/pipeStreamToResponse'
import H5PUser from '../implementations/H5PUser'

export const getTempFiles = ajaxEndpoint => async (req, res) => {
  const user = req.user && req.user()
  const { mimetype, stream, stats, range } = await ajaxEndpoint.getTemporaryFile(
    req.params.file,
    new H5PUser(user), // get the real user from Mongo and inject it here
    getRange(req)
  )
  if (range) {
    // We need to support ranged requests so that the Interactive
    // Video editor and player work
    pipeStreamToPartialResponse(
      req.params.file,
      stream,
      res,
      stats.size,
      range.start,
      range.end
    )
  }
  else {
    pipeStreamToResponse(mimetype, stream, res, stats.size)
  }
}
