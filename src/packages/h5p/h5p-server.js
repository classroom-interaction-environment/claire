import { H5PMeteor } from './api/H5PMeteor'
import { H5PUserContentCollection } from './api/collections/H5PUserContentCollection'
import { H5PContentCollection } from './api/collections/H5PContentCollection'
import { H5PFinishedUserDataCollection } from './api/collections/H5PFinishedUserDataCollection'
import { H5PTranslation } from './api/H5PTranslation'
import { H5PFactory } from './api/H5PFactory'
import { h5pConnectHandler } from './api/endpoints/h5pConnectHandler'

export const allCollections = [
  H5PFinishedUserDataCollection,
  H5PContentCollection,
  H5PUserContentCollection
]

export const collections = (factory) => {
  allCollections.forEach(c => {
    c.collection = factory(c)
  })
}

export const methods = (factory) => {
  Object.values(H5PMeteor.methods).forEach(factory)
}

export const i18n = H5PTranslation.config

export const config = (config) => {
  H5PFactory.init({ config })
}

export const routesHandler = () => {
  return h5pConnectHandler(H5PFactory.editor())
}

export default { H5PMeteor }
