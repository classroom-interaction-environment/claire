import { getFilesCollection } from '../../api/utils/getFilesCollection'

export const getFilesLink = ({ file, name, version = 'original' }) => {
  if (!file || !name) {
    return
  }

  const collection = getFilesCollection(name)
  if (!collection) {
    return
  }

  console.debug('[getFilesLink]:', file.name, version)
  const link = (typeof file.link === 'function')
    ? file.link(version)
    : collection.link(file, version)

  if (!link) {
    return console.warn('could not get link for', file.name)
  }

  return link
}
