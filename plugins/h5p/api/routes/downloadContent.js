import H5PUser from '../implementations/H5PUser'

/**
 * Downloads a H5P content as .h5p archive by given contentId.
 * @param ajaxEndpoint
 * @return {(function(*, *): Promise<void>)|*}
 */
export const downloadContent = ajaxEndpoint => async (req, res) => {
  const user = req.user && req.user()
  // set filename for the package with .h5p extension
  res.writeHead(200, {
    'Content-disposition': `attachment; filename=${req.params.contentId}.h5p`
  })
  await ajaxEndpoint.getDownload(req.params.contentId, new H5PUser(user), res)
}
