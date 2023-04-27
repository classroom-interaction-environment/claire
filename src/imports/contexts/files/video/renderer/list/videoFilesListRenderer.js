import { Template } from 'meteor/templating'
import { VideoFiles } from '../../VideoFiles'
import '../../../../../ui/components/download/downloadButton'
import '../../../shared/templates/helpers'
import './videoFilesListRenderer.html'

Template.videoFilesListRenderer.helpers({
  collectionName () {
    return VideoFiles.name
  }
})
