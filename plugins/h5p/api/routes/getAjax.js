import H5PUser from '../implementations/H5PUser'

/**
 * Required for the H5PEditor to work.
 * @param ajaxEndpoint
 * @return {(function(*, *): Promise<void>)|*}
 */
export const getAjax = ajaxEndpoint => async (req, res) => {
  const user = req.user && req.user()
  const result = await ajaxEndpoint.getAjax(
    req.query.action,
    req.query.machineName,
    req.query.majorVersion,
    req.query.minorVersion,
    req.query.language || req.Cookies.get('h5p-editor-lang'),
    new H5PUser(user)
  )
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.write(JSON.stringify(result))
  res.end()
}
