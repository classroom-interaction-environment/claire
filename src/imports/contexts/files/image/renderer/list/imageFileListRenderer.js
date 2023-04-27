import { Template } from 'meteor/templating'
import { ImageFiles } from '../../ImageFiles'
import { getFilesCollection } from '../../../../../api/utils/getFilesCollection'
import '../../../shared/templates/helpers'
import '../../../../../ui/components/download/downloadButton'
import './imageFileListRenderer.html'

Template.imageFileListRenderer.helpers({
  collectionName () {
    return ImageFiles.name
  },
  hasThumbnail (fileObj) {
    return fileObj?.versions?.thumbnail
  },
  linkThumbnail (fileObj) {
    return getFilesCollection(ImageFiles).link(fileObj, 'thumbnail')
  }
})
