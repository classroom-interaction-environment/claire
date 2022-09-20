export const FilesDefaults = {}

FilesDefaults.schema = () => filesSchema

FilesDefaults.fields = () => filesFields

const filesSchema = {
  size: {
    type: Number
  },
  type: {
    type: String
  },
  name: {
    type: String
  },
  meta: {
    type: Object,
    blackbox: true
  },
  ext: {
    type: String
  },
  extension: {
    type: String
  },
  extensionWithDot: {
    type: String
  },
  mime: {
    type: String
  },
  'mime-type': {
    type: String
  },
  _id: {
    type: String,
    optional: true,
  },
  userId: {
    type: String
  },
  path: {
    type: String
  },
  versions: {
    type: Object,
    blackbox: true
  },
  _downloadRoute: {
    type: String
  },
  _collectionName: {
    type: String
  },
  isVideo: {
    type: Boolean
  },
  isAudio: {
    type: Boolean
  },
  isImage: {
    type: Boolean
  },
  isText: {
    type: Boolean
  },
  isJSON: {
    type: Boolean
  },
  isPDF: {
    type: Boolean
  },
  _storagePath: {
    type: String
  },
  public: {
    type: Boolean
  },
  processed: {
    type: Number,
    optional: true,
    defaultValue: 0
  },
  processingComplete: {
    type: Boolean,
    optional: true,
    defaultValue: false
  },
  error: {
    type: String,
    optional: true
  }
}

const filesFields = {}
Object.keys(filesSchema).forEach(key => {
  filesFields[key] = 1
})
