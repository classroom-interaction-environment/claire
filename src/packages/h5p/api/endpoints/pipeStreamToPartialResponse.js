/**
 * Pipes the contents of the file to the request object and sets the
 * 206 status code and all necessary headers.
 * @param mimetype the mimetype of the file
 * @param readStream a readable stream of the file (at the start position)
 * @param response the Express response object (a writable stream)
 * @param totalLength the total file size of the file
 * @param start the start of the range
 * @param end the end of the range
 */
export const pipeStreamToPartialResponse = (mimetype, readStream, response, totalLength, start, end) => {
  response.writeHead(206, {
    'Content-Type': mimetype,
    'Content-Length': end - start + 1,
    'Content-Range': `bytes ${start}-${end}/${totalLength}`
  })

  readStream.on('error', () => {
    response.writeHead(404, {})
    response.end()
  })
  readStream.pipe(response)
}
