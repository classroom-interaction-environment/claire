import { onClientExec, onServerExec } from '../../utils/archUtils'

let profileImageSchema

onClientExec(() => {
  const { Files } = require('../../../contexts/files/Files')
  const { ProfileImages } = require('../../../contexts/files/image/ProfileImages')

  profileImageSchema = ({ optional = false } = {}) => ({
    type: String,
    optional: optional,
    label: null,
    autoform: {
      type: 'fileUpload',
      accept: ProfileImages.accept,
      collection: ProfileImages.name,
      uploadTemplate: Files.templates.upload,
      previewTemplate: ProfileImages.renderer.template
    }
  })
})

onServerExec(() => {
  profileImageSchema = ({ optional = false } = {}) => ({
    type: String,
    optional: optional
  })
})

export { profileImageSchema }
