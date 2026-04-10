import { pipeStreamToResponse } from '../endpoints/pipeStreamToResponse'

export const getLibraryFile = ajaxEndpoint => async (req, res) => {
  const { mimetype, stream, stats } = await ajaxEndpoint.getLibraryFile(
    req.params.uberName,
    req.params.file
  )
  pipeStreamToResponse(mimetype, stream, res, stats.size)
}
