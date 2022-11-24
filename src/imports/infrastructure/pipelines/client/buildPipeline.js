import { Mongo } from 'meteor/mongo'
import { createPipeline } from '../createPipeline'
import { createCollection } from '../../../infrastructure/factories/createCollection'
import { getUserCheck } from '../../../api/files/getUserCheck'
import { createFilesCollection } from '../../../infrastructure/factories/createFilesCollection'
import { isSupportedObject } from '../../../api/utils/isSupportedObject'
import { isFilesContext } from '../../../contexts/files/isFilesContext'

export const buildPipeline = createPipeline('build', function (context, api, options) {
  const { collection, filesCollection, debug } = options
  const products = {
    collection: null,
    filesCollection: null
  }

  if (collection && !context.collection && isSupportedObject(context.schema)) {
    api.info(`create collection [${context.name}]`)
    products.collection = createCollection(context)
  }

  if (filesCollection && isFilesContext(context)) {
    api.info(`create files collection [${context.name}]`)

    const FilesMongoCollection = products.collection || new Mongo.Collection(context.name)
    const { files } = context

    products.filesCollection = createFilesCollection({
      collection: FilesMongoCollection,
      maxSize: files.maxSize,
      extensions: files.extensions,
      validateUser: getUserCheck(),
      usePartialResponse: files.usePartialResponse,
      debug: debug
    })
  }

  return products
})
