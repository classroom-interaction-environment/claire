export const Sync = {
  name: 'sync',
  label: 'sync.title',
  icon: 'cycle'
}

Sync.methods = {}

Sync.methods.context = {
  name: 'sync.methods.context',
  schema: {
    name: String
  },
  roles: ['sync']
}

Sync.methods.files = {
  name: 'sync.methods.files',
  schema: {},
  roles: ['sync']
}

Sync.methods.chunks = {
  name: 'sync.methods.chunks',
  schema: {
    _ids: {
      type: Array,
      optional: true
    },
    '_ids.$': {
      type: Object
    },
    '_ids.$._str': {
      type: String
    }
  },
  roles: ['sync']
}

Sync.publications = {}
