import { getFilesCollection } from '../../api/utils/getFilesCollection'

const warn = name => console.warn('could not get link for', name)

/**
 * Returns a valid download link for a given file.
 * @param file
 * @param name
 * @param version
 * @return {void|string}
 */
export const getFilesLink = ({ file, name, version = 'original' }) => {
  if (!file) {
    return warn('undefined file')
  }

  const linkType = typeof file.link
  let link

  if (linkType === 'string') {
    link = file.link
  }
  else if (linkType === 'function') {
    link = file.link(version)
  }
  else {
    const collection = name && getFilesCollection(name)
    link = collection && collection.link(file, version)
  }

  if (!link) {
    return warn(file.name)
  }

  return link
}
