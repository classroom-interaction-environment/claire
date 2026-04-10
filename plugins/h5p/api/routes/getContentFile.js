import H5PUser from '../implementations/H5PUser'
import { pipeStreamToResponse } from '../endpoints/pipeStreamToResponse'
import { pipeStreamToPartialResponse } from '../endpoints/pipeStreamToPartialResponse'
import { getRange } from '../endpoints/getRange'

export const getContentFile = ajaxEndpoint => async (req, res) => {
  const user = req.user && req.user()
  const { mimetype, stream, stats, range } = await ajaxEndpoint.getContentFile(
    req.params.id,
    req.params.file,
    new H5PUser(user),
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
