import path from 'path'
import {
  cacheImplementations,
  fsImplementations,
  H5PConfig,
  H5PEditor,
  H5PPlayer
} from '@lumieducation/h5p-server'
import {MongoInternals} from 'meteor/mongo'
import {CacheMap} from './implementations/CacheMap'
import MongoGridFSContentStorage from './implementations/MongoGridFSContentStorage'
import ContentUserDataStorage from './implementations/ContentUserDataStorage'
import {H5PContentCollection} from './collections/H5PContentCollection'
import {H5PTranslation} from './H5PTranslation'

export const H5PFactory = {}

const internal = {
  editor: null,
  player: null
}

H5PFactory.editor = () => internal.editor
H5PFactory.player = () => internal.player

H5PFactory.init = ({ config }) => {
  if (H5PFactory.editor() && H5PFactory.player()) {
    return // run only once!
  }

  const h5pCoreConfig = new H5PConfig(fsImplementations.InMemoryStorage(), config.core)
  const cache = CacheMap.create()
  const contentUserDataStorage = new ContentUserDataStorage()
  const urlGenerator = undefined
  const editorOptions = { enableHubLocalization: true, enableLibraryNameLocalization: true }
  const libraryStorage = new cacheImplementations.CachedLibraryStorage(
    new fsImplementations.FileLibraryStorage(
      path.resolve('assets/app/h5p/libraries') // The libraries are copied
      // from `private/libraries` on startup.
    )
    // you could add a custom cache store (Redis etc. here)
  )
  const bucketName = 'h5p'
  const contentStorage = new MongoGridFSContentStorage(
    new MongoInternals.NpmModule.GridFSBucket(MongoInternals.defaultRemoteCollectionDriver().mongo.db, { bucketName }),
    H5PContentCollection.collection,
    {}
  )
  const tempFileStorage = new fsImplementations.DirectoryTemporaryFileStorage( // TODO: replace with Meteor Mongo implementation
    path.resolve('assets/app/h5p/tempdir')
  )

  const h5pEditor = new H5PEditor(
    cache,
    h5pCoreConfig,
    libraryStorage,
    contentStorage,
    tempFileStorage,
    H5PTranslation.translate,
    urlGenerator,
    editorOptions,
    contentUserDataStorage)
  h5pEditor.setRenderer((model) => model)

// For a SPA, we a super-simple renderer here
// that only pass through the model. The h5p-webcomponents know how to deal
// with the data structure of the model.

  const h5pPlayer = new H5PPlayer(
    h5pEditor.libraryStorage,
    h5pEditor.contentStorage,
    h5pEditor.config,
    undefined,
    urlGenerator,
    H5PTranslation.translate,
    {
      customization: {
        alterLibraryFiles: (library, scripts, styles) => {
          if (library.machineName === 'H5P.Dialogcards') {
            return {
              // The function should be immutable, so we re-create the arrays
              scripts,
              styles: [...styles, '/custom/custom-dialog-cards.css']
            }
          }
          // We return the original list for all other libraries.
          return { scripts, styles }
        }
      }
    },
    h5pEditor.contentUserDataStorage)
// For SPA applications, we use a super-simple
// renderer that passes through the whole model.
  h5pPlayer.setRenderer((model) => model)

  internal.editor = h5pEditor
  internal.player = h5pPlayer
}
