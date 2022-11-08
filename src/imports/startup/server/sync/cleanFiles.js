import { Meteor } from 'meteor/meteor'
import { MongoInternals } from 'meteor/mongo'
import { Files } from '../../../api/decorators/methods/files/Files'
import { SyncPipeline } from '../../../contexts/sync/SyncPipeline'
import { getCollection } from '../../../api/utils/getCollection'
import Grid from 'gridfs-stream'

const gfs = Grid(MongoInternals.defaultRemoteCollectionDriver().mongo.db, MongoInternals.NpmModule)

const getRemoveFile = fileContext => Meteor.bindEnvironment(file => {
  const gridFile = Promise.await(gfs.files.findOne({ 'metadata.updatedFileId': file._id }))
  if (!gridFile) {
    console.info(`delete [${fileContext.name}] file `, file._id)
    return Promise.await(fileContext.filesCollection.remove(file._id))
  }
  else {
    return false
  }
})

const removeChunksFor = Meteor.bindEnvironment(file => {
  if (!file || !file.metadata || !file.metadata.collectionName) {
    return Promise.await(gfs.remove({ _id: file._id }))
  }

  const { updatedFileId } = file.metadata
  const FilesCollection = getCollection(file.metadata.collectionName)
  const inFilesCollection = Promise.await(FilesCollection.findOne(updatedFileId))
  if (!inFilesCollection) {
    return Promise.await(gfs.remove({ _id: file._id }))
  }

  return Promise.await(0)
})

SyncPipeline.on(SyncPipeline.events.synced, Meteor.bindEnvironment(function () {
  console.info('=================== CLEANUP DEAD FILES =================')
  console.info('=> Part 1: check dead documents')
  const filesContexts = Object.values(Files.contexts)
  filesContexts.forEach(fileContext => {
    console.info(`[${fileContext.name}]: run check`)
    const contextFiles = fileContext.filesCollection.find()
    const removeFiles = getRemoveFile(fileContext)
    let removeCount = 0
    contextFiles.forEach(filesCursor => {
      const removed = Promise.await(removeFiles(filesCursor))
      removeCount += removed ? 1 : 0
    })
    console.log(`[${fileContext.name}]: removed (${removeCount})`)
  })
  SyncPipeline.complete(SyncPipeline.events.filesCollections)
}))

SyncPipeline.on(SyncPipeline.events.filesCollections, Meteor.bindEnvironment(function () {
  console.info('=> Part 2: check dead GridFS files')
  const gfsFilesCursor = Promise.await(gfs.files.find())
  const count = Promise.await(gfsFilesCursor.count())
  console.info(`[GridFS]: files count (${count})`)
  let done = 0
  let index = 0
  gfsFilesCursor.forEach(Meteor.bindEnvironment((file) => {
    const removed = Promise.await(removeChunksFor(file))
    done += removed ? 1 : 0
    index++
    if (index >= count) {
      console.log(`[GridFS]: removed (${done})`)
      SyncPipeline.done()
    }
  }))
}))
