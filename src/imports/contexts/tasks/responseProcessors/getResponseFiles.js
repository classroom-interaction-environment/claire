const defaultVersion = 'original'

export const getResponseFiles = ({ filesCollection, versions = [defaultVersion], lessonId, taskId, itemId }) => {
  const query = {
    'meta.lessonId': lessonId,
    'meta.taskId': taskId,
    'meta.itemId': itemId
  }

  return filesCollection.collection.find(query).fetch().map(filesDoc => {
    versions.forEach(version => {
      if (filesDoc.versions[version]) {
        filesDoc.versions[version].link = filesCollection.link(filesDoc, version)
      }

      else {
        console.warn('[getResponseFiles]: no file available vor version', version)
      }
    })
    return filesDoc
  })
}
