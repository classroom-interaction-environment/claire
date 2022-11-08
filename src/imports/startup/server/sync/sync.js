import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { DDP } from 'meteor/ddp-client'
import { Tracker } from 'meteor/tracker'
import { Sync } from '../../../contexts/sync/Sync'
import { Files } from '../../../api/decorators/methods/files/Files'
import { Curriculum } from '../../../contexts/curriculum/Curriculum.js'
import { WebResources } from '../../../contexts/resources/web/WebResources'
import { getCollection } from '../../../api/utils/getCollection'
import { insertUpdate } from '../../../api/utils/insertUpdate'
import { SyncPipeline } from '../../../contexts/sync/SyncPipeline'

let remoteConnection

const FsFiles = new Mongo.Collection('fs.files')
const FsChunks = new Mongo.Collection('fs.chunks')

const debug = false

const synced = {
  'fs.files': false,
  'fs.chunks': false
}

function updateSyncStatus (contextName, count = 0) {
  console.log(`[Synced]: ${contextName} (${count})`)
  synced[contextName] = true
  if (Object.values(synced).every(value => value === true)) {
    remoteConnection.disconnect()
    remoteConnection = null
  }
}

function callRemote (allContexts, index, callback) {
  if (index > allContexts.length - 1) {
    return callback(null, true)
  }
  const context = allContexts[index]
  remoteConnection.call(Sync.methods.context.name, { name: context.name }, (err, masterDocs) => {
    if (err) {
      console.error(err)
      return callback(err, null)
    }
    const Collection = getCollection(context.name)
    Collection.hook('insert', false)
    Collection.hook('update', false)

    let count = 0
    masterDocs.forEach(masterDoc => {
      masterDoc._master = true
      masterDoc.createdBy = 'sync'
      masterDoc.updatedBy = 'sync'
      const status = insertUpdate(Collection, masterDoc, true, true)
      count += status ? 1 : 0
    })
    Collection.hook('insert', true)
    Collection.hook('update', true)
    updateSyncStatus(context.name, count)
    callRemote(allContexts, index + 1, callback)
  })
}

function localChunks (existingFile) {
  const ChunksCollection = getCollection('fs.chunks')
  return ChunksCollection.find({ _id: { $in: [existingFile._id] } }).fetch()
}

/**
 * Loads chunks from the remove by given fs.files _id values
 * @param filesToLoad
 * @return {Promise<*>}
 */
async function loadChunks (filesToLoad) {
  return new Promise((resolve) => {
    remoteConnection.call(Sync.methods.chunks.name, { _ids: filesToLoad }, (err, chunks) => {
      if (err) {
        console.error(err)
        resolve([])
      }
      else if (chunks.length === 0 || filesToLoad.length > chunks.length) {
        console.error(new Error(`Expected ${filesToLoad.length} to be grater than ${chunks.length}`))
        resolve([])
      }
      else {
        resolve(chunks)
      }
    })
  })
}

function setupSyncPipeline () {
  const filesContexts = Object.values(Files.contexts)
  const allContexts = [].concat(Object.values(WebResources.contexts), Curriculum.getAllContexts(), filesContexts)
  allContexts.forEach(context => {
    synced[context.name] = false
  })

  // call remote to sync all docs, once we are logged in
  SyncPipeline.on(SyncPipeline.events.loggedin, Meteor.bindEnvironment(() => {
    callRemote(allContexts, 0, (err) => {
      if (err) {
        console.error(err)
        return
      }
      SyncPipeline.complete(SyncPipeline.events.docs)
    })
  }))

  // call remote to sync files documents, after all context docs
  // are successfully synced
  SyncPipeline.on(SyncPipeline.events.docs, Meteor.bindEnvironment(() => {
    remoteConnection.call(Sync.methods.files.name, {}, (err, files) => {
      if (err) {
        console.error(err)
        throw err
      }
      else {
        let filesCount = 0
        let chunksCount = 0
        files.forEach(fsFile => {
          // for each file we sync, we check if there
          // is no equivalent entry in this database or
          // if the entry in this database contains a different
          // md5 hash, which means it has been altered
          // if one of both is true we sync the chunks for this file
          const existingFile = FsFiles.findOne(fsFile._id)
          const fileModified = existingFile && existingFile.md5 !== fsFile.md5

          // XXX: there can be the case that a file meta document exists
          // but the chunks have not been loaded (websocket framelength too large error)
          // or have been corrupted and then deleted by the clean process.
          // In this case we still load the full chunks from the remote
          const noLocalChunks = existingFile && localChunks(existingFile).length === 0

          if (!existingFile || fileModified || noLocalChunks) {
            const fileObjectId = fsFile._id
            const updated = insertUpdate(FsFiles, fsFile, false, debug)
            if (updated) {
              filesCount++
              const chunks = Promise.await(loadChunks([fileObjectId]))
              chunks.forEach(fsChunk => {
                const status = insertUpdate(FsChunks, fsChunk, false, debug)
                chunksCount += status ? 1 : 0
              })
            }
          }
        })

        updateSyncStatus('fs.files', filesCount, true)
        updateSyncStatus('fs.chunks', chunksCount, true)
        SyncPipeline.complete(SyncPipeline.events.files)
      }
    })
  }))

  SyncPipeline.on(SyncPipeline.events.files, Meteor.bindEnvironment(() => {
    console.info('=================== SYNC COMPLETE =================')
    SyncPipeline.complete(SyncPipeline.events.synced)
  }))
}

Meteor.startup(() => {
  console.info('=================== SYNC =================')
  SyncPipeline.debug(debug)
  setupSyncPipeline()

  const syncSettings = Meteor.settings.curriculum.sync
  if (syncSettings.enabled === false) {
    console.info('SKIP SYNC BY CONFIG')
    return
  }

  remoteConnection = DDP.connect(syncSettings.url)

  Tracker.autorun(Meteor.bindEnvironment(function (trackerComputation) {
    const status = remoteConnection.status()
    if (status.connected) {
      DDP.loginWithPassword(remoteConnection, { username: syncSettings.username }, syncSettings.password, function (error) {
        if (error) {
          console.error(error)
          throw error
        }
        else {
          SyncPipeline.complete(SyncPipeline.events.loggedin)
          trackerComputation.stop()
        }
      })
    }
    else if (status.retryCount > 2) {
      console.info('=> NO CONNECTION ,ABORT SYNC AFTER 3 RETRIES')
      console.log('==========================================')
      trackerComputation.stop()
      remoteConnection.disconnect()
    }
  }))
})
