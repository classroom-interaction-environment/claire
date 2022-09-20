const _events = {
  loggedin: 'loggedin',
  synced: 'synced',
  cleaned: 'cleaned',
  docs: 'docs',
  files: 'files',
  chunks: 'chunks',
  filesCollections: 'filesCollections'
}
const _eventKeys = Object.keys(_events)

const _callbacks = {}
_eventKeys.forEach(key => {
  _callbacks[key] = []
})

let debug = false

function _debug (value) {
  debug = !!value
}

export const SyncPipeline = {}
SyncPipeline.events = _events
SyncPipeline.on = (name, cb) => _callbacks[name].push(cb)
SyncPipeline.debug = value => _debug(value)
SyncPipeline.complete = (key, optionalArgs) => {
  if (debug) {
    console.info(`[SyncPipeline]: complete [${key}]`)
  }
  _callbacks[key].forEach(cb => cb(optionalArgs))
  _callbacks[key] = []
}
SyncPipeline.done = () => {
  if (debug) {
    console.info('[SyncPipeline]: all complete')
  }
}
