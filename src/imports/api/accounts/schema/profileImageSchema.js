import { onClientExec, onServerExec } from '../../utils/archUtils'

let profileImageSchema

onClientExec(function () {
  import { Files } from '../../../contexts/files/Files'
  import { ProfileImages } from '../../../contexts/files/image/ProfileImages'

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

onServerExec(function () {
  profileImageSchema = ({ optional = false } = {}) => ({
    type: String,
    optional: optional
  })
})

export { profileImageSchema }
