import { Files } from '../../../api/decorators/methods/files/Files'
import { ContextRegistry } from '../../../infrastructure/context/ContextRegistry'
import { getCollection } from '../../../api/utils/getCollection'
import { onServer } from '../../../api/utils/archUtils'

Object.values(Files.contexts).forEach(filesContext => {
  // update the origigal context to provide
  // default methods and publications
  const name = filesContext.name
  const removeMethod = {
    name: `${name}.methods.remove`,
    schema: { _id: String },
    timeInterval: 1000,
    numRequests: 100,
    run: onServer(function (removeDoc) {
      // TODO check for roles --> teachers can remove all, students only theirs
      return getCollection(filesContext.collectionName).remove(removeDoc._id)
    })
  }

  filesContext.methods = Object.assign({}, { remove: removeMethod }, filesContext.methods)
  filesContext._curriculum = true
  delete filesContext.publications.fileList

  ContextRegistry.add(filesContext, { createCollection: true, createMethods: true, createPublications: true })
})
