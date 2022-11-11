import { Mongo } from 'meteor/mongo'
import { createPipeline } from '../createPipeline'
import {
  rateLimitMethod,
  rateLimitPublication
} from '../../../infrastructure/factories/rateLimit'
import { createPublication } from '../../factories/createPublication'
import { createFilesCollection } from '../../factories/createFilesCollection'
import { createMethod } from '../../factories/createMethod'
import { i18n } from '../../../api/language/language'
import { createCollection } from '../../factories/createCollection'
import { isSupportedObject } from '../../../api/utils/isSupportedObject'
import { getCheckMime } from '../../../api/files/getCheckMime'
import { getUserCheck } from '../../../api/files/getUserCheck'
import { isFilesContext } from '../../../contexts/files/isFilesContext'

const i18nFactory = (...args) => i18n.get(...args)

/**
 * The default build pipeline for sever-contexts
 * @server
 */
export const buildPipeline = createPipeline('build', function (context, api, options) {
  const { collection, filesCollection, methods, publications, debug } = options
  const products = {
    collection: null,
    filesCollection: null,
    methods: null,
    publications: null
  }

  // CREATE COLLECTION

  if (collection && isSupportedObject(context.schema)) {
    api.info(`create collection [${context.name}]`)
    products.collection = createCollection(context)
  }

  // CREATE FILES COLLECTION

  if (filesCollection && isFilesContext(context)) {
    const FilesMongoCollection = products.collection || new Mongo.Collection(context.name)
    const { files } = context

    api.info('Files context detected, create files collection')

    products.filesCollection = createFilesCollection({
      collection: FilesMongoCollection,
      maxSize: files.maxSize,
      extensions: files.extensions,
      validateUser: getUserCheck(),
      validateMime: getCheckMime(i18nFactory, files),
      transformVersions: files.converter,
      usePartialResponse: files.usePartialResponse,
      onError (error) {
        // TODO add to error log collection
        console.error(error)
      },
      debug: debug || context.debug // to allow individual debugging
    })
  }

  // CREATE METHODS

  if (methods && isSupportedObject(context.methods)) {
    products.methods = Object.values(context.methods).map(methodDef => {
      api.info(`> [${methodDef.name}]`)
      const method = createMethod(methodDef)
      rateLimitMethod(methodDef)
      return method
    })
  }
  else {
    api.info('skip methods')
  }

  // CREATE PUBLICATIONS

  if (publications && isSupportedObject(context.publications)) {
    products.publications = Object.values(context.publications).map(pubDef => {
      api.info(`> [${pubDef.name}]`)
      const pub = createPublication(pubDef)
      rateLimitPublication(pubDef)
      return pub
    })
  }
  else {
    api.info('skip publications')
  }

  return products
})
