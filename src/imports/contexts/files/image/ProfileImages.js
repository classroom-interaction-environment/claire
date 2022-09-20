import { FileTypes } from '../shared/FileTypes'
import { onClient, onServerExec } from '../../../api/utils/archUtils'
import { onServerExecLazy } from '../../../infrastructure/loading/onServerExecLazy'

export const ProfileImages = {
  name: 'profileImages',
  label: 'files.profileImages',
  isFilesCollection: true,
  icon: 'file-image',
  schema: {},
  debug: true,
  publicFields: {},
  dependencies: [],

  // this is not material so renderer is on top level
  renderer: onClient({
    template: 'imageFileRenderer',
    load: async function () {
      return import('./renderer/main/imageFileRenderer')
    }
  }),

  files: {
    type: FileTypes.image.value,
    extensions: FileTypes.image.extensions,
    accept: FileTypes.image.accept,
    maxSize: 1024 * 1000 * 6,
    usePartialResponse: false,
    converter: onServerExec(function () {
      const { imageConvert } = require('./converter/imageConvert')
      return imageConvert
    })
  }
}

ProfileImages.methods = {}

ProfileImages.methods.byClass = {
  name: 'profileImages.publications.byClass',
  schema: {
    classId: String,
    skip: {
      type: Array,
      optional: true
    },
    'skip.$': String
  },
  run: onServerExecLazy(function () {
    import { profileImagesByClass } from './profileImagesByClass'
    return profileImagesByClass
  })
}

ProfileImages.publications = {}

ProfileImages.publications.fileList = {
  name: 'profileImages.publications.fileList',
  schema: {},
  run: onServerExec(function () {
    import { getCollection } from '../../../api/utils/getCollection'
    import { userIsAdmin } from '../../../api/accounts/admin/userIsAdmin'

    return function () {
      const isAdmin = userIsAdmin(this.userId)
      const query = isAdmin ? {} : { userId: this.userId }
      return getCollection(ProfileImages.name).find(query)
    }
  })

}
