import { check } from 'meteor/check'
import { getHost } from '../../api/utils/methodUtils'
import SimpleSchema from 'simpl-schema'

export const resolveLink = function (url) {
  check(url, String)
  const split = url.split('://')
  if (split.length > 1) return url.replace('https:', 'http:')

  const cleanedUrl = url.charAt(0) === '/'
    ? url.substring(1, url.length)
    : url

  return `http://${cleanedUrl}`
}

const resolveSchema = new SimpleSchema({
  collectionName: String,
  downloadRoute: String,
  id: String,
  extension: String
})

export const resolveFileLink = function (collectionName, downloadRoute, id, extension) {
  resolveSchema.validate({ collectionName, downloadRoute, id, extension })
  const host = getHost()
  const fileRoute = `${host}${downloadRoute}/${collectionName}/${id}/original/${id}.${extension}`
  return resolveLink(fileRoute)
}
