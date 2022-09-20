import { ContentTypes } from './contentTypes'

const typesValues = Object.values(ContentTypes)

export const resolveLinkTypeByUrl = (url) => {
  if (!url) return url
  const getterIndex = url.indexOf('?')
  const cleanedUrl = (getterIndex > -1 ? url.substring(0, getterIndex) : url).toLowerCase()
  const endingIndex = cleanedUrl.lastIndexOf('.')
  if (endingIndex === -1) return ContentTypes.webpage
  const ending = cleanedUrl.substring(endingIndex + 1, cleanedUrl.length)
  const type = typesValues.find(type => type.endings.indexOf(ending) > -1 && type)
  return type || ContentTypes.webpage
}
