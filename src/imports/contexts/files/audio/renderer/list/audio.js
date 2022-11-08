import { Template } from 'meteor/templating'
import { AudioFiles } from '../../AudioFiles'
import '../../../../../ui/components/download/downloadButton'
import './audio.html'

Template.audioFileListRenderer.helpers({
  collectionName () {
    return AudioFiles.name
  }
})
