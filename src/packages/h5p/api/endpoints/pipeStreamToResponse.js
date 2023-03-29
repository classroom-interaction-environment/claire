/**
 * Pipes the contents of the file to the request object and sets the
 * 200 status code and all necessary headers to indicate support for ranges.
 * @param mimetype the mimetype of the file
 * @param readStream a readable stream of the file (at the start position)
 * @param response the Express response object (a writable stream)
 * @param contentLength the total file size of the file
 */
export const pipeStreamToResponse = (mimetype, readStream, response, contentLength) => {
  response.writeHead(200, {
    'Content-Type': mimetype,
    'Content-Length': contentLength,
    'Accept-Ranges': 'bytes'
  })

  readStream.on('error', () => {
    response.writeHead(404, {})
    response.end()
  })
  readStream.pipe(response)
}
