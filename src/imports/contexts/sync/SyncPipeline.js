import { createLog } from '../../api/log/createLog'

export const SyncPipeline = {}

const debug = createLog({ name: 'SyncPipeline', type: 'debug' })
const events = {
  loggedin: 'loggedin',
  synced: 'synced',
  cleaned: 'cleaned',
  docs: 'docs',
  files: 'files',
  chunks: 'chunks',
  filesCollections: 'filesCollections'
}

let debugActive = false
const eventKeys = Object.keys(events)
const callbacks = {}
for (const key in eventKeys) {
  callbacks[key] = []
}

SyncPipeline.events = events
SyncPipeline.on = (name, cb) => callbacks[name].push(cb)
SyncPipeline.debug = value => {
  debugActive = !!value
}

SyncPipeline.complete = (key, optionalArgs) => {
  if (debugActive) {
    debug(`complete [${key}]`)
  }
  for (const cb of callbacks[key]) {
    cb(optionalArgs)
  }
  callbacks[key] = []
}
SyncPipeline.done = () => {
  if (debugActive) {
    debug('all complete')
  }
}
