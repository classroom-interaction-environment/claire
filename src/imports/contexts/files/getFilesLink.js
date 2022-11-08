import { getFilesCollection } from '../../api/utils/getFilesCollection'

export const getFilesLink = ({ file, name, version = 'original' }) => {
  if (!file) { return }

  const linkType = typeof file.link
  let link

  if (linkType === 'string') {
    link = file.link
  } else if (linkType === 'function') {
    link  = file.link(version)
  } else {
    const collection = name && getFilesCollection(name)
    link = collection && collection.link(file, version)
  }

  if (!link) {
    return console.warn('could not get link for', file.name)
  }

  return link
}
